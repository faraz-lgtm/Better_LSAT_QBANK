-- Public bucket for PrepTest question explanation videos (path: {questionId}/{uuid}.ext).
-- Writes restricted to admin / super_admin profiles; reads are public for simple <video> playback.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question_explanation_videos',
  'question_explanation_videos',
  true,
  524288000,
  array['video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "question_explanation_videos_select_public" on storage.objects;
create policy "question_explanation_videos_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'question_explanation_videos');

drop policy if exists "question_explanation_videos_insert_admin" on storage.objects;
create policy "question_explanation_videos_insert_admin"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'question_explanation_videos'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "question_explanation_videos_update_admin" on storage.objects;
create policy "question_explanation_videos_update_admin"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'question_explanation_videos'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  )
  with check (
    bucket_id = 'question_explanation_videos'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "question_explanation_videos_delete_admin" on storage.objects;
create policy "question_explanation_videos_delete_admin"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'question_explanation_videos'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );
