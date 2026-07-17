-- Email-code verification for optional customer accounts.

alter table public.customer_accounts
  add column if not exists email_verified_at timestamptz;

create table if not exists public.customer_email_verifications (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists customer_email_verifications_account_idx
  on public.customer_email_verifications (customer_account_id, created_at desc);
