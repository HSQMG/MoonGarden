import { NextResponse } from 'next/server';
import { adminCookieName } from '../../../../lib/admin-auth';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/admin', request.url), 303);
  response.cookies.set(adminCookieName, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
