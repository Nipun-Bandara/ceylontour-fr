'use client';

/**
 * One 0-100 slider for the what-if simulator (F6).
 *
 * The current value is shown as a number beside the label, because a slider
 * thumb on its own tells you roughly where you are and nothing more, and the
 * whole point of this page is comparing numbers.
 *
 * `changed` marks a slider that has moved away from where it started, so it is
 * obvious at a glance which of the three is responsible for the score on
 * screen without having to remember what you touched.
 */
export default function LevelSlider({
  id,
  label,
  hint,
  value,
  baseline,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  /** Where this slider started, so a change can be pointed out. */
  baseline: number;
  onChange: (value: number) => void;
}) {
  const changed = value !== baseline;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <span className="text-sm tabular-nums text-ink">
          <span className={changed ? 'font-semibold' : ''}>{value}</span>
          <span className="text-muted"> / 100</span>
        </span>
      </div>

      <p id={`${id}-hint`} className="mt-0.5 text-xs text-muted">
        {hint}
      </p>

      <input
        id={id}
        name={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-describedby={`${id}-hint`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-brand"
      />

      <p className="mt-0.5 text-xs text-muted">
        {changed ? (
          <>
            Started at <span className="tabular-nums">{baseline}</span>
          </>
        ) : (
          <>&nbsp;</>
        )}
      </p>
    </div>
  );
}
