import type { Metadata } from 'next';
import SimulatorView from '@/components/SimulatorView';

export const metadata: Metadata = {
  title: 'What-if simulator · CeylonTour',
  description:
    'See how visitor numbers, waste management and infrastructure change a destination’s sustainability score.',
};

/** F6 — the what-if simulator. */
export default function SimulatePage({ params }: { params: { id: string } }) {
  return <SimulatorView destinationId={Number.parseInt(params.id, 10)} />;
}
