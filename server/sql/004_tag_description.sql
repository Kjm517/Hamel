-- Promo chip click descriptions (Special Offers modal)
alter table public.product_tags
  add column if not exists description text;
