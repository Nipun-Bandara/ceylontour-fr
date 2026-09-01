/**
 * Site footer. Team name and the competition note.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Blind Bandits &middot; University of Moratuwa</p>
        <p>Built for CodeSplash &rsquo;26</p>
      </div>
    </footer>
  );
}
