import { headers } from 'next/headers';
import AdminClient from './admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const requestHeaders = await headers();
  const currentEmail = requestHeaders.get('oai-authenticated-user-email')?.trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const allowed = process.env.NODE_ENV === 'development' || Boolean(adminEmail && currentEmail === adminEmail);

  if (!allowed) {
    return (
      <main className="adminDenied">
        <div><span>✦</span><h1>Khu vực riêng tư</h1><p>Tài khoản hiện tại không có quyền truy cập trang quản lý này.</p><a href="/">Trở về trang của Vy</a></div>
      </main>
    );
  }

  return <AdminClient />;
}
