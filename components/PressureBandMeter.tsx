import PressureBandChip, {
  BAND_LABEL,
  BAND_MEANING,
} from '@/components/PressureBandChip';
import type { PressureBand } from '@/types/api';

/**
 * The traffic-light band for a pressure forecast (F4).
 *
 * Green for low, amber for medium, red for high, with the predicted pressure
 * shown as a percentage on the meter and the band named in words.
 *
 * The band name is text, not just a colour, for the same reason F3's bars are
 * hatched rather than only tinted: red and green are the single most common
 * pair to confuse, and a traveller who cannot tell them apart still has to be
 * able to read this. Anyone who cannot see the colour reads "High pressure";
 * anyone who cannot see the meter reads "84%".
 */

// Written out in full because Tailwind scans source for complete class names
// and would not find them if they were built from a template.
const BAND_FILL: Record<PressureBand, string> = {
  low: 'bg-band-low',
  medium: 'bg-band-medium',
  high: 'bg-band-high',
};

const BAND_TEXT: Record<PressureBand, string> = {
  low: 'text-band-low',
  medium: 'text-band-medium',
  high: 'text-band-high',
};

/**
 * Below this the filled part of the meter is too narrow to hold its own label,
 * so the percentage is printed just past the end of the fill instead.
 */
const INSIDE_LABEL_MIN = 22;

export default function PressureBandMeter({
  band,
  pressure,
}: {
  band: PressureBand;
  /** Predicted occupancy rate, 0 to 100. */
  pressure: number;
}) {
  const clamped = Math.min(100, Math.max(0, pressure));
  const labelInside = clamped >= INSIDE_LABEL_MIN;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <PressureBandChip band={band} />
        <span className="text-sm text-muted">
          {clamped}% forecast occupancy
        </span>
      </div>

      {/*
        One accessible statement for the whole meter. The bar itself is hidden
        from screen readers because reading out a decorative track and a fill
        adds nothing to the sentence already above it.
      */}
      <div
        className="mt-2"
        role="img"
        aria-label={`${BAND_LABEL[band]}: ${clamped}% forecast occupancy. ${BAND_MEANING[band]}`}
      >
        <div
          aria-hidden="true"
          className="relative h-7 w-full overflow-hidden rounded bg-line"
        >
          <div
            className={`flex h-full items-center justify-end rounded-l ${BAND_FILL[band]}`}
            style={{ width: `${clamped}%` }}
          >
            {labelInside && (
              <span className="px-2 text-sm font-semibold tabular-nums text-white">
                {clamped}%
              </span>
            )}
          </div>
          {!labelInside && (
            <span
              className={`absolute inset-y-0 flex items-center px-2 text-sm font-semibold tabular-nums ${BAND_TEXT[band]}`}
              style={{ left: `${clamped}%` }}
            >
              {clamped}%
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-ink">{BAND_MEANING[band]}</p>
    </div>
  );
}
