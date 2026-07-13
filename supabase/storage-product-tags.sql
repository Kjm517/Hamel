-- Supabase Storage for product tag icons
-- Creates public bucket "product-tags" (required for admin upload — fixes "Bucket not found")
-- If you already use another bucket name, set VITE_SUPABASE_STORAGE_BUCKET in Main/.env instead.

insert into storage.buckets (id, name, public)
values ('product-tags', 'product-tags', true)
on conflict (id) do update set public = true;

-- Public read (storefront + admin preview)
drop policy if exists "Public read product-tags" on storage.objects;
create policy "Public read product-tags"
on storage.objects for select
to public
using (bucket_id = 'product-tags');

-- Authenticated employees can upload/update/delete
drop policy if exists "Employees upload product-tags" on storage.objects;
create policy "Employees upload product-tags"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-tags'
  and public.is_active_employee()
);

drop policy if exists "Employees update product-tags" on storage.objects;
create policy "Employees update product-tags"
on storage.objects for update
to authenticated
using (bucket_id = 'product-tags' and public.is_active_employee())
with check (bucket_id = 'product-tags' and public.is_active_employee());

drop policy if exists "Employees delete product-tags" on storage.objects;
create policy "Employees delete product-tags"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-tags' and public.is_active_employee());

-- Point each tag at your uploaded file names (edit paths to match your Storage files)
update public.product_tags set icon_url = 'tag-flash-15.png', icon_emoji = null where id = 'tag-flash-15';
update public.product_tags set icon_url = 'tag-free-install.png', icon_emoji = null where id = 'tag-free-install';
update public.product_tags set icon_url = 'tag-5000-off.png', icon_emoji = null where id = 'tag-5000-off';
update public.product_tags set icon_url = 'tag-cool-cash.png', icon_emoji = null where id = 'tag-cool-cash';
update public.product_tags set icon_url = 'tag-bundle.png', icon_emoji = null where id = 'tag-bundle';
