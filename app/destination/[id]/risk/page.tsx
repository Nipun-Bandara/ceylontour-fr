import type { Metadata } from 'next';
import RiskView from '@/components/RiskView';

export const metadata: Metadata = {
  title: 'Overtourism risk · CeylonTour',
  description:
    'Forecast visitor pressure for a Sri Lankan region, and what drives it.',
};

/**
 * F4 — the overtourism risk view.
 *
 * The id arrives from the URL as a string and could be anything. It is parsed
 * here and handed on as a number; `RiskView` decides what to do with one that
 * is not valid, so there is a single place that renders "destination not
 * found" whether the id was nonsense or simply unknown to the API.
 */
export default function RiskPage({ params }: { params: { id: string } }) {
  return <RiskView destinationId={Number.parseInt(params.id, 10)} />;
}
