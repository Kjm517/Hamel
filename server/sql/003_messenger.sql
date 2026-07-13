-- =============================================================================
-- Hamel — Messenger Platform (Page Send API + referral linking)
-- =============================================================================

alter table public.customers
  add column if not exists messenger_psid text;

create unique index if not exists customers_messenger_psid_unique_idx
  on public.customers (messenger_psid)
  where messenger_psid is not null and messenger_psid <> '';

alter table public.inquiries
  add column if not exists messenger_psid text;

alter table public.inquiries
  add column if not exists messenger_confirmation_sent_at timestamptz;
