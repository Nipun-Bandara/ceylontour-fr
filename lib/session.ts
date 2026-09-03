/**
 * The browser's half of authority sign-in (F8).
 *
 * These talk to this app's own route handler at `/api/session`, not to the
 * CeylonTour API. That is the whole point: the JWT is set as an **httpOnly**
 * cookie by the server, so JavaScript in the browser can never read it, and
 * therefore can never leak it through an XSS bug the way a token in
 * `localStorage` would. The real call to `POST /api/auth/login` happens inside
 * the route handler, through `lib/api.ts` like everything else.
 *
 * The fetches live here rather than in a component for the same reason every
 * other request does: components do not make network calls themselves.
 */

import type { UserRole } from '@/types/api';

/** Name of the httpOnly cookie holding the session token. */
export const SESSION_COOKIE = 'ceylontour_session';

/**
 * How long the session cookie lives, in seconds.
 *
 * `POST /api/auth/login` does not return an `expires_in`, so the cookie cannot
 * simply mirror the token's own lifetime. This is set deliberately short so
 * the cookie expires no later than the JWT does — a cookie outliving its token
 * only produces a confusing 401 on the next page load.
 *
 * **Keep this in step with the backend's JWT expiry.** If the API starts
 * returning `expires_in`, use that instead and delete this.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60;

export interface SignInResult {
  ok: boolean;
  /** Present when sign-in succeeded. */
  role?: UserRole;
  /** Present when it did not. Safe to show; never contains the password. */
  message?: string;
}

export async function signIn(
  email: string,
  password: string
): Promise<SignInResult> {
  let response: Response;
  try {
    response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { ok: false, message: 'Could not reach the server. Try again.' };
  }

  const body: unknown = await response.json().catch(() => null);
  const record =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {};

  if (!response.ok) {
    return {
      ok: false,
      message:
        typeof record.message === 'string'
          ? record.message
          : 'Sign in failed. Check the email and password and try again.',
    };
  }

  return {
    ok: true,
    role: record.role === 'tourist' ? 'tourist' : 'authority',
  };
}

export async function signOut(): Promise<void> {
  await fetch('/api/session', { method: 'DELETE' }).catch(() => undefined);
}
