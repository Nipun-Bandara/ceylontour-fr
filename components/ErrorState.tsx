'use client';

import { isApiError } from '@/lib/api';

interface ErrorStateProps {
  /** Whatever landed in the `catch`. Usually an `ApiError`. */
  error: unknown;
  /** Shown when there is a way to try again. */
  onRetry?: () => void;
  className?: string;
}

/**
 * Reads an unknown thrown value and returns something a traveller can act on.
 *
 * The rule is that a failure never shows a blank screen and never shows a raw
 * stack trace. Anything unrecognised falls through to a generic sentence.
 */
function messageFor(error: unknown): string {
  if (isApiError(error)) return error.message;
  return 'Something went wrong. Please try again.';
}

/** The technical detail, shown small and only when we actually have it. */
function detailFor(error: unknown): string | undefined {
  if (!isApiError(error)) return undefined;
  const status = error.isClientSide ? 'no response' : `HTTP ${error.status}`;
  return `${error.code} · ${status}`;
}

export default function ErrorState({
  error,
  onRetry,
  className = '',
}: ErrorStateProps) {
  const detail = detailFor(error);

  return (
    <div
      role="alert"
      className={`rounded-lg border border-band-high bg-band-surface-high p-4 ${className}`}
    >
      <p className="font-medium text-band-high">Could not load this</p>
      {/* React escapes this. Never swap it for dangerouslySetInnerHTML — the
          message can carry text that came back from the API. */}
      <p className="mt-1 text-sm text-ink">{messageFor(error)}</p>
      {detail !== undefined && (
        <p className="mt-2 font-mono text-xs text-muted">{detail}</p>
      )}
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded border border-band-high px-3 py-1.5 text-sm font-medium text-band-high hover:bg-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}
