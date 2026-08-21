-- Mirrors production migration:
-- 20260821223415 creator_dashboard_auto_bind_20260821

create or replace function public.get_creator_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
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

  if v_affiliate.id is null and v_email <> '' then
    select *
    into v_affiliate
    from public.affiliates
    where status = 'active'
      and lower(email) = v_email
    limit 1
    for update;

    if v_affiliate.id is not null then
      if v_affiliate.user_id is null then
        update public.affiliates
        set user_id = v_user_id
        where id = v_affiliate.id
          and user_id is null
        returning * into v_affiliate;
      elsif v_affiliate.user_id <> v_user_id then
        return jsonb_build_object(
          'ok', false,
          'reason', 'creator_already_bound'
        );
      end if;
    end if;
  end if;

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
      'clicks', (
        select count(*)
        from public.affiliate_clicks
        where affiliate_id = v_affiliate.id
      ),
      'attributed_users', (
        select count(*)
        from public.affiliate_users
        where affiliate_id = v_affiliate.id
      ),
      'trial_starts', (
        select count(*)
        from public.affiliate_users au
        join public.revenuecat_events e
          on e.app_user_id = au.user_id
        where au.affiliate_id = v_affiliate.id
          and e.event_type = 'INITIAL_PURCHASE'
          and upper(coalesce(
            e.period_type,
            e.raw -> 'event' ->> 'period_type',
            e.raw ->> 'period_type',
            ''
          )) = 'TRIAL'
          and upper(coalesce(
            e.raw -> 'event' ->> 'environment',
            e.raw ->> 'environment',
            ''
          )) = 'PRODUCTION'
      ),
      'paying_subscribers', (
        select count(distinct user_id)
        from public.affiliate_commissions
        where affiliate_id = v_affiliate.id
          and commission_amount > 0
          and status in ('pending', 'approved', 'paid')
      ),
      'pending_commission', coalesce((
        select sum(commission_amount)
        from public.affiliate_commissions
        where affiliate_id = v_affiliate.id
          and status = 'pending'
      ), 0),
      'approved_commission', coalesce((
        select sum(commission_amount)
        from public.affiliate_commissions
        where affiliate_id = v_affiliate.id
          and status = 'approved'
      ), 0),
      'paid_commission', coalesce((
        select sum(commission_amount)
        from public.affiliate_commissions
        where affiliate_id = v_affiliate.id
          and status = 'paid'
      ), 0),
      'total_earnings', coalesce((
        select sum(commission_amount)
        from public.affiliate_commissions
        where affiliate_id = v_affiliate.id
          and status in ('pending', 'approved', 'paid')
      ), 0)
    ),
    'commissions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'earned_at', earned_at,
          'product_id', product_id,
          'store', store,
          'commission_amount', commission_amount,
          'currency', currency,
          'status', status
        )
        order by earned_at desc
      )
      from (
        select
          earned_at,
          product_id,
          store,
          commission_amount,
          currency,
          status
        from public.affiliate_commissions
        where affiliate_id = v_affiliate.id
        order by earned_at desc
        limit 50
      ) rows
    ), '[]'::jsonb),
    'payouts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'created_at', created_at,
          'amount', amount,
          'currency', currency,
          'method', method,
          'reference', reference,
          'status', status,
          'paid_at', paid_at
        )
        order by created_at desc
      )
      from public.affiliate_payouts
      where affiliate_id = v_affiliate.id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_creator_dashboard() from public;
revoke all on function public.get_creator_dashboard() from anon;
grant execute on function public.get_creator_dashboard() to authenticated;
grant execute on function public.get_creator_dashboard() to service_role;
