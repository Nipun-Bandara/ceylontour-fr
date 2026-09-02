import type { Metadata } from 'next';
import MapView from '@/components/MapView';

export const metadata: Metadata = {
  title: 'Destination map · CeylonTour',
  description:
    'Every destination we score, on a map of Sri Lanka, coloured by forecast visitor pressure.',
};

/** F7 — the destination map. */
export default function MapPage() {
  return <MapView />;
}
