'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@/lib/session';

/**
 * Ends the session (F8).
 *
 * Clearing the cookie is the whole of logging out — there is nothing in
 * `localStorage` or `sessionStorage` to clear, because the token was never
 * put anywhere a script could reach it.
 */
export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signOut();
        router.push('/authority/login');
        // The dashboard is server rendered from the cookie, so the cached
        // version has to be dropped or the signed-in page would flash back.
        router.refresh();
      }}
      className="text-sm font-medium text-brand underline underline-offset-2 disabled:text-muted"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
