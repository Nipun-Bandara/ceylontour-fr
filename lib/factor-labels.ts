/**
 * Friendly names for anything that can appear in an explanation.
 *
 * Two different vocabularies end up in the same panel:
 *
 *   - the five Sustainability Index factors, which produce **exact**
 *     contributions
 *   - the pressure model's features, which produce **estimated** TreeSHAP
 *     contributions
 *
 * Neither should reach a traveller as a snake_case identifier. F3 says the
 * panel has to be readable by someone with no technical background, and
 * `recent_occupancy` is not that.
 */

import type { FactorName } from '@/types/api';

/** Full names, used in the explanation panel where there is room. */
export const FACTOR_LABELS: Record<FactorName, string> = {
  environmental: 'Environment',
  crowd: 'Crowd',
  community: 'Community',
  suitability: 'Suitability',
  infrastructure: 'Infrastructure',
};

/**
 * Abbreviated names for the five-column score row on a result card, where
 * each column is about 60px wide at 375px.
 */
export const FACTOR_SHORT_LABELS: Record<FactorName, string> = {
  environmental: 'Environment',
  crowd: 'Crowd',
  community: 'Community',
  suitability: 'Suitability',
  infrastructure: 'Infra',
};

/**
 * Names for the pressure model's features. These are N's feature names, so
 * this map is the frontend's best guess and needs checking against the model
 * once it lands. Anything not listed falls back to `prettify` below, which
 * degrades to something readable rather than to a crash.
 */
const MODEL_FEATURE_LABELS: Record<string, string> = {
  month: 'Time of year',
  region: 'Region',
  recent_occupancy: 'Recent occupancy',
  arrival_trend: 'Arrival trend',
  holiday_indicator: 'Holiday season',
  forecast_pressure: 'Forecast pressure',
};

/** `recent_occupancy` becomes `Recent occupancy`. */
function prettify(raw: string): string {
  const spaced = raw.replace(/[_-]+/g, ' ').trim();
  if (spaced === '') return raw;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The display name for a contribution's `factor`.
 *
 * Exact contributions are typed as one of the five index factors, so they
 * always hit `FACTOR_LABELS`. Estimated ones are a plain string from the
 * model, so they go through the feature map and then the fallback.
 */
export function contributionLabel(factor: string): string {
  if (factor in FACTOR_LABELS) {
    return FACTOR_LABELS[factor as FactorName];
  }
  return MODEL_FEATURE_LABELS[factor] ?? prettify(factor);
}
