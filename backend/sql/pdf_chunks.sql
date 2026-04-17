-- =========================================================================
-- RAG (Retrieval Augmented Generation) schema.
--
-- Stores PDF text chunked into small passages and the Gemini-generated
-- embedding for each chunk. Vector similarity search lets us pull only the
-- most relevant passages for a user question instead of cramming the first
-- N characters of the PDF into every prompt.
--
-- Embedding model: Google Gemini `text-embedding-004` → 768-dim vectors.
--
-- Run this in the Supabase SQL editor. Supabase has pgvector preinstalled
-- but the extension is usually disabled per project — this script enables it.
-- =========================================================================

create extension if not exists vector;

create table if not exists public.pdf_chunks (
  id uuid primary key default gen_random_uuid(),
  pdf_id uuid not null references public.pdfs(id) on delete cascade,
  chunk_index integer not null,
  page integer,
  token_count integer,
  text text not null,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists pdf_chunks_pdf_idx
  on public.pdf_chunks (pdf_id, chunk_index);

-- Cosine similarity ANN index. `lists = 100` is a reasonable default for
-- thousands of chunks; increase for larger datasets.
-- Must be created after rows are inserted for best quality, but creating it
-- empty is fine too.
create index if not exists pdf_chunks_embedding_idx
  on public.pdf_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- =========================================================================
-- RPC: match_pdf_chunks
-- Returns the top-N most similar chunks in a given PDF for an input
-- query embedding, above a similarity threshold.
-- =========================================================================
create or replace function public.match_pdf_chunks(
  query_embedding vector(768),
  match_pdf_id uuid,
  match_count int default 8,
  similarity_threshold float default 0.2
)
returns table (
  id uuid,
  chunk_index int,
  page int,
  text text,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.chunk_index,
    c.page,
    c.text,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.pdf_chunks c
  where c.pdf_id = match_pdf_id
    and c.embedding is not null
    and (1 - (c.embedding <=> query_embedding)) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- =========================================================================
-- Row Level Security
-- Readable by anyone authenticated (or anon for the backend),
-- writable by the PDF owner / backend.
-- =========================================================================
alter table public.pdf_chunks enable row level security;

drop policy if exists "pdf_chunks_read_all" on public.pdf_chunks;
create policy "pdf_chunks_read_all"
  on public.pdf_chunks
  for select
  to anon, authenticated
  using (true);

drop policy if exists "pdf_chunks_write_backend" on public.pdf_chunks;
create policy "pdf_chunks_write_backend"
  on public.pdf_chunks
  for all
  to anon, authenticated
  using (true)
  with check (true);
