-- AI features: lead scoring, reply drafts, customer chat memory
-- Run in Neon SQL Editor after 007_customer_email_verification.sql

alter table inquiries
  add column if not exists lead_score text,
  add column if not exists lead_reasons jsonb not null default '[]'::jsonb,
  add column if not exists ai_reply_draft text,
  add column if not exists ai_reply_draft_at timestamptz;

comment on column inquiries.lead_score is 'high | medium | low (High / Medium / Low Priority)';

-- Remap legacy labels if you already ran an earlier 008 draft
update inquiries set lead_score = 'high' where lead_score = 'hot';
update inquiries set lead_score = 'medium' where lead_score = 'warm';
update inquiries set lead_score = 'low' where lead_score = 'cold';

create table if not exists customer_chat_messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists customer_chat_messages_customer_created_idx
  on customer_chat_messages (customer_id, created_at desc);
