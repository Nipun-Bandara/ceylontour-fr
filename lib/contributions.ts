/**
 * Turns the contribution list from the API into the rows the explanation
 * panel draws.
 *
 * Pure functions, no React, so the arithmetic behind the highest-marked part
 * of the project can be read and checked on its own.
 *
 * ## How a percentage becomes a bar length
 *
 * The API gives each contribution a `percent`, and those percentages sum to
 * 100 — they are shares of the *reasons*, not points of the score. But F3
 * requires the bars to visually sum to the **total score**, which for a
 * destination scoring 89 is 89, not 100.
 *
 * So a bar's length is the share of the score it accounts for:
 *
 *     points = percent / 100 × score
 *
 * A destination scoring 89 whose environment contributes 32% gets a bar of
 * 28.5 points. Laid end to end the five bars come to 89, which is what the
 * thin total bar above them shows. Both are drawn on the same 0–100 scale, so
 * the comparison is honest.
 *
 * The label on each bar stays the percentage, because "32% of the reason" is
 * what a traveller can actually act on.
 */

import { contributionLabel } from '@/lib/factor-labels';
import type { Contribution } from '@/types/api';

/**
 * F3: "Top five factors shown, no more. Longer lists stop being explanations."
 */
export const MAX_BARS = 5;

export interface ContributionBar {
  /** Stable key for React, and for the hatch pattern id. */
  key: string;
  /** Friendly name, e.g. `Environment`. */
  label: string;
  /** Share of the reasons, as returned by the API. */
  percent: number;
  /** Share of the total score this accounts for. Drives the bar length. */
  points: number;
  /** Which of the two bar styles to draw. */
  type: Contribution['type'];
}

export interface PreparedExplanation {
  bars: ContributionBar[];
  /** The destination's total Sustainability Score. */
  score: number;
  /** Percentages of the bars actually shown. 100 when nothing was cut. */
  shownPercent: number;
  /** Points of the bars actually shown. Equals `score` when nothing was cut. */
  shownPoints: number;
  /** True when the API sent more than five and the tail was cut. */
  truncated: boolean;
  /** How many were dropped by the top-five rule. */
  hiddenCount: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Sorts high to low, keeps the top five, and works out each bar's length.
 *
 * Ties are broken by the order the API sent them, so a destination with two
 * factors on the same percentage renders the same way on every load instead of
 * swapping places. The sort is written with an explicit index rather than
 * relying on the engine's sort being stable.
 */
export function prepareExplanation(
  contributions: readonly Contribution[],
  score: number
): PreparedExplanation {
  const ordered = contributions
    .map((contribution, index) => ({ contribution, index }))
    .sort((a, b) => {
      const byPercent = b.contribution.percent - a.contribution.percent;
      return byPercent !== 0 ? byPercent : a.index - b.index;
    });

  const kept = ordered.slice(0, MAX_BARS);

  const bars: ContributionBar[] = kept.map(({ contribution, index }) => ({
    // The factor name alone is not guaranteed unique across the two
    // vocabularies, so the index keeps the key stable.
    key: `${contribution.type}-${contribution.factor}-${index}`,
    label: contributionLabel(contribution.factor),
    percent: contribution.percent,
    points: round1((contribution.percent / 100) * score),
    type: contribution.type,
  }));

  const shownPercent = round1(
    bars.reduce((total, bar) => total + bar.percent, 0)
  );
  const shownPoints = round1(bars.reduce((total, bar) => total + bar.points, 0));

  return {
    bars,
    score,
    shownPercent,
    shownPoints,
    truncated: ordered.length > MAX_BARS,
    hiddenCount: Math.max(0, ordered.length - MAX_BARS),
  };
}

/**
 * True when the bars on screen account for the whole score.
 *
 * Normally they do, because the API sends five contributions summing to 100.
 * They will not if the API ever sends more than five, or sends a set that does
 * not sum to 100. The panel says so rather than drawing bars that quietly fail
 * to add up — an explanation that silently loses a chunk of its own score is
 * worse than no explanation.
 *
 * The half-point tolerance absorbs rounding, not a real gap.
 */
export function barsAccountForScore(prepared: PreparedExplanation): boolean {
  return Math.abs(prepared.shownPoints - prepared.score) <= 0.5;
}
