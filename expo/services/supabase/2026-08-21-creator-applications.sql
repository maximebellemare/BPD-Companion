create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  profile_url text not null,
  primary_platform text not null,
  audience_size text null,
  message text not null,
  status text not null default 'submitted',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_applications_status_check check (status in ('submitted', 'reviewing', 'approved', 'declined', 'spam')),
  constraint creator_applications_email_check check (email = lower(email) and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint creator_applications_url_check check (profile_url ~* '^https?://.{4,500}$')
);

drop trigger if exists creator_applications_set_updated_at on public.creator_applications;
create trigger creator_applications_set_updated_at
  before update on public.creator_applications
  for each row execute function public.set_updated_at();

create index if not exists creator_applications_email_created_idx
  on public.creator_applications (email, created_at desc);

create index if not exists creator_applications_status_created_idx
  on public.creator_applications (status, created_at desc);

alter table public.creator_applications enable row level security;
alter table public.creator_applications force row level security;

create or replace function public.submit_creator_application(
  p_name text,
  p_email text,
  p_profile_url text,
  p_primary_platform text,
  p_audience_size text default null,
  p_message text default null,
  p_honeypot text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_email text := lower(nullif(trim(coalesce(p_email, '')), ''));
  v_profile_url text := nullif(trim(coalesce(p_profile_url, '')), '');
  v_primary_platform text := nullif(trim(coalesce(p_primary_platform, '')), '');
  v_message text := nullif(trim(coalesce(p_message, '')), '');
  v_audience_size text := nullif(left(trim(coalesce(p_audience_size, '')), 120), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_application_id uuid;
begin
  if nullif(trim(coalesce(p_honeypot, '')), '') is not null then
    return jsonb_build_object('ok', true, 'reason', 'submitted');
  end if;

  if v_name is null or length(v_name) < 2 or length(v_name) > 120 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_name');
  end if;

  if v_email is null or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(v_email) > 254 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_email');
  end if;

  if v_profile_url is null or v_profile_url !~* '^https?://.{4,500}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_profile_url');
  end if;

  if v_primary_platform is null or length(v_primary_platform) > 80 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_platform');
  end if;

  if v_message is null or length(v_message) < 20 or length(v_message) > 2000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_message');
  end if;

  if exists (
    select 1
    from public.creator_applications
    where email = v_email
      and created_at > now() - interval '24 hours'
  ) then
    return jsonb_build_object('ok', true, 'reason', 'already_submitted_recently');
  end if;

  if octet_length(v_metadata::text) > 4096 then
    v_metadata := jsonb_build_object('truncated', true);
  end if;

  insert into public.creator_applications (
    name,
    email,
    profile_url,
    primary_platform,
    audience_size,
    message,
    metadata
  )
  values (
    left(v_name, 120),
    v_email,
    left(v_profile_url, 500),
    left(v_primary_platform, 80),
    v_audience_size,
    left(v_message, 2000),
    v_metadata
  )
  returning id into v_application_id;

  return jsonb_build_object('ok', true, 'reason', 'submitted', 'application_id', v_application_id);
end;
$$;

revoke all on function public.submit_creator_application(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.submit_creator_application(text, text, text, text, text, text, text, jsonb) to anon, authenticated;
