import Link from 'next/link';

/**
 * Site header. Just the project name for now — navigation gets added when
 * there are pages to navigate to.
 */
export default function Header() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-brand sm:text-xl"
        >
          CeylonTour
        </Link>
        <span className="text-xs text-muted sm:text-sm">
          Travel Sri Lanka sustainably
        </span>
      </div>
    </header>
  );
}
