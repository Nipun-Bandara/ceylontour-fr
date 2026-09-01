import type { Metadata } from 'next';
import RecommendForm from '@/components/RecommendForm';

export const metadata: Metadata = {
  title: 'Find a destination · CeylonTour',
  description:
    'Tell us your budget, dates and interests, and we will rank Sri Lankan destinations by sustainability.',
};

/** F2 — the recommendation form. */
export default function RecommendPage() {
  return <RecommendForm />;
}
