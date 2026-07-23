-- One Helpful vote per storefront account per review.

create table if not exists public.review_helpful_votes (
  review_id uuid not null references public.customer_reviews (id) on delete cascade,
  customer_account_id uuid not null references public.customer_accounts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, customer_account_id)
);

create index if not exists review_helpful_votes_account_idx
  on public.review_helpful_votes (customer_account_id, created_at desc);
