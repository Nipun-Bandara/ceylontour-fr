import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isApiError, postLogin } from '@/lib/api';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/session';

/**
 * The session route handler (F8).
 *
 * The browser never sees the JWT. It posts an email and password here, this
 * runs on the server, calls `POST /api/auth/login` through `lib/api.ts`, and
 * puts the returned token into an **httpOnly** cookie. Only the role comes
 * back in the response body.
 *
 * That is why the token is not in `localStorage`: anything in `localStorage`
 * is readable by any script on the page, so a single XSS bug hands an
 * attacker a valid official's session. An httpOnly cookie is not readable by
 * script at all.
 *
 * The password exists only as a local variable in `POST` below. It is not
 * logged, not stored, not echoed back, and not put in a cookie. Hashing and
 * verification are the backend's job — F8 requires bcrypt or argon2 there.
 */

/** Cookies are set here, so this route can never be statically rendered. */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Expected an email and a password.' },
      { status: 400 }
    );
  }

  const record =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const email = typeof record.email === 'string' ? record.email.trim() : '';
  const password = typeof record.password === 'string' ? record.password : '';

  if (email === '' || password === '') {
    return NextResponse.json(
      { message: 'Enter both an email and a password.' },
      { status: 400 }
    );
  }

  try {
    const session = await postLogin({ email, password });

    cookies().set(SESSION_COOKIE, session.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      // Only sent over HTTPS in production. Left off in development so the
      // cookie works over plain http on localhost.
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      // The API does not send an `expires_in`, so this is a fixed lifetime
      // kept deliberately no longer than the token's own.
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    // The role is returned so the form knows where to send the user. The
    // token deliberately is not.
    return NextResponse.json({ role: session.role });
  } catch (caught) {
    // Deliberately vague to the browser: saying which of the two was wrong
    // tells an attacker which emails exist.
    const status = isApiError(caught) && caught.status === 401 ? 401 : 502;
    return NextResponse.json(
      {
        message:
          status === 401
            ? 'That email and password did not match an account.'
            : 'Could not reach the sign-in service. Try again shortly.',
      },
      { status }
    );
  }
}

/** Logout. Clears the cookie; there is nothing else to clear. */
export async function DELETE() {
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
