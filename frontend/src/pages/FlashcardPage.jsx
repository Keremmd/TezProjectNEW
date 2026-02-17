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
    if (mode !== 'deck') return; // Only allow deletion for PDF decks
    setCardToDelete(currentCard);
    setDeleteCardModalOpen(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete || mode !== 'deck') return;
    
    setDeletingCard(true);
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardToDelete.id);

      if (error) throw error;

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
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if ((!deckTitle || cards.length === 0) && !loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Layers className="w-20 h-20 text-gray-500 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-xl mb-4">No cards in this deck</p>
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

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              {mode === 'deck' && (
                <button
                  onClick={handleDeleteCard}
                  className="p-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                  title="Delete current card"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={shuffleDeck}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Shuffle deck"
              >
                <Shuffle className="w-5 h-5" />
              </button>
              {shuffled && (
                <button
                  onClick={resetOrder}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
                  title="Reset order"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <h1 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white truncate">
            {deckTitle}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
      </header>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCard.id}-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl"
          >
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="w-full text-left block"
            >
              <div
                className={`relative rounded-2xl border-2 min-h-[280px] overflow-hidden transition-colors duration-300 ${
                  flipped
                    ? 'bg-gradient-to-br from-purple-600 to-blue-700 border-purple-500 dark:border-purple-400'
                    : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 hover:border-purple-400 dark:hover:border-purple-500'
                }`}
              >
                <div className="absolute inset-0 flex flex-col justify-center p-8">
                  <span className={`text-xs font-medium uppercase tracking-wide mb-2 ${flipped ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                    {flipped ? 'Answer' : 'Question'}
                  </span>
                  <motion.p
                    key={flipped ? 'back' : 'front'}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-lg md:text-xl font-medium ${flipped ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                  >
                    {flipped ? currentCard.back : currentCard.front}
                  </motion.p>
                  <p className={`mt-4 text-sm ${flipped ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
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
            className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[4rem] text-center">
            {currentIndex + 1} / {cards.length}
          </span>
          <button
            onClick={goNext}
            disabled={currentIndex === cards.length - 1}
            className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            className="bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete Card?</h3>
              <p className="text-gray-600 dark:text-gray-400">
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
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCard}
                disabled={deletingCard}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
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
