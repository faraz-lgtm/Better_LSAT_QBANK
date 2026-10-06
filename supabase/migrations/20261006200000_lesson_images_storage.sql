-- Public bucket for prep-course lesson body images (path: {courseId}/{uuid}.ext).
-- Writes restricted to admin / super_admin profiles; reads are public for <img> in lessons.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson_images',
  'lesson_images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lesson_images_select_public" on storage.objects;
create policy "lesson_images_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'lesson_images');

drop policy if exists "lesson_images_insert_admin" on storage.objects;
create policy "lesson_images_insert_admin"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'lesson_images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "lesson_images_update_admin" on storage.objects;
create policy "lesson_images_update_admin"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'lesson_images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  )
  with check (
    bucket_id = 'lesson_images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "lesson_images_delete_admin" on storage.objects;
create policy "lesson_images_delete_admin"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'lesson_images'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );
