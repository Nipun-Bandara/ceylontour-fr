import type { Metadata } from 'next';
import ResultsView from '@/components/ResultsView';

export const metadata: Metadata = {
  title: 'Your destinations · CeylonTour',
  description: 'Destinations ranked by their Sustainability Score.',
};

/** F2 — the ranked list. Renders what the form already fetched. */
export default function ResultsPage() {
  return <ResultsView />;
}
