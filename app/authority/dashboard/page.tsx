import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Card from '@/components/Card';
import DashboardContent from '@/components/DashboardContent';
import SignOutButton from '@/components/SignOutButton';
import { getDashboardSummary, isApiError } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Authority dashboard · CeylonTour',
  description: 'Overview of forecast visitor pressure across monitored regions.',
  robots: { index: false, follow: false },
};

/** Reads a cookie, so it can never be prerendered. */
export const dynamic = 'force-dynamic';

/**
 * F8 — the tourism authority dashboard.
 *
 * A **server** component, and it has to be one. The session token lives in an
 * httpOnly cookie, which means client-side JavaScript cannot read it by
 * design — so the only place that can attach it to a request is the server.
 * The token is read here, used here, and never sent to the browser.
 *
 * Authorisation is the API's decision, not this page's. Middleware has already
 * established that *some* session exists; what that session is allowed to see
 * is answered by `GET /api/dashboard/summary` returning 200, 401 or 403, and
 * each of those is rendered as a page. Nothing here redirects, so there is no
 * way to produce a loop.
 */
export default async function AuthorityDashboardPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;

  // Normally unreachable — middleware redirects a request with no cookie
  // before it gets here — but the page does not assume that.
  if (!token) return <SignedOut />;

  try {
    const summary = await getDashboardSummary(token);

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold text-ink">
            Authority dashboard
          </h1>
          <SignOutButton />
        </div>
        <DashboardContent summary={summary} />
      </div>
    );
  } catch (caught) {
    if (isApiError(caught) && caught.status === 403) return <NoAccess />;
    if (isApiError(caught) && caught.status === 401) return <SignedOut />;

    // Rendered here rather than handed to `ErrorState`, because that is a
    // client component and an ApiError instance does not survive being
    // serialised across the server/client boundary.
    return (
      <Card title="Could not load the dashboard">
        <p className="text-sm text-ink">
          {isApiError(caught)
            ? caught.message
            : 'Something went wrong loading the dashboard.'}
        </p>
        <p className="mt-3 text-sm text-muted">
          Reload the page to try again.
        </p>
      </Card>
    );
  }
}

/**
 * F8: a tourist-role account gets told plainly that it cannot see this, rather
 * than a blank page or a bounce back to a login it has already completed.
 */
function NoAccess() {
  return (
    <Card title="You do not have access to this page">
      <p className="text-sm leading-relaxed text-ink">
        You are signed in, but this dashboard is only for tourism authority
        staff. If you think your account should have access, ask whoever
        administers it.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Back to CeylonTour
        </Link>
        <SignOutButton />
      </div>
    </Card>
  );
}

function SignedOut() {
  return (
    <Card title="Your session has ended">
      <p className="text-sm text-ink">
        Sign in again to see the authority dashboard.
      </p>
      <Link
        href="/authority/login"
        className="mt-4 inline-block rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Sign in
      </Link>
    </Card>
  );
}
