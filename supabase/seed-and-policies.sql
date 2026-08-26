-- Chạy TOÀN BỘ tệp này sau khi schema.sql đã tạo xong ba bảng.

insert into public.milestones
  (slug, event_year, title, description, icon, image_path, image_alt, sort_order)
values
  ('vy-ra-doi', 2003, 'Một cô gái nhỏ ra đời', 'Ngày thế giới bỗng có thêm một người thật đặc biệt.', '✦', '/images/avatar/vy.jpg', 'Một bức ảnh đáng nhớ của Vy', 1)
on conflict (slug) do update set event_year = excluded.event_year, title = excluded.title, description = excluded.description, icon = excluded.icon, image_path = excluded.image_path, image_alt = excluded.image_alt, sort_order = excluded.sort_order, updated_at = now();

insert into public.milestones
  (slug, event_year, title, description, icon, image_path, image_alt, sort_order)
values
  ('tuoi-muoi-tam', 2018, 'Bước qua tuổi mười tám', 'Mang theo những ước mơ đầu tiên và bắt đầu hành trình của riêng mình.', '☼', '/images/year-2018/img_01.jpg', 'Khoảnh khắc tuổi 18', 2)
on conflict (slug) do update set event_year = excluded.event_year, title = excluded.title, description = excluded.description, icon = excluded.icon, image_path = excluded.image_path, image_alt = excluded.image_alt, sort_order = excluded.sort_order, updated_at = now();

insert into public.milestones
  (slug, event_year, title, description, icon, image_path, image_alt, sort_order)
values
  ('tot-nghiep-thpt', 2021, 'Tốt nghiệp trung học phổ thông', 'Trưởng thành hơn mỗi ngày.', '⌁', '/images/year-2021/img_01.jpg', 'Cô gái năm ấy đã trưởng thành.', 3)
on conflict (slug) do update set event_year = excluded.event_year, title = excluded.title, description = excluded.description, icon = excluded.icon, image_path = excluded.image_path, image_alt = excluded.image_alt, sort_order = excluded.sort_order, updated_at = now();

insert into public.milestones
  (slug, event_year, title, description, icon, image_path, image_alt, sort_order)
values
  ('bat-dau-dai-hoc', 2021, 'Bắt đầu một hành trình mới ở cấp bậc đại học', 'Cô ấy đã bắt đầu một chặng đường mới đầy hứa hẹn.', '♡', '/images/year-2021/img_02.jpg', 'Một cột mốc quan trọng cho một hành trình mới.', 4)
on conflict (slug) do update set event_year = excluded.event_year, title = excluded.title, description = excluded.description, icon = excluded.icon, image_path = excluded.image_path, image_alt = excluded.image_alt, sort_order = excluded.sort_order, updated_at = now();

insert into public.milestones
  (slug, event_year, title, description, icon, image_path, image_alt, sort_order)
values
  ('tot-nghiep-dai-hoc', 2025, 'Tốt nghiệp đại học', 'Cô ấy đã hoàn thành chặng đường học tập đầy thử thách.', '⌁', '/images/year-2025/img_01.jpg', 'Khoảnh khắc tốt nghiệp là một cột mốc quan trọng.', 5)
on conflict (slug) do update set event_year = excluded.event_year, title = excluded.title, description = excluded.description, icon = excluded.icon, image_path = excluded.image_path, image_alt = excluded.image_alt, sort_order = excluded.sort_order, updated_at = now();

insert into public.friend_trips
  (slug, trip_date, title, friends, description, tone, sort_order)
values
  ('mot-ngay-tron-pho', date '2023-03-12', 'Một ngày trốn phố', 'Cùng hội bạn thân', 'Chuyến đi ngẫu hứng, những câu chuyện không đầu không cuối và thật nhiều tiếng cười.', 'lavender', 1)
on conflict (slug) do update set trip_date = excluded.trip_date, title = excluded.title, friends = excluded.friends, description = excluded.description, tone = excluded.tone, sort_order = excluded.sort_order, updated_at = now();

insert into public.friend_trips
  (slug, trip_date, title, friends, description, tone, sort_order)
values
  ('hen-nhau-ben-bien', date '2024-08-27', 'Hẹn nhau bên biển', 'Cùng những người bạn đại học', 'Chiều hôm ấy, biển xanh và tuổi trẻ dường như đều không có điểm dừng.', 'blue', 2)
on conflict (slug) do update set trip_date = excluded.trip_date, title = excluded.title, friends = excluded.friends, description = excluded.description, tone = excluded.tone, sort_order = excluded.sort_order, updated_at = now();

insert into public.friend_trips
  (slug, trip_date, title, friends, description, tone, sort_order)
values
  ('chuyen-di-dau-nam', date '2025-01-05', 'Chuyến đi đầu năm', 'Cùng nhóm bạn thân', 'Một khởi đầu mới được đánh dấu bằng nắng, gió và những người luôn ở bên.', 'amber', 3)
on conflict (slug) do update set trip_date = excluded.trip_date, title = excluded.title, friends = excluded.friends, description = excluded.description, tone = excluded.tone, sort_order = excluded.sort_order, updated_at = now();

alter table public.milestones enable row level security;
alter table public.friend_trips enable row level security;
alter table public.trip_media enable row level security;

drop policy if exists "public read milestones" on public.milestones;
create policy "public read milestones" on public.milestones for select to anon using (true);
drop policy if exists "public read friend trips" on public.friend_trips;
create policy "public read friend trips" on public.friend_trips for select to anon using (true);
drop policy if exists "public read trip media" on public.trip_media;
create policy "public read trip media" on public.trip_media for select to anon using (true);
