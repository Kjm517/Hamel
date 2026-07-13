-- Optional normalized column for promo countdown end (app primarily stores promoEndsAt in products.data JSONB).
alter table if exists public.product_promos
  add column if not exists promo_ends_at timestamptz;
