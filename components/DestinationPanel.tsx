'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ConfidenceChip from '@/components/ConfidenceChip';
import ErrorState from '@/components/ErrorState';
import Loading from '@/components/Loading';
import PressureBandChip from '@/components/PressureBandChip';
import { getDestination, isApiError } from '@/lib/api';
import type { DestinationDetailResponse } from '@/types/api';

/**
 * The panel that opens when a marker is clicked (F7).
 *
 * `GET /api/destinations` gives the map everything it needs to draw a marker —
 * coordinates, a band, a score — but not the community and environmental
 * figures this panel has to show. Those come from
 * `GET /api/destinations/{id}`, which is why F7 lists both endpoints. It is
 * fetched on click rather than up front, so opening the map does not pull down
 * five destination records nobody has asked to see.
 */
export default function DestinationPanel({
  destinationId,
  onClose,
}: {
  destinationId: number;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<DestinationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const response = await getDestination(destinationId, { signal });
        if (signal?.aborted) return;
        setDetail(response);
      } catch (caught) {
        if (signal?.aborted) return;
        setError(caught);
        setDetail(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [destinationId]
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Escape closes it, which is what a panel over a map should do.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const notFound = isApiError(error) && error.status === 404;

  return (
    /*
      A bottom sheet on a phone and a column beside the map from `lg` up. The
      z-index has to clear Leaflet's own panes and controls, which go up to
      1000; below that the sheet would slide under the map's zoom buttons.
    */
    <aside
      aria-label="Destination details"
      className="fixed inset-x-0 bottom-0 z-[1100] max-h-[65vh] overflow-y-auto rounded-t-xl border-t border-line bg-white p-4 shadow-lg lg:static lg:z-auto lg:max-h-none lg:rounded-lg lg:border lg:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">
          {loading ? 'Loading' : (detail?.name ?? 'Destination')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close destination details"
          className="-m-1 shrink-0 rounded p-1 text-2xl leading-none text-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          &times;
        </button>
      </div>

      <div className="mt-3">
        {loading && <Loading lines={5} label="Loading destination details" />}

        {!loading && notFound && (
          <p className="text-sm text-ink">
            We have no details for that destination.
          </p>
        )}

        {!loading && error !== null && !notFound && (
          <ErrorState error={error} onRetry={() => void load()} />
        )}

        {!loading && error === null && detail !== null && (
          <>
            <p className="text-sm text-muted">
              {detail.district} district &middot; {detail.region}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PressureBandChip band={detail.band} size="sm" />
              <ConfidenceChip confidence={detail.confidence} />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-brand">
                {detail.sustainability_score}
              </span>
              <span className="text-sm text-muted">
                Sustainability Score out of 100
              </span>
            </div>

            {/*
              F7 asks for the community and environmental figures specifically.
              The other three factors are on the destination's own page rather
              than crammed in here.
            */}
            <dl className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded bg-surface p-2">
                <dd className="text-lg font-semibold tabular-nums text-ink">
                  {detail.factors.environmental}
                </dd>
                <dt className="text-xs text-muted">Environment</dt>
              </div>
              <div className="rounded bg-surface p-2">
                <dd className="text-lg font-semibold tabular-nums text-ink">
                  {detail.factors.community}
                </dd>
                <dt className="text-xs text-muted">Community</dt>
              </div>
            </dl>

            <p className="mt-3 text-xs text-muted">
              Source: {detail.source_ref}
            </p>

            <Link
              href={`/destination/${detail.destination_id}/risk`}
              className="mt-4 inline-block rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              See {detail.name} in full
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
