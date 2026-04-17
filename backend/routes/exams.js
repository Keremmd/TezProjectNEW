import express from 'express';
import { supabase } from '../utils/supabase.js';
import {
  generateExamInOneCall,
  gradeOpenEndedAnswers,
} from '../utils/gemini.js';

const router = express.Router();

/**
 * Utility: download & extract text (with page numbers) for a PDF id.
 */
async function extractPdfTextById(pdfId) {
  const { data: pdf, error: pdfError } = await supabase
    .from('pdfs')
    .select('*')
    .eq('id', pdfId)
    .single();
  if (pdfError || !pdf) throw new Error(`PDF not found: ${pdfId}`);

  const { data: file, error: downloadError } = await supabase.storage
    .from('pdfs')
    .download(pdf.file_path);
  if (downloadError) throw new Error(`Failed to download PDF: ${downloadError.message}`);

  const pdfParse = (await import('pdf-parse')).default;
  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  const parsed = await pdfParse(buf);
  return {
    pdf,
    text: parsed.text || '',
    pages: parsed.numpages || 0,
  };
}

/**
 * Strip bad control chars and cap a snippet for prompt use.
 */
function cleanSnippet(s, max = 16000) {
  return (s || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * POST /api/exam/generate
 * Body:
 *   {
 *     userId: uuid,
 *     title: string,
 *     pdfIds: [uuid, ...],
 *     language?: 'Turkish'|'English',
 *     durationMinutes?: number,
 *     sections: [
 *       { name, type: 'mcq'|'open'|'cloze'|'true_false'|'short',
 *         count, difficulty?, points_per_question? }
 *     ]
 *   }
 *
 * Returns the created exam with its questions.
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      userId,
      title,
      pdfIds,
      sections,
      language = 'Turkish',
      durationMinutes = null,
    } = req.body || {};

    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!Array.isArray(pdfIds) || pdfIds.length === 0) {
      return res.status(400).json({ error: 'pdfIds must be a non-empty array' });
    }
    if (!Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: 'sections must be a non-empty array' });
    }

    // 1) Pull & merge PDF texts
    const pdfBlocks = [];
    for (const pid of pdfIds) {
      try {
        const { pdf, text } = await extractPdfTextById(pid);
        if (text) {
          pdfBlocks.push(
            `--- PDF: ${pdf.file_name || pdf.id} ---\n${cleanSnippet(text, 14000)}`
          );
        }
      } catch (e) {
        console.warn(`⚠️ Skipping PDF ${pid}:`, e.message);
      }
    }
    if (pdfBlocks.length === 0) {
      return res.status(400).json({ error: 'No readable text in the selected PDFs.' });
    }

    // Keep combined text under a safe bound for the model.
    const perPdfBudget = Math.floor(26000 / pdfBlocks.length);
    const combinedText = pdfBlocks
      .map((b) => b.slice(0, perPdfBudget + 500))
      .join('\n\n');

    // 2) Normalize sections
    const normalizedSections = sections.map((section, i) => ({
      name: section.name || `Bölüm ${i + 1}`,
      type: section.type || 'mcq',
      count: Math.max(1, Math.min(30, Number(section.count) || 5)),
      difficulty: section.difficulty || 'medium',
      points_per_question: Math.max(
        1,
        Math.min(50, Number(section.points_per_question) || 1)
      ),
    }));

    // 3) Generate all sections in ONE Gemini call (rate-limit friendly)
    const allQuestions = await generateExamInOneCall(combinedText, normalizedSections, {
      language,
    });

    if (allQuestions.length === 0) {
      return res.status(500).json({
        error: 'No questions could be generated. Try reducing counts or picking other PDFs.',
      });
    }

    const totalPoints = allQuestions.reduce(
      (sum, q) => sum + (Number(q.points) || 0),
      0
    );

    // 4) Insert exam
    const { data: examRow, error: examErr } = await supabase
      .from('exams')
      .insert({
        user_id: userId,
        title: title.slice(0, 200),
        pdf_ids: pdfIds,
        sections: normalizedSections,
        total_points: totalPoints,
        duration_minutes: durationMinutes,
        language,
      })
      .select('*')
      .single();
    if (examErr) {
      console.error('Exam insert error:', examErr);
      return res.status(500).json({
        error: 'Failed to save exam',
        message: examErr.message,
      });
    }

    // 5) Insert questions
    const rows = allQuestions.map((q, i) => ({
      exam_id: examRow.id,
      section: q.section_name,
      order_index: i + 1,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer || null,
      expected_answer: q.expected_answer || null,
      points: q.points || 1,
    }));
    const { data: questionRows, error: qErr } = await supabase
      .from('exam_questions')
      .insert(rows)
      .select('*')
      .order('order_index', { ascending: true });
    if (qErr) {
      console.error('Exam questions insert error:', qErr);
      await supabase.from('exams').delete().eq('id', examRow.id);
      return res.status(500).json({
        error: 'Failed to save exam questions',
        message: qErr.message,
      });
    }

    return res.json({
      success: true,
      exam: examRow,
      questions: questionRows,
    });
  } catch (error) {
    console.error('Error generating exam:', error);
    const status = error.status || 500;
    return res.status(status).json({
      error: 'Failed to generate exam',
      message: error.message,
    });
  }
});

/**
 * GET /api/exam/:id
 * Returns exam + questions. Questions hide correct_answer / expected_answer
 * unless ?reveal=true is passed (used after submission).
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reveal = req.query.reveal === 'true';

    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();
    if (examErr || !exam) return res.status(404).json({ error: 'Exam not found' });

    const { data: questions, error: qErr } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', id)
      .order('order_index', { ascending: true });
    if (qErr) return res.status(500).json({ error: qErr.message });

    const safeQuestions = questions.map((q) =>
      reveal
        ? q
        : {
            ...q,
            correct_answer: null,
            expected_answer: null,
          }
    );

    res.json({ success: true, exam, questions: safeQuestions });
  } catch (error) {
    console.error('Error loading exam:', error);
    res.status(500).json({ error: 'Failed to load exam', message: error.message });
  }
});

/**
 * POST /api/exam/:id/submit
 * Body: { userId, answers: { [questionId]: string }, timeTakenSeconds? }
 *
 * Auto-grades MCQ, cloze, true_false, short with exact/case-insensitive match.
 * Uses Gemini to grade "open" answers with 0-100 rubric (converted to points).
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, answers = {}, timeTakenSeconds = null } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();
    if (examErr || !exam) return res.status(404).json({ error: 'Exam not found' });

    const { data: questions, error: qErr } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', id)
      .order('order_index', { ascending: true });
    if (qErr) return res.status(500).json({ error: qErr.message });

    let autoScore = 0;
    let maxAutoScore = 0;
    const openToGrade = [];
    const perQuestion = {};

    for (const q of questions) {
      const given = (answers[q.id] ?? '').toString().trim();
      const correct = (q.correct_answer ?? '').toString().trim();
      const points = Number(q.points) || 1;

      if (q.question_type === 'open') {
        openToGrade.push({
          question_id: q.id,
          question_text: q.question_text,
          expected_answer: q.expected_answer || '',
          student_answer: given,
          max_points: points,
        });
        continue;
      }

      maxAutoScore += points;
      let isCorrect = false;
      if (q.question_type === 'mcq' || q.question_type === 'true_false') {
        isCorrect = given.toLowerCase() === correct.toLowerCase();
      } else if (q.question_type === 'cloze' || q.question_type === 'short') {
        // Accept case-insensitive match, trimmed
        isCorrect =
          given.toLowerCase().replace(/\s+/g, ' ') ===
          correct.toLowerCase().replace(/\s+/g, ' ');
      }
      if (isCorrect) autoScore += points;
      perQuestion[q.id] = {
        type: q.question_type,
        given,
        correct_answer: correct,
        is_correct: isCorrect,
        points_awarded: isCorrect ? points : 0,
        max_points: points,
      };
    }

    // AI grading for open-ended
    let aiGraded = [];
    if (openToGrade.length > 0) {
      aiGraded = await gradeOpenEndedAnswers(openToGrade, {
        language: exam.language || 'Turkish',
      });
      for (const g of aiGraded) {
        const q = openToGrade.find((x) => x.question_id === g.question_id);
        if (!q) continue;
        const awarded = Math.round((g.score_percent / 100) * q.max_points);
        perQuestion[q.question_id] = {
          type: 'open',
          given: q.student_answer,
          expected_answer: q.expected_answer,
          score_percent: g.score_percent,
          feedback: g.feedback,
          points_awarded: awarded,
          max_points: q.max_points,
        };
      }
    }

    const totalPointsAwarded =
      autoScore +
      Object.values(perQuestion)
        .filter((v) => v.type === 'open')
        .reduce((s, v) => s + (v.points_awarded || 0), 0);

    // Save attempt
    const { data: attempt, error: attErr } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: exam.id,
        user_id: userId,
        answers,
        auto_score: autoScore,
        max_auto_score: maxAutoScore,
        ai_graded: perQuestion,
        submitted_at: new Date().toISOString(),
        time_taken_seconds: timeTakenSeconds,
      })
      .select('*')
      .single();
    if (attErr) {
      console.error('Attempt save error:', attErr);
      return res.status(500).json({ error: attErr.message });
    }

    res.json({
      success: true,
      attempt,
      perQuestion,
      totalPointsAwarded,
      totalPointsPossible: exam.total_points,
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ error: 'Failed to submit exam', message: error.message });
  }
});

export default router;
