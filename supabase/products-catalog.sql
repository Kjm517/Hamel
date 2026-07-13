-- =============================================================================
-- Hamel — Products catalog (public.products)
-- Run in Supabase SQL Editor after product-tags-schema.sql
-- =============================================================================
-- Each row: id (text PK), data (jsonb) matching the React Product type:
--   brand, model, category, priceStart, priceEnd, rating, reviews,
--   image, images[], hp[], features[], description, specifications[],
--   tier ('premium'|'budget'|'flash-sale'), promos[], isActive (boolean)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Inspect what you have
-- -----------------------------------------------------------------------------
select
  id,
  data->>'brand' as brand,
  data->>'model' as model,
  data->>'category' as category,
  (data->>'priceStart')::numeric as price_start,
  (data->>'priceEnd')::numeric as price_end,
  coalesce((data->>'isActive')::boolean, true) as is_active,
  jsonb_array_length(coalesce(data->'hp', '[]'::jsonb)) as hp_count,
  jsonb_array_length(coalesce(data->'promos', '[]'::jsonb)) as promo_count,
  updated_at
from public.products
order by id;

-- Products missing fields the storefront needs
select id, data
from public.products
where
  coalesce(data->>'brand', '') = ''
  or coalesce(data->>'model', '') = ''
  or coalesce(data->>'category', '') = ''
  or coalesce(data->>'image', '') = ''
  or jsonb_array_length(coalesce(data->'hp', '[]'::jsonb)) = 0;

-- Distinct filter values (should match Products page sidebar)
select distinct data->>'brand' as brand
from public.products
where coalesce((data->>'isActive')::boolean, true)
order by 1;

select distinct data->>'category' as category
from public.products
where coalesce((data->>'isActive')::boolean, true)
order by 1;

select distinct jsonb_array_elements_text(coalesce(data->'hp', '[]'::jsonb)) as hp
from public.products
where coalesce((data->>'isActive')::boolean, true)
order by 1;

-- -----------------------------------------------------------------------------
-- 2. Normalize existing rows (safe defaults for missing jsonb fields)
-- -----------------------------------------------------------------------------
update public.products
set data = data
  || jsonb_build_object(
    'brand', coalesce(nullif(trim(data->>'brand'), ''), 'Unknown'),
    'model', coalesce(nullif(trim(data->>'model'), ''), 'Untitled model'),
    'category', coalesce(nullif(trim(data->>'category'), ''), 'Split Type'),
    'priceStart', coalesce((data->>'priceStart')::numeric, 0),
    'priceEnd', coalesce((data->>'priceEnd')::numeric, (data->>'priceStart')::numeric, 0),
    'rating', coalesce((data->>'rating')::numeric, 0),
    'reviews', coalesce((data->>'reviews')::int, 0),
    'hp', case
      when jsonb_array_length(coalesce(data->'hp', '[]'::jsonb)) > 0 then data->'hp'
      else '["1HP"]'::jsonb
    end,
    'features', coalesce(data->'features', '[]'::jsonb),
    'images', case
      when jsonb_array_length(coalesce(data->'images', '[]'::jsonb)) > 0 then data->'images'
      when coalesce(data->>'image', '') <> '' then jsonb_build_array(data->>'image')
      else '[]'::jsonb
    end,
    'specifications', coalesce(data->'specifications', '[]'::jsonb),
    'tier', coalesce(data->>'tier', 'premium'),
    'isActive', coalesce((data->>'isActive')::boolean, true)
  ),
  updated_at = now()
where true;

-- Ensure image field matches first entry in images[]
update public.products
set data = jsonb_set(
  data,
  '{image}',
  to_jsonb(coalesce(
    nullif(data->>'image', ''),
    data->'images'->>0,
    ''
  ))
),
updated_at = now()
where coalesce(data->>'image', '') = ''
  and jsonb_array_length(coalesce(data->'images', '[]'::jsonb)) > 0;

-- -----------------------------------------------------------------------------
-- 3. Example: insert one product (edit values before running)
-- -----------------------------------------------------------------------------
-- insert into public.products (id, data)
-- values (
--   '9',
--   jsonb_build_object(
--     'brand', 'Panasonic',
--     'model', 'Aero Series 1.5HP Inverter',
--     'category', 'Split Type',
--     'priceStart', 28900,
--     'priceEnd', 32900,
--     'rating', 4.6,
--     'reviews', 42,
--     'image', 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/assets/your-image.png',
--     'images', jsonb_build_array('https://YOUR_PROJECT.supabase.co/storage/v1/object/public/assets/your-image.png'),
--     'hp', jsonb_build_array('1HP', '1.5HP', '2HP'),
--     'features', jsonb_build_array('Inverter Technology', 'Sleep Mode', 'Auto Clean'),
--     'description', 'Short description for the product detail page.',
--     'specifications', jsonb_build_array(
--       jsonb_build_object('label', 'Cooling Capacity', 'value', '13,000 BTU'),
--       jsonb_build_object('label', 'Energy Rating', 'value', '5 Star')
--     ),
--     'tier', 'premium',
--     'isActive', true,
--     'promos', '[]'::jsonb
--   )
-- )
-- on conflict (id) do update set
--   data = excluded.data,
--   updated_at = now();

-- -----------------------------------------------------------------------------
-- 4. Hide a product from the storefront (keep in admin)
-- -----------------------------------------------------------------------------
-- update public.products
-- set data = jsonb_set(data, '{isActive}', 'false'::jsonb),
--     updated_at = now()
-- where id = '7';

-- -----------------------------------------------------------------------------
-- 5. Promos: read from normalized table or jsonb
-- -----------------------------------------------------------------------------
select
  p.id,
  p.data->>'model' as model,
  pp.sort_order,
  pp.tag_id,
  pp.label,
  pp.badge_type
from public.products p
left join public.product_promos pp on pp.product_id = p.id
order by p.id, pp.sort_order;

-- -----------------------------------------------------------------------------
-- 6. Optional: remove demo seed IDs if you only want DB-authored products
--    (Only run if you intentionally migrated everything to Supabase.)
-- -----------------------------------------------------------------------------
-- delete from public.products where id in ('1','2','3','4','5','6','7','8');
