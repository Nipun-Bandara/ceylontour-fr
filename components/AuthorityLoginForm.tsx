'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Card from '@/components/Card';
import { signIn } from '@/lib/session';

/**
 * Sign-in for tourism authority users (F8).
 *
 * The password is held in component state only for as long as the form is on
 * screen, sent once to this app's own `/api/session` route, and never written
 * anywhere else — not to storage, not to a cookie, not to a log. What comes
 * back is a role, not a token; the token goes straight into an httpOnly cookie
 * on the server side where script cannot reach it.
 */
export default function AuthorityLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = email.trim() !== '' && password !== '' && !submitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setMessage(null);

    const result = await signIn(email, password);

    if (!result.ok) {
      setMessage(result.message ?? 'Sign in failed.');
      setSubmitting(false);
      return;
    }

    // Drop the password from memory as soon as it is no longer needed.
    setPassword('');

    const next = searchParams.get('next');
    router.push(next && next.startsWith('/') ? next : '/authority/dashboard');
    // The dashboard reads the cookie on the server, so the route has to be
    // re-fetched rather than served from the client cache.
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md">
      <Card
        title="Authority sign in"
        subtitle="For tourism authority staff. Travellers do not need an account."
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ink"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>

          {message !== null && (
            <p role="alert" className="text-sm text-band-high">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-md bg-brand px-4 py-2.5 text-base font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </Card>
    </div>
  );
}
