-- Persist Messenger handoff so Page can send inquiry details after m.me opens
-- (works across API restarts; complements webhook referrals)

alter table public.inquiries
  add column if not exists messenger_handoff_at timestamptz;

comment on column public.inquiries.messenger_handoff_at is
  'Set when storefront opens Messenger; cleared after confirmation is sent';
