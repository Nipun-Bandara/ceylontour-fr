/**
 * The choices offered by the recommendation form.
 *
 * One place for the option lists, so the form, the validation and any future
 * summary of the search all agree on what is allowed and what each value is
 * called on screen. Values come from `types/api.ts`; only the labels live here.
 */

import type {
  CrowdPreference,
  Interest,
  SustainabilityWeight,
} from '@/types/api';

export interface Option<T> {
  value: T;
  label: string;
}

export const INTEREST_OPTIONS: ReadonlyArray<Option<Interest>> = [
  { value: 'nature', label: 'Nature' },
  { value: 'culture', label: 'Culture' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'beach', label: 'Beach' },
  { value: 'wildlife', label: 'Wildlife' },
];

export const CROWD_PREFERENCE_OPTIONS: ReadonlyArray<Option<CrowdPreference>> = [
  { value: 'low', label: 'Quiet — I would rather avoid crowds' },
  { value: 'medium', label: 'Medium — some other visitors is fine' },
  { value: 'high', label: 'Busy — I do not mind crowds' },
];

export const SUSTAINABILITY_WEIGHT_OPTIONS: ReadonlyArray<
  Option<SustainabilityWeight>
> = [
  { value: 'low', label: 'Low — focus on what suits me' },
  { value: 'medium', label: 'Medium — balance the two' },
  { value: 'high', label: 'High — favour sustainable destinations' },
];

export const MONTH_OPTIONS: ReadonlyArray<Option<number>> = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

/** Smallest and largest trip length the form accepts, in days. */
export const MIN_DURATION_DAYS = 1;
export const MAX_DURATION_DAYS = 30;

/** Looks up a month name for display. Falls back to the number. */
export function monthLabel(month: number): string {
  return MONTH_OPTIONS.find((m) => m.value === month)?.label ?? String(month);
}

/** Looks up an interest's display label. Falls back to the raw value. */
export function interestLabel(interest: Interest): string {
  return INTEREST_OPTIONS.find((i) => i.value === interest)?.label ?? interest;
}
