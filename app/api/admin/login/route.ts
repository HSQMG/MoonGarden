import { NextResponse } from 'next/server';
import { adminCookieName, createAdminToken } from '../../../../lib/admin-auth';

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get('password') || '');
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL('/admin?error=1', request.url), 303);
  }
  const response = NextResponse.redirect(new URL('/admin', request.url), 303);
  response.cookies.set(adminCookieName, await createAdminToken(), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 24 * 60 * 60 });
  return response;
}
