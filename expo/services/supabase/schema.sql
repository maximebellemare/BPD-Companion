-- Run this SQL in the Supabase SQL Editor for your project.
-- Creates the user key-value table used to sync app data (journal entries,
-- check-ins, moods, medications, appointments, settings, etc.) per user.

create table if not exists public.user_kv (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists user_kv_user_idx on public.user_kv(user_id);

alter table public.user_kv enable row level security;

drop policy if exists "user_kv_select_own" on public.user_kv;
create policy "user_kv_select_own"
  on public.user_kv for select
  using (auth.uid() = user_id);

drop policy if exists "user_kv_insert_own" on public.user_kv;
create policy "user_kv_insert_own"
  on public.user_kv for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_kv_update_own" on public.user_kv;
create policy "user_kv_update_own"
  on public.user_kv for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_kv_delete_own" on public.user_kv;
create policy "user_kv_delete_own"
  on public.user_kv for delete
  using (auth.uid() = user_id);
