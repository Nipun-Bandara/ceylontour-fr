import type { ReactNode } from 'react';

interface CardProps {
  /** Optional heading. Rendered above the content with a divider. */
  title?: ReactNode;
  /** Optional line under the title, for a caption or a confidence label. */
  subtitle?: ReactNode;
  children: ReactNode;
  /** Extra classes for spacing or width. Do not pass colours — use tokens. */
  className?: string;
}

/**
 * The shared surface every panel in the app sits on, so cards cannot drift
 * apart from each other as pages get added.
 */
export default function Card({
  title,
  subtitle,
  children,
  className = '',
}: CardProps) {
  return (
    <section
      className={`rounded-lg border border-line bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      {title !== undefined && (
        <div className="mb-3 border-b border-line pb-3">
          <h2 className="text-base font-semibold text-ink sm:text-lg">{title}</h2>
          {subtitle !== undefined && (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
