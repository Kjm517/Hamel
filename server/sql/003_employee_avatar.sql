-- Admin profile avatars
alter table public.employees
  add column if not exists avatar_url text;
