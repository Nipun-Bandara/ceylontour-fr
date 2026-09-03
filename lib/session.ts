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
