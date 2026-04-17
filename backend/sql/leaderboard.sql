-- =========================================================================
-- Leaderboard: profiles mirror + learning points aggregation
--
-- Creates a public.profiles table that mirrors auth.users metadata so the
-- leaderboard can display names/avatars without needing the admin API.
-- A trigger keeps profiles in sync whenever a user signs up or updates
-- their metadata. An existing-user backfill is included at the bottom.
--
-- Finally, public.get_learning_leaderboard(limit_count) is a SECURITY
-- DEFINER SQL function that aggregates per-user learning points from
-- quizzes, completed pdfs, and submitted exam attempts, and returns the
-- top N users sorted by points.
--
-- Run this in the Supabase SQL editor.
-- =========================================================================

-- ------------------ profiles ------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  university text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);

-- Row Level Security: profiles are publicly readable, self-writable.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select to anon, authenticated
  using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- Backend (anon key) fallback: allow writes so trigger/backfill and
-- manual sync endpoints can upsert without service_role key.
drop policy if exists "profiles_backend_all" on public.profiles;
create policy "profiles_backend_all"
  on public.profiles for all to anon
  using (true)
  with check (true);

-- ------------------ trigger: auto-populate from auth.users ------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, university, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'university', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    university = excluded.university,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of raw_user_meta_data, email on auth.users
  for each row execute function public.handle_new_user();

-- ------------------ backfill ------------------
-- Copy any existing auth.users into public.profiles.
insert into public.profiles (id, email, first_name, last_name, university, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'first_name', ''),
  coalesce(u.raw_user_meta_data ->> 'last_name', ''),
  coalesce(u.raw_user_meta_data ->> 'university', ''),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  university = excluded.university,
  avatar_url = excluded.avatar_url,
  updated_at = now();

-- =========================================================================
-- Leaderboard RPC
-- =========================================================================
-- Points formula:
--   quizzes.created           * 35
--   pdfs with status completed* 10
--   submitted exam attempts   * 10 (base "participation" bonus)
--   + round(auto_score / max_auto_score * 50) per submitted attempt
-- =========================================================================
create or replace function public.get_learning_leaderboard(limit_count int default 20)
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  avatar_url text,
  university text,
  quiz_count int,
  completed_pdfs int,
  exam_attempts int,
  exam_accuracy_points int,
  learning_points int
)
language sql
stable
security definer
set search_path = public
as $$
  with
    quiz_counts as (
      select user_id, count(*)::int as c
      from public.quizzes
      group by user_id
    ),
    pdf_counts as (
      select user_id, count(*)::int as c
      from public.pdfs
      where status = 'completed'
      group by user_id
    ),
    exam_counts as (
      select
        user_id,
        count(*)::int as attempts,
        coalesce(sum(
          case
            when max_auto_score > 0
              then round(auto_score::numeric / max_auto_score::numeric * 50)::int
            else 0
          end
        ), 0)::int as accuracy_points
      from public.exam_attempts
      where submitted_at is not null
      group by user_id
    )
  select
    p.id as user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.avatar_url,
    p.university,
    coalesce(qc.c, 0)                       as quiz_count,
    coalesce(pc.c, 0)                       as completed_pdfs,
    coalesce(ec.attempts, 0)                as exam_attempts,
    coalesce(ec.accuracy_points, 0)         as exam_accuracy_points,
    (
      coalesce(qc.c, 0) * 35
      + coalesce(pc.c, 0) * 10
      + coalesce(ec.attempts, 0) * 10
      + coalesce(ec.accuracy_points, 0)
    )::int                                  as learning_points
  from public.profiles p
  left join quiz_counts qc on qc.user_id = p.id
  left join pdf_counts  pc on pc.user_id = p.id
  left join exam_counts ec on ec.user_id = p.id
  order by learning_points desc, p.created_at asc
  limit greatest(1, least(coalesce(limit_count, 20), 100));
$$;

-- Let anon/authenticated callers use the function.
grant execute on function public.get_learning_leaderboard(int) to anon, authenticated;
