import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tourism sustainability · CeylonTour',
  description:
    'What CeylonTour looks at when it scores a destination, and where the figures come from.',
};

/**
 * F1's information page, behind the "Explore Tourism Sustainability" button.
 *
 * Plain language throughout, same as the landing page. This is the page that
 * answers "where did that number come from?", which is the question the whole
 * project is built to be able to answer — so the sources are named, and the
 * gaps in them are admitted rather than glossed over.
 *
 * A server component with no interactive parts, so it costs nothing to load.
 */

/** Listed in the order they carry weight, heaviest first. */
const FACTORS: ReadonlyArray<{ name: string; description: string }> = [
  {
    name: 'The natural surroundings',
    description:
      'The condition of the air, water, forest and coastline around a place, and how much strain it is already under. A destination that is being worn down by the number of people visiting scores lower here.',
  },
  {
    name: 'How crowded it gets',
    description:
      'How many visitors the surrounding region normally receives in a given month, and whether that is close to what it can comfortably hold. Quieter places score higher, and quieter months score higher at the same place.',
  },
  {
    name: 'How much local people gain',
    description:
      'Whether money spent by visitors reaches families living there — guesthouses, guides, drivers, cooks, craftspeople — rather than leaving the area almost entirely.',
  },
  {
    name: 'How well it suits your trip',
    description:
      'Whether the place matches what you told us: the kind of thing you enjoy, how busy you are happy for it to be, and how long you have.',
  },
  {
    name: 'Roads, transport and facilities',
    description:
      'How easy the place is to reach, and what is there when you arrive. This matters, but it counts for the least of the five.',
  },
];

const SOURCES: ReadonlyArray<{
  name: string;
  href: string;
  description: string;
}> = [
  {
    name: 'Sri Lanka Tourism Development Authority',
    href: 'https://www.sltda.gov.lk',
    description:
      'The official statistics on visitor arrivals, hotel occupancy and guest nights, published for each region. This is what tells us how busy a place usually is in a given month.',
  },
  {
    name: 'Open-Meteo',
    href: 'https://open-meteo.com',
    description:
      'Open weather records for each destination, used to work out what conditions to expect at the time of year you are travelling.',
  },
  {
    name: 'OpenAQ',
    href: 'https://openaq.org',
    description:
      'Open air quality readings, where a sensor exists near enough to a destination to be meaningful.',
  },
  {
    name: 'OpenStreetMap',
    href: 'https://www.openstreetmap.org',
    description: 'Locations and maps for each destination.',
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="py-4 sm:py-6">
        <h1 className="text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl">
          Exploring tourism sustainability
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink">
          Sri Lanka has places that are loved almost to breaking point, and
          places nearby that are just as worth seeing and barely visited. Where
          people choose to go changes what happens to both. CeylonTour is an
          attempt to make that choice easier to see.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink">
          For every destination we look at five things. Some of them are about
          you and your trip. Most of them are about the place and the people who
          live there.
        </p>
      </section>

      <section
        aria-labelledby="factors"
        className="border-t border-line py-6 sm:py-8"
      >
        <h2
          id="factors"
          className="text-lg font-semibold text-ink sm:text-xl"
        >
          The five things we look at
        </h2>

        <dl className="mt-4 space-y-5">
          {FACTORS.map((factor) => (
            <div key={factor.name}>
              <dt className="text-base font-medium text-ink">{factor.name}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">
                {factor.description}
              </dd>
            </div>
          ))}
        </dl>

        {/*
          Described in words rather than numbers on purpose. The weights live in
          the backend's config file and are version-tracked there; printing them
          here would create a second copy that could quietly fall out of step
          with the one actually doing the scoring.
        */}
        <p className="mt-6 text-sm leading-relaxed text-ink">
          The five do not count equally. The natural surroundings count for the
          most, then how crowded a place gets, then how much local people gain.
          How well a place suits you, and the state of its facilities, count for
          the least — they matter, but they matter less than whether your visit
          leaves the place better or worse than it found it. The exact balance
          is recorded alongside every result, so any score you are shown can be
          checked again later.
        </p>
      </section>

      <section
        aria-labelledby="sources"
        className="border-t border-line py-6 sm:py-8"
      >
        <h2 id="sources" className="text-lg font-semibold text-ink sm:text-xl">
          Where the data comes from
        </h2>

        <dl className="mt-4 space-y-5">
          {SOURCES.map((source) => (
            <div key={source.name}>
              <dt className="text-base font-medium text-ink">
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand underline underline-offset-2"
                >
                  {source.name}
                </a>
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">
                {source.description}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="honesty"
        className="border-t border-line py-6 sm:py-8"
      >
        <h2 id="honesty" className="text-lg font-semibold text-ink sm:text-xl">
          What we do not know
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          Sensor coverage in Sri Lanka thins out quickly away from the larger
          towns. For some of the smaller places there is no reading at all, and
          we use a figure from the surrounding region instead. Wherever we have
          done that, the result is labelled an estimate rather than a
          measurement, and you will see that label next to the score.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          The forecast of how busy a region will be is exactly that — a
          forecast, worked out from what has happened in previous years. It
          describes a whole region rather than a single site, and it can be
          wrong. Anything we have estimated rather than calculated is marked as
          such wherever it appears.
        </p>
      </section>

      <section className="border-t border-line py-6">
        <Link
          href="/recommend"
          className="inline-block rounded-md bg-brand px-5 py-3 text-base font-medium text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          Find a Sustainable Destination
        </Link>
      </section>
    </div>
  );
}
