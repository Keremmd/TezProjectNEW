-- Courses tablosu
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  total_pdfs INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course-PDF ilişki tablosu (many-to-many)
CREATE TABLE IF NOT EXISTS public.course_pdfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  pdf_id UUID REFERENCES public.pdfs(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, pdf_id)
);

-- Course-Quiz ilişki tablosu (many-to-many)
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, quiz_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS courses_user_id_idx ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS course_pdfs_course_id_idx ON public.course_pdfs(course_id);
CREATE INDEX IF NOT EXISTS course_pdfs_pdf_id_idx ON public.course_pdfs(pdf_id);
CREATE INDEX IF NOT EXISTS course_quizzes_course_id_idx ON public.course_quizzes(course_id);
CREATE INDEX IF NOT EXISTS course_quizzes_quiz_id_idx ON public.course_quizzes(quiz_id);

-- RLS (Row Level Security) aktif et
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;

-- Courses RLS Policies
CREATE POLICY "Users can view own courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Course-PDFs RLS Policies
CREATE POLICY "Users can view own course pdfs"
  ON public.course_pdfs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_pdfs.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own course pdfs"
  ON public.course_pdfs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_pdfs.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own course pdfs"
  ON public.course_pdfs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_pdfs.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Course-Quizzes RLS Policies
CREATE POLICY "Users can view own course quizzes"
  ON public.course_quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_quizzes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own course quizzes"
  ON public.course_quizzes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_quizzes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own course quizzes"
  ON public.course_quizzes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_quizzes.course_id
      AND courses.user_id = auth.uid()
    )
  );
