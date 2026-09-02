import type { PressureBand } from '@/types/api';

/**
 * The traffic-light band as a small chip.
 *
 * Pulled out of `PressureBandMeter` so the meter on a risk view and the chips
 * on alternative cards cannot end up naming or colouring a band differently.
 * The band is always spelled out in words, never signalled by colour alone —
 * red and green are the commonest pair to confuse, and every one of these has
 * to be readable without seeing the difference.
 */

export const BAND_LABEL: Record<PressureBand, string> = {
  low: 'Low pressure',
  medium: 'Medium pressure',
  high: 'High pressure',
};

export const BAND_MEANING: Record<PressureBand, string> = {
  low: 'Quiet. This region is well below its usual visitor levels this month.',
  medium:
    'Busy but manageable. This region is around its usual visitor levels this month.',
  high: 'Crowded. This region is close to or above its usual capacity this month.',
};

// Written out in full because Tailwind scans source for complete class names
// and would not find them if they were built from a template.
const BAND_CHIP: Record<PressureBand, string> = {
  low: 'bg-band-surface-low text-band-low',
  medium: 'bg-band-surface-medium text-band-medium',
  high: 'bg-band-surface-high text-band-high',
};

export default function PressureBandChip({
  band,
  size = 'base',
}: {
  band: PressureBand;
  /** `sm` for the alternative cards, where space is tighter. */
  size?: 'sm' | 'base';
}) {
  const sizing =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold ${sizing} ${BAND_CHIP[band]}`}
    >
      {BAND_LABEL[band]}
    </span>
  );
}
