/**
 * Client-side validation for the recommendation form.
 *
 * Pure functions with no React in them, so the rules can be read, explained
 * and tested on their own.
 *
 * This does **not** replace server-side validation. F2 requires both, and the
 * server is the one that actually matters — anything here can be bypassed by
 * turning off JavaScript or calling the API directly. What this buys is a
 * clear message under the field instead of a round trip and an error banner.
 */

import {
  CROWD_PREFERENCE_OPTIONS,
  INTEREST_OPTIONS,
  MAX_DURATION_DAYS,
  MIN_DURATION_DAYS,
  MONTH_OPTIONS,
  SUSTAINABILITY_WEIGHT_OPTIONS,
} from '@/lib/recommend-options';
import type {
  CrowdPreference,
  Interest,
  RecommendRequest,
  SustainabilityWeight,
} from '@/types/api';

/**
 * What the form holds while it is being filled in. Every field is a string
 * because that is what an `<input>` and a `<select>` give back; converting to
 * numbers is this module's job, once the value is known to be good.
 */
export interface RecommendFormValues {
  budget_lkr: string;
  duration_days: string;
  interest: string;
  crowd_preference: string;
  sustainability_weight: string;
  travel_month: string;
}

export type RecommendField = keyof RecommendFormValues;

/** One message per invalid field. A field with no entry is valid. */
export type FieldErrors = Partial<Record<RecommendField, string>>;

export const EMPTY_FORM: RecommendFormValues = {
  budget_lkr: '',
  duration_days: '',
  interest: '',
  crowd_preference: '',
  sustainability_weight: '',
  travel_month: '',
};

/**
 * Parses a whole number. Returns `undefined` for anything that is not one, so
 * `"4.5"`, `"1e5"`, `"abc"` and `""` are all rejected rather than being
 * silently coerced the way `Number()` would.
 */
function parseWholeNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : undefined;
}

function isOneOf<T extends string>(
  raw: string,
  options: ReadonlyArray<{ value: T }>
): raw is T {
  return options.some((option) => option.value === raw);
}

function validateBudget(raw: string): string | undefined {
  if (raw.trim() === '') return 'Enter your budget in rupees.';
  const value = parseWholeNumber(raw);
  if (value === undefined) {
    return 'Enter a whole number of rupees, with no letters or symbols.';
  }
  if (value <= 0) return 'Budget must be more than 0.';
  return undefined;
}

function validateDuration(raw: string): string | undefined {
  if (raw.trim() === '') return 'Enter how many days your trip is.';
  const value = parseWholeNumber(raw);
  if (value === undefined) return 'Enter a whole number of days.';
  if (value < MIN_DURATION_DAYS || value > MAX_DURATION_DAYS) {
    return `Trip length must be between ${MIN_DURATION_DAYS} and ${MAX_DURATION_DAYS} days.`;
  }
  return undefined;
}

function validateMonth(raw: string): string | undefined {
  if (raw.trim() === '') return 'Choose the month you plan to travel.';
  const value = parseWholeNumber(raw);
  if (value === undefined || !MONTH_OPTIONS.some((m) => m.value === value)) {
    return 'Choose a month from the list.';
  }
  return undefined;
}

/** Validates every field. An empty object means the form is ready to submit. */
export function validateRecommendForm(
  values: RecommendFormValues
): FieldErrors {
  const errors: FieldErrors = {};

  const budget = validateBudget(values.budget_lkr);
  if (budget) errors.budget_lkr = budget;

  const duration = validateDuration(values.duration_days);
  if (duration) errors.duration_days = duration;

  if (values.interest.trim() === '') {
    errors.interest = 'Choose what you are most interested in.';
  } else if (!isOneOf(values.interest, INTEREST_OPTIONS)) {
    errors.interest = 'Choose an interest from the list.';
  }

  if (values.crowd_preference.trim() === '') {
    errors.crowd_preference = 'Choose how busy you are happy for it to be.';
  } else if (!isOneOf(values.crowd_preference, CROWD_PREFERENCE_OPTIONS)) {
    errors.crowd_preference = 'Choose an option from the list.';
  }

  if (values.sustainability_weight.trim() === '') {
    errors.sustainability_weight =
      'Choose how much sustainability should count.';
  } else if (
    !isOneOf(values.sustainability_weight, SUSTAINABILITY_WEIGHT_OPTIONS)
  ) {
    errors.sustainability_weight = 'Choose an option from the list.';
  }

  const month = validateMonth(values.travel_month);
  if (month) errors.travel_month = month;

  return errors;
}

export function isFormValid(values: RecommendFormValues): boolean {
  return Object.keys(validateRecommendForm(values)).length === 0;
}

/**
 * Converts a validated form into the request body from the contract.
 *
 * Returns `undefined` if the form is not valid, so there is no path where a
 * half-filled form reaches the API. Callers check the result rather than
 * trusting that validation ran first.
 */
export function toRecommendRequest(
  values: RecommendFormValues
): RecommendRequest | undefined {
  if (!isFormValid(values)) return undefined;

  const budget_lkr = parseWholeNumber(values.budget_lkr);
  const duration_days = parseWholeNumber(values.duration_days);
  const travel_month = parseWholeNumber(values.travel_month);
  if (
    budget_lkr === undefined ||
    duration_days === undefined ||
    travel_month === undefined
  ) {
    return undefined;
  }

  return {
    budget_lkr,
    duration_days,
    interest: values.interest as Interest,
    crowd_preference: values.crowd_preference as CrowdPreference,
    sustainability_weight: values.sustainability_weight as SustainabilityWeight,
    travel_month,
  };
}

/** Fills the form back in from a request, so a search can be refined. */
export function fromRecommendRequest(
  request: RecommendRequest
): RecommendFormValues {
  return {
    budget_lkr: String(request.budget_lkr),
    duration_days: String(request.duration_days),
    interest: request.interest,
    crowd_preference: request.crowd_preference,
    sustainability_weight: request.sustainability_weight,
    travel_month: String(request.travel_month),
  };
}
