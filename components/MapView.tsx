'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/Card';
import DestinationPanel from '@/components/DestinationPanel';
import ErrorState from '@/components/ErrorState';
import Loading from '@/components/Loading';
import { getDestinations } from '@/lib/api';
import type { DestinationSummary, PressureBand } from '@/types/api';

/**
 * The map page (F7).
 *
 * ## Why the map is loaded this way
 *
 * Leaflet touches `window` the moment it is evaluated, so it cannot be server
 * rendered. `ssr: false` keeps it out of the server bundle entirely, and
 * `next/dynamic` means the ~150KB of map code is a separate chunk that is
 * fetched after the page is already interactive rather than being part of it.
 * That is what F7 means by the map loading without blocking the rest of the
 * page: the heading, the legend and the destination list are usable while the
 * tiles are still on their way.
 */
const DestinationMap = dynamic(
  () => import('@/components/map/DestinationMap'),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

/** Stands in for the map at the same height, so nothing jumps when it lands. */
function MapSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex h-full w-full items-center justify-center rounded-lg border border-line bg-surface"
    >
      <span className="sr-only">Loading the map</span>
      <div className="w-2/3 max-w-xs">
        <Loading lines={3} label="Loading the map" />
      </div>
    </div>
  );
}

const BAND_ORDER: ReadonlyArray<PressureBand> = ['low', 'medium', 'high'];

// Full class names, because Tailwind scans source for complete strings.
const LEGEND_DOT: Record<PressureBand, string> = {
  low: 'bg-band-low',
  medium: 'bg-band-medium',
  high: 'bg-band-high',
};

const LEGEND_LABEL: Record<PressureBand, string> = {
  low: 'Low pressure',
  medium: 'Medium pressure',
  high: 'High pressure',
};

export default function MapView() {
  const [destinations, setDestinations] = useState<DestinationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDestinations({ signal });
      if (signal?.aborted) return;
      setDestinations(response.destinations);
    } catch (caught) {
      if (signal?.aborted) return;
      setError(caught);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const close = useCallback(() => setSelectedId(null), []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Destination map</h1>
        <p className="mt-1 text-sm text-muted">
          Every destination we score, coloured by how busy its region is
          forecast to be. Tap a marker for the detail.
        </p>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {BAND_ORDER.map((band) => (
          <li key={band} className="flex items-center gap-2 text-sm text-ink">
            <span
              aria-hidden="true"
              className={`inline-block h-3 w-3 rounded-full ${LEGEND_DOT[band]}`}
            />
            {LEGEND_LABEL[band]}
          </li>
        ))}
      </ul>

      {error !== null && <ErrorState error={error} onRetry={() => void load()} />}

      <div className="lg:flex lg:items-start lg:gap-4">
        <div className="h-[60vh] min-h-[320px] flex-1 overflow-hidden rounded-lg border border-line lg:h-[70vh]">
          {loading ? (
            <MapSkeleton />
          ) : (
            <DestinationMap
              destinations={destinations}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        {selectedId !== null && (
          <div className="lg:w-80 lg:shrink-0">
            <DestinationPanel
              // Remounts on a different marker, so the panel never shows one
              // destination's name above another's numbers while loading.
              key={selectedId}
              destinationId={selectedId}
              onClose={close}
            />
          </div>
        )}
      </div>

      {/*
        A plain list of the same destinations, underneath the map.
        A map is unusable with a keyboard and a screen reader however carefully
        the markers are labelled, so the same information is reachable without
        one. It also means the page says something useful before the map chunk
        has even arrived.
      */}
      {!loading && destinations.length > 0 && (
        <Card title="All destinations">
          <ul className="divide-y divide-line">
            {destinations.map((destination) => (
              <li key={destination.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(destination.id)}
                  className="flex w-full items-center justify-between gap-3 py-2 text-left hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <span className="font-medium text-ink">
                    {destination.name}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <span className="tabular-nums">
                      {destination.sustainability_score}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`inline-block h-2.5 w-2.5 rounded-full ${LEGEND_DOT[destination.band]}`}
                    />
                    <span className="sr-only">
                      {LEGEND_LABEL[destination.band]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
