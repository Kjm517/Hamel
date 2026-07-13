-- Corner badges (SALE, INV, TOP) — extend product_tags + seed defaults
-- Run in Supabase SQL Editor after product-tags-schema.sql

alter table public.product_tags add column if not exists placement text default 'promo';
alter table public.product_tags add column if not exists auto_rule text;

update public.product_tags set placement = 'promo' where placement is null;
update public.product_tags set placement = 'corner' where id like 'corner-%';

alter table public.product_tags drop constraint if exists product_tags_placement_check;
alter table public.product_tags add constraint product_tags_placement_check
  check (placement in ('promo', 'corner'));

alter table public.product_tags drop constraint if exists product_tags_auto_rule_check;
alter table public.product_tags add constraint product_tags_auto_rule_check
  check (auto_rule is null or auto_rule in ('manual', 'flash-sale', 'inverter', 'best-seller'));

insert into public.product_tags (
  id, name, style, placement, auto_rule, text_bg_color, icon_bg_color, sort_order, is_active
) values
  ('corner-sale', 'SALE', 'flash-sale', 'corner', 'flash-sale', '#EA580C', '#FFFFFF', 100, true),
  ('corner-inv', 'INV', 'flash-sale', 'corner', 'inverter', '#0EA5E9', '#FFFFFF', 101, true),
  ('corner-top', 'TOP', 'bundle', 'corner', 'best-seller', '#7C3AED', '#FFFFFF', 102, true)
on conflict (id) do update set
  name = excluded.name,
  placement = excluded.placement,
  auto_rule = excluded.auto_rule,
  text_bg_color = excluded.text_bg_color,
  icon_bg_color = excluded.icon_bg_color,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- Optional: set corner badges on a product (overrides auto rules)
-- update public.products
-- set data = jsonb_set(coalesce(data, '{}'::jsonb), '{cornerTagIds}', '["corner-sale","corner-inv"]'::jsonb)
-- where id = '1';

select id, name, placement, auto_rule from public.product_tags order by sort_order;
