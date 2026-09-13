-- Create storage bucket for event banners
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-banners',
  'event-banners',
  true,
  5242880, -- 5MB
  array['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Allow admin to upload
create policy "Admin can upload banners"
on storage.objects for insert
with check (
  bucket_id = 'event-banners'
  and auth.jwt() ->> 'email' = 'samuelivere92@gmail.com'
);

-- Allow admin to update/delete
create policy "Admin can update banners"
on storage.objects for update
using (
  bucket_id = 'event-banners'
  and auth.jwt() ->> 'email' = 'samuelivere92@gmail.com'
);

-- Allow public to read banners
create policy "Public can read banners"
on storage.objects for select
using (bucket_id = 'event-banners');
