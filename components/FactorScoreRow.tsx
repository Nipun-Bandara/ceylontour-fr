import type { FactorName, FactorScores } from '@/types/api';

/**
 * The five factor scores behind a Sustainability Score, as a small labelled
 * row. F2 requires all five to be shown, not just the total.
 *
 * Ordered by their base weight in the index — environmental 0.30, crowd 0.25,
 * community 0.20, suitability 0.15, infrastructure 0.10 — so the factor that
 * moves the score most is read first. The weights themselves live in the
 * backend's config and are not repeated here; this is only the display order.
 */
const FACTOR_ORDER: ReadonlyArray<{ key: FactorName; label: string }> = [
  { key: 'environmental', label: 'Environment' },
  { key: 'crowd', label: 'Crowd' },
  { key: 'community', label: 'Community' },
  { key: 'suitability', label: 'Suitability' },
  { key: 'infrastructure', label: 'Infra' },
];

export default function FactorScoreRow({ factors }: { factors: FactorScores }) {
  return (
    <dl className="grid grid-cols-5 gap-1 text-center">
      {FACTOR_ORDER.map(({ key, label }) => (
        <div key={key} className="rounded bg-surface px-1 py-1.5">
          <dd className="text-sm font-semibold tabular-nums text-ink">
            {factors[key]}
          </dd>
          <dt className="mt-0.5 text-[11px] leading-tight text-muted">
            {label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
