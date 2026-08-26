-- Cấu trúc PostgreSQL dành cho Supabase.
-- Chạy toàn bộ tệp này trong Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  event_year smallint not null check (event_year between 1900 and 2200),
  title text not null,
  description text not null default '',
  icon text not null default '✦',
  image_path text,
  image_alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friend_trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  trip_date date not null,
  title text not null,
  friends text not null default '',
  description text not null default '',
  tone text not null default 'lavender'
    check (tone in ('lavender', 'blue', 'amber')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_media (
  id uuid primary key default gen_random_uuid(),
  friend_trip_id uuid not null references public.friend_trips(id) on delete cascade,
  storage_bucket text not null default 'trip-media',
  storage_path text not null unique,
  original_name text not null,
  media_type text not null check (media_type in ('image', 'video')),
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_milestones_sort
  on public.milestones(sort_order, event_year);

create index if not exists idx_friend_trips_sort
  on public.friend_trips(sort_order, trip_date);

create index if not exists idx_trip_media_trip_sort
  on public.trip_media(friend_trip_id, sort_order, created_at);

-- Bảo vệ dữ liệu mặc định. Chưa tạo policy công khai.
alter table public.milestones enable row level security;
alter table public.friend_trips enable row level security;
alter table public.trip_media enable row level security;

-- Dữ liệu milestones hiện tại.
insert into public.milestones
  (slug, event_year, title, description, icon, image_path, image_alt, sort_order)
values
  ('vy-ra-doi', 2003, 'Một cô gái nhỏ ra đời', 'Ngày thế giới bỗng có thêm một người thật đặc biệt.', '✦', 'milestones/2003/vy.jpg', 'Một bức ảnh đáng nhớ của Vy', 1),
  ('tuoi-muoi-tam', 2018, 'Bước qua tuổi mười tám', 'Mang theo những ước mơ đầu tiên và bắt đầu hành trình của riêng mình.', '☼', 'milestones/2018/img_01.jpg', 'Khoảnh khắc tuổi 18', 2),
  ('tot-nghiep-thpt', 2021, 'Tốt nghiệp trung học phổ thông', 'Trưởng thành hơn mỗi ngày.', '⌁', 'milestones/2021/img_01.jpg', 'Cô gái năm ấy đã trưởng thành.', 3),
  ('bat-dau-dai-hoc', 2021, 'Bắt đầu một hành trình mới ở cấp bậc đại học', 'Cô ấy đã bắt đầu một chặng đường mới đầy hứa hẹn.', '♡', 'milestones/2021/img_02.jpg', 'Một cột mốc quan trọng cho một hành trình mới.', 4),
  ('tot-nghiep-dai-hoc', 2025, 'Tốt nghiệp đại học', 'Cô ấy đã hoàn thành chặng đường học tập đầy thử thách.', '⌁', 'milestones/2025/img_01.jpg', 'Khoảnh khắc tốt nghiệp là một cột mốc quan trọng.', 5)
on conflict (slug) do update set
  event_year = excluded.event_year,
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  image_path = excluded.image_path,
  image_alt = excluded.image_alt,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Dữ liệu friendTrips hiện tại.
insert into public.friend_trips
  (slug, trip_date, title, friends, description, tone, sort_order)
values
  ('mot-ngay-tron-pho', '2023-03-12', 'Một ngày trốn phố', 'Cùng hội bạn thân', 'Chuyến đi ngẫu hứng, những câu chuyện không đầu không cuối và thật nhiều tiếng cười.', 'lavender', 1),
  ('hen-nhau-ben-bien', '2024-08-27', 'Hẹn nhau bên biển', 'Cùng những người bạn đại học', 'Chiều hôm ấy, biển xanh và tuổi trẻ dường như đều không có điểm dừng.', 'blue', 2),
  ('chuyen-di-dau-nam', '2025-01-05', 'Chuyến đi đầu năm', 'Cùng nhóm bạn thân', 'Một khởi đầu mới được đánh dấu bằng nắng, gió và những người luôn ở bên.', 'amber', 3)
on conflict (slug) do update set
  trip_date = excluded.trip_date,
  title = excluded.title,
  friends = excluded.friends,
  description = excluded.description,
  tone = excluded.tone,
  sort_order = excluded.sort_order,
  updated_at = now();

comment on table public.milestones is 'Các cột mốc quan trọng trong hành trình của Vy';
comment on table public.friend_trips is 'Những lần Vy đi cùng bạn bè';
comment on table public.trip_media is 'Thông tin ảnh và video thuộc từng chuyến đi';
