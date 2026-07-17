-- Optional customer accounts + PayMongo-backed checkout.
-- Run after 001_schema.sql through 003_messenger.sql.

create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers (id) on delete cascade,
  email text not null,
  password_hash text not null,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customer_accounts_email_unique_idx
  on public.customer_accounts (lower(email));

drop trigger if exists trg_customer_accounts_updated_at on public.customer_accounts;
create trigger trg_customer_accounts_updated_at
before update on public.customer_accounts
for each row execute function public.set_updated_at();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  customer_name text not null,
  email text,
  phone text not null,
  address text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'payment_failed', 'cancelled', 'fulfilled')),
  currency text not null default 'PHP',
  subtotal_centavos integer not null check (subtotal_centavos >= 0),
  payment_provider text,
  payment_session_id text unique,
  payment_reference text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null,
  product_label text not null,
  hp text,
  unit_price_centavos integer not null check (unit_price_centavos >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();
