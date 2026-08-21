-- Mirrors production migration:
-- 20260821213416 affiliate_program_permission_hardening_20260821

revoke all on function public.attribute_affiliate_user(text, text, jsonb) from anon;
revoke all on function public.claim_creator_account() from anon;
revoke all on function public.get_creator_dashboard() from anon;

revoke all on function public.set_affiliate_commission_available_at() from public;
revoke all on function public.set_affiliate_commission_available_at() from anon;
revoke all on function public.set_affiliate_commission_available_at() from authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;

create or replace function public.normalize_affiliate_slug(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(coalesce(trim(p_value), ''), '[^a-zA-Z0-9_-]+', '', 'g'));
$$;

revoke all on function public.normalize_affiliate_slug(text) from public;
revoke all on function public.normalize_affiliate_slug(text) from anon;
revoke all on function public.normalize_affiliate_slug(text) from authenticated;
grant execute on function public.normalize_affiliate_slug(text) to service_role;
