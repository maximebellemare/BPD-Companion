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

create or replace function public.set_affiliate_commission_available_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.earned_at = coalesce(new.earned_at, now());
  if new.available_at is null then
    new.available_at = new.earned_at + interval '45 days';
  end if;
  return new;
end;
$$;

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null unique references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  slug text not null unique,
  promo_code text not null unique,
  commission_percent numeric(5, 2) not null default 30,
  status text not null default 'pending',
  paypal_email text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliates_status_check check (status in ('pending', 'active', 'paused', 'disabled')),
  constraint affiliates_commission_percent_check check (commission_percent = 30),
  constraint affiliates_slug_format_check check (slug = lower(slug) and slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  constraint affiliates_promo_code_format_check check (promo_code = upper(promo_code) and promo_code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$')
);

drop trigger if exists affiliates_set_updated_at on public.affiliates;
create trigger affiliates_set_updated_at
  before update on public.affiliates
  for each row execute function public.set_updated_at();

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  anonymous_id text null,
  landing_url text null,
  referrer text null,
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  attribution_source text not null,
  referral_code text null,
  attributed_at timestamptz not null default now(),
  locked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint affiliate_users_source_check check (attribution_source in ('manual_code', 'web_referral', 'singular', 'deep_link', 'admin', 'import'))
);

create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  user_id uuid null references auth.users(id) on delete set null,
  revenuecat_event_id text not null references public.revenuecat_events(event_id) on delete restrict,
  event_type text not null,
  product_id text null,
  store text null,
  transaction_id text not null,
  original_transaction_id text null,
  price_usd numeric(14, 6) not null,
  net_proceeds_usd numeric(14, 6) not null,
  currency text not null default 'USD',
  commission_percent numeric(5, 2) not null,
  commission_amount numeric(14, 6) not null,
  status text not null default 'pending',
  earned_at timestamptz not null default now(),
  available_at timestamptz not null,
  paid_at timestamptz null,
  payout_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_commissions_status_check check (status in ('pending', 'approved', 'reversed', 'paid')),
  constraint affiliate_commissions_price_check check (price_usd <> 0),
  constraint affiliate_commissions_net_proceeds_check check (net_proceeds_usd <> 0),
  constraint affiliate_commissions_currency_check check (currency = 'USD'),
  constraint affiliate_commissions_percent_check check (commission_percent >= 0 and commission_percent <= 100)
);

create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  amount numeric(12, 2) not null,
  currency text not null,
  method text not null default 'paypal',
  reference text null,
  status text not null default 'pending',
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz null,
  constraint affiliate_payouts_status_check check (status in ('pending', 'processing', 'paid', 'cancelled')),
  constraint affiliate_payouts_amount_check check (amount >= 0),
  constraint affiliate_payouts_currency_check check (currency = upper(currency) and currency ~ '^[A-Z]{3}$')
);

alter table public.affiliate_commissions
  alter column user_id drop not null,
  alter column price_usd type numeric(14, 6),
  alter column net_proceeds_usd type numeric(14, 6),
  alter column commission_amount type numeric(14, 6),
  alter column available_at drop default,
  drop constraint if exists affiliate_commissions_user_id_fkey,
  add constraint affiliate_commissions_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null,
  drop constraint if exists affiliate_commissions_payout_id_fkey,
  add constraint affiliate_commissions_payout_id_fkey
    foreign key (payout_id) references public.affiliate_payouts(id) on delete set null;

update public.affiliates
set commission_percent = 30
where commission_percent <> 30;

alter table public.affiliates
  alter column commission_percent set default 30,
  drop constraint if exists affiliates_commission_percent_check,
  add constraint affiliates_commission_percent_check check (commission_percent = 30);

create unique index if not exists affiliates_email_lower_unique
  on public.affiliates (lower(email));

create unique index if not exists affiliate_commissions_revenuecat_event_unique
  on public.affiliate_commissions (revenuecat_event_id);

create index if not exists affiliates_status_idx on public.affiliates (status);
create index if not exists affiliates_status_email_lower_idx on public.affiliates (status, lower(email));
create index if not exists affiliate_clicks_affiliate_created_idx on public.affiliate_clicks (affiliate_id, created_at);
create index if not exists affiliate_users_affiliate_idx on public.affiliate_users (affiliate_id, attributed_at);
create index if not exists affiliate_commissions_affiliate_status_idx on public.affiliate_commissions (affiliate_id, status, available_at);
create index if not exists affiliate_commissions_user_idx on public.affiliate_commissions (user_id);
create index if not exists affiliate_commissions_transaction_idx on public.affiliate_commissions (transaction_id);
create index if not exists affiliate_commissions_original_transaction_idx on public.affiliate_commissions (original_transaction_id);
create index if not exists affiliate_payouts_affiliate_idx on public.affiliate_payouts (affiliate_id, created_at);

drop trigger if exists affiliate_commissions_set_available_at on public.affiliate_commissions;
create trigger affiliate_commissions_set_available_at
  before insert on public.affiliate_commissions
  for each row execute function public.set_affiliate_commission_available_at();

drop trigger if exists affiliate_commissions_set_updated_at on public.affiliate_commissions;
create trigger affiliate_commissions_set_updated_at
  before update on public.affiliate_commissions
  for each row execute function public.set_updated_at();

alter table public.affiliates enable row level security;
alter table public.affiliates force row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_clicks force row level security;
alter table public.affiliate_users enable row level security;
alter table public.affiliate_users force row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.affiliate_commissions force row level security;
alter table public.affiliate_payouts enable row level security;
alter table public.affiliate_payouts force row level security;

drop policy if exists "affiliate_users_select_own" on public.affiliate_users;
create policy "affiliate_users_select_own"
  on public.affiliate_users for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.normalize_affiliate_slug(p_value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(coalesce(trim(p_value), ''), '[^a-zA-Z0-9_-]+', '', 'g'));
$$;

create or replace function public.record_affiliate_click(
  p_ref text,
  p_anonymous_id text default null,
  p_landing_url text default null,
  p_referrer text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text := public.normalize_affiliate_slug(p_ref);
  v_affiliate public.affiliates%rowtype;
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if v_ref = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_ref');
  end if;

  select *
  into v_affiliate
  from public.affiliates
  where status = 'active'
    and (
      slug = v_ref
      or lower(promo_code) = v_ref
    )
  limit 1;

  if v_affiliate.id is null then
    return jsonb_build_object('ok', false, 'reason', 'unknown_or_inactive');
  end if;

  if octet_length(v_metadata::text) > 4096 then
    v_metadata := jsonb_build_object('truncated', true);
  end if;

  insert into public.affiliate_clicks (
    affiliate_id,
    anonymous_id,
    landing_url,
    referrer,
    utm_source,
    utm_medium,
    utm_campaign,
    metadata
  )
  values (
    v_affiliate.id,
    nullif(left(coalesce(p_anonymous_id, ''), 120), ''),
    nullif(left(coalesce(p_landing_url, ''), 1000), ''),
    nullif(left(coalesce(p_referrer, ''), 1000), ''),
    nullif(left(coalesce(p_utm_source, ''), 120), ''),
    nullif(left(coalesce(p_utm_medium, ''), 120), ''),
    nullif(left(coalesce(p_utm_campaign, ''), 120), ''),
    v_metadata
  );

  return jsonb_build_object(
    'ok', true,
    'slug', v_affiliate.slug,
    'promo_code', v_affiliate.promo_code
  );
end;
$$;

create or replace function public.attribute_affiliate_user(
  p_referral_code text,
  p_attribution_source text default 'manual_code',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_ref text := public.normalize_affiliate_slug(p_referral_code);
  v_source text := coalesce(nullif(trim(p_attribution_source), ''), 'manual_code');
  v_existing public.affiliate_users%rowtype;
  v_affiliate public.affiliates%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  select *
  into v_existing
  from public.affiliate_users
  where user_id = v_user_id;

  if v_existing.user_id is not null then
    return jsonb_build_object('ok', true, 'reason', 'already_attributed', 'affiliate_id', v_existing.affiliate_id);
  end if;

  if v_ref = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_code');
  end if;

  select *
  into v_affiliate
  from public.affiliates
  where status = 'active'
    and (
      lower(promo_code) = v_ref
      or slug = v_ref
    )
  limit 1;

  if v_affiliate.id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  if v_affiliate.user_id = v_user_id or (v_email <> '' and lower(v_affiliate.email) = v_email) then
    return jsonb_build_object('ok', false, 'reason', 'self_referral');
  end if;

  insert into public.affiliate_users (
    user_id,
    affiliate_id,
    attribution_source,
    referral_code,
    metadata
  )
  values (
    v_user_id,
    v_affiliate.id,
    case
      when v_source in ('manual_code', 'web_referral', 'singular', 'deep_link', 'admin', 'import') then v_source
      else 'manual_code'
    end,
    upper(v_ref),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id) do nothing;

  select *
  into v_existing
  from public.affiliate_users
  where user_id = v_user_id;

  if v_existing.affiliate_id = v_affiliate.id then
    return jsonb_build_object('ok', true, 'reason', 'attributed', 'affiliate_id', v_existing.affiliate_id);
  end if;

  return jsonb_build_object('ok', true, 'reason', 'already_attributed', 'affiliate_id', v_existing.affiliate_id);
end;
$$;

create or replace function public.get_creator_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_affiliate public.affiliates%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  select *
  into v_affiliate
  from public.affiliates
  where status = 'active'
    and user_id = v_user_id
  limit 1;

  if v_affiliate.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_active_creator');
  end if;

  return jsonb_build_object(
    'ok', true,
    'affiliate', jsonb_build_object(
      'id', v_affiliate.id,
      'name', v_affiliate.name,
      'slug', v_affiliate.slug,
      'promo_code', v_affiliate.promo_code,
      'commission_percent', 30,
      'paypal_email', v_affiliate.paypal_email
    ),
    'stats', jsonb_build_object(
      'clicks', (select count(*) from public.affiliate_clicks where affiliate_id = v_affiliate.id),
      'attributed_users', (select count(*) from public.affiliate_users where affiliate_id = v_affiliate.id),
      'trial_starts', (
        select count(*)
        from public.affiliate_users au
        join public.revenuecat_events e on e.app_user_id = au.user_id
        where au.affiliate_id = v_affiliate.id
          and e.event_type = 'INITIAL_PURCHASE'
          and upper(coalesce(e.period_type, e.raw -> 'event' ->> 'period_type', e.raw ->> 'period_type', '')) = 'TRIAL'
          and upper(coalesce(e.raw -> 'event' ->> 'environment', e.raw ->> 'environment', '')) = 'PRODUCTION'
      ),
      'paying_subscribers', (
        select count(distinct user_id)
        from public.affiliate_commissions
        where affiliate_id = v_affiliate.id
          and commission_amount > 0
          and status in ('pending', 'approved', 'paid')
      ),
      'pending_commission', coalesce((select sum(commission_amount) from public.affiliate_commissions where affiliate_id = v_affiliate.id and status = 'pending'), 0),
      'approved_commission', coalesce((select sum(commission_amount) from public.affiliate_commissions where affiliate_id = v_affiliate.id and status = 'approved'), 0),
      'paid_commission', coalesce((select sum(commission_amount) from public.affiliate_commissions where affiliate_id = v_affiliate.id and status = 'paid'), 0),
      'total_earnings', coalesce((select sum(commission_amount) from public.affiliate_commissions where affiliate_id = v_affiliate.id and status in ('pending', 'approved', 'paid')), 0)
    ),
    'commissions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'earned_at', earned_at,
        'product_id', product_id,
        'store', store,
        'commission_amount', commission_amount,
        'currency', currency,
        'status', status
      ) order by earned_at desc)
      from (
        select earned_at, product_id, store, commission_amount, currency, status
        from public.affiliate_commissions
        where affiliate_id = v_affiliate.id
        order by earned_at desc
        limit 50
      ) rows
    ), '[]'::jsonb),
    'payouts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'created_at', created_at,
        'amount', amount,
        'currency', currency,
        'method', method,
        'reference', reference,
        'status', status,
        'paid_at', paid_at
      ) order by created_at desc)
      from public.affiliate_payouts
      where affiliate_id = v_affiliate.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.claim_creator_account()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_affiliate public.affiliates%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if v_email = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_verified_email');
  end if;

  select *
  into v_affiliate
  from public.affiliates
  where status = 'active'
    and lower(email) = v_email
  for update;

  if v_affiliate.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_active_creator');
  end if;

  if v_affiliate.user_id is null then
    update public.affiliates
    set user_id = v_user_id
    where id = v_affiliate.id
      and user_id is null
    returning * into v_affiliate;
  elsif v_affiliate.user_id <> v_user_id then
    return jsonb_build_object('ok', false, 'reason', 'creator_already_bound');
  end if;

  return jsonb_build_object(
    'ok', true,
    'affiliate', jsonb_build_object(
      'name', v_affiliate.name,
      'slug', v_affiliate.slug,
      'promo_code', v_affiliate.promo_code
    )
  );
end;
$$;

create or replace function public.admin_create_affiliate(
  p_name text,
  p_email text,
  p_slug text,
  p_promo_code text,
  p_status text default 'pending',
  p_paypal_email text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
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
    trim(p_name),
    lower(trim(p_email)),
    public.normalize_affiliate_slug(p_slug),
    upper(trim(p_promo_code)),
    30,
    coalesce(p_status, 'pending'),
    nullif(lower(trim(coalesce(p_paypal_email, ''))), ''),
    p_notes
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.admin_set_affiliate_status(
  p_affiliate_id uuid,
  p_status text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.affiliates
  set status = p_status
  where id = p_affiliate_id
    and p_status in ('pending', 'active', 'paused', 'disabled');
$$;

drop function if exists public.admin_record_affiliate_payout(uuid, numeric, text, text, timestamptz, timestamptz, uuid[]);
drop function if exists public.admin_create_affiliate(text, text, text, text, numeric, text, text, text);

create or replace function public.admin_record_affiliate_payout(
  p_affiliate_id uuid,
  p_reference text default null,
  p_commission_ids uuid[] default null,
  p_allow_under_minimum boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout_id uuid;
  v_now timestamptz := now();
  v_locked_ids uuid[];
  v_locked_count integer := 0;
  v_requested_count integer := null;
  v_updated_count integer := 0;
  v_payout_amount numeric(14, 6);
  v_period_start timestamptz;
  v_period_end timestamptz;
begin
  if p_affiliate_id is null then
    raise exception 'affiliate_id is required';
  end if;

  if p_commission_ids is not null then
    select count(distinct commission_id)
    into v_requested_count
    from unnest(p_commission_ids) as requested(commission_id);
  end if;

  with locked_commissions as materialized (
    select id, commission_amount, earned_at
    from public.affiliate_commissions
    where affiliate_id = p_affiliate_id
      and status in ('pending', 'approved')
      and paid_at is null
      and payout_id is null
      and available_at <= v_now
      and (p_commission_ids is null or id = any(p_commission_ids))
    order by available_at, earned_at, id
    for update
  )
  select
    count(*)::integer,
    coalesce(sum(commission_amount), 0)::numeric(14, 6),
    min(earned_at),
    max(earned_at),
    coalesce(array_agg(id order by earned_at, id), '{}'::uuid[])
  into
    v_locked_count,
    v_payout_amount,
    v_period_start,
    v_period_end,
    v_locked_ids
  from locked_commissions;

  if v_locked_count = 0 then
    raise exception 'no eligible affiliate commissions are available for payout';
  end if;

  if v_requested_count is not null and v_locked_count <> v_requested_count then
    raise exception 'one or more requested commission rows are not eligible for this affiliate payout';
  end if;

  if v_payout_amount <= 0 then
    raise exception 'calculated payout amount must be greater than zero';
  end if;

  if v_payout_amount < 100 and not p_allow_under_minimum then
    raise exception 'calculated payout amount is below the 100 USD minimum';
  end if;

  insert into public.affiliate_payouts (
    affiliate_id,
    amount,
    currency,
    reference,
    status,
    period_start,
    period_end,
    paid_at
  )
  values (
    p_affiliate_id,
    round(v_payout_amount, 2),
    'USD',
    p_reference,
    'paid',
    v_period_start,
    v_period_end,
    v_now
  )
  returning id into v_payout_id;

  update public.affiliate_commissions
  set status = 'paid',
      paid_at = v_now,
      payout_id = v_payout_id
  where id = any(v_locked_ids)
    and affiliate_id = p_affiliate_id
    and status in ('pending', 'approved')
    and paid_at is null
    and payout_id is null;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_locked_count then
    raise exception 'affiliate payout concurrency check failed';
  end if;

  return v_payout_id;
end;
$$;

comment on column public.affiliate_commissions.user_id is
  'Nullable so append-only commission history survives auth user deletion; affiliate attribution remains available through affiliate_id and RevenueCat audit fields.';
comment on column public.affiliate_commissions.available_at is
  'Default creator commission hold is earned_at plus 45 days; payout RPC also requires available_at <= now().';
comment on column public.affiliate_commissions.price_usd is
  'RevenueCat event.price USD financial basis, preserved to six decimal places.';
comment on column public.affiliate_commissions.net_proceeds_usd is
  'USD net store proceeds after RevenueCat tax_percentage and commission_percentage, preserved to six decimal places.';
comment on function public.claim_creator_account() is
  'Authenticated creator binding by auth.uid() and JWT email; idempotent for same user and rejects accounts already bound elsewhere.';
comment on function public.admin_record_affiliate_payout(uuid, text, uuid[], boolean) is
  'Service-role payout finalization: locks eligible unpaid rows, derives USD amount from the ledger, enforces 100 USD minimum unless explicitly overridden, and marks exactly those rows paid atomically.';

-- Focused audit expectations for this migration:
-- - deleting auth.users rows sets affiliate_commissions.user_id to null and preserves financial ledger history;
-- - omitted affiliate_commissions.available_at is derived from earned_at + 45 days;
-- - admin_record_affiliate_payout locks only requested affiliate rows that are unpaid and available_at <= now();
-- - payout amount is derived from sum(commission_amount), including negative adjustments, and paid in USD;
-- - concurrent or duplicate payout attempts cannot mark the same commission row paid twice;
-- - payouts below 100 USD require the explicit service-role-only override flag;
-- - claim_creator_account binds active creators by authenticated JWT email and rejects already-bound creators;
-- - lower(affiliates.email) is unique, preventing duplicate creator email ownership;
-- - attribute_affiliate_user blocks self-referral by affiliate user_id and pre-binding JWT email.

revoke all on function public.record_affiliate_click(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.record_affiliate_click(text, text, text, text, text, text, text, jsonb) to anon, authenticated;

revoke all on function public.attribute_affiliate_user(text, text, jsonb) from public;
grant execute on function public.attribute_affiliate_user(text, text, jsonb) to authenticated;

revoke all on function public.get_creator_dashboard() from public;
grant execute on function public.get_creator_dashboard() to authenticated;

revoke all on function public.claim_creator_account() from public;
grant execute on function public.claim_creator_account() to authenticated;

revoke all on function public.admin_create_affiliate(text, text, text, text, text, text, text) from public;
revoke all on function public.admin_create_affiliate(text, text, text, text, text, text, text) from anon;
revoke all on function public.admin_create_affiliate(text, text, text, text, text, text, text) from authenticated;
grant execute on function public.admin_create_affiliate(text, text, text, text, text, text, text) to service_role;

revoke all on function public.admin_set_affiliate_status(uuid, text) from public;
revoke all on function public.admin_set_affiliate_status(uuid, text) from anon;
revoke all on function public.admin_set_affiliate_status(uuid, text) from authenticated;
grant execute on function public.admin_set_affiliate_status(uuid, text) to service_role;

revoke all on function public.admin_record_affiliate_payout(uuid, text, uuid[], boolean) from public;
revoke all on function public.admin_record_affiliate_payout(uuid, text, uuid[], boolean) from anon;
revoke all on function public.admin_record_affiliate_payout(uuid, text, uuid[], boolean) from authenticated;
grant execute on function public.admin_record_affiliate_payout(uuid, text, uuid[], boolean) to service_role;
