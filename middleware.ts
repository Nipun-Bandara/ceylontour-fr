import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

/**
 * Keeps signed-out visitors off the authority dashboard (F8).
 *
 * This checks one thing: whether a session cookie exists. It deliberately does
 * **not** decide anything about the role.
 *
 * Two reasons for that. A JWT read in middleware cannot be trusted without
 * verifying its signature, and the secret for that belongs on the backend, not
 * here — so any role read here would be a claim, not a fact. And a role check
 * that redirects is exactly how redirect loops start: a tourist bounced from
 * the dashboard to somewhere that bounces them back spins forever.
 *
 * So the split is: middleware answers "are you signed in at all", and sends
 * you to the login page if not. Whether your account may see this page is
 * answered by the API, which returns 403, and the dashboard renders that as a
 * plain "you do not have access" screen. A rendered page cannot loop.
 */
export function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE);
  if (session) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/authority/login';
  // So sign-in can return them to where they were headed.
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/authority/dashboard'],
};
