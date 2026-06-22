-- Community profile identity for BPD Companion.
-- Run this in Supabase SQL editor.

alter table public.profiles
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists avatar_color text;

update public.profiles
set username = lower(username)
where username is not null and username <> lower(username);

alter table public.profiles
  drop constraint if exists profiles_username_format_check,
  add constraint profiles_username_format_check
    check (
      username is null
      or (
        username = lower(username)
        and char_length(username) between 3 and 20
        and username ~ '^[a-z0-9_]+$'
      )
    );

alter table public.profiles
  drop constraint if exists profiles_avatar_color_format_check,
  add constraint profiles_avatar_color_format_check
    check (
      avatar_color is null
      or avatar_color ~ '^#[0-9A-Fa-f]{6}$'
    );

create unique index if not exists profiles_username_unique_idx
  on public.profiles (username)
  where username is not null;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Public community tables, if/when enabled in Supabase, should store author_id
-- and public username/display/avatar fields separately from email.
-- Delete policies should use author_id = auth.uid(); never expose profiles.email
-- in community post/reply public queries.
