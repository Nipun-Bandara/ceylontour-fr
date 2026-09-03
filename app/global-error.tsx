'use client';

/**
 * The last-resort error boundary.
 *
 * `app/error.tsx` catches anything a page throws, but it renders *inside* the
 * root layout — so if the layout itself throws, there is nothing left to catch
 * it. This one replaces the whole document, which is why it has to supply its
 * own `<html>` and `<body>`.
 *
 * It also cannot rely on the app's components or Tailwind, for the same
 * reason: whatever broke may be the thing that would have loaded them. The
 * styles here are inline and the markup is plain. This is the one file in the
 * project that is allowed raw colour values, because a token import is exactly
 * the kind of thing that might be unavailable at this point — the values are
 * copied from `design-tokens.ts` and only need to be roughly right.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <main style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.25rem', margin: '0 0 0.75rem' }}>
            CeylonTour could not load
          </h1>
          <p style={{ margin: '0 0 1rem', lineHeight: 1.6 }}>
            Something failed before the page could start. This is a fault on our
            side. Reloading usually fixes it.
          </p>
          {error.digest !== undefined && (
            <p
              style={{
                margin: '0 0 1rem',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#065f46',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.65rem 1.1rem',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
