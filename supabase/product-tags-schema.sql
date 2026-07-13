-- =============================================================================
-- Hamel — Product promo tags (syncs with Admin → Tags + product edit promos)
-- Run in Supabase: SQL Editor → New query → paste → Run
-- =============================================================================
-- Frontend types:
--   ProductTag      → public.product_tags
--   ProductPromoEntry → public.product_promos (or products.data->'promos' jsonb)
-- Max 4 promos per product (enforced by trigger)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tag catalog (Admin → Tags)
-- If an old product_tags exists without "name", rename it and recreate.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'product_tags'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_tags'
      and column_name = 'name'
  ) then
    drop table if exists public.product_promos cascade;
    drop table if exists public.product_tags_legacy cascade;
    alter table public.product_tags rename to product_tags_legacy;
  end if;
end $$;

create table if not exists public.product_tags (
  id text primary key,
  name text not null,
  style text not null default 'flash-sale',
  icon_url text,
  icon_emoji text,
  icon_bg_color text,
  text_bg_color text,
  subtitle text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade existing product_tags (CREATE TABLE IF NOT EXISTS skips missing columns)
alter table public.product_tags add column if not exists name text;
alter table public.product_tags add column if not exists style text;
alter table public.product_tags add column if not exists icon_url text;
alter table public.product_tags add column if not exists icon_emoji text;
alter table public.product_tags add column if not exists icon_bg_color text;
alter table public.product_tags add column if not exists text_bg_color text;
alter table public.product_tags add column if not exists subtitle text;
alter table public.product_tags add column if not exists sort_order int default 0;
alter table public.product_tags add column if not exists is_active boolean default true;
alter table public.product_tags add column if not exists created_at timestamptz default now();
alter table public.product_tags add column if not exists updated_at timestamptz default now();
alter table public.product_tags add column if not exists placement text default 'promo';
alter table public.product_tags add column if not exists auto_rule text;

update public.product_tags set name = id where name is null and id is not null;
update public.product_tags set placement = 'promo' where placement is null;
update public.product_tags set placement = 'corner' where id like 'corner-%';
update public.product_tags set style = 'flash-sale' where style is null;
update public.product_tags set sort_order = 0 where sort_order is null;
update public.product_tags set is_active = true where is_active is null;
update public.product_tags set created_at = now() where created_at is null;
update public.product_tags set updated_at = now() where updated_at is null;

alter table public.product_tags alter column name set not null;
alter table public.product_tags alter column style set default 'flash-sale';
alter table public.product_tags alter column style set not null;
alter table public.product_tags alter column sort_order set default 0;
alter table public.product_tags alter column sort_order set not null;
alter table public.product_tags alter column is_active set default true;
alter table public.product_tags alter column is_active set not null;
alter table public.product_tags alter column created_at set default now();
alter table public.product_tags alter column created_at set not null;
alter table public.product_tags alter column updated_at set default now();
alter table public.product_tags alter column updated_at set not null;

drop index if exists product_tags_sort_idx;
create index if not exists product_tags_sort_idx
  on public.product_tags (sort_order, name);

-- ---------------------------------------------------------------------------
-- 2. Products (if you do not already have this table)
--    Full product document is stored in data (jsonb), including legacy promos.
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists data jsonb default '{}'::jsonb;
alter table public.products add column if not exists created_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();

create index if not exists products_data_gin_idx
  on public.products using gin (data);

-- ---------------------------------------------------------------------------
-- 3. Product ↔ tag assignments (recommended source of truth for storefront)
--    Mirrors ProductPromoEntry in the React app.
-- ---------------------------------------------------------------------------
create table if not exists public.product_promos (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  tag_id text not null references public.product_tags (id) on delete restrict,
  sort_order smallint not null default 0 check (sort_order >= 0 and sort_order <= 3),
  promo_type text not null check (
    promo_type in ('percentage', 'fixed', 'free-service', 'cash-deal', 'bundle')
  ),
  value numeric not null default 0,
  label text not null default '',
  badge_type text not null check (
    badge_type in ('flash-sale', 'free-install', 'discount', 'cash-deal', 'bundle')
  ),
  cash_per_month numeric,
  valid_until text,
  applies_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, sort_order),
  unique (product_id, tag_id)
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'product_promos'
  ) then
    alter table public.product_promos add column if not exists sort_order smallint default 0;
    alter table public.product_promos add column if not exists promo_type text;
    alter table public.product_promos add column if not exists value numeric default 0;
    alter table public.product_promos add column if not exists label text default '';
    alter table public.product_promos add column if not exists badge_type text;
    alter table public.product_promos add column if not exists cash_per_month numeric;
    alter table public.product_promos add column if not exists valid_until text;
    alter table public.product_promos add column if not exists applies_to text;
    alter table public.product_promos add column if not exists created_at timestamptz default now();
    alter table public.product_promos add column if not exists updated_at timestamptz default now();

    update public.product_promos set sort_order = 0 where sort_order is null;
    update public.product_promos set value = 0 where value is null;
    update public.product_promos set label = '' where label is null;

    drop index if exists product_promos_product_idx;
    create index if not exists product_promos_product_idx
      on public.product_promos (product_id, sort_order);
  end if;
end $$;

-- Max 4 promos per product
create or replace function public.enforce_max_product_promos()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)::int
    from public.product_promos
    where product_id = coalesce(new.product_id, old.product_id)
  ) > 4 then
    raise exception 'A product can have at most 4 promo tags';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_enforce_max_product_promos on public.product_promos;
create trigger trg_enforce_max_product_promos
after insert or update or delete on public.product_promos
for each row execute function public.enforce_max_product_promos();

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_tags_updated_at on public.product_tags;
create trigger trg_product_tags_updated_at
before update on public.product_tags
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_promos_updated_at on public.product_promos;
create trigger trg_product_promos_updated_at
before update on public.product_promos
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Helper: active employee (for admin write policies)
--    Requires public.employees from your auth schema.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.product_tags enable row level security;
alter table public.product_promos enable row level security;

-- Tags: everyone can read active tags (storefront + admin)
drop policy if exists product_tags_select_public on public.product_tags;
create policy product_tags_select_public on public.product_tags
  for select
  using (is_active = true or public.is_active_employee());

drop policy if exists product_tags_write_employees on public.product_tags;
create policy product_tags_write_employees on public.product_tags
  for all
  using (public.is_active_employee())
  with check (public.is_active_employee());

-- Promos: public read (storefront), employees write (admin)
drop policy if exists product_promos_select_public on public.product_promos;
create policy product_promos_select_public on public.product_promos
  for select
  using (true);

drop policy if exists product_promos_write_employees on public.product_promos;
create policy product_promos_write_employees on public.product_promos
  for all
  using (public.is_active_employee())
  with check (public.is_active_employee());

-- Products: adjust if you already have policies on this table
alter table public.products enable row level security;

drop policy if exists products_select_public on public.products;
create policy products_select_public on public.products
  for select
  using (true);

drop policy if exists products_write_employees on public.products;
create policy products_write_employees on public.products
  for all
  using (public.is_active_employee())
  with check (public.is_active_employee());

-- ---------------------------------------------------------------------------
-- 6. Seed default tags (matches src/app/data/productTags.ts)
-- ---------------------------------------------------------------------------
alter table public.product_tags drop constraint if exists product_tags_placement_check;
alter table public.product_tags add constraint product_tags_placement_check
  check (placement in ('promo', 'corner'));

alter table public.product_tags drop constraint if exists product_tags_auto_rule_check;
alter table public.product_tags add constraint product_tags_auto_rule_check
  check (auto_rule is null or auto_rule in ('manual', 'flash-sale', 'inverter', 'best-seller'));

insert into public.product_tags (
  id, name, style, placement, auto_rule, icon_emoji, subtitle, text_bg_color, icon_bg_color, sort_order
) values
  ('tag-flash-15', '15% OFF', 'flash-sale', 'promo', null, '⚡', null, null, null, 1),
  ('tag-free-install', 'FREE AUTHORIZED', 'free-install', 'promo', null, '✓', 'INSTALLATION', null, null, 2),
  ('tag-5000-off', '₱5,000 OFF', 'discount', 'promo', null, '★', null, null, null, 3),
  ('tag-cool-cash', 'COOL CASH', 'cash-deal', 'promo', null, '₱', 'per month', null, null, 4),
  ('tag-bundle', 'PROMO BUNDLE DEAL', 'bundle', 'promo', null, '🎁', null, null, null, 5),
  ('corner-sale', 'SALE', 'flash-sale', 'corner', 'flash-sale', null, null, '#EA580C', '#FFFFFF', 100),
  ('corner-inv', 'INV', 'flash-sale', 'corner', 'inverter', null, null, '#0EA5E9', '#FFFFFF', 101),
  ('corner-top', 'TOP', 'bundle', 'corner', 'best-seller', null, null, '#7C3AED', '#FFFFFF', 102)
on conflict (id) do update set
  name = excluded.name,
  style = excluded.style,
  placement = excluded.placement,
  auto_rule = excluded.auto_rule,
  icon_emoji = excluded.icon_emoji,
  subtitle = excluded.subtitle,
  text_bg_color = excluded.text_bg_color,
  icon_bg_color = excluded.icon_bg_color,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 7. Optional: sync product_promos → products.data.promos (jsonb)
--    Keeps existing catalog-api that reads/writes products.data in sync.
-- ---------------------------------------------------------------------------
create or replace function public.sync_product_promos_to_json(p_product_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  promos_json jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'tagId', pp.tag_id,
        'type', pp.promo_type,
        'value', pp.value,
        'label', pp.label,
        'badgeType', pp.badge_type,
        'cashPerMonth', pp.cash_per_month,
        'validUntil', pp.valid_until,
        'appliesTo', pp.applies_to
      )
      order by pp.sort_order
    ),
    '[]'::jsonb
  )
  into promos_json
  from public.product_promos pp
  where pp.product_id = p_product_id;

  update public.products
  set
    data = jsonb_set(
      coalesce(data, '{}'::jsonb),
      '{promos}',
      promos_json,
      true
    )
      - 'promo',
    updated_at = now()
  where id = p_product_id;
end;
$$;

create or replace function public.trg_sync_product_promos_to_json()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_product_promos_to_json(coalesce(new.product_id, old.product_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_product_promos_sync_json on public.product_promos;
create trigger trg_product_promos_sync_json
after insert or update or delete on public.product_promos
for each row execute function public.trg_sync_product_promos_to_json();

-- ---------------------------------------------------------------------------
-- 8. Example: attach promos to product id "1" (Samsung)
--    Adjust product_id / values to match your catalog.
-- ---------------------------------------------------------------------------
-- insert into public.product_promos (
--   product_id, tag_id, sort_order, promo_type, value, label, badge_type, valid_until
-- ) values
--   ('1', 'tag-flash-15', 0, 'percentage', 15, '15% OFF', 'flash-sale', 'May 31, 2026'),
--   ('1', 'tag-cool-cash', 1, 'cash-deal', 0, 'COOL CASH', 'cash-deal', 'May 31, 2026')
-- on conflict (product_id, tag_id) do update set
--   sort_order = excluded.sort_order,
--   value = excluded.value,
--   label = excluded.label,
--   valid_until = excluded.valid_until,
--   updated_at = now();

-- ---------------------------------------------------------------------------
-- Grants (Supabase anon/authenticated roles)
-- ---------------------------------------------------------------------------
grant select on public.product_tags to anon, authenticated;
grant select on public.product_promos to anon, authenticated;
grant select on public.products to anon, authenticated;

grant insert, update, delete on public.product_tags to authenticated;
grant insert, update, delete on public.product_promos to authenticated;
grant insert, update, delete on public.products to authenticated;
