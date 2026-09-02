import Link from 'next/link';
import PressureBandChip from '@/components/PressureBandChip';
import SimilarityRing from '@/components/SimilarityRing';
import type { Alternative } from '@/types/api';

/**
 * One suggested alternative destination (F5).
 *
 * The whole card is the link, so the tap target on a phone is the card rather
 * than a few words of text. It goes to that destination's risk view, which is
 * where the traveller can see the forecast for themselves instead of taking
 * "more room" on trust.
 */
export default function AlternativeCard({
  alternative,
}: {
  alternative: Alternative;
}) {
  return (
    <Link
      href={`/destination/${alternative.destination_id}/risk`}
      className="block rounded-lg border border-line bg-white p-3 hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
    >
      <div className="flex items-start gap-3">
        <SimilarityRing percent={alternative.similarity_percent} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-ink">{alternative.name}</span>
            <PressureBandChip band={alternative.band} size="sm" />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {alternative.reason}
          </p>
        </div>
      </div>
    </Link>
  );
}
