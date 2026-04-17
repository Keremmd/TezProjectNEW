-- =========================================================================
-- pdf_mindmaps: cache for AI-generated mindmaps per PDF.
--
-- One row per (pdf_id). We deliberately make it per-PDF (not per-user) so
-- every user opening the same shared PDF reuses the same cached mindmap.
-- If you want per-user mindmaps later, add user_id to the primary key.
--
-- Run this in the Supabase SQL editor.
-- =========================================================================

create table if not exists public.pdf_mindmaps (
  pdf_id uuid primary key references public.pdfs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  title text,
  mindmap jsonb not null,
  language text default 'Turkish',
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pdf_mindmaps_updated_at_idx
  on public.pdf_mindmaps (updated_at desc);

-- Trigger to keep updated_at fresh on upsert/update
create or replace function public.set_pdf_mindmaps_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pdf_mindmaps_updated_at on public.pdf_mindmaps;
create trigger trg_pdf_mindmaps_updated_at
before update on public.pdf_mindmaps
for each row execute function public.set_pdf_mindmaps_updated_at();

-- RLS: allow any authenticated user to read mindmaps, and allow writes from
-- either (a) the anon role used by our backend, or (b) the PDF owner.
-- If your backend uses SUPABASE_SERVICE_ROLE_KEY, service_role already
-- bypasses RLS and the permissive write policies below are harmless.
alter table public.pdf_mindmaps enable row level security;

-- READ: anyone (anon or authenticated) can read cached mindmaps.
drop policy if exists "pdf_mindmaps_read_all" on public.pdf_mindmaps;
drop policy if exists "pdf_mindmaps_read_all_authed" on public.pdf_mindmaps;
create policy "pdf_mindmaps_read_all"
  on public.pdf_mindmaps
  for select
  to anon, authenticated
  using (true);

-- WRITE: allow backend service (anon key) AND the PDF owner to write.
-- This is needed when the backend uses the anon key (no service_role set).
drop policy if exists "pdf_mindmaps_write_backend" on public.pdf_mindmaps;
drop policy if exists "pdf_mindmaps_write_owner" on public.pdf_mindmaps;
create policy "pdf_mindmaps_write_backend"
  on public.pdf_mindmaps
  for all
  to anon, authenticated
  using (true)
  with check (true);
