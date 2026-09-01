import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { RecommendationProvider } from '@/lib/recommendation-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'CeylonTour',
  description:
    'Find destinations in Sri Lanka that are good to visit and good for the places you visit.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * Root layout. Header and footer wrap every page, and the main column is
 * capped so long text stays readable on a laptop while still fitting a 375px
 * phone screen.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        {/*
          The provider sits above the router outlet so navigating between
          /recommend and /results does not unmount it. That is what lets the
          results page render the response the form already fetched instead of
          fetching it a second time.
        */}
        <RecommendationProvider>
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
            {children}
          </main>
          <Footer />
        </RecommendationProvider>
      </body>
    </html>
  );
}
