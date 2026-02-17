-- Rating tables for PDFs and Quizzes
-- Run this in Supabase SQL Editor

-- 1) PDF Ratings
CREATE TABLE IF NOT EXISTS public.pdf_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_id UUID NOT NULL REFERENCES public.pdfs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pdf_id, user_id)
);

ALTER TABLE public.pdf_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone (even anon) can read ratings
CREATE POLICY "Anyone can read pdf ratings"
  ON public.pdf_ratings
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own ratings
CREATE POLICY "Users can insert pdf ratings"
  ON public.pdf_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own ratings
CREATE POLICY "Users can update own pdf ratings"
  ON public.pdf_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optional: allow users to delete their own ratings
CREATE POLICY "Users can delete own pdf ratings"
  ON public.pdf_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- 2) Quiz Ratings
CREATE TABLE IF NOT EXISTS public.quiz_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (quiz_id, user_id)
);

ALTER TABLE public.quiz_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone (even anon) can read ratings
CREATE POLICY "Anyone can read quiz ratings"
  ON public.quiz_ratings
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own ratings
CREATE POLICY "Users can insert quiz ratings"
  ON public.quiz_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own ratings
CREATE POLICY "Users can update own quiz ratings"
  ON public.quiz_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optional: allow users to delete their own ratings
CREATE POLICY "Users can delete own quiz ratings"
  ON public.quiz_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

