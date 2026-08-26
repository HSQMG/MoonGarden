-- Chạy toàn bộ tệp này trong Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  reflected_at date not null,
  title text not null,
  source_type text not null default 'photo'
    check (source_type in ('photo', 'post')),
  feeling text not null default '',
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reflections_date
  on public.reflections(reflected_at desc, created_at desc);

alter table public.reflections enable row level security;

drop policy if exists "public read reflections" on public.reflections;
create policy "public read reflections"
  on public.reflections for select
  to anon
  using (true);

comment on table public.reflections is
  'Cảm nhận cá nhân qua từng bức ảnh hoặc bài đăng của Vy';
