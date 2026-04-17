-- =========================================================================
-- Exam Simulator tables.
--
-- An "exam" is a multi-section paper built from one or more source PDFs.
-- Each section can contain different question types (MCQ, open-ended,
-- cloze/fill-in-the-blank, true/false, short answer).
--
-- Run this in the Supabase SQL editor.
-- =========================================================================

-- ------------------ exams ------------------
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  pdf_ids uuid[] not null default '{}',
  sections jsonb not null default '[]',
  total_points integer not null default 0,
  duration_minutes integer,
  language text default 'Turkish',
  created_at timestamptz not null default now()
);

create index if not exists exams_user_idx
  on public.exams (user_id, created_at desc);

-- ------------------ exam_questions ------------------
create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  section text,
  order_index integer not null default 0,
  question_type text not null check (
    question_type in ('mcq', 'open', 'cloze', 'true_false', 'short')
  ),
  question_text text not null,
  options jsonb,
  correct_answer text,
  expected_answer text,
  points integer not null default 1,
  source_pdf_id uuid references public.pdfs(id) on delete set null,
  source_page integer,
  created_at timestamptz not null default now()
);

create index if not exists exam_questions_exam_idx
  on public.exam_questions (exam_id, order_index);

-- ------------------ exam_attempts ------------------
create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null default '{}',
  auto_score integer not null default 0,
  max_auto_score integer not null default 0,
  ai_graded jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  time_taken_seconds integer
);

create index if not exists exam_attempts_user_idx
  on public.exam_attempts (user_id, submitted_at desc);
create index if not exists exam_attempts_exam_idx
  on public.exam_attempts (exam_id, submitted_at desc);

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;

-- ---- exams: users see/modify only their own ----
drop policy if exists "exams_select_own" on public.exams;
create policy "exams_select_own"
  on public.exams for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "exams_cud_own" on public.exams;
create policy "exams_cud_own"
  on public.exams for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Also allow backend (anon key) full access so it can generate exams.
-- If you use service_role key in the backend, this is redundant but harmless.
drop policy if exists "exams_backend_all" on public.exams;
create policy "exams_backend_all"
  on public.exams for all to anon
  using (true)
  with check (true);

-- ---- exam_questions: readable/writable if user owns parent exam ----
drop policy if exists "exam_questions_select_own" on public.exam_questions;
create policy "exam_questions_select_own"
  on public.exam_questions for select to authenticated
  using (
    exists (
      select 1 from public.exams e
      where e.id = exam_questions.exam_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "exam_questions_cud_own" on public.exam_questions;
create policy "exam_questions_cud_own"
  on public.exam_questions for all to authenticated
  using (
    exists (
      select 1 from public.exams e
      where e.id = exam_questions.exam_id and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.exams e
      where e.id = exam_questions.exam_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "exam_questions_backend_all" on public.exam_questions;
create policy "exam_questions_backend_all"
  on public.exam_questions for all to anon
  using (true)
  with check (true);

-- ---- exam_attempts: users see/modify only their own ----
drop policy if exists "exam_attempts_select_own" on public.exam_attempts;
create policy "exam_attempts_select_own"
  on public.exam_attempts for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "exam_attempts_cud_own" on public.exam_attempts;
create policy "exam_attempts_cud_own"
  on public.exam_attempts for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "exam_attempts_backend_all" on public.exam_attempts;
create policy "exam_attempts_backend_all"
  on public.exam_attempts for all to anon
  using (true)
  with check (true);
