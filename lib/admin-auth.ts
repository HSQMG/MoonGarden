const cookieName = 'moongarden_admin';
const encoder = new TextEncoder();

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error('ADMIN_SESSION_SECRET chưa được cấu hình.');
  return value;
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createAdminToken() {
  const expires = String(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return `${expires}.${await sign(expires)}`;
}

export async function verifyAdminToken(token?: string | null) {
  if (!token) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return (await sign(expires)) === signature;
}

export async function isAdminRequest(request: Request) {
  if (process.env.NODE_ENV === 'development' && !process.env.ADMIN_PASSWORD) return true;
  const cookie = request.headers.get('cookie') || '';
  const value = cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return verifyAdminToken(value);
}

export const adminCookieName = cookieName;
