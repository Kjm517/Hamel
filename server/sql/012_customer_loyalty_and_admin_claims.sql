-- Customer codes, loyalty tiers, and admin-assigned voucher claims.

create sequence if not exists public.customer_code_seq;

alter table public.customers
  add column if not exists customer_code text,
  add column if not exists loyalty_tier text
    check (loyalty_tier is null or loyalty_tier in ('bronze', 'silver', 'gold'));

-- Backfill missing codes from the sequence (stable order by created_at).
do $$
declare
  r record;
  next_n bigint;
begin
  for r in
    select id
    from public.customers
    where customer_code is null
    order by created_at asc, id asc
  loop
    next_n := nextval('public.customer_code_seq');
    update public.customers
    set customer_code = 'HML-' || lpad(next_n::text, 6, '0')
    where id = r.id;
  end loop;
end $$;

-- Align sequence with any pre-existing max numeric suffix.
select setval(
  'public.customer_code_seq',
  greatest(
    coalesce(
      (
        select max(nullif(regexp_replace(customer_code, '^HML-', ''), '')::bigint)
        from public.customers
        where customer_code ~ '^HML-[0-9]+$'
      ),
      0
    ),
    1
  ),
  true
);

alter table public.customers
  alter column customer_code set not null;

create unique index if not exists customers_customer_code_unique_idx
  on public.customers (customer_code);

-- Allow admin-assigned claims (drop old check if present, then add widened check).
alter table public.customer_voucher_claims
  drop constraint if exists customer_voucher_claims_source_check;

alter table public.customer_voucher_claims
  add constraint customer_voucher_claims_source_check
  check (source in ('cool-deals', 'admin'));
