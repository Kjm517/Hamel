-- =============================================================================
-- FIX: product_tags was created with the wrong columns (no "name", etc.)
-- Run this entire script once in Supabase SQL Editor.
-- Backs up the old table as product_tags_legacy, then creates the correct schema.
-- =============================================================================

-- Remove dependent table first (safe to recreate empty)
drop table if exists public.product_promos cascade;

-- Backup broken / old product_tags if it is not the app schema
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'product_tags'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'product_tags'
        and column_name = 'name'
    ) then
      drop table if exists public.product_tags_legacy cascade;
      alter table public.product_tags rename to product_tags_legacy;
      raise notice 'Renamed old table to product_tags_legacy';
    end if;
  end if;
end $$;

-- Correct tag catalog (matches React ProductTag)
create table if not exists public.product_tags (
  id text primary key,
  name text not null,
  style text not null default 'flash-sale' check (
    style in ('flash-sale', 'free-install', 'discount', 'cash-deal', 'bundle')
  ),
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

-- If table existed but was missing columns (had id+name only, etc.)
alter table public.product_tags add column if not exists name text;
alter table public.product_tags add column if not exists style text default 'flash-sale';
alter table public.product_tags add column if not exists icon_url text;
alter table public.product_tags add column if not exists icon_emoji text;
alter table public.product_tags add column if not exists icon_bg_color text;
alter table public.product_tags add column if not exists text_bg_color text;
alter table public.product_tags add column if not exists subtitle text;
alter table public.product_tags add column if not exists sort_order int default 0;
alter table public.product_tags add column if not exists is_active boolean default true;
alter table public.product_tags add column if not exists created_at timestamptz default now();
alter table public.product_tags add column if not exists updated_at timestamptz default now();

update public.product_tags set name = id where name is null and id is not null;
update public.product_tags set style = 'flash-sale' where style is null;
update public.product_tags set sort_order = 0 where sort_order is null;
update public.product_tags set is_active = true where is_active is null;
update public.product_tags set created_at = now() where created_at is null;
update public.product_tags set updated_at = now() where updated_at is null;

alter table public.product_tags alter column name set not null;
alter table public.product_tags alter column style set not null;
alter table public.product_tags alter column sort_order set not null;
alter table public.product_tags alter column is_active set not null;

drop index if exists product_tags_sort_idx;
create index product_tags_sort_idx on public.product_tags (sort_order, name);

-- Default tags
insert into public.product_tags (
  id, name, style, icon_emoji, subtitle, sort_order
) values
  ('tag-flash-15', '15% OFF', 'flash-sale', '⚡', null, 1),
  ('tag-free-install', 'FREE AUTHORIZED', 'free-install', '✓', 'INSTALLATION', 2),
  ('tag-5000-off', '₱5,000 OFF', 'discount', '★', null, 3),
  ('tag-cool-cash', 'COOL CASH', 'cash-deal', '₱', 'per month', 4),
  ('tag-bundle', 'PROMO BUNDLE DEAL', 'bundle', '🎁', null, 5)
on conflict (id) do update set
  name = excluded.name,
  style = excluded.style,
  icon_emoji = excluded.icon_emoji,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Product promos (per-product tag links)
create table if not exists public.products (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create index if not exists product_promos_product_idx
  on public.product_promos (product_id, sort_order);

grant select on public.product_tags to anon, authenticated;
grant select on public.product_promos to anon, authenticated;
grant insert, update, delete on public.product_tags to authenticated;
grant insert, update, delete on public.product_promos to authenticated;

-- Verify
select id, name, style, sort_order from public.product_tags order by sort_order;
