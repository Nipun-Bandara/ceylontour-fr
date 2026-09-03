/**
 * Where the F6 simulator's three sliders start.
 *
 * ## Why this is here and not on the API
 *
 * The frontend used to expect a `simulation_baseline` on the destination
 * detail, so that "reset returns exactly the original score" was guaranteed by
 * construction: the server would state the starting positions, and the server
 * would score them.
 *
 * The real API does not send one. So the starting positions are derived here
 * from the destination's factors, which means **the guarantee now depends on
 * the backend deriving them the same way.** If it does not, resetting the
 * sliders will land near the original score rather than on it, and F6 asks for
 * exactly on it.
 *
 * The page makes any discrepancy visible rather than hiding it: the "today"
 * figure it shows is `baseline_score` straight from the simulate response, so
 * a mismatch appears as a non-zero delta after a reset instead of quietly
 * looking fine. Raised in `docs/api-contract.md`.
 */

import type { FactorScores, SimulateInputs } from '@/types/api';

export function baselineInputsFrom(factors: FactorScores): SimulateInputs {
  return {
    // The crowd factor scores *quietness* — 96 means almost nobody is there —
    // so the visitor level is its inverse.
    expected_tourists: 100 - factors.crowd,
    // No waste-management column exists in the dataset yet, so this stands on
    // the environmental factor. A proxy, not a measurement.
    waste_management_level: factors.environmental,
    infrastructure_level: factors.infrastructure,
  };
}

/** True when the sliders are back where they started. */
export function isBaseline(
  inputs: SimulateInputs,
  baseline: SimulateInputs
): boolean {
  return (
    inputs.expected_tourists === baseline.expected_tourists &&
    inputs.waste_management_level === baseline.waste_management_level &&
    inputs.infrastructure_level === baseline.infrastructure_level
  );
}
