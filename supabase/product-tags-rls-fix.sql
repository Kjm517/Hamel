-- Fixes: "new row violates row-level security policy for table product_tags"
-- Run in Supabase SQL Editor while logged into the dashboard (not from the app).

-- Ensure helper exists (from product-tags-schema.sql)
create or replace function public.is_active_employee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employees e
    where e.auth_user_id = auth.uid()
      and e.status = 'Active'
  );
$$;

alter table public.product_tags enable row level security;

-- Everyone can read active tags (storefront)
drop policy if exists product_tags_select_public on public.product_tags;
create policy product_tags_select_public on public.product_tags
  for select
  to anon, authenticated
  using (is_active = true);

-- Logged-in admins: read all tags (including inactive)
drop policy if exists product_tags_select_authenticated on public.product_tags;
create policy product_tags_select_authenticated on public.product_tags
  for select
  to authenticated
  using (true);

-- Logged-in users can manage tags (admin UI; tighten later via employees only)
drop policy if exists product_tags_write_employees on public.product_tags;
drop policy if exists product_tags_write_authenticated on public.product_tags;
create policy product_tags_write_authenticated on public.product_tags
  for all
  to authenticated
  using (true)
  with check (true);

grant select on public.product_tags to anon, authenticated;
grant insert, update, delete on public.product_tags to authenticated;

-- Seed rows (safe to re-run)
insert into public.product_tags (
  id, name, style, icon_emoji, subtitle, sort_order
) values
  ('tag-flash-15', '15% OFF', 'flash-sale', '⚡', null, 1),
  ('tag-free-install', 'FREE AUTHORIZED', 'free-install', '✓', 'INSTALLATION', 2),
  ('tag-5000-off', '₱5,000 OFF', 'discount', '★', null, 3),
  ('tag-cool-cash', 'COOL CASH', 'cash-deal', '₱', 'per month', 4),
  ('tag-bundle', 'PROMO BUNDLE DEAL', 'bundle', '🎁', null, 5)
on conflict (id) do nothing;
