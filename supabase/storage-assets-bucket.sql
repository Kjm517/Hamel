-- Run in Supabase SQL Editor — fixes upload + "Bucket not found" for bucket "assets"
-- Your dashboard already has a bucket named: assets

-- 1. Make bucket public (required for icon URLs on the storefront)
update storage.buckets
set public = true
where id = 'assets';

-- If the bucket row is missing, create it:
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do update set public = true;

-- 2. Storage policies for bucket "assets"
drop policy if exists "Public read assets" on storage.objects;
create policy "Public read assets"
on storage.objects for select
to public
using (bucket_id = 'assets');

drop policy if exists "Authenticated upload assets" on storage.objects;
create policy "Authenticated upload assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'assets');

drop policy if exists "Authenticated update assets" on storage.objects;
create policy "Authenticated update assets"
on storage.objects for update
to authenticated
using (bucket_id = 'assets')
with check (bucket_id = 'assets');

drop policy if exists "Authenticated delete assets" on storage.objects;
create policy "Authenticated delete assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'assets');
