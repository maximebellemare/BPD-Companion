-- Mirrors production migration:
-- 20260821213435 affiliate_payout_index_20260821

create index if not exists affiliate_commissions_payout_idx
  on public.affiliate_commissions (payout_id);
