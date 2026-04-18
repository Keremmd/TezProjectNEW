import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import {
  ChevronLeft,
  Download,
  Clock,
  Send,
  Loader,
  CheckCircle2,
  XCircle,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { API_URL } from '../lib/api';

const TYPE_LABELS_TR = {
  mcq: 'Çoktan Seçmeli',
  open: 'Klasik',
  cloze: 'Boşluk Doldurma',
  true_false: 'Doğru / Yanlış',
  short: 'Kısa Cevap',
};

const TYPE_LABELS_EN = {
  mcq: 'Multiple Choice',
  open: 'Open-Ended',
  cloze: 'Fill in the Blank',
  true_false: 'True / False',
  short: 'Short Answer',
};

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// jsPDF default "helvetica" font only supports Windows-1252 (no Turkish chars).
// Rather than shipping a 200KB+ Unicode font, we transliterate Turkish-specific
// characters to their ASCII equivalents when writing the PDF. This preserves
// readability without any external font dependency.
const TR_TO_ASCII = {
  Ç: 'C', ç: 'c',
  Ğ: 'G', ğ: 'g',
  İ: 'I', ı: 'i',
  Ö: 'O', ö: 'o',
  Ş: 'S', ş: 's',
  Ü: 'U', ü: 'u',
  Â: 'A', â: 'a',
  Î: 'I', î: 'i',
  Û: 'U', û: 'u',
};
function toPdfText(str) {
  if (str == null) return '';
  return String(str).replace(
    /[ÇçĞğİıÖöŞşÜüÂâÎîÛû]/g,
    (ch) => TR_TO_ASCII[ch] || ch
  );
}

export default function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useI18n();
  const TYPE_LABELS = language === 'tr' ? TYPE_LABELS_TR : TYPE_LABELS_EN;

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_URL}/api/exam/${id}`);
        const data = await resp.json();
        if (cancelled) return;
        if (!resp.ok || !data.success) {
          throw new Error(data.error || data.message || 'Sınav yüklenemedi');
        }
        setExam(data.exam);
        setQuestions(data.questions || []);
        if (data.exam.duration_minutes) {
          setTimeLeft(data.exam.duration_minutes * 60);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user, navigate]);

  // Tick timer while started and not submitted
  useEffect(() => {
    if (!started || result) return;
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setInterval(() => {
      setTimeLeft((v) => (v !== null ? v - 1 : v));
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, timeLeft, result]);

  const sections = useMemo(() => {
    const bySection = new Map();
    for (const q of questions) {
      const key = q.section || 'Bölüm';
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key).push(q);
    }
    return Array.from(bySection.entries()).map(([name, qs]) => ({ name, questions: qs }));
  }, [questions]);

  const handleStart = () => {
    setStarted(true);
    setStartedAt(Date.now());
  };

  const handleSubmit = async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const timeTakenSeconds = startedAt
        ? Math.round((Date.now() - startedAt) / 1000)
        : null;
      const resp = await fetch(`${API_URL}/api/exam/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          answers,
          timeTakenSeconds,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || data.message || 'Sınav gönderilemedi');
      }
      // Re-fetch with reveal=true so correct answers show
      const revealResp = await fetch(`${API_URL}/api/exam/${id}?reveal=true`);
      const revealData = await revealResp.json();
      if (revealResp.ok && revealData.success) {
        setQuestions(revealData.questions || []);
      }
      setResult(data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportToPDF = ({ withAnswers = false } = {}) => {
    if (!exam) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    const writeLine = (text, options = {}) => {
      const {
        size = 11,
        style = 'normal',
        gap = 6,
        indent = 0,
        color = [30, 30, 30],
      } = options;
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
      const wrapped = doc.splitTextToSize(
        toPdfText(text),
        pageWidth - margin * 2 - indent
      );
      for (const line of wrapped) {
        if (y + size + 2 > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin + indent, y);
        y += size + gap;
      }
    };

    // Header
    writeLine(exam.title, { size: 18, style: 'bold', gap: 4 });
    const meta = [];
    if (exam.duration_minutes) meta.push(`Süre: ${exam.duration_minutes} dk`);
    if (exam.total_points) meta.push(`Toplam Puan: ${exam.total_points}`);
    if (meta.length) writeLine(meta.join('  ·  '), { size: 10, color: [100, 100, 100], gap: 12 });

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    // Name / date lines (for printed exam)
    if (!withAnswers) {
      writeLine('Ad Soyad: ______________________________        Tarih: ____ / ____ / ______', {
        size: 10,
        gap: 18,
      });
    }

    // Sections
    let qIndex = 1;
    for (const section of sections) {
      writeLine(section.name, { size: 13, style: 'bold', gap: 8 });
      for (const q of section.questions) {
        const typeLabel = TYPE_LABELS[q.question_type] || q.question_type;
        writeLine(`${qIndex}. (${typeLabel} · ${q.points} pts)  ${q.question_text}`, {
          size: 11,
          style: 'bold',
          gap: 6,
        });

        if (q.question_type === 'mcq' && Array.isArray(q.options)) {
          q.options.forEach((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const marker =
              withAnswers && q.correct_answer && opt === q.correct_answer ? '✓' : ' ';
            writeLine(`  ${marker} ${letter}) ${opt}`, { size: 10, indent: 12 });
          });
        } else if (q.question_type === 'true_false') {
          writeLine('   ( ) Doğru    ( ) Yanlış', { size: 10, indent: 12 });
          if (withAnswers && q.correct_answer) {
            writeLine(`   Cevap: ${q.correct_answer}`, {
              size: 10,
              indent: 12,
              color: [0, 120, 0],
            });
          }
        } else if (q.question_type === 'cloze' || q.question_type === 'short') {
          writeLine('   Cevap: ______________________________', { size: 10, indent: 12 });
          if (withAnswers && q.correct_answer) {
            writeLine(`   Doğru cevap: ${q.correct_answer}`, {
              size: 10,
              indent: 12,
              color: [0, 120, 0],
            });
          }
        } else if (q.question_type === 'open') {
          for (let i = 0; i < 5; i++) {
            writeLine('   ' + '_'.repeat(100), { size: 10, indent: 12, gap: 10 });
          }
          if (withAnswers && q.expected_answer) {
            writeLine(`   Örnek cevap: ${q.expected_answer}`, {
              size: 9,
              indent: 12,
              color: [0, 120, 0],
            });
          }
        }
        y += 8;
        qIndex += 1;
      }
      y += 6;
    }

    const safeTitle = (exam.title || 'sinav').replace(/[^a-zA-Z0-9-_]+/g, '_');
    doc.save(`${safeTitle}${withAnswers ? '_cevap_anahtari' : ''}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-black p-6">
        <p className="text-red-500">{error || 'Sınav bulunamadı'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-black"
        >
          Dashboard'a dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            {timeLeft !== null && started && !result && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold ${
                  timeLeft < 60
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={() => exportToPDF({ withAnswers: false })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            {result && (
              <button
                onClick={() => exportToPDF({ withAnswers: true })}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-500 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Download className="w-3.5 h-3.5" />
                Cevap Anahtarı
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {exam.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {questions.length} soru · {exam.total_points} puan
                {exam.duration_minutes ? ` · ${exam.duration_minutes} dk` : ''}
              </p>
            </div>
            {!started && !result && (
              <button
                onClick={handleStart}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm hover:opacity-90"
              >
                Sınava Başla
              </button>
            )}
          </div>
        </div>

        {/* Sections + questions */}
        <div className="space-y-8">
          {sections.map((section, sIdx) => {
            let runningIndex = 0;
            for (let i = 0; i < sIdx; i++) runningIndex += sections[i].questions.length;
            return (
              <div key={section.name}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-zinc-800">
                  {section.name}
                </h2>
                <div className="space-y-4">
                  {section.questions.map((q, qIdx) => {
                    const n = runningIndex + qIdx + 1;
                    const myAnswer = answers[q.id] ?? '';
                    const graded = result?.perQuestion?.[q.id];
                    const disabled = !!result || !started;
                    return (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-500">
                                Soru {n}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                                {TYPE_LABELS[q.question_type]}
                              </span>
                              <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">
                                {q.points} pts
                              </span>
                            </div>
                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                              {q.question_text}
                            </p>
                          </div>
                          {graded && (
                            <div
                              className={`flex items-center gap-1 text-sm font-semibold ${
                                graded.is_correct ||
                                (graded.score_percent !== undefined && graded.score_percent >= 60)
                                  ? 'text-green-600'
                                  : 'text-red-500'
                              }`}
                            >
                              {graded.is_correct ||
                              (graded.score_percent !== undefined && graded.score_percent >= 60) ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              {graded.points_awarded}/{graded.max_points}
                            </div>
                          )}
                        </div>

                        {/* Inputs by type */}
                        {q.question_type === 'mcq' && Array.isArray(q.options) && (
                          <div className="space-y-2">
                            {q.options.map((opt, i) => {
                              const letter = String.fromCharCode(65 + i);
                              const selected = myAnswer === opt;
                              const isCorrect = result && opt === q.correct_answer;
                              const isWrongSelected = result && selected && !isCorrect;
                              return (
                                <label
                                  key={i}
                                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                    isCorrect
                                      ? 'border-green-500 bg-green-100 dark:bg-green-500/20'
                                      : isWrongSelected
                                      ? 'border-red-500 bg-red-100 dark:bg-red-500/20'
                                      : selected
                                      ? 'border-purple-500 bg-purple-100 dark:bg-purple-500/20 shadow-md shadow-purple-500/20'
                                      : 'border-gray-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-700'
                                  } ${disabled ? 'cursor-default' : ''}`}
                                >
                                  <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    disabled={disabled}
                                    checked={selected}
                                    onChange={() =>
                                      setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                    }
                                    className="mt-1"
                                  />
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    <span className="font-semibold mr-2">{letter})</span>
                                    {opt}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {q.question_type === 'true_false' && (
                          <div className="flex gap-3">
                            {['Doğru', 'Yanlış'].map((tv) => {
                              const selected = myAnswer === tv;
                              const isCorrect = result && q.correct_answer === tv;
                              const isWrongSelected = result && selected && !isCorrect;
                              return (
                                <button
                                  key={tv}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() =>
                                    setAnswers((prev) => ({ ...prev, [q.id]: tv }))
                                  }
                                  className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${
                                    isCorrect
                                      ? 'border-green-500 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300'
                                      : isWrongSelected
                                      ? 'border-red-500 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                                      : selected
                                      ? 'border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-500/30 dark:bg-purple-500 dark:text-white'
                                      : 'border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-gray-200 hover:border-purple-300 dark:hover:border-purple-700'
                                  } ${disabled ? 'cursor-default' : ''}`}
                                >
                                  {tv}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {(q.question_type === 'cloze' || q.question_type === 'short') && (
                          <input
                            type="text"
                            disabled={disabled}
                            value={myAnswer}
                            onChange={(e) =>
                              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder="Cevabını yaz..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-80"
                          />
                        )}

                        {q.question_type === 'open' && (
                          <textarea
                            disabled={disabled}
                            value={myAnswer}
                            onChange={(e) =>
                              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            rows={5}
                            placeholder="Cevabını buraya yaz..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-80 resize-y"
                          />
                        )}

                        {/* Reveal correct/feedback after submit */}
                        {result && (
                          <div className="mt-3 space-y-2">
                            {graded?.feedback && (
                              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-900 dark:text-blue-200">
                                <span className="font-semibold">Geri bildirim: </span>
                                {graded.feedback}
                                {graded.score_percent !== undefined && (
                                  <span className="ml-2 text-xs">
                                    ({graded.score_percent}/100)
                                  </span>
                                )}
                              </div>
                            )}
                            {q.question_type === 'open' && q.expected_answer && (
                              <div className="p-3 rounded-lg bg-gray-100 dark:bg-zinc-800 text-xs text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Örnek ideal cevap: </span>
                                {q.expected_answer}
                              </div>
                            )}
                            {(q.question_type === 'cloze' || q.question_type === 'short') &&
                              q.correct_answer && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  <span className="font-semibold">Doğru cevap: </span>
                                  {q.correct_answer}
                                </div>
                              )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit */}
        {started && !result && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Değerlendiriliyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Sınavı Bitir
                </>
              )}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            ref={resultRef}
            className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-6 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Sınav Tamamlandı
            </h2>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {result.totalPointsAwarded} / {result.totalPointsPossible}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Otomatik puanlanan: {result.attempt.auto_score}/{result.attempt.max_auto_score}
              {result.attempt.time_taken_seconds != null &&
                ` · Süre: ${formatTime(result.attempt.time_taken_seconds)}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
