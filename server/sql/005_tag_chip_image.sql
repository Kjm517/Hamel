-- Full Abenson-style chip graphics (TAG D)
alter table public.product_tags
  add column if not exists chip_image_url text;

alter table public.product_tags
  add column if not exists render_mode text;
