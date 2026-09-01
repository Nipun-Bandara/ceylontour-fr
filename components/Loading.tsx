interface LoadingProps {
  /** How many placeholder lines to draw. */
  lines?: number;
  /** Announced to screen readers while the request is in flight. */
  label?: string;
  className?: string;
}

/**
 * Loading skeleton. Grey blocks roughly the shape of the content that is
 * coming, rather than a spinner, so the page does not jump when data lands.
 *
 * `aria-busy` plus the visually hidden label means a screen reader says
 * something useful instead of reading out five empty divs.
 */
export default function Loading({
  lines = 3,
  label = 'Loading',
  className = '',
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`animate-pulse space-y-3 ${className}`}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-4 rounded bg-line"
          // The last line is short, the way a real paragraph ends.
          style={{ width: index === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}
