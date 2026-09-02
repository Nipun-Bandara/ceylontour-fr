'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/Card';
import ErrorState from '@/components/ErrorState';
import ExplanationPanel from '@/components/ExplanationPanel';
import Loading from '@/components/Loading';
import PressureBandMeter from '@/components/PressureBandMeter';
import { getRisk, isApiError } from '@/lib/api';
import { MONTH_OPTIONS, monthLabel } from '@/lib/recommend-options';
import { useRecommendation } from '@/lib/recommendation-context';
import type { ApiMeta, RiskResponse, TravelMonth } from '@/types/api';

/**
 * The overtourism risk view (F4).
 *
 * Fetches the forecast for one destination and one month, and refetches when
 * the month changes. Unlike `/results`, which renders what the form already
 * fetched, this page owns its own request — it can be opened directly from a
 * link or a URL with nothing in memory behind it.
 */

/** Calendar month, 1-12, as the API expects it. */
function currentMonth(): TravelMonth {
  return new Date().getMonth() + 1;
}

interface RiskViewProps {
  /** Straight from the URL, so it has not been validated yet. */
  destinationId: number;
}

export default function RiskView({ destinationId }: RiskViewProps) {
  const { search } = useRecommendation();

  // Open on the month they were planning for, if they came from a search.
  // Otherwise the month it is now.
  const [month, setMonth] = useState<TravelMonth>(
    () => search?.request.travel_month ?? currentMonth()
  );

  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(
    async (forMonth: TravelMonth, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const envelope = await getRisk(destinationId, forMonth, { signal });
        if (signal?.aborted) return;
        setRisk(envelope.data);
        setMeta(envelope.meta);
      } catch (caught) {
        // An abort is this component tidying up after itself, not a failure
        // the user should be told about.
        if (signal?.aborted) return;
        setError(caught);
        setRisk(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [destinationId]
  );

  useEffect(() => {
    // A month change while a request is still in flight would otherwise race,
    // and the slower response could overwrite the newer one.
    const controller = new AbortController();
    void load(month, controller.signal);
    return () => controller.abort();
  }, [load, month]);

  // An id that is not a number never reaches the API at all.
  if (!Number.isInteger(destinationId) || destinationId <= 0) {
    return <NotFound />;
  }

  const notFound = isApiError(error) && error.status === 404;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">
          Overtourism risk
          {risk !== null && `: ${risk.name}`}
        </h1>
        <Link
          href="/results"
          className="text-sm font-medium text-brand underline underline-offset-2"
        >
          Back to results
        </Link>
      </div>

      {notFound ? (
        <NotFound />
      ) : (
        <>
          <Card>
            <MonthSelector month={month} onChange={setMonth} />
          </Card>

          {loading && (
            <Card title={`Forecasting ${monthLabel(month)}`}>
              <Loading
                lines={4}
                label={`Loading the pressure forecast for ${monthLabel(month)}`}
              />
            </Card>
          )}

          {!loading && error !== null && (
            <ErrorState error={error} onRetry={() => void load(month)} />
          )}

          {!loading && error === null && risk !== null && (
            <RiskDetail risk={risk} meta={meta} />
          )}
        </>
      )}
    </div>
  );
}

function MonthSelector({
  month,
  onChange,
}: {
  month: TravelMonth;
  onChange: (month: TravelMonth) => void;
}) {
  return (
    <div>
      <label
        htmlFor="risk-month"
        className="block text-sm font-medium text-ink"
      >
        Travel month
      </label>
      <p id="risk-month-hint" className="mt-0.5 text-xs text-muted">
        Pressure is seasonal, so the forecast changes with the month.
      </p>
      <select
        id="risk-month"
        name="risk-month"
        value={String(month)}
        aria-describedby="risk-month-hint"
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand sm:w-64"
      >
        {MONTH_OPTIONS.map((option) => (
          <option key={option.value} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RiskDetail({
  risk,
  meta,
}: {
  risk: RiskResponse;
  meta: ApiMeta | null;
}) {
  return (
    <>
      <Card
        title={`${risk.name} in ${monthLabel(risk.month)}`}
        subtitle={`Forecast for the ${risk.region} region`}
      >
        <PressureBandMeter band={risk.band} pressure={risk.predicted_pressure} />

        {/*
          F4: the response has to state that this is a regional indicator, not
          a per-site measurement. The sentence is served, never written here —
          if the backend stops sending it the line disappears rather than the
          app going on making a claim the data does not support.
        */}
        {risk.scope.trim() !== '' && (
          <p className="mt-4 rounded border-l-4 border-line bg-surface p-3 text-sm text-ink">
            {risk.scope}
          </p>
        )}
      </Card>

      <Card>
        {/*
          The same panel F3 uses on a result card. Every contribution here is a
          TreeSHAP value, so every bar comes out hatched and outlined without
          the panel needing to be told — it reads each bar's own `type`.
        */}
        <ExplanationPanel
          heading="Why is pressure at this level?"
          total={risk.predicted_pressure}
          totalLabel="Forecast pressure"
          contributions={risk.contributions}
          explanation={risk.explanation}
        />
      </Card>

      {meta !== null && (
        <p className="text-xs text-muted">
          Forecast produced by model{' '}
          <span className="font-mono">{meta.model_version}</span>. Quote this
          version when checking a number later.
        </p>
      )}
    </>
  );
}

function NotFound() {
  return (
    <Card title="Destination not found">
      <p className="text-sm text-ink">
        We have no destination with that id, so there is no pressure forecast to
        show. It may have been removed, or the link may be wrong.
      </p>
      <Link
        href="/recommend"
        className="mt-4 inline-block rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Find a destination
      </Link>
    </Card>
  );
}
