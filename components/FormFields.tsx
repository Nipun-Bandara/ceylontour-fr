'use client';

import type { Option } from '@/lib/recommend-options';

/**
 * The two field types the recommendation form needs.
 *
 * Both wire up the same accessibility bits — the label points at the input,
 * `aria-invalid` marks a bad value, and `aria-describedby` ties the message
 * under the field to the input so a screen reader reads them together. Doing
 * it here once means no field can be added later that forgets.
 *
 * `error` is only passed once the field has been touched. The form decides
 * that; these components just render what they are given.
 */

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {hint !== undefined && (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-muted">
          {hint}
        </p>
      )}
      <div className="mt-1">{children}</div>
      {/* Reserved space is not used here on purpose: at 375px an always-present
          empty line under six fields wastes most of a screen. */}
      {error !== undefined && (
        <p id={`${id}-error`} className="mt-1 text-sm text-band-high">
          {error}
        </p>
      )}
    </div>
  );
}

/** Classes shared by the input and the select, so they line up. */
function controlClasses(hasError: boolean): string {
  const base =
    'w-full rounded border bg-white px-3 py-2 text-base text-ink outline-none focus:ring-2 focus:ring-brand';
  return hasError
    ? `${base} border-band-high`
    : `${base} border-line focus:border-brand`;
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [
    hint !== undefined ? `${id}-hint` : undefined,
    error !== undefined ? `${id}-error` : undefined,
  ].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  hint?: string;
  error?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  min,
  max,
  placeholder,
}: NumberFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        name={id}
        // `inputMode="numeric"` gets the number pad on a phone. The type stays
        // `text` so a stray letter is caught by our own validation and shown
        // under the field, instead of the browser silently emptying the value.
        type="text"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClasses(error !== undefined)}
      />
    </FieldShell>
  );
}

interface SelectFieldProps<T extends string | number> {
  id: string;
  label: string;
  value: string;
  options: ReadonlyArray<Option<T>>;
  onChange: (value: string) => void;
  onBlur: () => void;
  /** Shown as the disabled first entry, so nothing is chosen by default. */
  placeholder: string;
  hint?: string;
  error?: string;
}

export function SelectField<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
  onBlur,
  placeholder,
  hint,
  error,
}: SelectFieldProps<T>) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClasses(error !== undefined)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
