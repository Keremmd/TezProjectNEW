-- Flashcard decks (PDF-based; quiz-based decks are virtual from quiz_questions)
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'pdf' CHECK (source_type IN ('pdf', 'quiz')),
  source_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS flashcard_decks_user_id_idx ON public.flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS flashcard_decks_source_idx ON public.flashcard_decks(source_type, source_id);
CREATE INDEX IF NOT EXISTS flashcards_deck_id_idx ON public.flashcards(deck_id);

ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Decks: user can only see/insert/update/delete their own
CREATE POLICY "Users can read own flashcard_decks"
  ON public.flashcard_decks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard_decks"
  ON public.flashcard_decks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard_decks"
  ON public.flashcard_decks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard_decks"
  ON public.flashcard_decks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Flashcards: user can manage cards of their own decks (via deck_id -> flashcard_decks.user_id)
CREATE POLICY "Users can read flashcards of own decks"
  ON public.flashcards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks d
      WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert flashcards into own decks"
  ON public.flashcards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks d
      WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update flashcards in own decks"
  ON public.flashcards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks d
      WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete flashcards in own decks"
  ON public.flashcards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks d
      WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
    )
  );
