'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import Card from '@/components/Card';
import ErrorState from '@/components/ErrorState';
import { NumberField, SelectField } from '@/components/FormFields';
import Loading from '@/components/Loading';
import { postRecommend } from '@/lib/api';
import {
  CROWD_PREFERENCE_OPTIONS,
  INTEREST_OPTIONS,
  MAX_DURATION_DAYS,
  MIN_DURATION_DAYS,
  MONTH_OPTIONS,
  SUSTAINABILITY_WEIGHT_OPTIONS,
} from '@/lib/recommend-options';
import { useRecommendation } from '@/lib/recommendation-context';
import {
  EMPTY_FORM,
  fromRecommendRequest,
  toRecommendRequest,
  validateRecommendForm,
  type RecommendField,
  type RecommendFormValues,
} from '@/lib/validate-recommend';
import type { RecommendRequest } from '@/types/api';

type TouchedFields = Partial<Record<RecommendField, boolean>>;

/**
 * The recommendation form (F2).
 *
 * Validation runs on every keystroke so the submit button can be disabled
 * until the whole form is good, but a message only appears under a field once
 * that field has been touched — otherwise the form would open covered in red
 * before anything had been typed.
 *
 * On success the response is put in context and the user is sent to
 * `/results`. The results page renders what is already in memory, so it does
 * not fetch again.
 */
export default function RecommendForm() {
  const router = useRouter();
  const { search, saveSearch } = useRecommendation();

  // Refining an earlier search reopens the form with the same answers.
  const [values, setValues] = useState<RecommendFormValues>(() =>
    search ? fromRecommendRequest(search.request) : EMPTY_FORM
  );
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const errors = validateRecommendForm(values);
  const isValid = Object.keys(errors).length === 0;

  /** The message for a field, or undefined until that field is touched. */
  const messageFor = (field: RecommendField): string | undefined =>
    touched[field] ? errors[field] : undefined;

  const update = (field: RecommendField) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const markTouched = (field: RecommendField) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const runSearch = useCallback(
    async (request: RecommendRequest) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await postRecommend(request);
        saveSearch({ request, response });
        router.push('/results');
      } catch (caught) {
        // Stay on this page and show the error. The user keeps their answers
        // and can either retry or change something.
        setError(caught);
        setSubmitting(false);
      }
      // No `setSubmitting(false)` on success: the skeleton stays up until the
      // route changes, so the finished form does not flash back into view.
    },
    [router, saveSearch]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request = toRecommendRequest(values);
    // Cannot normally happen — submit is disabled while invalid — but the
    // conversion is the only thing allowed to decide what reaches the API.
    if (!request) {
      setTouched({
        budget_lkr: true,
        duration_days: true,
        interest: true,
        crowd_preference: true,
        sustainability_weight: true,
        travel_month: true,
      });
      return;
    }
    void runSearch(request);
  };

  const handleRetry = () => {
    const request = toRecommendRequest(values);
    if (request) void runSearch(request);
  };

  if (submitting) {
    return (
      <Card title="Scoring destinations">
        <Loading lines={5} label="Scoring destinations against your answers" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error !== null && <ErrorState error={error} onRetry={handleRetry} />}

      <Card
        title="Find a sustainable destination"
        subtitle="Answer these and we will rank destinations and show why each one scored the way it did."
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <NumberField
            id="budget_lkr"
            label="Budget"
            hint="Total for the trip, in Sri Lankan rupees."
            placeholder="50000"
            value={values.budget_lkr}
            onChange={update('budget_lkr')}
            onBlur={markTouched('budget_lkr')}
            error={messageFor('budget_lkr')}
            min={1}
          />

          <NumberField
            id="duration_days"
            label="Trip length"
            hint={`How many days, from ${MIN_DURATION_DAYS} to ${MAX_DURATION_DAYS}.`}
            placeholder="4"
            value={values.duration_days}
            onChange={update('duration_days')}
            onBlur={markTouched('duration_days')}
            error={messageFor('duration_days')}
            min={MIN_DURATION_DAYS}
            max={MAX_DURATION_DAYS}
          />

          <SelectField
            id="interest"
            label="Main interest"
            placeholder="Choose an interest"
            options={INTEREST_OPTIONS}
            value={values.interest}
            onChange={update('interest')}
            onBlur={markTouched('interest')}
            error={messageFor('interest')}
          />

          <SelectField
            id="crowd_preference"
            label="Crowd preference"
            placeholder="Choose how busy you want it"
            options={CROWD_PREFERENCE_OPTIONS}
            value={values.crowd_preference}
            onChange={update('crowd_preference')}
            onBlur={markTouched('crowd_preference')}
            error={messageFor('crowd_preference')}
          />

          <SelectField
            id="sustainability_weight"
            label="How much should sustainability count?"
            hint="This shifts the balance between sustainability and personal fit."
            placeholder="Choose a weighting"
            options={SUSTAINABILITY_WEIGHT_OPTIONS}
            value={values.sustainability_weight}
            onChange={update('sustainability_weight')}
            onBlur={markTouched('sustainability_weight')}
            error={messageFor('sustainability_weight')}
          />

          <SelectField
            id="travel_month"
            label="Travel month"
            placeholder="Choose a month"
            options={MONTH_OPTIONS}
            value={values.travel_month}
            onChange={update('travel_month')}
            onBlur={markTouched('travel_month')}
            error={messageFor('travel_month')}
          />

          <button
            type="submit"
            disabled={!isValid}
            className="w-full rounded bg-brand px-4 py-2.5 text-base font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
          >
            Find destinations
          </button>

          {!isValid && (
            <p className="text-center text-xs text-muted" role="status">
              Fill in every field to continue.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
