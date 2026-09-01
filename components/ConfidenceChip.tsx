import type { Confidence } from '@/types/api';

/**
 * Says whether a destination's factor values came from real recorded data or
 * from proxies.
 *
 * Required by the cross-cutting confidence rule: every score carries a
 * `measured` or `estimated` label and it has to be visible, not buried. This
 * is a different thing from F3's exact-versus-estimated *contribution* bars —
 * this one is about the input data, that one is about the explanation.
 */

const LABELS: Record<Confidence, string> = {
  measured: 'Measured',
  estimated: 'Estimated',
};

const DESCRIPTIONS: Record<Confidence, string> = {
  measured: 'Scored from recorded data for this destination.',
  estimated:
    'Scored partly from regional proxy values, because there is no recorded data for this destination.',
};

// Written out in full rather than built from a template, because Tailwind
// scans the source for complete class names and would not find them otherwise.
const STYLES: Record<Confidence, string> = {
  measured: 'bg-confidence-surface-measured text-confidence-measured',
  estimated: 'bg-confidence-surface-estimated text-confidence-estimated',
};

export default function ConfidenceChip({
  confidence,
}: {
  confidence: Confidence;
}) {
  return (
    <span
      title={DESCRIPTIONS[confidence]}
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[confidence]}`}
    >
      {LABELS[confidence]}
      <span className="sr-only"> — {DESCRIPTIONS[confidence]}</span>
    </span>
  );
}
