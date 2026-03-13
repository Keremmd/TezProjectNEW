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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-20 h-20 text-gray-500 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-xl mb-4">Quiz not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const score = showResults ? calculateScore() : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-white/80 dark:bg-zinc-900/95 border-b border-gray-200 dark:border-zinc-800 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-5 h-5" />
                <span>
                  {timeLimitSeconds != null
                    ? `${formatTime(Math.max(0, timeLimitSeconds - timeElapsed))} ${t('quiz_timer_remaining_suffix')}`
                    : formatTime(timeElapsed)}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} / {questions.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Quiz Info */}
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-500 dark:text-purple-400 mb-1">
                  Quiz
                </p>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {quiz.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {quiz.pdf?.file_name && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200">
                      {quiz.pdf.file_name}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 capitalize">
                    {quiz.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200">
                    {questions.length} questions
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {Object.keys(userAnswers).length} / {questions.length} answered
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 mb-8 shadow-sm dark:shadow-none"
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  {currentQuestion.question_text}
                </h2>

                <div className="space-y-3">
                  {JSON.parse(currentQuestion.options).map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(currentQuestion.id, option)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        userAnswers[currentQuestion.id] === option
                          ? 'border-purple-500 bg-purple-500/8 dark:bg-purple-500/10 shadow-sm'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600 bg-gray-50 dark:bg-zinc-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          userAnswers[currentQuestion.id] === option
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-400 dark:border-zinc-600'
                        }`}>
                          {userAnswers[currentQuestion.id] === option && (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(userAnswers).length !== questions.length}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              {/* Results */}
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 mb-8">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Quiz Completed!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Here are your results</p>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Score</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{score.percentage}%</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Correct</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{score.correct}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Time</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatTime(timeElapsed)}</p>
                  </div>
                </div>

                {/* Question Review */}
                <div className="text-left space-y-4 max-h-96 overflow-y-auto">
                  {questions.map((q, index) => {
                    const isCorrect = userAnswers[q.id] === q.correct_answer;
                    return (
                      <div key={q.id} className="bg-gray-100 dark:bg-zinc-800 rounded-xl p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          {isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400 flex-shrink-0 mt-1" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-white font-medium mb-2">
                              {index + 1}. {q.question_text}
                            </p>
                            <p className={`text-sm ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              Your answer: {userAnswers[q.id] || 'Not answered'}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Correct answer: {q.correct_answer}
                              </p>
                            )}
                            {q.explanation && (
                              <p className="text-sm text-gray-500 mt-2">
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

              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 font-semibold"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizPage;
