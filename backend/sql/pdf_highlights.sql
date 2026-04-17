-- =========================================================================
-- pdf_highlights: per-user highlights saved for a PDF, synced across devices.
--
-- Each row is one highlight (optionally with a user note). A user can have
-- many highlights on the same PDF. Different users have their own highlights
-- even on the same PDF.
--
-- Run this in the Supabase SQL editor.
-- =========================================================================

create table if not exists public.pdf_highlights (
  id uuid primary key default gen_random_uuid(),
  pdf_id uuid not null references public.pdfs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  page integer not null check (page >= 1),
  text text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists pdf_highlights_pdf_user_idx
  on public.pdf_highlights (pdf_id, user_id, page);

create index if not exists pdf_highlights_user_idx
  on public.pdf_highlights (user_id, created_at desc);

-- Row Level Security: users can only see/modify their own highlights.
alter table public.pdf_highlights enable row level security;

drop policy if exists "pdf_highlights_select_own" on public.pdf_highlights;
create policy "pdf_highlights_select_own"
  on public.pdf_highlights
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "pdf_highlights_insert_own" on public.pdf_highlights;
create policy "pdf_highlights_insert_own"
  on public.pdf_highlights
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "pdf_highlights_update_own" on public.pdf_highlights;
create policy "pdf_highlights_update_own"
  on public.pdf_highlights
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pdf_highlights_delete_own" on public.pdf_highlights;
create policy "pdf_highlights_delete_own"
  on public.pdf_highlights
  for delete
  to authenticated
  using (user_id = auth.uid());
