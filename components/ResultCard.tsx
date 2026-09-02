import Link from 'next/link';
import Card from '@/components/Card';
import ConfidenceChip from '@/components/ConfidenceChip';
import ExplanationPanel from '@/components/ExplanationPanel';
import FactorScoreRow from '@/components/FactorScoreRow';
import type { Recommendation } from '@/types/api';

/**
 * One destination in the ranked list (F2).
 *
 * Shows the rank, the name, the total Sustainability Score as the biggest
 * thing on the card, the five factor scores behind it, and whether those
 * values were measured or estimated.
 *
 * The card stacks on a phone: at 375px the header row keeps the name and the
 * score side by side, and everything below is full width.
 */
export default function ResultCard({
  rank,
  result,
}: {
  rank: number;
  result: Recommendation;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand"
              aria-hidden="true"
            >
              {rank}
            </span>
            <h3 className="truncate text-lg font-semibold text-ink">
              <span className="sr-only">Ranked {rank}: </span>
              {result.name}
            </h3>
          </div>
          <div className="mt-2">
            <ConfidenceChip confidence={result.confidence} />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-3xl font-bold leading-none tabular-nums text-brand">
            {result.sustainability_score}
          </p>
          <p className="mt-1 text-[11px] leading-tight text-muted">
            Sustainability
            <br />
            Score
          </p>
        </div>
      </div>

      <div className="mt-4">
        <FactorScoreRow factors={result.factors} />
      </div>

      {/* F3. No result is shown without a reason. */}
      <div className="mt-4">
        <ExplanationPanel
          heading="Why was this recommended?"
          total={result.sustainability_score}
          totalLabel="Sustainability Score"
          contributions={result.contributions}
          explanation={result.explanation}
        />
      </div>

      {/* F4 is reachable from here as well as by URL. */}
      <div className="mt-3">
        <Link
          href={`/destination/${result.destination_id}/risk`}
          className="text-sm font-medium text-brand underline underline-offset-2"
        >
          See overtourism risk for {result.name}
        </Link>
      </div>
    </Card>
  );
}
