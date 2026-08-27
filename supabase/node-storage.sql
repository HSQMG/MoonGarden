-- Chạy toàn bộ tệp này một lần trong Supabase SQL Editor trước khi deploy Render.
insert into storage.buckets (id, name, public, file_size_limit)
values ('journey-media', 'journey-media', false, 52428800)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- Đảm bảo bảng metadata ảnh/video Phần 03 tồn tại.
create table if not exists public.trip_media (
  id uuid primary key default gen_random_uuid(),
  friend_trip_id uuid not null references public.friend_trips(id) on delete cascade,
  storage_bucket text not null default 'journey-media',
  storage_path text not null unique,
  original_name text not null,
  media_type text not null check (media_type in ('image', 'video')),
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_trip_media_trip_sort
  on public.trip_media(friend_trip_id, sort_order, created_at);

alter table public.trip_media enable row level security;
drop policy if exists "public read trip media" on public.trip_media;
create policy "public read trip media"
  on public.trip_media for select to anon using (true);
