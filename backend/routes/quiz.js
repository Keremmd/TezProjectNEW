import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateQuizFromPDF as generateQuizFromPDFGemini } from '../utils/gemini.js';
import dotenv from 'dotenv';

dotenv.config();

// Always use Gemini for quiz generation (Groq temporarily disabled)
const generateQuizFromPDF = generateQuizFromPDFGemini;

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Fallback: local mock question generator when Gemini quota is exceeded
function generateMockQuestions(count = 10, difficulty = 'medium') {
  const difficultyLabel =
    difficulty === 'easy' ? 'easy introduction' :
    difficulty === 'hard' ? 'advanced level' :
    'core concepts';

  return Array.from({ length: count }, (_, i) => {
    const idx = i + 1;
    return {
      question_text: `Sample ${difficultyLabel} question ${idx}. Replace with real AI question when quota is available.`,
      options: [
        `Option A for question ${idx}`,
        `Option B for question ${idx}`,
        `Option C for question ${idx}`,
        `Option D for question ${idx}`,
      ],
      correct_answer: `Option A for question ${idx}`,
      explanation: `This is a placeholder explanation for question ${idx}.`,
      points: 1,
    };
  });
}

/**
 * POST /api/quiz/generate
 * Generate quiz questions from a PDF using AI
 */
router.post('/generate', async (req, res) => {
  try {
    console.log('📥 Received quiz generation request:', req.body);
    
    const { 
      pdfId, 
      userId, 
      title, 
      questionCount = 10, 
      difficulty = 'medium',
      privacy = 'private',
      timeLimitMinutes = null
    } = req.body;

    if (!pdfId || !userId || !title) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: pdfId, userId, title' 
      });
    }

    // Get PDF from database
    const { data: pdf, error: pdfError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (pdfError || !pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Download PDF from Supabase Storage
    const { data: pdfFile, error: downloadError } = await supabase
      .storage
      .from('pdfs')
      .download(pdf.file_path);

    if (downloadError) {
      return res.status(500).json({ 
        error: 'Failed to download PDF',
        details: downloadError.message 
      });
    }

    // Convert PDF to text
    const pdfParse = (await import('pdf-parse')).default;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;

    console.log(`📄 PDF text extracted: ${pdfText.length} characters`);

    // Generate quiz questions using AI (Gemini 2.5 Flash)
    console.log(`🤖 Generating ${questionCount} ${difficulty} questions (Gemini)...`);
    let questions;

    try {
      questions = await generateQuizFromPDF(pdfText, {
        questionCount,
        difficulty,
        language: 'Turkish'
      });
    } catch (aiError) {
      const msg = aiError.message || '';
      console.error('🤖 Gemini AI error:', msg);

      const isQuotaError =
        msg.includes('Too Many Requests') ||
        msg.includes('429') ||
        msg.includes('quota') ||
        msg.includes('Quota exceeded') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('limit: 0');

      if (isQuotaError) {
        console.warn('⚠️ Gemini quota exceeded — not creating quiz with placeholder questions.');
        return res.status(429).json({
          success: false,
          error: 'AI quota exceeded',
          message: 'Google AI (Gemini) quota is exceeded or free tier has no quota for this project. Enable billing at Google AI Studio or use an API key from a project with available quota. No quiz was created.'
        });
      }
      throw aiError;
    }

    console.log(`✅ Questions generated, creating quiz in DB...`);

    // Create quiz in database
    const insertPayload = {
      user_id: userId,
      pdf_id: pdfId,
      title,
      difficulty,
      total_questions: questions.length,
      privacy
    };

    if (timeLimitMinutes != null && Number(timeLimitMinutes) > 0) {
      insertPayload.time_limit = Number(timeLimitMinutes);
    }

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert(insertPayload)
      .select()
      .single();

    if (quizError) {
      console.error('❌ Quiz DB error:', quizError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create quiz',
        details: quizError.message 
      });
    }

    console.log(`✅ Quiz created in DB: ${quiz.id}, inserting questions...`);

    // Insert questions
    const questionsToInsert = questions.map((q, index) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: 'multiple_choice',
      options: JSON.stringify(q.options),
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: q.points || 1,
      order_index: index
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('❌ Questions DB error:', questionsError);
      // Rollback quiz if questions insertion fails
      await supabase.from('quizzes').delete().eq('id', quiz.id);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to insert questions',
        details: questionsError.message 
      });
    }

    console.log(`✅✅✅ QUIZ FULLY CREATED: ${quiz.id} (AI)`);
    console.log(`📤 Sending success response to frontend...`);

    return res.status(200).json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        total_questions: quiz.total_questions,
        time_limit: quiz.time_limit ?? insertPayload.time_limit ?? null
      },
      message: `Successfully generated ${questions.length} AI questions`
    });

  } catch (error) {
    console.error('❌ Error in quiz generation:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to generate quiz',
      message: error.message 
    });
  }
});

export default router;
