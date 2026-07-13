-- =============================================================================
-- Hamel — CMS + ops tables (run after 001_schema.sql)
-- =============================================================================

-- Site CMS documents (banners, cool_deals, promo_pages, brands_page)
create table if not exists public.site_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Site settings (whatsapp, hours, flags, etc.)
create table if not exists public.site_settings (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Customers (upserted from inquiries)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_phone_unique_idx
  on public.customers (phone)
  where phone is not null and phone <> '';

create index if not exists customers_name_idx on public.customers (lower(name));

-- Expand inquiries for AI / storefront payload
alter table public.inquiries add column if not exists phone text;
alter table public.inquiries add column if not exists address text;
alter table public.inquiries add column if not exists property_type text;
alter table public.inquiries add column if not exists floor text;
alter table public.inquiries add column if not exists schedule_date text;
alter table public.inquiries add column if not exists schedule_time text;
alter table public.inquiries add column if not exists hp text;
alter table public.inquiries add column if not exists notes text;
alter table public.inquiries add column if not exists source text default 'storefront';
alter table public.inquiries add column if not exists customer_id uuid references public.customers (id) on delete set null;
alter table public.inquiries add column if not exists product_id text;

create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists inquiries_customer_idx on public.inquiries (customer_id);

-- Messages inbox
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  name text not null default '',
  contact text not null default '',
  channel text not null default 'contact'
    check (channel in ('contact', 'whatsapp', 'ai', 'other')),
  body text not null default '',
  status text not null default 'unread'
    check (status in ('unread', 'read', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_status_idx on public.messages (status, created_at desc);

-- Lightweight analytics beacons
create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  path text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_events_type_created_idx
  on public.site_events (event_type, created_at desc);

-- updated_at triggers
drop trigger if exists trg_site_content_updated_at on public.site_content;
create trigger trg_site_content_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists trg_messages_updated_at on public.messages;
create trigger trg_messages_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

-- Default settings
insert into public.site_settings (key, data)
values (
  'store',
  jsonb_build_object(
    'whatsappNumber', '639171234567',
    'businessHours', 'Mon–Sat 9:00 AM – 6:00 PM',
    'storeName', 'Hamel Trading',
    'contactEmail', 'hello@hamel.example',
    'showAiChat', true
  )
)
on conflict (key) do nothing;
