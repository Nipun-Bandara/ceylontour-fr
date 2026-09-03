import Link from 'next/link';
import Card from '@/components/Card';

/**
 * 404. Rendered inside the normal layout, so the header and footer stay put
 * and the page still looks like part of the site rather than a dead end.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl">
      <Card title="We could not find that page">
        <p className="text-sm leading-relaxed text-ink">
          The link may be wrong, or the page may have moved. Nothing is broken —
          this address just does not exist.
        </p>

        <nav aria-label="Where to go instead" className="mt-4">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <li>
              <Link
                href="/"
                className="rounded bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              >
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <Link
                href="/recommend"
                className="font-medium text-brand underline underline-offset-2"
              >
                Find a destination
              </Link>
            </li>
            <li className="flex items-center">
              <Link
                href="/map"
                className="font-medium text-brand underline underline-offset-2"
              >
                Destination map
              </Link>
            </li>
          </ul>
        </nav>
      </Card>
    </div>
  );
}
