-- Allow Helpful votes from guests (browser key) as well as signed-in accounts.

alter table public.review_helpful_votes
  drop constraint if exists review_helpful_votes_pkey;

alter table public.review_helpful_votes
  alter column customer_account_id drop not null;

alter table public.review_helpful_votes
  add column if not exists guest_key text;

alter table public.review_helpful_votes
  add column if not exists id uuid default gen_random_uuid();

update public.review_helpful_votes
set id = gen_random_uuid()
where id is null;

alter table public.review_helpful_votes
  alter column id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'review_helpful_votes_pkey'
  ) then
    alter table public.review_helpful_votes
      add constraint review_helpful_votes_pkey primary key (id);
  end if;
end $$;

create unique index if not exists review_helpful_votes_account_uniq
  on public.review_helpful_votes (review_id, customer_account_id)
  where customer_account_id is not null;

create unique index if not exists review_helpful_votes_guest_uniq
  on public.review_helpful_votes (review_id, guest_key)
  where guest_key is not null;

alter table public.review_helpful_votes
  drop constraint if exists review_helpful_votes_voter_chk;

alter table public.review_helpful_votes
  add constraint review_helpful_votes_voter_chk check (
    (customer_account_id is not null and guest_key is null)
    or (customer_account_id is null and guest_key is not null)
  );
