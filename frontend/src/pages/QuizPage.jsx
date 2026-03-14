import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trophy,
  Brain
} from 'lucide-react';

const QuizPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  // Timer
  useEffect(() => {
    if (!showResults && quiz) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showResults, quiz]);

  // Auto-submit when time limit (if any) is reached
  const timeLimitSeconds = quiz?.time_limit ? quiz.time_limit * 60 : null;

  useEffect(() => {
    if (!quiz || showResults || autoSubmittedRef.current || timeLimitSeconds == null) return;
    if (timeElapsed >= timeLimitSeconds) {
      autoSubmittedRef.current = true;
      handleSubmit();
    }
  }, [timeElapsed, timeLimitSeconds, quiz, showResults]);

  const loadQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*, pdf:pdfs(file_name, course_name)')
        .eq('id', id)
        .single();

      if (quizError) throw quizError;

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index');

      if (questionsError) throw questionsError;

      setQuiz(quizData);
      setQuestions(questionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading quiz:', error);
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    let score = 0;
    let totalPoints = 0;

    questions.forEach(q => {
      totalPoints += q.points;
      if (userAnswers[q.id] === q.correct_answer) {
        score += q.points;
      }
    });

    const percentage = ((score / totalPoints) * 100).toFixed(2);

    try {
      await supabase.from('quiz_attempts').insert({
        quiz_id: id,
        user_id: user.id,
        score,
        total_points: totalPoints,
        percentage,
        answers: userAnswers,
        started_at: new Date(Date.now() - timeElapsed * 1000).toISOString(),
        completed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }

    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correct_answer) {
        correct++;
      }
    });
    return { correct, total: questions.length, percentage: ((correct / questions.length) * 100).toFixed(0) };
  };

  const downloadCsvReport = () => {
    if (!quiz || !questions.length) return;

    const { correct, total, percentage } = calculateScore();

    const headers = [
      'Question #',
      'Question',
      'Your answer',
      'Correct answer',
      'Is correct'
    ];

    const rows = questions.map((q, index) => {
      const userAnswer = userAnswers[q.id] || 'Not answered';
      const isCorrect = userAnswers[q.id] === q.correct_answer ? 'Yes' : 'No';
      return [
        index + 1,
        q.question_text,
        userAnswer,
        q.correct_answer,
        isCorrect
      ];
    });

    const metaRows = [
      ['Quiz title', quiz.title || ''],
      ['PDF', quiz.pdf?.file_name || ''],
      ['Difficulty', quiz.difficulty || ''],
      ['Score (%)', `${percentage}%`],
      ['Correct / Total', `${correct} / ${total}`],
      ['Time spent (seconds)', timeElapsed],
      [],
    ];

    const allRows = [
      ...metaRows,
      headers,
      ...rows,
    ];

    const escapeCell = (cell) => {
      const value = cell == null ? '' : String(cell);
      const needsQuotes = /[",\n]/.test(value);
      const escaped = value.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const csvContent = allRows
      .map(row => row.map(escapeCell).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${quiz.title || 'quiz'}-report-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPdfReport = () => {
    if (!quiz || !questions.length) return;

    const { correct, total, percentage } = calculateScore();
    const dateStr = new Date().toLocaleString();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>${quiz.title || 'Quiz'} - Detailed Report</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; }
            .meta { font-size: 14px; color: #4B5563; margin-bottom: 16px; }
            .summary-grid { display: flex; gap: 16px; margin: 16px 0 24px; }
            .summary-card { flex: 1; background: #F3F4F6; padding: 12px 16px; border-radius: 8px; }
            .summary-label { font-size: 12px; color: #6B7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .06em; }
            .summary-value { font-size: 20px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
            th, td { border: 1px solid #E5E7EB; padding: 6px 8px; vertical-align: top; }
            th { background: #F9FAFB; text-align: left; }
            tr.correct { background-color: #ECFDF3; }
            tr.incorrect { background-color: #FEF2F2; }
            .question-text { font-weight: 500; }
            .answer-label { font-weight: 500; }
            .explanation { color: #4B5563; margin-top: 4px; }
          </style>
        </head>
        <body>
          <h1>${quiz.title || 'Quiz'} - Detailed Report</h1>
          <div class="meta">
            Generated at: ${dateStr}<br />
            PDF: ${quiz.pdf?.file_name || '-'}<br />
            Difficulty: ${quiz.difficulty || '-'}
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Score</div>
              <div class="summary-value">${percentage}%</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Correct</div>
              <div class="summary-value">${correct} / ${total}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Time spent</div>
              <div class="summary-value">${formatTime(timeElapsed)}</div>
            </div>
          </div>

          <h2>Question Details</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Question</th>
                <th style="width: 25%;">Your answer</th>
                <th style="width: 25%;">Correct answer</th>
              </tr>
            </thead>
            <tbody>
              ${questions
                .map((q, index) => {
                  const userAnswer = userAnswers[q.id] || 'Not answered';
                  const isCorrect = userAnswers[q.id] === q.correct_answer;
                  const explanation = q.explanation || '';
                  const rowClass = isCorrect ? 'correct' : 'incorrect';
                  return `
                    <tr class="${rowClass}">
                      <td>${index + 1}</td>
                      <td>
                        <div class="question-text">${index + 1}. ${q.question_text}</div>
                        ${explanation
                          ? `<div class="explanation">💡 ${explanation}</div>`
                          : ''
                        }
                      </td>
                      <td>${userAnswer}</td>
                      <td>${q.correct_answer}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-8 bg-purple-500/20 blur-3xl rounded-full" />
          <div className="relative bg-slate-900/80 border border-slate-800 rounded-2xl px-10 py-8 shadow-2xl backdrop-blur">
            <div className="w-14 h-14 border-[3px] border-purple-500/60 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-200 text-sm tracking-wide uppercase mb-1 text-center">
              Preparing your quiz
            </p>
            <p className="text-slate-400 text-xs text-center">
              We are loading your questions and study data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative max-w-md mx-auto px-6">
          <div className="absolute -inset-10 bg-red-500/10 blur-3xl rounded-full" />
          <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-10 shadow-2xl backdrop-blur text-center">
            <Brain className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-50 mb-2">Quiz not found</h2>
            <p className="text-slate-400 text-sm mb-6">
              This quiz could not be loaded. It may have been removed or you might have followed an old link.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-sm font-medium text-white shadow-lg shadow-purple-500/30 hover:opacity-95 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const score = showResults ? calculateScore() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 relative">
      <div className="pointer-events-none fixed inset-0 opacity-50">
        <div className="absolute -top-24 -left-10 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute top-32 -right-16 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-slate-100 transition-colors px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/80"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-[10px] text-slate-500 uppercase tracking-[0.22em]">
              <span className="text-slate-400/90">Question</span>
              <span className="text-xs text-slate-200">
                {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="tabular-nums">
                {timeLimitSeconds != null
                  ? `${formatTime(Math.max(0, timeLimitSeconds - timeElapsed))} ${t('quiz_timer_remaining_suffix')}`
                  : formatTime(timeElapsed)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 sm:space-y-8"
            >
              {/* Top meta & progress */}
              <div className="flex flex-col gap-4 sm:gap-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-purple-400 mb-2">
                      Active Quiz
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 tracking-tight mb-1">
                      {quiz.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-400 mt-1">
                      {quiz.pdf?.file_name && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
                          {quiz.pdf.file_name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 capitalize">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400/90" />
                        {quiz.difficulty}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400/90" />
                        {questions.length} questions
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs text-slate-400">
                    <span className="uppercase tracking-[0.18em] text-[10px]">Progress</span>
                    <span className="text-sm text-slate-100">
                      {Object.keys(userAnswers).length} / {questions.length} answered
                    </span>
                  </div>
                </div>

                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-900/80 border border-slate-800/80">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-sky-400 shadow-[0_0_25px_rgba(129,140,248,0.7)] transition-all duration-300"
                    style={{ width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question & answers */}
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5 sm:gap-6"
              >
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_18px_45px_rgba(15,23,42,0.85)] backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/80 text-[11px] text-slate-300">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-medium text-slate-100">
                        {currentQuestionIndex + 1}
                      </span>
                      <span className="uppercase tracking-[0.16em] text-[10px] text-slate-400">Question</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {currentQuestion.points ?? 1} pt{(currentQuestion.points ?? 1) > 1 ? 's' : ''}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-50 leading-relaxed">
                    {currentQuestion.question_text}
                  </h2>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_18px_45px_rgba(15,23,42,0.85)] backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-3">
                    Choose the best answer
                  </p>
                  <div className="space-y-2.5 sm:space-y-3">
                    {JSON.parse(currentQuestion.options).map((option, index) => {
                      const isSelected = userAnswers[currentQuestion.id] === option;
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswer(currentQuestion.id, option)}
                          className={`group w-full text-left px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl border text-sm sm:text-[15px] transition-all duration-150 ${
                            isSelected
                              ? 'border-purple-400/90 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-sky-500/20 shadow-[0_0_25px_rgba(129,140,248,0.45)]'
                              : 'border-slate-800/90 bg-slate-950/70 hover:border-slate-500 hover:bg-slate-900/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border text-[11px] font-medium ${
                                isSelected
                                  ? 'border-purple-300 bg-purple-500 text-slate-50'
                                  : 'border-slate-700 bg-slate-900 text-slate-300 group-hover:border-slate-500'
                              }`}
                            >
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-slate-100 group-hover:text-slate-50">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm font-medium text-slate-200 hover:bg-slate-900/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(userAnswers).length !== questions.length}
                    className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-purple-500/40 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>Finish quiz</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 rounded-xl bg-slate-100 text-sm font-semibold text-slate-900 hover:bg-white"
                  >
                    <span>Next question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22 }}
              className="space-y-6 sm:space-y-7"
            >
              {/* Results */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/80 shadow-[0_26px_65px_rgba(15,23,42,0.95)] backdrop-blur-2xl p-7 sm:p-9">
                <div className="pointer-events-none absolute inset-0 opacity-60">
                  <div className="absolute -top-10 left-8 h-40 w-40 rounded-full bg-yellow-400/25 blur-3xl" />
                  <div className="absolute -bottom-16 right-0 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" />
                </div>

                <div className="relative flex flex-col items-center text-center gap-3 sm:gap-4 mb-7 sm:mb-8">
                  <div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-slate-950/80 border border-yellow-400/40 shadow-lg shadow-yellow-400/40">
                    <Trophy className="w-9 h-9 sm:w-11 sm:h-11 text-yellow-300" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-1">
                      Session Summary
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">
                      Quiz completed
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-400">
                      Here is a breakdown of how you performed in this quiz.
                    </p>
                  </div>
                </div>

                <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-7 sm:mb-8">
                  <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-purple-500/15 via-slate-950 to-slate-950 px-4 py-4 sm:px-5 sm:py-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2">Score</p>
                    <p className="text-3xl sm:text-4xl font-semibold text-purple-300 tabular-nums">
                      {score.percentage}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-emerald-500/10 via-slate-950 to-slate-950 px-4 py-4 sm:px-5 sm:py-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2">Correct</p>
                    <p className="text-3xl sm:text-4xl font-semibold text-emerald-300 tabular-nums">
                      {score.correct}
                      <span className="ml-1 text-sm text-slate-400">/ {questions.length}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-sky-500/10 via-slate-950 to-slate-950 px-4 py-4 sm:px-5 sm:py-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2">Time</p>
                    <p className="text-2xl sm:text-3xl font-semibold text-sky-300 tabular-nums">
                      {formatTime(timeElapsed)}
                    </p>
                  </div>
                </div>

                {/* Export buttons */}
                <div className="relative flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-7">
                  <button
                    onClick={downloadCsvReport}
                    className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border border-slate-700/90 bg-slate-950/80 text-xs sm:text-sm font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-900/90"
                  >
                    Download detailed report (CSV)
                  </button>
                  <button
                    onClick={downloadPdfReport}
                    className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-50 via-slate-200 to-slate-100 text-xs sm:text-sm font-semibold text-slate-950 shadow-lg shadow-slate-200/40 hover:opacity-95"
                  >
                    Download detailed report (PDF)
                  </button>
                </div>

                {/* Question Review */}
                <div className="relative rounded-2xl border border-slate-800/90 bg-slate-950/90 max-h-96 sm:max-h-[26rem] overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-4">
                  {questions.map((q, index) => {
                    const isCorrect = userAnswers[q.id] === q.correct_answer;
                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border px-3.5 sm:px-4 py-3.5 sm:py-4 ${
                          isCorrect
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-rose-500/40 bg-rose-500/5'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-2.5">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm sm:text[15px] text-slate-50 font-medium mb-1.5">
                              {index + 1}. {q.question_text}
                            </p>
                            <p
                              className={`text-xs sm:text-sm ${
                                isCorrect ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              Your answer: {userAnswers[q.id] || 'Not answered'}
                            </p>
                            {!isCorrect && (
                              <p className="text-xs sm:text-sm text-rose-100/80 mt-0.5">
                                Correct answer: {q.correct_answer}
                              </p>
                            )}
                            {q.explanation && (
                              <p className="text-xs sm:text-sm text-slate-200 mt-2">
                                💡 {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-900/80"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to dashboard</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizPage;
