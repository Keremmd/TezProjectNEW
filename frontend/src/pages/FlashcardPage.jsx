import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle, RotateCcw, Layers, Trash2 } from 'lucide-react';

const FlashcardPage = ({ mode = 'quiz' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deckTitle, setDeckTitle] = useState('');
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteCardModalOpen, setDeleteCardModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [deletingCard, setDeletingCard] = useState(false);

  useEffect(() => {
    loadDeck();
  }, [id, mode]);

  const loadDeck = async () => {
    try {
      if (mode === 'deck') {
        const { data: deckData, error: deckError } = await supabase
          .from('flashcard_decks')
          .select('id, title')
          .eq('id', id)
          .single();

        if (deckError || !deckData) throw deckError || new Error('Deck not found');

        const { data: cardRows, error: cardsError } = await supabase
          .from('flashcards')
          .select('id, front, back')
          .eq('deck_id', id)
          .order('order_index');

        if (cardsError) throw cardsError;

        const list = (cardRows || []).map((c) => ({
          id: c.id,
          front: c.front,
          back: c.back,
        }));

        setDeckTitle(deckData.title);
        setCards(list);
      } else {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*, pdf:pdfs(file_name, course_name)')
          .eq('id', id)
          .single();

        if (quizError) throw quizError;

        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('id, question_text, correct_answer')
          .eq('quiz_id', id)
          .order('order_index');

        if (questionsError) throw questionsError;

        const list = (questionsData || []).map((q) => ({
          id: q.id,
          front: q.question_text,
          back: q.correct_answer,
        }));

        setDeckTitle(quizData?.title || 'Quiz');
        setCards(list);
      }

      setCurrentIndex(0);
      setFlipped(false);
      setLoading(false);
    } catch (error) {
      console.error('Error loading flashcard deck:', error);
      setLoading(false);
    }
  };

  const shuffleDeck = () => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setFlipped(false);
    setShuffled(true);
  };

  const resetOrder = () => {
    loadDeck();
    setShuffled(false);
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFlipped(false);
    }
  };

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  const handleDeleteCard = () => {
    if (!currentCard) return;
    setCardToDelete(currentCard);
    setDeleteCardModalOpen(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;

    setDeletingCard(true);
    try {
      if (mode === 'deck') {
        const { error } = await supabase
          .from('flashcards')
          .delete()
          .eq('id', cardToDelete.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quiz_questions')
          .delete()
          .eq('id', cardToDelete.id);

        if (error) throw error;
      }

      // Remove from local state
      const newCards = cards.filter((c) => c.id !== cardToDelete.id);
      setCards(newCards);

      // Adjust currentIndex if needed
      if (currentIndex >= newCards.length && newCards.length > 0) {
        setCurrentIndex(newCards.length - 1);
      } else if (newCards.length === 0) {
        // No cards left, will show empty state
        setCurrentIndex(0);
      }
      setFlipped(false);

      setDeleteCardModalOpen(false);
      setCardToDelete(null);
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card: ' + error.message);
    } finally {
      setDeletingCard(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-8 bg-purple-500/20 blur-3xl rounded-full" />
          <div className="relative bg-slate-900/80 border border-slate-800 rounded-2xl px-10 py-8 shadow-2xl backdrop-blur">
            <div className="w-14 h-14 border-[3px] border-purple-500/60 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-200 text-sm tracking-wide uppercase mb-1 text-center">
              Preparing your deck
            </p>
            <p className="text-slate-400 text-xs text-center">
              We are loading your flashcards and study data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if ((!deckTitle || cards.length === 0) && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative max-w-md mx-auto px-6">
          <div className="absolute -inset-10 bg-purple-500/10 blur-3xl rounded-full" />
          <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-10 shadow-2xl backdrop-blur text-center">
            <Layers className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-50 mb-2">No cards in this deck</h2>
            <p className="text-slate-400 text-sm mb-6">
              This deck is empty for now. Generate flashcards from a quiz or create a new deck to start studying.
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

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col relative">
      <div className="pointer-events-none fixed inset-0 opacity-50">
        <div className="absolute -top-24 -left-10 h-64 w-64 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute top-32 -right-16 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-slate-950/80 border-b border-slate-800/80 backdrop-blur flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-slate-100 transition-colors px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/80"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={shuffleDeck}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/80 transition-colors"
                title="Shuffle deck"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              {shuffled && (
                <button
                  onClick={resetOrder}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/80 transition-colors"
                  title="Reset order"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleDeleteCard}
                className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors"
                title="Delete current card"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-50 truncate">
                {deckTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Card {currentIndex + 1} of {cards.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Card area */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCard.id}-${currentIndex}`}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-2xl"
          >
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="w-full text-left block"
            >
              <div
                className={`relative rounded-3xl border min-h-[260px] sm:min-h-[280px] overflow-hidden transition-all duration-300 shadow-[0_20px_60px_rgba(15,23,42,0.9)] ${
                  flipped
                    ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-sky-500 border-purple-400/80'
                    : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-600/90'
                }`}
              >
                {!flipped && (
                  <div className="pointer-events-none absolute inset-0 opacity-60">
                    <div className="absolute -top-10 left-0 h-40 w-40 rounded-full bg-purple-500/25 blur-3xl" />
                    <div className="absolute -bottom-16 right-0 h-52 w-52 rounded-full bg-indigo-500/25 blur-3xl" />
                  </div>
                )}
                <div className="relative inset-0 flex flex-col justify-center px-6 sm:px-8 py-7 sm:py-8">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] ${
                        flipped ? 'text-white/80' : 'text-slate-300'
                      }`}
                    >
                      <span className="inline-flex h-1.5 w-6 rounded-full bg-gradient-to-r from-purple-400 to-sky-400" />
                      {flipped ? 'Answer' : 'Question'}
                    </span>
                  </div>
                  <motion.p
                    key={flipped ? 'back' : 'front'}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-base sm:text-lg md:text-xl font-medium leading-relaxed ${
                      flipped ? 'text-white' : 'text-slate-50'
                    }`}
                  >
                    {flipped ? currentCard.back : currentCard.front}
                  </motion.p>
                  <p
                    className={`mt-5 text-xs sm:text-sm ${
                      flipped ? 'text-white/70' : 'text-slate-300/80'
                    }`}
                  >
                    Tap to {flipped ? 'show question' : 'show answer'}
                  </p>
                </div>
              </div>
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-slate-200 hover:bg-slate-900/80 hover:border-slate-600/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-medium text-slate-300 min-w-[4rem] text-center">
            {currentIndex + 1} / {cards.length}
          </span>
          <button
            onClick={goNext}
            disabled={currentIndex === cards.length - 1}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-slate-200 hover:bg-slate-900/80 hover:border-slate-600/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Delete Card Confirmation Modal */}
      {deleteCardModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-[0_22px_60px_rgba(15,23,42,0.9)]"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-50 mb-2">Delete Card?</h3>
              <p className="text-slate-400">
                Are you sure you want to delete this card? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteCardModalOpen(false);
                  setCardToDelete(null);
                }}
                disabled={deletingCard}
                className="flex-1 px-6 py-3 bg-slate-800 text-slate-50 rounded-xl font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCard}
                disabled={deletingCard}
                className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {deletingCard ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FlashcardPage;
