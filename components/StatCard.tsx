import type { PressureBand } from '@/types/api';

/**
 * One number and its label, for the row of counts at the top of the dashboard.
 *
 * `band` tints the figure when the card is counting a pressure band, so the
 * four cards read at a glance. The band name is always in the label as words,
 * never signalled by the colour alone.
 */

// Full class names, because Tailwind scans source for complete strings.
const BAND_TEXT: Record<PressureBand, string> = {
  low: 'text-band-low',
  medium: 'text-band-medium',
  high: 'text-band-high',
};

export default function StatCard({
  label,
  value,
  band,
}: {
  label: string;
  value: number;
  /** Omit for a plain count. */
  band?: PressureBand;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <p
        className={`text-3xl font-bold tabular-nums ${band ? BAND_TEXT[band] : 'text-ink'}`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
