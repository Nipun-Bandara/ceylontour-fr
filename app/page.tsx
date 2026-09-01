import Link from 'next/link';
import Card from '@/components/Card';
import { isUsingMocks } from '@/lib/api';

/**
 * Placeholder home page. This is not F1 — it exists so the shell has
 * something to render and so `npm run dev` proves the layout, the tokens and
 * the mock switch are wired up. The real home page replaces this.
 */
export default function HomePage() {
  const usingMocks = isUsingMocks();

  return (
    <div className="space-y-4">
      <Card
        title="Skeleton is up"
        subtitle="No feature pages yet. This placeholder gets replaced by F1."
      >
        <p className="text-sm text-ink">
          The app shell, the typed API wrapper in{' '}
          <code className="rounded bg-surface px-1 py-0.5 text-xs">lib/api.ts</code>{' '}
          and the mock responses in{' '}
          <code className="rounded bg-surface px-1 py-0.5 text-xs">
            lib/mocks.ts
          </code>{' '}
          are in place. Pages get built on top of these.
        </p>
        <p className="mt-3 text-sm text-muted">
          Data source:{' '}
          <span className="font-medium text-ink">
            {usingMocks ? 'mock responses, no backend' : 'live API'}
          </span>
        </p>
        {/* Plain link so F2 is reachable. The real call to action arrives
            with F1, which replaces this page. */}
        <Link
          href="/recommend"
          className="mt-4 inline-block rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Find a sustainable destination
        </Link>
      </Card>

      <Card
        title="Pressure bands"
        subtitle="Green, amber and red come from design-tokens.ts. Components never write a hex value."
      >
        <ul className="flex flex-wrap gap-2">
          <li className="rounded-full bg-band-surface-low px-3 py-1 text-sm font-medium text-band-low">
            Low pressure
          </li>
          <li className="rounded-full bg-band-surface-medium px-3 py-1 text-sm font-medium text-band-medium">
            Medium pressure
          </li>
          <li className="rounded-full bg-band-surface-high px-3 py-1 text-sm font-medium text-band-high">
            High pressure
          </li>
        </ul>
      </Card>
    </div>
  );
}
