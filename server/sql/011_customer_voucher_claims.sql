-- Per-account Cool Deals / voucher claims (replaces browser localStorage).

create table if not exists public.customer_voucher_claims (
  id uuid primary key default gen_random_uuid(),
  customer_account_id uuid not null references public.customer_accounts (id) on delete cascade,
  card_id text not null,
  title text not null,
  voucher_code text,
  source text not null default 'cool-deals'
    check (source in ('cool-deals')),
  claimed_at timestamptz not null default now(),
  constraint customer_voucher_claims_account_card_unique unique (customer_account_id, card_id)
);

create index if not exists customer_voucher_claims_account_idx
  on public.customer_voucher_claims (customer_account_id, claimed_at desc);

create index if not exists customer_voucher_claims_code_idx
  on public.customer_voucher_claims (customer_account_id, upper(voucher_code))
  where voucher_code is not null;
