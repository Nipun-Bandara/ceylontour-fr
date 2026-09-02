'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Card from '@/components/Card';
import ErrorState from '@/components/ErrorState';
import ExplanationPanel from '@/components/ExplanationPanel';
import LevelSlider from '@/components/LevelSlider';
import Loading from '@/components/Loading';
import { getDestination, isApiError, postSimulate } from '@/lib/api';
import type {
  DestinationDetailResponse,
  SimulateInputs,
  SimulateResponse,
} from '@/types/api';

/**
 * The what-if simulator (F6).
 *
 * Three sliders, all 0 to 100, starting at the destination's real values. Move
 * one and the index is re-run with the changed numbers.
 *
 * ## Why nothing is calculated here
 *
 * It would be easy to work the new score out in the browser and have it update
 * instantly. That is exactly what must not happen. The weights live in the
 * backend's config and are version tracked there, and a second copy of the
 * index in the frontend would drift from the real one — at which point this
 * page would be confidently showing numbers the actual scorer disagrees with.
 * Every recalculation is a round trip.
 *
 * ## On the 300ms target
 *
 * F6 asks for the score to update within 300ms of a slider moving, and the
 * brief asks for a 200ms debounce. Those two cannot both hold unless the API
 * answers in under 100ms. Against `lib/mocks.ts`, which adds a deliberate
 * 300ms so loading states are visible elsewhere in the app, the settled figure
 * takes roughly 500ms.
 *
 * What is immediate is the *acknowledgement*: the moment a slider moves the
 * displayed score greys out, so the number you are looking at is never
 * silently stale. The settled value follows. See the branch notes.
 */

/** How long to wait after the last slider move before asking the API. */
const DEBOUNCE_MS = 200;

interface SimulatorViewProps {
  /** Straight from the URL, so not yet known to be valid. */
  destinationId: number;
}

export default function SimulatorView({ destinationId }: SimulatorViewProps) {
  const [destination, setDestination] =
    useState<DestinationDetailResponse | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loadingDestination, setLoadingDestination] = useState(true);

  const [inputs, setInputs] = useState<SimulateInputs | null>(null);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [simulateError, setSimulateError] = useState<unknown>(null);

  const loadDestination = useCallback(
    async (signal?: AbortSignal) => {
      setLoadingDestination(true);
      setLoadError(null);
      try {
        const detail = await getDestination(destinationId, { signal });
        if (signal?.aborted) return;
        setDestination(detail);
        setInputs(detail.simulation_baseline);
        setResult(null);
      } catch (caught) {
        if (signal?.aborted) return;
        setLoadError(caught);
      } finally {
        if (!signal?.aborted) setLoadingDestination(false);
      }
    },
    [destinationId]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDestination(controller.signal);
    return () => controller.abort();
  }, [loadDestination]);

  /**
   * Debounced recalculation.
   *
   * The timer restarts on every slider move, so dragging one end to the other
   * makes a single request rather than one per pixel.
   *
   * Out-of-order responses are handled with a sequence number rather than by
   * checking whether this effect's request was aborted. That distinction
   * matters and cost a bug: the first version cleared the pending flag only
   * when its own request had *not* been aborted, so if the newest request was
   * the one that got aborted, nothing was ever left to clear the flag and the
   * score stayed greyed out over a stale number indefinitely.
   *
   * With a sequence number the newest request always owns the final write, in
   * every path, and stale ones write nothing at all. The abort controller is
   * still here, but only to stop real network work — never to decide state.
   */
  const requestSeq = useRef(0);

  useEffect(() => {
    if (inputs === null || destination === null) return;

    const controller = new AbortController();
    const seq = ++requestSeq.current;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await postSimulate(
            { destination_id: destinationId, ...inputs },
            { signal: controller.signal }
          );
          if (seq !== requestSeq.current) return;
          setSimulateError(null);
          setResult(response);
          setPending(false);
        } catch (caught) {
          if (seq !== requestSeq.current) return;
          setSimulateError(caught);
          setPending(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputs, destination, destinationId]);

  const updateInput = (key: keyof SimulateInputs) => (value: number) => {
    // Set immediately so the displayed score greys out on the very first move,
    // rather than after the debounce has elapsed.
    setPending(true);
    setInputs((current) => (current === null ? current : { ...current, [key]: value }));
  };

  const baseline = destination?.simulation_baseline ?? null;

  const reset = () => {
    if (baseline === null) return;
    setPending(true);
    setInputs({ ...baseline });
  };

  const isReset =
    inputs !== null &&
    baseline !== null &&
    inputs.expected_visitor_level === baseline.expected_visitor_level &&
    inputs.waste_management_level === baseline.waste_management_level &&
    inputs.infrastructure_level === baseline.infrastructure_level;

  if (!Number.isInteger(destinationId) || destinationId <= 0) return <NotFound />;

  if (loadingDestination) {
    return (
      <Card title="Loading">
        <Loading lines={5} label="Loading this destination" />
      </Card>
    );
  }

  if (loadError !== null) {
    if (isApiError(loadError) && loadError.status === 404) return <NotFound />;
    return (
      <ErrorState error={loadError} onRetry={() => void loadDestination()} />
    );
  }

  if (destination === null || inputs === null || baseline === null) {
    return <NotFound />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">
          What if: {destination.name}
        </h1>
        <Link
          href={`/destination/${destinationId}/risk`}
          className="text-sm font-medium text-brand underline underline-offset-2"
        >
          See overtourism risk
        </Link>
      </div>

      <Card
        title="Change the numbers"
        subtitle="These start where this destination actually sits today. Move one and the score is worked out again."
      >
        <div className="space-y-5">
          <LevelSlider
            id="expected_visitor_level"
            label="Expected visitors"
            hint="How busy the place is. Higher means more people."
            value={inputs.expected_visitor_level}
            baseline={baseline.expected_visitor_level}
            onChange={updateInput('expected_visitor_level')}
          />
          <LevelSlider
            id="waste_management_level"
            label="Waste management"
            hint="How well waste is collected and dealt with. Higher is better."
            value={inputs.waste_management_level}
            baseline={baseline.waste_management_level}
            onChange={updateInput('waste_management_level')}
          />
          <LevelSlider
            id="infrastructure_level"
            label="Infrastructure"
            hint="Roads, transport and facilities. Higher is better."
            value={inputs.infrastructure_level}
            baseline={baseline.infrastructure_level}
            onChange={updateInput('infrastructure_level')}
          />
        </div>

        <button
          type="button"
          onClick={reset}
          disabled={isReset}
          className="mt-5 w-full rounded-md border border-brand px-4 py-2.5 text-sm font-medium text-brand hover:bg-brand-light disabled:cursor-not-allowed disabled:border-line disabled:text-muted sm:w-auto"
        >
          Reset to today&rsquo;s values
        </button>
      </Card>

      {simulateError !== null && (
        <ErrorState
          error={simulateError}
          onRetry={() => setInputs((current) => (current ? { ...current } : current))}
        />
      )}

      <ScoreComparison
        baselineScore={destination.sustainability_score}
        result={result}
        pending={pending}
      />

      {result !== null && (
        <Card>
          {/*
            The same panel as a result card and the risk view. Every
            contribution here comes from the index rather than a model, so
            every bar is solid — the panel works that out from each bar's own
            `type` without being told.
          */}
          <ExplanationPanel
            heading="What makes up this score?"
            total={result.sustainability_score}
            totalLabel="Sustainability Score"
            contributions={result.contributions}
            explanation={result.explanation}
          />
        </Card>
      )}
    </div>
  );
}

/**
 * Original and simulated score side by side.
 *
 * While a recalculation is in flight the simulated figure is dimmed rather
 * than blanked or replaced by a spinner. Blanking it would make the layout
 * jump on every slider move, and leaving it at full strength would present a
 * stale number as though it were current.
 */
function ScoreComparison({
  baselineScore,
  result,
  pending,
}: {
  baselineScore: number;
  result: SimulateResponse | null;
  pending: boolean;
}) {
  const simulated = result?.sustainability_score ?? baselineScore;
  const delta = result?.delta ?? 0;

  const deltaColour =
    delta < 0 ? 'text-band-high' : delta > 0 ? 'text-band-low' : 'text-muted';

  return (
    <Card>
      <div className="flex items-stretch gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted">Today</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-ink">
            {baselineScore}
          </p>
        </div>

        <div className="flex items-center text-2xl text-line" aria-hidden="true">
          &rarr;
        </div>

        <div className="flex-1">
          <p className="text-xs text-muted">With your changes</p>
          <p
            aria-busy={pending}
            className={`mt-1 text-3xl font-bold tabular-nums transition-colors ${
              pending ? 'text-muted opacity-60' : 'text-brand'
            }`}
          >
            {simulated}
          </p>
        </div>

        <div className="flex-1">
          <p className="text-xs text-muted">Change</p>
          <p
            className={`mt-1 text-3xl font-bold tabular-nums ${
              pending ? 'text-muted opacity-60' : deltaColour
            }`}
          >
            {delta > 0 ? '+' : ''}
            {delta}
          </p>
        </div>
      </div>

      <p className="mt-1 text-xs text-muted" role="status">
        {pending ? 'Working the score out again…' : ' '}
      </p>

      {/*
        F6: a warning when a change costs more than 10 points. The sentence
        comes from the API, which is what knows the weights and can therefore
        say which slider did the damage.
      */}
      {!pending && result?.warning != null && (
        <p className="mt-2 rounded border-l-4 border-band-high bg-band-surface-high p-3 text-sm text-ink">
          {result.warning}
        </p>
      )}
    </Card>
  );
}

function NotFound() {
  return (
    <Card title="Destination not found">
      <p className="text-sm text-ink">
        We have no destination with that id, so there is nothing to simulate.
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
