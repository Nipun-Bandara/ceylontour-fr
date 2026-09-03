'use client';

import { useEffect } from 'react';
import Card from '@/components/Card';

/**
 * The route-level error boundary.
 *
 * Catches anything a page throws during render and shows a page instead of a
 * blank screen — the "never a blank screen" rule applied to the one case the
 * per-component `ErrorState` cannot reach, because a component that threw
 * never got to render its own error state.
 *
 * The header and footer stay, because this boundary sits inside the root
 * layout. A crash on one route should not make the whole site look gone.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production Next replaces the message with a digest, so the console is
    // the only place the real error survives. Worth having during a demo.
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl">
      <Card title="Something went wrong on this page">
        <p className="text-sm leading-relaxed text-ink">
          This is a fault on our side, not something you did. Trying again often
          works; if it does not, the rest of the site is still fine.
        </p>

        {/*
          The digest, not the message. Next strips messages in production
          builds to avoid leaking internals, and the digest is what ties a
          report back to a server log.
        */}
        {error.digest !== undefined && (
          <p className="mt-3 font-mono text-xs text-muted">
            Reference: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          Try again
        </button>
      </Card>
    </div>
  );
}
