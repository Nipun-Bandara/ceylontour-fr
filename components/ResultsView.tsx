'use client';

import Link from 'next/link';
import Card from '@/components/Card';
import ResultCard from '@/components/ResultCard';
import { formatDays, formatLkr } from '@/lib/format';
import { interestLabel, monthLabel } from '@/lib/recommend-options';
import { useRecommendation } from '@/lib/recommendation-context';
import type { RecommendRequest } from '@/types/api';

/**
 * The ranked list (F2).
 *
 * Renders whatever `/recommend` already put in context. There is no fetch in
 * here at all, so nothing is requested again on render or on a re-render.
 *
 * Three things can be on screen, and they are not the same thing:
 *   - no search in memory, because the page was opened directly or refreshed
 *   - a search that came back with nothing, because the filters excluded
 *     every destination
 *   - results
 */
export default function ResultsView() {
  const { search } = useRecommendation();

  if (search === null) return <NoSearchYet />;

  const { request, response } = search;
  if (response.results.length === 0) return <NoMatches request={request} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">
          {response.results.length} destination
          {response.results.length === 1 ? '' : 's'} for you
        </h1>
        <RefineLink />
      </div>

      <SearchSummary request={request} />

      <ol className="space-y-4">
        {response.results.map((result, index) => (
          <li key={result.destination_id}>
            <ResultCard rank={index + 1} result={result} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function RefineLink() {
  return (
    <Link
      href="/recommend"
      className="text-sm font-medium text-brand underline underline-offset-2"
    >
      Change my answers
    </Link>
  );
}

/** One line recapping what was asked for, so the ranking has context. */
function SearchSummary({ request }: { request: RecommendRequest }) {
  return (
    <p className="text-sm text-muted">
      {formatLkr(request.budget_lkr)} · {formatDays(request.duration_days)} ·{' '}
      {interestLabel(request.interest)} · {monthLabel(request.travel_month)}
    </p>
  );
}

/**
 * Shown when `/results` is opened directly or refreshed. The search lives in
 * memory only, so there is nothing to show — but a refresh should send the
 * user back to the form rather than quietly re-running their last search.
 */
function NoSearchYet() {
  return (
    <Card title="No search yet">
      <p className="text-sm text-ink">
        Results are not saved when the page reloads. Fill in the form again and
        we will score destinations for you.
      </p>
      <Link
        href="/recommend"
        className="mt-4 inline-block rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Start a search
      </Link>
    </Card>
  );
}

/**
 * The empty state.
 *
 * F2 is explicit that budget and duration are filters applied before scoring —
 * a destination that does not fit is excluded, not given a low score. So an
 * empty list means the filters were too tight, and the only useful thing to
 * say is which one to loosen. The other three answers cannot cause this, so
 * they are not mentioned.
 */
function NoMatches({ request }: { request: RecommendRequest }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">No destinations match</h1>
        <RefineLink />
      </div>

      <Card>
        <p className="text-sm text-ink">
          Nothing fits a budget of{' '}
          <strong className="font-semibold">
            {formatLkr(request.budget_lkr)}
          </strong>{' '}
          over{' '}
          <strong className="font-semibold">
            {formatDays(request.duration_days)}
          </strong>
          . Budget and trip length are filters, so a destination that does not
          fit either one is left out rather than given a low score.
        </p>

        <p className="mt-4 text-sm font-medium text-ink">Two things to try:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
          <li>
            Raise the budget. It is the filter that rules out the most
            destinations.
          </li>
          <li>
            Add a day or two. Some destinations need a minimum stay to be worth
            the journey.
          </li>
        </ul>

        <p className="mt-4 text-sm text-muted">
          Your interest, crowd preference and sustainability weighting change
          the ranking, not which destinations are eligible, so changing those
          will not bring anything back.
        </p>

        <Link
          href="/recommend"
          className="mt-4 inline-block rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Change my answers
        </Link>
      </Card>
    </div>
  );
}
