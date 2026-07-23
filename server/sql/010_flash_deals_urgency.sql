-- =============================================================================
-- Flash Deals countdown urgency (site_content.cool_deals)
-- Settings live in DB — edit via Admin → Cool Deals, or run this SQL.
-- =============================================================================

-- Inspect current flash-deals section(s)
select
  elem->>'id' as id,
  elem->>'endsAt' as ends_at,
  elem->>'urgencyThresholdHours' as urgency_hours,
  elem->>'blinkWhenUrgent' as auto_urgent,
  elem->>'forceBlink' as force_urgent
from public.site_content sc
cross join lateral jsonb_array_elements(sc.data->'sections') as elem
where sc.key = 'cool_deals'
  and elem->>'type' = 'flash-deals';

-- Example: set threshold to 72h (3 days), keep auto-urgent on, force off.
-- Timer turns urgent red whenever remaining time ≤ this many hours (end-of-day
-- countdown included when endsAt is empty).
update public.site_content
set
  data = jsonb_set(
    data,
    '{sections}',
    (
      select jsonb_agg(
        case
          when elem->>'type' = 'flash-deals' then
            elem
            || jsonb_build_object(
              'urgencyThresholdHours', 72,
              'blinkWhenUrgent', true,
              'forceBlink', false
            )
          else elem
        end
      )
      from jsonb_array_elements(data->'sections') as elem
    )
  ),
  updated_at = now()
where key = 'cool_deals';

-- Optional: set a real multi-day deadline (ISO local/UTC string the admin datetime uses)
-- update public.site_content
-- set
--   data = jsonb_set(
--     data,
--     '{sections}',
--     (
--       select jsonb_agg(
--         case
--           when elem->>'type' = 'flash-deals' then
--             elem || jsonb_build_object('endsAt', '2026-07-25T23:59')
--           else elem
--         end
--       )
--       from jsonb_array_elements(data->'sections') as elem
--     )
--   ),
--   updated_at = now()
-- where key = 'cool_deals';
