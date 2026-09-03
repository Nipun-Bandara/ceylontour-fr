'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import AlternativeCard from '@/components/AlternativeCard';
import ErrorState from '@/components/ErrorState';
import Loading from '@/components/Loading';
import { getAlternatives } from '@/lib/api';
import { monthLabel } from '@/lib/recommend-options';
import type {
  AlternativesResponse,
  PressureBand,
  TravelMonth,
} from '@/types/api';

/**
 * F5 — the warning and the alternatives that go with it.
 *
 * This is the piece that joins the two AI features together. Without it the
 * recommendation engine and the pressure model sit side by side doing nothing
 * for each other, which is the thing the proposal claims they do.
 *
 * Rendered by both the result card and the risk view, so the two cannot drift
 * apart in what they warn about or how they word it. It draws nothing at all
 * unless the forecast band is `high`.
 *
 * The traveller's budget and trip length are passed through to the endpoint.
 * F5 is explicit that an alternative outside the filters they already set is
 * not an acceptable suggestion, and the endpoint cannot honour a filter it was
 * never told about. When there is no search behind the page — a risk view
 * opened straight from a link — they are simply left off.
 */
interface HighPressureAlternativesProps {
  destinationId: number;
  destinationName: string;
  band: PressureBand;
  month: TravelMonth;
  budgetLkr?: number;
  durationDays?: number;
}

export default function HighPressureAlternatives({
  destinationId,
  destinationName,
  band,
  month,
  budgetLkr,
  durationDays,
}: HighPressureAlternativesProps) {
  const headingId = `alternatives-${useId().replace(/:/g, '')}`;

  const [result, setResult] = useState<AlternativesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const isHigh = band === 'high';

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAlternatives(
          destinationId,
          { budget_lkr: budgetLkr, duration_days: durationDays },
          { signal }
        );
        if (signal?.aborted) return;
        setResult(response);
      } catch (caught) {
        if (signal?.aborted) return;
        setError(caught);
        setResult(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [destinationId, budgetLkr, durationDays]
  );

  useEffect(() => {
    // Nothing is fetched for a destination that is not under high pressure.
    // There is no warning to show, so there is no reason to ask.
    if (!isHigh) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [isHigh, load]);

  if (!isHigh) return null;

  const alternatives = result?.alternatives ?? [];
  const hasAlternatives = alternatives.length > 0;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-band-high bg-band-surface-high p-3"
    >
      <h4 id={headingId} className="text-sm font-semibold text-band-high">
        This destination is under high visitor pressure in {monthLabel(month)}.
        {/*
          The second sentence is a promise, so it is only made once we know
          there is something to show. Printing "here are similar places" above
          a message explaining that there are none would be worse than saying
          nothing.
        */}
        {hasAlternatives && ' Here are similar places with more room.'}
      </h4>

      <div className="mt-3">
        {loading && (
          <Loading
            lines={3}
            label={`Looking for quieter places like ${destinationName}`}
          />
        )}

        {!loading && error !== null && (
          <ErrorState error={error} onRetry={() => void load()} />
        )}

        {!loading && error === null && hasAlternatives && (
          <ul className="space-y-2">
            {alternatives.map((alternative) => (
              <li key={alternative.destination_id}>
                <AlternativeCard alternative={alternative} />
              </li>
            ))}
          </ul>
        )}

        {/*
          F5 requires that the case with no good match says so rather than
          padding the list out with a bad one. The sentence comes from the API,
          because the API is what knows why the list came back empty.
        */}
        {!loading && error === null && !hasAlternatives && (
          <p className="rounded border border-line bg-white p-3 text-sm leading-relaxed text-ink">
            {result?.message ??
              `We could not find a quieter destination comparable to ${destinationName} for ${monthLabel(month)}.`}
          </p>
        )}
      </div>
    </section>
  );
}
