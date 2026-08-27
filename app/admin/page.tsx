import { cookies } from 'next/headers';
import AdminClient from './admin-client';
import { adminCookieName, verifyAdminToken } from '../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const store = await cookies();
  const allowed = process.env.NODE_ENV === 'development' && !process.env.ADMIN_PASSWORD
    ? true
    : await verifyAdminToken(store.get(adminCookieName)?.value);

  if (!allowed) {
    return (
      <main className="adminDenied">
        <form action="/api/admin/login" method="post"><span>✦</span><h1>Khu vực riêng tư</h1><p>Nhập mật khẩu quản trị để tiếp tục.</p><input name="password" type="password" required autoComplete="current-password" placeholder="Mật khẩu quản trị" /><button type="submit">Đăng nhập</button><a href="/">Trở về trang của Vy</a></form>
      </main>
    );
  }

  return <AdminClient />;
}
