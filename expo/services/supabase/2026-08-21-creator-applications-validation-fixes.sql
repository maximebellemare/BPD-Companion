-- Consolidates production migrations:
-- 20260821221035 creator_application_email_regex_fix_20260821
-- 20260821221056 creator_application_profile_url_regex_fix_20260821
-- 20260821221128 creator_application_validation_constraints_fix_20260821

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
set search_path = 'public'
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

  if v_email is null
    or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    or length(v_email) > 254
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_email');
  end if;

  if v_profile_url is null
    or v_profile_url !~* '^https?://.+'
    or length(v_profile_url) > 500
  then
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

  return jsonb_build_object(
    'ok', true,
    'reason', 'submitted',
    'application_id', v_application_id
  );
end;
$$;

alter table public.creator_applications
  drop constraint if exists creator_applications_email_check,
  drop constraint if exists creator_applications_url_check;

alter table public.creator_applications
  add constraint creator_applications_email_check
  check (
    email = lower(email)
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    and char_length(email) <= 254
  ),
  add constraint creator_applications_url_check
  check (
    profile_url ~* '^https?://.+'
    and char_length(profile_url) <= 500
  );
