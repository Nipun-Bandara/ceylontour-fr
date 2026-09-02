import Link from 'next/link';
import { isUsingMocks } from '@/lib/api';

/**
 * F1 — the landing page.
 *
 * Deliberately a server component with no interactive parts, so the page ships
 * no JavaScript of its own and there is nothing to wait for. No images, no
 * video, no animation: the whole thing is text and CSS, which is the simplest
 * way to meet the two-second budget rather than something to optimise later.
 *
 * The one-sentence description is the heading, and it avoids the vocabulary
 * the rest of the project runs on. No "index", no "model", no "XAI", no
 * "SHAP". Someone who has never heard any of those words should be able to
 * read this page and know what the system is for.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="py-6 sm:py-10">
        <h1 className="text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-4xl sm:leading-tight">
          Find places to visit in Sri Lanka that are good for you and good for
          the country.
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Tell us your budget, how long you have and what you enjoy. We suggest
          destinations that fit, and show you the reasons behind every
          suggestion so you can judge them yourself.
        </p>

        {/*
          Stacked on a phone and side by side from `sm` up. Both are full-width
          targets at 375px rather than two narrow buttons squeezed onto one row.
        */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/recommend"
            className="rounded-md bg-brand px-5 py-3 text-center text-base font-medium text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            Find a Sustainable Destination
          </Link>
          <Link
            href="/about"
            className="rounded-md border border-brand px-5 py-3 text-center text-base font-medium text-brand hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            Explore Tourism Sustainability
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="how-it-works"
        className="border-t border-line py-6 sm:py-8"
      >
        <h2 id="how-it-works" className="sr-only">
          How CeylonTour works
        </h2>

        <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          <div>
            <h3 className="text-sm font-semibold text-ink">What we score</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Five things about every destination: its natural surroundings, how
              crowded it gets, how much local families gain from visitors, how
              well it fits your trip, and the state of its roads and facilities.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">
              Why we explain it
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Every suggestion comes with the reasons behind it, and we say
              which reasons are worked out exactly and which are an informed
              guess. You should not have to take a number on trust.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">
              Where the data comes from
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Official Sri Lankan tourism statistics, alongside open weather and
              air quality records. Where a figure is an estimate rather than a
              measurement, we label it.
            </p>
          </div>
        </div>
      </section>

      {/*
        Only rendered when the build is serving mock data, so it disappears
        entirely in a real deployment. It is here so nobody demonstrates sample
        numbers believing they are real ones.
      */}
      {isUsingMocks() && (
        <p className="border-t border-line pt-4 text-xs text-muted">
          This build is running on sample data, not live figures.
        </p>
      )}
    </div>
  );
}
