-- Mirrors production migration:
-- 20260821224707 creator_admin_workflow_20260821

create table if not exists public.creator_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.creator_admins enable row level security;
alter table public.creator_admins force row level security;

revoke all on table public.creator_admins from anon;
revoke all on table public.creator_admins from authenticated;

drop function if exists public.is_creator_admin();
create function public.is_creator_admin()
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1
    from public.creator_admins ca
    where ca.user_id = auth.uid()
  );
$$;

revoke all on function public.is_creator_admin() from public;
revoke all on function public.is_creator_admin() from anon;
grant execute on function public.is_creator_admin() to authenticated;
grant execute on function public.is_creator_admin() to service_role;

drop function if exists public.admin_list_creator_applications(text, integer);
create function public.admin_list_creator_applications(
  p_status text default null,
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 200));
  v_status text := nullif(trim(coalesce(p_status, '')), '');
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if not public.is_creator_admin() then
    return jsonb_build_object('ok', false, 'reason', 'not_creator_admin');
  end if;

  if v_status is not null
    and v_status not in ('submitted', 'reviewing', 'approved', 'declined', 'spam')
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  return jsonb_build_object(
    'ok', true,
    'applications', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'name', a.name,
          'email', a.email,
          'profile_url', a.profile_url,
          'primary_platform', a.primary_platform,
          'audience_size', a.audience_size,
          'message', a.message,
          'status', a.status,
          'created_at', a.created_at,
          'updated_at', a.updated_at,
          'affiliate', case
            when af.id is null then null
            else jsonb_build_object(
              'id', af.id,
              'slug', af.slug,
              'promo_code', af.promo_code,
              'status', af.status,
              'paypal_email', af.paypal_email
            )
          end
        )
        order by a.created_at desc
      )
      from (
        select *
        from public.creator_applications
        where v_status is null or status = v_status
        order by created_at desc
        limit v_limit
      ) a
      left join public.affiliates af
        on lower(af.email) = lower(a.email)
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_list_creator_applications(text, integer) from public;
revoke all on function public.admin_list_creator_applications(text, integer) from anon;
grant execute on function public.admin_list_creator_applications(text, integer) to authenticated;
grant execute on function public.admin_list_creator_applications(text, integer) to service_role;

drop function if exists public.admin_review_creator_application(uuid, text, text, text, text, text);
create function public.admin_review_creator_application(
  p_application_id uuid,
  p_action text,
  p_slug text default null,
  p_promo_code text default null,
  p_paypal_email text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_action text := lower(trim(coalesce(p_action, '')));
  v_application public.creator_applications%rowtype;
  v_affiliate public.affiliates%rowtype;
  v_slug text;
  v_slug_base text;
  v_promo text;
  v_promo_base text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if not public.is_creator_admin() then
    return jsonb_build_object('ok', false, 'reason', 'not_creator_admin');
  end if;

  if p_application_id is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_application_id');
  end if;

  if v_action not in ('approve', 'decline', 'reviewing') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_action');
  end if;

  select *
  into v_application
  from public.creator_applications
  where id = p_application_id
  for update;

  if v_application.id is null then
    return jsonb_build_object('ok', false, 'reason', 'application_not_found');
  end if;

  if v_action = 'reviewing' then
    if v_application.status in ('approved', 'declined', 'spam') then
      return jsonb_build_object('ok', false, 'reason', 'application_closed');
    end if;

    update public.creator_applications
    set status = 'reviewing'
    where id = v_application.id;

    return jsonb_build_object('ok', true, 'reason', 'reviewing');
  end if;

  if v_action = 'decline' then
    if v_application.status = 'approved' then
      return jsonb_build_object('ok', false, 'reason', 'already_approved');
    end if;

    update public.creator_applications
    set status = 'declined'
    where id = v_application.id;

    return jsonb_build_object('ok', true, 'reason', 'declined');
  end if;

  select *
  into v_affiliate
  from public.affiliates
  where lower(email) = lower(v_application.email)
  limit 1
  for update;

  if v_affiliate.id is not null then
    if v_affiliate.status <> 'active' then
      update public.affiliates
      set status = 'active'
      where id = v_affiliate.id
      returning * into v_affiliate;
    end if;

    update public.creator_applications
    set status = 'approved'
    where id = v_application.id;

    return jsonb_build_object(
      'ok', true,
      'reason', 'already_has_affiliate',
      'affiliate', jsonb_build_object(
        'id', v_affiliate.id,
        'name', v_affiliate.name,
        'email', v_affiliate.email,
        'slug', v_affiliate.slug,
        'promo_code', v_affiliate.promo_code,
        'commission_percent', 30,
        'status', v_affiliate.status,
        'paypal_email', v_affiliate.paypal_email
      )
    );
  end if;

  if nullif(trim(coalesce(p_slug, '')), '') is not null then
    v_slug := lower(trim(p_slug));
    if v_slug !~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' then
      return jsonb_build_object('ok', false, 'reason', 'invalid_slug');
    end if;
  else
    v_slug_base := lower(regexp_replace(trim(v_application.name), '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug_base := trim(both '-' from v_slug_base);
    if v_slug_base = '' then
      v_slug_base := 'creator';
    end if;
    v_slug := left(v_slug_base, 50) || '-' || substr(md5(v_application.id::text), 1, 6);
  end if;

  if exists (select 1 from public.affiliates where slug = v_slug) then
    return jsonb_build_object('ok', false, 'reason', 'slug_already_exists');
  end if;

  if nullif(trim(coalesce(p_promo_code, '')), '') is not null then
    v_promo := upper(trim(p_promo_code));
    if v_promo !~ '^[A-Z0-9][A-Z0-9_-]{2,31}$' then
      return jsonb_build_object('ok', false, 'reason', 'invalid_promo_code');
    end if;
  else
    v_promo_base := upper(regexp_replace(trim(v_application.name), '[^a-zA-Z0-9]+', '', 'g'));
    if v_promo_base = '' then
      v_promo_base := 'CREATOR';
    end if;
    v_promo := left(v_promo_base, 18) || substr(upper(md5(v_application.id::text)), 1, 6);
  end if;

  if exists (select 1 from public.affiliates where promo_code = v_promo) then
    return jsonb_build_object('ok', false, 'reason', 'promo_code_already_exists');
  end if;

  insert into public.affiliates (
    name,
    email,
    slug,
    promo_code,
    commission_percent,
    status,
    paypal_email,
    notes
  )
  values (
    trim(v_application.name),
    lower(trim(v_application.email)),
    v_slug,
    v_promo,
    30,
    'active',
    nullif(lower(trim(coalesce(p_paypal_email, ''))), ''),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning * into v_affiliate;

  update public.creator_applications
  set status = 'approved'
  where id = v_application.id;

  return jsonb_build_object(
    'ok', true,
    'reason', 'approved',
    'affiliate', jsonb_build_object(
      'id', v_affiliate.id,
      'name', v_affiliate.name,
      'email', v_affiliate.email,
      'slug', v_affiliate.slug,
      'promo_code', v_affiliate.promo_code,
      'commission_percent', 30,
      'status', v_affiliate.status,
      'paypal_email', v_affiliate.paypal_email
    )
  );
end;
$$;

revoke all on function public.admin_review_creator_application(uuid, text, text, text, text, text) from public;
revoke all on function public.admin_review_creator_application(uuid, text, text, text, text, text) from anon;
grant execute on function public.admin_review_creator_application(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.admin_review_creator_application(uuid, text, text, text, text, text) to service_role;
