-- Run this SQL in the Supabase SQL Editor for your project.
-- It creates the profile table used for auth launch flow, onboarding state,
-- and the 7-day free trial. It also keeps the user_kv table used by the app
-- to sync journals, check-ins, settings, and other feature data per user.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  onboarding_completed boolean not null default false,
  onboarding_answers jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration helpers for earlier builds that used user_id/subscription_status.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'id'
  ) then
    alter table public.profiles rename column user_id to id;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
  ) then
    alter table public.profiles add column email text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'onboarding_answers'
  ) then
    alter table public.profiles add column onboarding_answers jsonb;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'subscription_status'
  ) then
    alter table public.profiles drop column subscription_status;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'personalization'
  ) then
    update public.profiles
    set onboarding_answers = personalization
    where onboarding_answers is null and personalization is not null;

    alter table public.profiles drop column personalization;
  end if;
end $$;

alter table public.profiles
  alter column id set not null,
  alter column trial_started_at set default now(),
  alter column trial_ends_at set default (now() + interval '7 days'),
  alter column onboarding_completed set default false,
  alter column created_at set default now(),
  alter column updated_at set default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    trial_started_at,
    trial_ends_at,
    onboarding_completed,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    new.created_at,
    new.created_at + interval '7 days',
    false,
    new.created_at,
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create table if not exists public.user_kv (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists user_kv_user_idx on public.user_kv(user_id);

drop trigger if exists user_kv_set_updated_at on public.user_kv;
create trigger user_kv_set_updated_at
  before update on public.user_kv
  for each row execute function public.set_updated_at();

alter table public.user_kv enable row level security;
alter table public.user_kv force row level security;

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
