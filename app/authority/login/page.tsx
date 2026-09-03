import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthorityLoginForm from '@/components/AuthorityLoginForm';
import Card from '@/components/Card';
import Loading from '@/components/Loading';

export const metadata: Metadata = {
  title: 'Authority sign in · CeylonTour',
  description: 'Sign in to the CeylonTour tourism authority dashboard.',
  // Nothing here should be indexed.
  robots: { index: false, follow: false },
};

/**
 * F8 — the authority sign-in page.
 *
 * The form reads `?next=` to send an official back to wherever they were
 * headed, which means it uses `useSearchParams` and therefore has to sit
 * inside a Suspense boundary.
 */
export default function AuthorityLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md">
          <Card title="Authority sign in">
            <Loading lines={4} label="Loading the sign-in form" />
          </Card>
        </div>
      }
    >
      <AuthorityLoginForm />
    </Suspense>
  );
}
