-- =============================================================================
-- Hamel — Neon Postgres schema (no Supabase Auth / RLS / Storage)
-- Run in Neon SQL Editor (or: psql $DATABASE_URL -f 001_schema.sql)
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Employees (admin users; password_hash replaces Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  username text unique,
  phone text,
  role text not null check (role in ('Manager', 'Admin', 'Staff', 'Viewer')),
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  added_by text,
  permissions text[] not null default '{}',
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_email_lower_idx on public.employees (lower(email));
create index if not exists employees_username_lower_idx on public.employees (lower(username));

-- ---------------------------------------------------------------------------
-- Password reset tokens (hashed)
-- ---------------------------------------------------------------------------
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_employee_idx
  on public.password_reset_tokens (employee_id);

-- ---------------------------------------------------------------------------
-- Product tags
-- ---------------------------------------------------------------------------
create table if not exists public.product_tags (
  id text primary key,
  name text not null,
  style text not null default 'flash-sale',
  placement text not null default 'promo',
  auto_rule text,
  icon_url text,
  icon_emoji text,
  icon_bg_color text,
  text_bg_color text,
  subtitle text,
  description text,
  chip_image_url text,
  render_mode text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_tags_sort_idx
  on public.product_tags (sort_order, name);

-- ---------------------------------------------------------------------------
-- Products (full document in data jsonb)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_data_gin_idx
  on public.products using gin (data);

-- ---------------------------------------------------------------------------
-- Product promos (optional normalized table; app primarily uses products.data)
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

create index if not exists product_promos_product_idx
  on public.product_promos (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- Customer reviews
-- ---------------------------------------------------------------------------
create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists customer_reviews_product_idx
  on public.customer_reviews (product_id);

-- ---------------------------------------------------------------------------
-- Inquiries
-- ---------------------------------------------------------------------------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  customer_name text not null,
  product_label text,
  quantity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_created_idx
  on public.inquiries (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_tags_updated_at on public.product_tags;
create trigger trg_product_tags_updated_at
before update on public.product_tags
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_promos_updated_at on public.product_promos;
create trigger trg_product_promos_updated_at
before update on public.product_promos
for each row execute function public.set_updated_at();

drop trigger if exists trg_inquiries_updated_at on public.inquiries;
create trigger trg_inquiries_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed default product tags
-- ---------------------------------------------------------------------------
insert into public.product_tags (id, name, style, placement, auto_rule, icon_emoji, subtitle, sort_order)
values
  ('tag-flash-15', '15% OFF', 'flash-sale', 'promo', null, '⚡', null, 1),
  ('tag-free-install', 'FREE AUTHORIZED', 'free-install', 'promo', null, '✓', 'INSTALLATION', 2),
  ('tag-5000-off', '₱5,000 OFF', 'discount', 'promo', null, '★', null, 3),
  ('tag-cool-cash', 'COOL CASH', 'cash-deal', 'promo', null, '₱', 'per month', 4),
  ('tag-bundle', 'BUNDLE DEAL', 'bundle', 'promo', null, '🎁', null, 5),
  ('corner-sale', 'SALE', 'flash-sale', 'corner', 'flash-sale', null, null, 6),
  ('corner-inv', 'INV', 'free-install', 'corner', 'inverter', null, null, 7),
  ('corner-top', 'TOP', 'discount', 'corner', 'best-seller', null, null, 8)
on conflict (id) do nothing;
