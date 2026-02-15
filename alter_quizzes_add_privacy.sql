-- Add privacy column to quizzes (private / public)
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS privacy TEXT
  CHECK (privacy IN ('private', 'public'))
  DEFAULT 'private';

