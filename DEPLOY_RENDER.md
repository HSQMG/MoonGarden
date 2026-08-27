# Triển khai MoonGarden trên Render

## 1. Chuẩn bị Supabase

Mở Supabase SQL Editor và chạy toàn bộ tệp `supabase/node-storage.sql`.

## 2. Biến môi trường Render

Thêm các biến sau trong Render → Environment:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET=journey-media`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET` (chuỗi ngẫu nhiên dài tối thiểu 32 ký tự)

Không đưa các giá trị bí mật vào GitHub.

## 3. Cấu hình Web Service

- Runtime: Node
- Branch: `main`
- Root Directory: để trống
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/`

Repository đã có `render.yaml`, vì vậy cũng có thể dùng Render Blueprint.

## 4. Đăng nhập quản trị

Mở `/admin` và đăng nhập bằng giá trị đã đặt cho `ADMIN_PASSWORD`.

## 5. Media cũ

Ảnh/video mới được lưu trong bucket Supabase `journey-media`. Media cũ nằm trong Cloudflare R2 không tự xuất hiện trong Supabase; cần tải chúng xuống từ website cũ rồi tải lại tại trang quản trị mới.
