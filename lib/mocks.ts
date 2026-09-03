/**
 * Mock API responses, so the frontend can be built and demoed with no backend
 * running at all.
 *
 * `lib/api.ts` serves these when `NEXT_PUBLIC_USE_MOCKS=true`. Nothing else
 * should import from this file at runtime — components call `lib/api.ts` and
 * neither know nor care whether the data is mocked. Tests may import the
 * fixtures below directly.
 *
 * The five destinations are real places with real coordinates. The numbers are
 * plausible but invented; none of them came from SLTDA and none of them should
 * ever be shown to a judge as though they did. They are replaced the moment
 * N's real endpoints land.
 *
 * Two things are kept honest even in mock data, because components are built
 * against these shapes and would go wrong later otherwise:
 *   - contribution percentages sum to 100 in every result
 *   - `meta` carries a model and index version on every response
 */

import { contributionLabel } from '@/lib/factor-labels';
import { monthLabel } from '@/lib/recommend-options';
import type {
  AlternativesResponse,
  ApiEnvelope,
  ApiErrorBody,
  ApiMeta,
  BandCounts,
  DashboardHotspot,
  DashboardSummaryResponse,
  DestinationDetailResponse,
  Alternative,
  DestinationsResponse,
  EstimatedContribution,
  ExactContribution,
  FactorName,
  FactorScores,
  FeatureImportance,
  LoginResponse,
  PressureBand,
  RecommendResponse,
  RiskResponse,
  SimulateInputs,
  SimulateResponse,
  UserRole,
} from '@/types/api';

/** Marked as mock versions so a stray mock response is obvious in the UI. */
const MOCK_META: ApiMeta = {
  model_version: 'pressure-v1.2-mock',
  index_version: 'weights-v1-mock',
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return { data, meta: MOCK_META };
}

/** Destination ids, fixed so every mock below agrees with the others. */
export const MOCK_IDS = {
  ella: 3,
  belihuloya: 7,
  kalpitiya: 9,
  meemure: 12,
  knuckles: 15,
} as const;

/* ------------------------------------------------------------------ */
/* POST /api/recommend                                                 */
/* ------------------------------------------------------------------ */

/**
 * Ranked as the index would rank them for a nature-interested traveller who
 * wants low crowds. The mock ignores the request body — it always returns this
 * same ranking, which is enough to build the results page against.
 */
export const mockRecommend: ApiEnvelope<RecommendResponse> = envelope({
  results: [
    {
      destination_id: MOCK_IDS.belihuloya,
      name: 'Belihuloya',
      sustainability_score: 89,
      factors: {
        environmental: 92,
        community: 88,
        crowd: 91,
        infrastructure: 76,
        suitability: 90,
      },
      contributions: [
        { factor: 'environmental', percent: 32, type: 'exact' },
        { factor: 'crowd', percent: 25, type: 'exact' },
        { factor: 'community', percent: 20, type: 'exact' },
        { factor: 'suitability', percent: 14, type: 'exact' },
        { factor: 'infrastructure', percent: 9, type: 'exact' },
      ],
      explanation:
        'Recommended mainly because of low visitor pressure and strong environmental conditions.',
      confidence: 'measured',
    },
    {
      destination_id: MOCK_IDS.meemure,
      name: 'Meemure',
      sustainability_score: 86,
      factors: {
        environmental: 95,
        community: 90,
        crowd: 96,
        infrastructure: 52,
        suitability: 81,
      },
      contributions: [
        { factor: 'environmental', percent: 30, type: 'exact' },
        { factor: 'crowd', percent: 28, type: 'exact' },
        { factor: 'community', percent: 22, type: 'exact' },
        { factor: 'suitability', percent: 12, type: 'exact' },
        { factor: 'infrastructure', percent: 8, type: 'exact' },
      ],
      explanation:
        'Recommended mainly because of low visitor pressure and strong community benefit.',
      confidence: 'estimated',
    },
    {
      destination_id: MOCK_IDS.knuckles,
      name: 'Knuckles',
      sustainability_score: 79,
      factors: {
        environmental: 94,
        community: 74,
        crowd: 83,
        infrastructure: 61,
        suitability: 85,
      },
      // Crowd and community are deliberately tied on 22. F3 calls out ties as
      // an edge case, and keeping one in the default data means the panel's
      // ordering is exercised on every run rather than only in a fixture.
      contributions: [
        { factor: 'environmental', percent: 30, type: 'exact' },
        { factor: 'crowd', percent: 22, type: 'exact' },
        { factor: 'community', percent: 22, type: 'exact' },
        { factor: 'suitability', percent: 16, type: 'exact' },
        { factor: 'infrastructure', percent: 10, type: 'exact' },
      ],
      explanation:
        'Recommended mainly because of strong environmental conditions and low visitor pressure.',
      confidence: 'estimated',
    },
    {
      destination_id: MOCK_IDS.kalpitiya,
      name: 'Kalpitiya',
      sustainability_score: 72,
      factors: {
        environmental: 78,
        community: 81,
        crowd: 69,
        infrastructure: 72,
        suitability: 76,
      },
      contributions: [
        { factor: 'environmental', percent: 27, type: 'exact' },
        { factor: 'community', percent: 23, type: 'exact' },
        { factor: 'crowd', percent: 21, type: 'exact' },
        { factor: 'suitability', percent: 18, type: 'exact' },
        { factor: 'infrastructure', percent: 11, type: 'exact' },
      ],
      explanation:
        'Recommended mainly because of strong community benefit and good environmental conditions.',
      confidence: 'measured',
    },
    {
      destination_id: MOCK_IDS.ella,
      name: 'Ella',
      sustainability_score: 58,
      factors: {
        environmental: 64,
        community: 70,
        crowd: 38,
        infrastructure: 88,
        suitability: 87,
      },
      // The only result carrying a SHAP contribution, so both bar styles show
      // up in the default demo. Ella is the high-pressure destination, so the
      // pressure model is the one place a model estimate genuinely belongs.
      // See the note on ESTIMATED_CONTRIBUTIONS_IN_RECOMMEND below — whether
      // this endpoint really returns these is still an open question for N.
      contributions: [
        { factor: 'infrastructure', percent: 24, type: 'exact' },
        { factor: 'suitability', percent: 22, type: 'exact' },
        { factor: 'forecast_pressure', percent: 20, type: 'estimated' },
        { factor: 'community', percent: 18, type: 'exact' },
        { factor: 'environmental', percent: 16, type: 'exact' },
      ],
      explanation:
        'Ranked below Kalpitiya mainly because of high visitor pressure.',
      confidence: 'measured',
    },
  ],
});

/**
 * ── OPEN QUESTION FOR N ───────────────────────────────────────────────────
 *
 * Does `POST /api/recommend` ever return `"estimated"` contributions?
 *
 * Section 7's worked example returns index contributions only, all `"exact"`.
 * But F3's table describes the explanation panel as showing both kinds, with
 * the estimated ones coming from TreeSHAP on the pressure forecast. Those two
 * cannot both be right.
 *
 *   - If the recommend response carries a SHAP contribution, Ella's mock above
 *     is the shape to build against and the panel is already correct.
 *   - If it only ever carries exact contributions, then the hatched bars only
 *     ever appear in the F4 risk view, and Ella's mock should drop back to
 *     five exact contributions.
 *
 * The panel handles either without changing, because `contributions` is typed
 * as the union and every bar is drawn from its own `type`. This only decides
 * what the mock should say. Flagged in docs/api-contract.md.
 * ──────────────────────────────────────────────────────────────────────────
 */

/**
 * Edge cases for the explanation panel, kept out of the demo data.
 *
 * These are stress fixtures, not plausible destinations — an 80% single factor
 * is not something the index can actually produce, since no weight is above
 * 0.30. They exist to prove the panel does not fall apart at the extremes.
 *
 * To look at them, temporarily return this from `recommendFor` instead of the
 * filtered list:
 *
 *     export function recommendFor(): ApiEnvelope<RecommendResponse> {
 *       return mockRecommendEdgeCases;
 *     }
 *
 * Put it back afterwards. There is no test runner in this repo yet, so these
 * are checked by eye rather than asserted.
 */
export const mockRecommendEdgeCases: ApiEnvelope<RecommendResponse> = envelope({
  results: [
    {
      // One factor dominates. The other four bars are nearly invisible, so
      // this is what proves short bars still render and stay labelled.
      destination_id: MOCK_IDS.meemure,
      name: 'Meemure (single dominant factor)',
      sustainability_score: 86,
      factors: {
        environmental: 95,
        community: 90,
        crowd: 96,
        infrastructure: 52,
        suitability: 81,
      },
      contributions: [
        { factor: 'environmental', percent: 80, type: 'exact' },
        { factor: 'crowd', percent: 8, type: 'exact' },
        { factor: 'community', percent: 6, type: 'exact' },
        { factor: 'suitability', percent: 4, type: 'exact' },
        { factor: 'infrastructure', percent: 2, type: 'exact' },
      ],
      explanation:
        'Recommended almost entirely because of its environmental condition.',
      confidence: 'estimated',
    },
    {
      // Two factors tied at the top, so neither is obviously "first". The
      // panel must order them the same way on every render.
      destination_id: MOCK_IDS.belihuloya,
      name: 'Belihuloya (two factors tied at the top)',
      sustainability_score: 89,
      factors: {
        environmental: 92,
        community: 88,
        crowd: 91,
        infrastructure: 76,
        suitability: 90,
      },
      contributions: [
        { factor: 'environmental', percent: 30, type: 'exact' },
        { factor: 'crowd', percent: 30, type: 'exact' },
        { factor: 'community', percent: 20, type: 'exact' },
        { factor: 'suitability', percent: 12, type: 'exact' },
        { factor: 'infrastructure', percent: 8, type: 'exact' },
      ],
      explanation:
        'Recommended mainly because of low visitor pressure and strong environmental conditions.',
      confidence: 'measured',
    },
    {
      // Six contributions. F3 allows five bars at most, so the sixth is cut
      // and the panel has to admit that the bars no longer cover the score.
      destination_id: MOCK_IDS.ella,
      name: 'Ella (six contributions, one gets cut)',
      sustainability_score: 58,
      factors: {
        environmental: 64,
        community: 70,
        crowd: 38,
        infrastructure: 88,
        suitability: 87,
      },
      contributions: [
        { factor: 'infrastructure', percent: 24, type: 'exact' },
        { factor: 'suitability', percent: 21, type: 'exact' },
        { factor: 'forecast_pressure', percent: 19, type: 'estimated' },
        { factor: 'community', percent: 16, type: 'exact' },
        { factor: 'environmental', percent: 13, type: 'exact' },
        { factor: 'crowd', percent: 7, type: 'exact' },
      ],
      explanation:
        'Ranked below Kalpitiya mainly because of high visitor pressure.',
      confidence: 'measured',
    },
  ],
});

/**
 * What each destination costs and how long it needs.
 *
 * F2 is explicit that budget and duration are **filters applied before
 * scoring**, not scored factors: a destination that does not fit the budget is
 * excluded rather than penalised. `recommendFor` below applies that filter so
 * the mock behaves the way the real endpoint will, and so the empty state is
 * reachable without a backend.
 *
 * With the contract's example request (50000 LKR, 4 days) all five pass, and
 * Belihuloya comes out on top — same as the worked example in section 7.
 */
const MOCK_TRIP_REQUIREMENTS: Record<
  number,
  { min_budget_lkr: number; min_days: number }
> = {
  [MOCK_IDS.belihuloya]: { min_budget_lkr: 18000, min_days: 2 },
  [MOCK_IDS.meemure]: { min_budget_lkr: 15000, min_days: 2 },
  [MOCK_IDS.knuckles]: { min_budget_lkr: 28000, min_days: 3 },
  [MOCK_IDS.ella]: { min_budget_lkr: 35000, min_days: 2 },
  [MOCK_IDS.kalpitiya]: { min_budget_lkr: 42000, min_days: 3 },
};

/**
 * Applies the budget and duration filter to the fixed ranking above.
 *
 * Only budget and duration change the result. Interest, crowd preference and
 * sustainability weight are ignored — reproducing the weighted index in the
 * mock layer would mean maintaining a second copy of N's Sustainability Index,
 * which would drift and would be the wrong thing to build against. Ranking is
 * the real endpoint's job.
 *
 * A malformed or missing body falls through to the unfiltered list rather than
 * throwing. Validating the request is the API's job, and the mock has no
 * business inventing a 400.
 */
export function recommendFor(body: unknown): ApiEnvelope<RecommendResponse> {
  const request = isRecord(body) ? body : {};
  const budget =
    typeof request.budget_lkr === 'number' ? request.budget_lkr : undefined;
  const days =
    typeof request.duration_days === 'number'
      ? request.duration_days
      : undefined;

  if (budget === undefined && days === undefined) return mockRecommend;

  const results = mockRecommend.data.results.filter((result) => {
    const needs = MOCK_TRIP_REQUIREMENTS[result.destination_id];
    if (!needs) return true;
    if (budget !== undefined && budget < needs.min_budget_lkr) return false;
    if (days !== undefined && days < needs.min_days) return false;
    return true;
  });

  return envelope({ results });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/* ------------------------------------------------------------------ */
/* GET /api/destinations                                               */
/* ------------------------------------------------------------------ */

export const mockDestinations: ApiEnvelope<DestinationsResponse> = envelope({
  destinations: [
    {
      id: MOCK_IDS.belihuloya,
      name: 'Belihuloya',
      lat: 6.7167,
      lon: 80.7833,
      district: 'Ratnapura',
      region: 'Sabaragamuwa',
      band: 'low',
      sustainability_score: 89,
    },
    {
      id: MOCK_IDS.meemure,
      name: 'Meemure',
      lat: 7.3667,
      lon: 80.8333,
      district: 'Kandy',
      region: 'Central',
      band: 'low',
      sustainability_score: 86,
    },
    {
      id: MOCK_IDS.knuckles,
      name: 'Knuckles',
      lat: 7.45,
      lon: 80.7833,
      district: 'Matale',
      region: 'Central',
      band: 'medium',
      sustainability_score: 79,
    },
    {
      id: MOCK_IDS.kalpitiya,
      name: 'Kalpitiya',
      lat: 8.2333,
      lon: 79.7667,
      district: 'Puttalam',
      region: 'North Western',
      band: 'medium',
      sustainability_score: 72,
    },
    {
      id: MOCK_IDS.ella,
      name: 'Ella',
      lat: 6.8667,
      lon: 81.0466,
      district: 'Badulla',
      region: 'Uva',
      band: 'high',
      sustainability_score: 58,
    },
  ],
});

/* ------------------------------------------------------------------ */
/* GET /api/destinations/{id}                                          */
/* ------------------------------------------------------------------ */

/**
 * What is stored for each destination. `simulation_baseline` is not in here
 * because it is derived on the way out, in `resolveMock`, from the factors
 * below — one rule, in one place.
 */
type StoredDestinationDetail = Omit<
  DestinationDetailResponse,
  'simulation_baseline'
>;

export const mockDestinationDetail: Record<
  number,
  ApiEnvelope<StoredDestinationDetail>
> = {
  [MOCK_IDS.belihuloya]: envelope({
    id: MOCK_IDS.belihuloya,
    name: 'Belihuloya',
    lat: 6.7167,
    lon: 80.7833,
    district: 'Ratnapura',
    region: 'Sabaragamuwa',
    band: 'low',
    sustainability_score: 89,
    activities: ['hiking', 'waterfalls', 'birdwatching', 'camping'],
    cost_band: 'low',
    typical_days: 3,
    factors: {
      environmental: 92,
      community: 88,
      crowd: 91,
      infrastructure: 76,
      suitability: 90,
    },
    source_ref: 'SLTDA Annual Statistical Report 2025, table 4.2',
    confidence: 'measured',
  }),
  [MOCK_IDS.meemure]: envelope({
    id: MOCK_IDS.meemure,
    name: 'Meemure',
    lat: 7.3667,
    lon: 80.8333,
    district: 'Kandy',
    region: 'Central',
    band: 'low',
    sustainability_score: 86,
    activities: ['village stay', 'hiking', 'river bathing'],
    cost_band: 'low',
    typical_days: 2,
    factors: {
      environmental: 95,
      community: 90,
      crowd: 96,
      infrastructure: 52,
      suitability: 81,
    },
    source_ref:
      'Regional proxy from Central province averages; no site-level sensor coverage',
    confidence: 'estimated',
  }),
  [MOCK_IDS.knuckles]: envelope({
    id: MOCK_IDS.knuckles,
    name: 'Knuckles',
    lat: 7.45,
    lon: 80.7833,
    district: 'Matale',
    region: 'Central',
    band: 'medium',
    sustainability_score: 79,
    activities: ['trekking', 'birdwatching', 'camping'],
    cost_band: 'medium',
    typical_days: 3,
    factors: {
      environmental: 94,
      community: 74,
      crowd: 83,
      infrastructure: 61,
      suitability: 85,
    },
    source_ref:
      'Forest Department conservation area records 2025; air quality proxied',
    confidence: 'estimated',
  }),
  [MOCK_IDS.kalpitiya]: envelope({
    id: MOCK_IDS.kalpitiya,
    name: 'Kalpitiya',
    lat: 8.2333,
    lon: 79.7667,
    district: 'Puttalam',
    region: 'North Western',
    band: 'medium',
    sustainability_score: 72,
    activities: ['kitesurfing', 'dolphin watching', 'lagoon tours'],
    cost_band: 'medium',
    typical_days: 4,
    factors: {
      environmental: 78,
      community: 81,
      crowd: 69,
      infrastructure: 72,
      suitability: 76,
    },
    source_ref: 'SLTDA Annual Statistical Report 2025, table 4.2',
    confidence: 'measured',
  }),
  [MOCK_IDS.ella]: envelope({
    id: MOCK_IDS.ella,
    name: 'Ella',
    lat: 6.8667,
    lon: 81.0466,
    district: 'Badulla',
    region: 'Uva',
    band: 'high',
    sustainability_score: 58,
    activities: ['hiking', 'train journeys', 'viewpoints', 'cafes'],
    cost_band: 'medium',
    typical_days: 3,
    factors: {
      environmental: 64,
      community: 70,
      crowd: 38,
      infrastructure: 88,
      suitability: 87,
    },
    source_ref: 'SLTDA Annual Statistical Report 2025, table 4.1',
    confidence: 'measured',
  }),
};

/* ------------------------------------------------------------------ */
/* GET /api/risk/{id}?month=                                           */
/* ------------------------------------------------------------------ */

const SCOPE_NOTE =
  'This forecast is a regional indicator for the whole region, not a measurement for this site on its own.';

export const mockRisk: Record<number, ApiEnvelope<RiskResponse>> = {
  [MOCK_IDS.ella]: envelope({
    destination_id: MOCK_IDS.ella,
    region: 'Uva',
    month: 9,
    predicted_pressure: 84,
    band: 'high',
    contributions: [
      { factor: 'month', percent: 34, type: 'estimated' },
      { factor: 'recent_occupancy', percent: 27, type: 'estimated' },
      { factor: 'arrival_trend', percent: 21, type: 'estimated' },
      { factor: 'region', percent: 12, type: 'estimated' },
      { factor: 'holiday_indicator', percent: 6, type: 'estimated' },
    ],
    explanation:
      'Pressure is estimated to be high mainly because of the travel month and recent occupancy in Uva.',
    scope: SCOPE_NOTE,
  }),
  [MOCK_IDS.kalpitiya]: envelope({
    destination_id: MOCK_IDS.kalpitiya,
    region: 'North Western',
    month: 9,
    predicted_pressure: 61,
    band: 'medium',
    contributions: [
      { factor: 'month', percent: 31, type: 'estimated' },
      { factor: 'arrival_trend', percent: 26, type: 'estimated' },
      { factor: 'recent_occupancy', percent: 24, type: 'estimated' },
      { factor: 'region', percent: 13, type: 'estimated' },
      { factor: 'holiday_indicator', percent: 6, type: 'estimated' },
    ],
    explanation:
      'Pressure is estimated to be medium mainly because of the travel month and a rising arrival trend.',
    scope: SCOPE_NOTE,
  }),
  [MOCK_IDS.knuckles]: envelope({
    destination_id: MOCK_IDS.knuckles,
    region: 'Central',
    month: 9,
    predicted_pressure: 55,
    band: 'medium',
    contributions: [
      { factor: 'recent_occupancy', percent: 33, type: 'estimated' },
      { factor: 'month', percent: 28, type: 'estimated' },
      { factor: 'arrival_trend', percent: 19, type: 'estimated' },
      { factor: 'region', percent: 15, type: 'estimated' },
      { factor: 'holiday_indicator', percent: 5, type: 'estimated' },
    ],
    explanation:
      'Pressure is estimated to be medium mainly because of recent occupancy and the travel month.',
    scope: SCOPE_NOTE,
  }),
  [MOCK_IDS.belihuloya]: envelope({
    destination_id: MOCK_IDS.belihuloya,
    region: 'Sabaragamuwa',
    month: 9,
    predicted_pressure: 28,
    band: 'low',
    contributions: [
      { factor: 'region', percent: 36, type: 'estimated' },
      { factor: 'recent_occupancy', percent: 29, type: 'estimated' },
      { factor: 'month', percent: 20, type: 'estimated' },
      { factor: 'arrival_trend', percent: 11, type: 'estimated' },
      { factor: 'holiday_indicator', percent: 4, type: 'estimated' },
    ],
    explanation:
      'Pressure is estimated to be low mainly because Sabaragamuwa sees few visitors and recent occupancy is flat.',
    scope: SCOPE_NOTE,
  }),
  [MOCK_IDS.meemure]: envelope({
    destination_id: MOCK_IDS.meemure,
    region: 'Central',
    month: 9,
    predicted_pressure: 19,
    band: 'low',
    contributions: [
      { factor: 'region', percent: 38, type: 'estimated' },
      { factor: 'recent_occupancy', percent: 26, type: 'estimated' },
      { factor: 'month', percent: 21, type: 'estimated' },
      { factor: 'arrival_trend', percent: 10, type: 'estimated' },
      { factor: 'holiday_indicator', percent: 5, type: 'estimated' },
    ],
    explanation:
      'Pressure is estimated to be low mainly because access is difficult and recent occupancy is very low.',
    scope: SCOPE_NOTE,
  }),
};

/**
 * A crude seasonality curve, used to make `?month=` actually change something.
 *
 * Every entry in `mockRisk` above is a September figure, and September is 1.00
 * here, so the stored numbers are what you get for month 9 and the other
 * eleven months move around them. The shape is roughly Sri Lanka's two peak
 * seasons — December to February, and July to August — with the inter-monsoon
 * lulls in May, June and October.
 *
 * This is not a model and is not meant to look like one. The real endpoint
 * runs LightGBM over the SLTDA series; this exists so the month selector can
 * be built and demonstrated against something that visibly responds.
 */
const MONTH_PRESSURE_FACTOR: Record<number, number> = {
  1: 1.25,
  2: 1.2,
  3: 1.05,
  4: 0.95,
  5: 0.8,
  6: 0.75,
  7: 1.15,
  8: 1.2,
  9: 1.0,
  10: 0.8,
  11: 0.85,
  12: 1.3,
};

/**
 * The band thresholds. Kept here so the mock cannot disagree with itself when
 * a month change pushes a destination across a boundary — the band is always
 * derived from the pressure, never stored alongside it.
 *
 * The real thresholds live in N's config and these need checking against them.
 */
function bandFor(pressure: number): PressureBand {
  if (pressure >= 70) return 'high';
  if (pressure >= 40) return 'medium';
  return 'low';
}

/**
 * The risk forecast for one destination in one month.
 *
 * Recomputes the pressure and the band from the seasonality curve, and rebuilds
 * the sentence so it cannot end up saying "high" next to a green band. The SHAP
 * contributions are left alone: re-deriving those would mean inventing a second
 * model, and the shape is what the panel is built against.
 */
export function riskFor(
  id: number,
  month: number
): ApiEnvelope<RiskResponse> | undefined {
  const base = mockRisk[id];
  if (!base) return undefined;

  const factor = MONTH_PRESSURE_FACTOR[month];
  if (factor === undefined) return base;

  const predicted_pressure = Math.min(
    100,
    Math.max(0, Math.round(base.data.predicted_pressure * factor))
  );
  const band = bandFor(predicted_pressure);

  // No `explanation`: the real endpoint does not send one for a forecast, so
  // neither does the mock. The panel renders its bars without a sentence.
  return envelope({ ...base.data, month, predicted_pressure, band });
}

/* ------------------------------------------------------------------ */
/* GET /api/alternatives/{id}                                          */
/* ------------------------------------------------------------------ */

/**
 * Pairwise similarity, standing in for the cosine similarity over landscape
 * type, activities, travel distance and climate that F5 describes.
 *
 * Written as pairs rather than a full matrix so each relationship is stated
 * once and the two directions cannot disagree. A pair that is not listed
 * scores 0 and is never offered as an alternative — better to suggest nothing
 * than to suggest a beach to somebody who came for cloud forest.
 */
const SIMILARITY_PAIRS: ReadonlyArray<readonly [number, number, number]> = [
  [MOCK_IDS.belihuloya, MOCK_IDS.knuckles, 85],
  [MOCK_IDS.ella, MOCK_IDS.belihuloya, 82],
  [MOCK_IDS.knuckles, MOCK_IDS.meemure, 80],
  [MOCK_IDS.ella, MOCK_IDS.knuckles, 76],
  [MOCK_IDS.belihuloya, MOCK_IDS.meemure, 74],
  [MOCK_IDS.ella, MOCK_IDS.meemure, 68],
  [MOCK_IDS.ella, MOCK_IDS.kalpitiya, 24],
  [MOCK_IDS.belihuloya, MOCK_IDS.kalpitiya, 22],
  [MOCK_IDS.knuckles, MOCK_IDS.kalpitiya, 20],
  [MOCK_IDS.meemure, MOCK_IDS.kalpitiya, 18],
];

function similarityBetween(a: number, b: number): number {
  const pair = SIMILARITY_PAIRS.find(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
  return pair ? pair[2] : 0;
}

/** Used to fill the one-sentence reason on each alternative. */
const DESTINATION_CHARACTER: Record<number, string> = {
  [MOCK_IDS.ella]: 'hill country walking and viewpoints',
  [MOCK_IDS.belihuloya]: 'montane river valleys, waterfalls and hiking',
  [MOCK_IDS.meemure]: 'remote forest village life and river walks',
  [MOCK_IDS.knuckles]: 'cloud forest trekking and birdwatching',
  [MOCK_IDS.kalpitiya]: 'coastal lagoons and open water',
};

/**
 * Similar destinations with lower forecast pressure than the one asked about.
 *
 * Everything F5 requires is applied here rather than left to the UI, because
 * the UI is not the right place to decide what counts as an acceptable
 * suggestion:
 *
 *   - only destinations with *lower* forecast pressure that month
 *   - only destinations inside the budget and trip length, when those were
 *     passed; a suggestion the traveller cannot afford is not a suggestion
 *   - only destinations with some real similarity to the source
 *   - at most three, most similar first
 *
 * When nothing survives that, the list comes back empty with a message saying
 * why. F5 asks for exactly this rather than a padded-out bad match.
 */
export function alternativesFor(
  id: number,
  query: { month: number; budget_lkr?: number; duration_days?: number }
): ApiEnvelope<AlternativesResponse> | undefined {
  const source = riskFor(id, query.month);
  if (!source) return undefined;

  const sourceName = destinationName(id);
  const sourcePressure = source.data.predicted_pressure;
  const monthName = monthLabel(query.month);

  const alternatives: Alternative[] = Object.values(MOCK_IDS)
    // flatMap rather than map-then-filter so the forecast is known to exist
    // from here on, without a non-null assertion further down.
    .flatMap((otherId) => {
      if (otherId === id) return [];
      const risk = riskFor(otherId, query.month);
      if (!risk) return [];
      return [
        {
          otherId,
          data: risk.data,
          needs: MOCK_TRIP_REQUIREMENTS[otherId],
          similarity: similarityBetween(id, otherId),
        },
      ];
    })
    .filter(({ data, needs, similarity }) => {
      if (similarity <= 0) return false;
      if (data.predicted_pressure >= sourcePressure) return false;
      if (needs === undefined) return true;
      if (
        query.budget_lkr !== undefined &&
        query.budget_lkr < needs.min_budget_lkr
      ) {
        return false;
      }
      if (
        query.duration_days !== undefined &&
        query.duration_days < needs.min_days
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map(({ otherId, data, similarity }) => ({
      destination_id: otherId,
      name: destinationName(otherId),
      similarity_percent: similarity,
      predicted_pressure: data.predicted_pressure,
      band: data.band,
      reason: `Similar ${DESTINATION_CHARACTER[otherId] ?? 'landscape and activities'}, and forecast at ${data.predicted_pressure}% visitor pressure in ${monthName} against ${sourceName}'s ${sourcePressure}%.`,
    }));

  const filtered =
    query.budget_lkr !== undefined || query.duration_days !== undefined;

  return envelope({
    destination_id: id,
    alternatives,
    message:
      alternatives.length > 0
        ? null
        : `Nothing comparable to ${sourceName} is forecast to be quieter in ${monthName}${filtered ? ' within your budget and dates' : ''}. Travelling in a quieter month may do more than changing destination.`,
  });
}

/* ------------------------------------------------------------------ */
/* POST /api/simulate                                                  */
/* ------------------------------------------------------------------ */

/**
 * The index weights from F2. In the mock these belong here, because the mock
 * is standing in for the backend and the backend is where weights live. They
 * are never read by a component.
 */
const MOCK_INDEX_WEIGHTS: Record<FactorName, number> = {
  environmental: 0.3,
  crowd: 0.25,
  community: 0.2,
  suitability: 0.15,
  infrastructure: 0.1,
};

function weightedTotal(factors: FactorScores): number {
  return (Object.keys(MOCK_INDEX_WEIGHTS) as FactorName[]).reduce(
    (total, key) => total + MOCK_INDEX_WEIGHTS[key] * factors[key],
    0
  );
}

/**
 * Where the three sliders start for a given destination.
 *
 * Derived here, in the one place, and served on the destination detail so the
 * UI never has to re-derive it. If the UI worked these out for itself and the
 * two rules ever drifted apart, resetting the sliders would stop returning the
 * original score exactly — which is the one thing F6 asks for by name.
 *
 * `expected_tourists` is inverted from the crowd factor: the crowd factor
 * scores *quietness*, so 96 means almost nobody is there, which is a visitor
 * level of 4.
 *
 * `waste_management_level` has no field of its own in the dataset and is stood
 * up here on the environmental factor. That is a proxy, not a measurement, and
 * it needs a real column before this is anything more than a demonstration.
 */
export function baselineInputsFor(factors: FactorScores): SimulateInputs {
  return {
    expected_tourists: 100 - factors.crowd,
    waste_management_level: factors.environmental,
    infrastructure_level: factors.infrastructure,
  };
}

/** Applies the three slider values back onto a destination's five factors. */
function factorsFromInputs(
  factors: FactorScores,
  inputs: SimulateInputs
): FactorScores {
  return {
    ...factors,
    crowd: 100 - inputs.expected_tourists,
    environmental: inputs.waste_management_level,
    infrastructure: inputs.infrastructure_level,
  };
}

const SLIDER_LABEL: Record<keyof SimulateInputs, string> = {
  expected_tourists: 'the number of visitors',
  waste_management_level: 'waste management',
  infrastructure_level: 'infrastructure',
};

/**
 * Re-runs the index with changed inputs. Not a simulation engine — F6 is
 * explicit that this is the same weighted sum with different numbers in it.
 *
 * The score is worked out as a **change from the destination's real score**
 * rather than as an absolute:
 *
 *     score = baseline_score + (weighted(now) - weighted(baseline))
 *
 * That matters for one of F6's acceptance criteria. Computing the weighted sum
 * outright would give a number a point or two away from the stored score, so
 * putting the sliders back would land near the original rather than on it.
 * Expressed as a change, the baseline inputs produce a change of exactly zero,
 * and reset returns exactly the original score.
 *
 * The result is clamped to 0–100, which holds at every slider combination
 * because each weighted term is between 0 and its weight, and the weights sum
 * to one. Direction holds too: raising visitors lowers the crowd factor and so
 * can only lower the score, and raising waste management or infrastructure can
 * only raise it.
 */
export function simulateFor(
  body: unknown
): ApiEnvelope<SimulateResponse> | undefined {
  const request = isRecord(body) ? body : {};
  const id =
    typeof request.destination_id === 'number' ? request.destination_id : undefined;
  if (id === undefined) return undefined;

  const detail = mockDestinationDetail[id];
  if (!detail) return undefined;

  const baseFactors = detail.data.factors;
  const baselineScore = detail.data.sustainability_score;
  const baselineInputs = baselineInputsFor(baseFactors);

  const clampLevel = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value)
      ? Math.min(100, Math.max(0, Math.round(value)))
      : fallback;

  const inputs: SimulateInputs = {
    expected_tourists: clampLevel(
      request.expected_tourists,
      baselineInputs.expected_tourists
    ),
    waste_management_level: clampLevel(
      request.waste_management_level,
      baselineInputs.waste_management_level
    ),
    infrastructure_level: clampLevel(
      request.infrastructure_level,
      baselineInputs.infrastructure_level
    ),
  };

  const nowFactors = factorsFromInputs(baseFactors, inputs);
  const change = weightedTotal(nowFactors) - weightedTotal(baseFactors);
  const score = Math.min(100, Math.max(0, Math.round(baselineScore + change)));
  const delta = score - baselineScore;

  // How much each slider moved the score on its own, so the warning can name
  // the one actually responsible rather than guessing.
  const perSlider: Array<{ key: keyof SimulateInputs; effect: number }> = [
    {
      key: 'expected_tourists',
      effect:
        MOCK_INDEX_WEIGHTS.crowd *
        (baselineInputs.expected_tourists - inputs.expected_tourists),
    },
    {
      key: 'waste_management_level',
      effect:
        MOCK_INDEX_WEIGHTS.environmental *
        (inputs.waste_management_level - baselineInputs.waste_management_level),
    },
    {
      key: 'infrastructure_level',
      effect:
        MOCK_INDEX_WEIGHTS.infrastructure *
        (inputs.infrastructure_level - baselineInputs.infrastructure_level),
    },
  ];

  const worst = perSlider.reduce((a, b) => (b.effect < a.effect ? b : a));

  const total = weightedTotal(nowFactors);
  const contributions: ExactContribution[] = (
    Object.keys(MOCK_INDEX_WEIGHTS) as FactorName[]
  )
    .map((key) => ({
      factor: key,
      percent:
        total === 0
          ? 0
          : Math.round((MOCK_INDEX_WEIGHTS[key] * nowFactors[key] * 100) / total),
      type: 'exact' as const,
    }))
    .sort((a, b) => b.percent - a.percent);

  // Rounding five percentages independently can land on 99 or 101; the largest
  // absorbs the difference so they always sum to 100, which F3 requires.
  const sum = contributions.reduce((t, c) => t + c.percent, 0);
  const first = contributions[0];
  if (first && sum !== 100) first.percent += 100 - sum;

  return envelope({
    destination_id: id,
    sustainability_score: score,
    baseline_score: baselineScore,
    delta,
    factors: nowFactors,
    contributions,
    warning:
      delta < -10
        ? `This drops the score by ${Math.abs(delta)} points. Most of that comes from ${SLIDER_LABEL[worst.key]}.`
        : null,
  });
}

/* ------------------------------------------------------------------ */
/* GET /api/dashboard/summary                                          */
/* ------------------------------------------------------------------ */

/**
 * The importance the pressure model puts on each of its features overall.
 *
 * Mean absolute SHAP across the training set, which is what a global
 * importance view is. Stored rather than derived, because unlike everything
 * else here it is a property of N's trained model and there is nothing in the
 * mock to derive it from. These five sum to 1.00.
 */
const MOCK_FEATURE_IMPORTANCE: FeatureImportance[] = [
  { feature: 'month', importance: 0.31 },
  { feature: 'recent_occupancy', importance: 0.27 },
  { feature: 'arrival_trend', importance: 0.19 },
  { feature: 'region', importance: 0.16 },
  { feature: 'holiday_indicator', importance: 0.07 },
];

/**
 * What an official should do about a destination, worked out from its forecast
 * rather than written down next to it.
 *
 * F8 requires the recommended action to be generated from the data, and a
 * stored sentence would go stale the moment the forecast moved — a destination
 * could drop to a low band while still carrying advice about crowding.
 */
function recommendedActionFor(
  name: string,
  region: string,
  pressure: number,
  band: PressureBand,
  monthName: string,
  quieterAlternatives: string[]
): string {
  if (band === 'high') {
    const suggestion =
      quieterAlternatives.length > 0
        ? ` Consider promoting ${quieterAlternatives.slice(0, 2).join(' and ')} instead.`
        : ' No comparable destination is quieter this month, so consider managing arrivals directly.';
    return `${region} is forecast at ${pressure}% occupancy for ${monthName}, which is above what ${name} comfortably holds.${suggestion}`;
  }
  if (band === 'medium') {
    return `${region} is forecast at ${pressure}% occupancy for ${monthName}. ${name} is within capacity but close enough to it to be worth watching monthly.`;
  }
  return `${region} is forecast at ${pressure}% occupancy for ${monthName}. ${name} has room, and could absorb visitors redirected from busier regions.`;
}

/**
 * The authority overview, built from the same forecasts as every other page.
 *
 * F8 requires the counts to match the destination table exactly, so nothing
 * here is stored separately: the bands, the counts, the ranking and the
 * recommended actions are all derived from `riskFor` for the current month.
 * A second hardcoded set of counts would have drifted the first time either
 * side was edited.
 */
export function dashboardSummaryFor(
  month: number
): ApiEnvelope<DashboardSummaryResponse> {
  const monthName = monthLabel(month);

  const rows = mockDestinations.data.destinations
    .flatMap((destination) => {
      const risk = riskFor(destination.id, month);
      return risk ? [{ destination, risk: risk.data }] : [];
    })
    .sort((a, b) => b.risk.predicted_pressure - a.risk.predicted_pressure);

  const band_counts: BandCounts = { low: 0, medium: 0, high: 0 };
  for (const row of rows) band_counts[row.risk.band] += 1;

  const highest_pressure: Array<DashboardHotspot & { quieter: string[] }> = rows.map(({ destination, risk }) => {
    const quieter = rows
      .filter((other) => other.risk.predicted_pressure < risk.predicted_pressure)
      .sort((a, b) => a.risk.predicted_pressure - b.risk.predicted_pressure)
      .map((other) => other.destination.name);

    return {
      destination_id: destination.id,
      name: destination.name,
      region: destination.region,
      predicted_pressure: risk.predicted_pressure,
      band: risk.band,
      quieter,
    };
  });

  // One action for the dashboard as a whole, about whichever destination is
  // under the most pressure. That is the one an official deals with first.
  const worst = highest_pressure[0];

  return envelope({
    destinations_monitored: rows.length,
    band_counts,
    highest_pressure: highest_pressure.map(({ quieter: _quieter, ...row }) => row),
    recommended_action: worst
      ? recommendedActionFor(
          worst.name,
          worst.region,
          worst.predicted_pressure,
          worst.band,
          monthName,
          worst.quieter
        )
      : 'No destinations are being monitored yet.',
    global_feature_importance: MOCK_FEATURE_IMPORTANCE,
  });
}

/* ------------------------------------------------------------------ */
/* POST /api/auth/login                                                */
/* ------------------------------------------------------------------ */

/**
 * Stand-in tokens. Not JWTs, not signed, and they prove nothing — the string
 * simply carries the role so the rest of the mock can behave differently for
 * an official and for a tourist.
 *
 * Real authentication is D's work on the backend: a signed JWT, passwords
 * hashed with bcrypt or argon2, and the role taken from the verified claims
 * rather than from the token text. Nothing here should outlive the mock.
 */
export const MOCK_TOKENS: Record<UserRole, string> = {
  authority: 'mock-not-a-real-token.authority',
  tourist: 'mock-not-a-real-token.tourist',
};

/**
 * The mock accepts any password. The *email* decides the role, so the
 * tourist-gets-403 path can actually be exercised without a backend: anything
 * containing "tourist" comes back as a tourist, everything else as an
 * official.
 *
 * The password is not read, not compared and not echoed back.
 */
export function loginFor(body: unknown): ApiEnvelope<LoginResponse> {
  const request = isRecord(body) ? body : {};
  const email = typeof request.email === 'string' ? request.email : '';
  const role: UserRole = /tourist/i.test(email) ? 'tourist' : 'authority';

  return envelope({
    access_token: MOCK_TOKENS[role],
    token_type: 'bearer',
    role,
  });
}

/** The role a mock token claims. Unknown or missing tokens have no role. */
export function roleFromMockToken(token: string | undefined): UserRole | undefined {
  if (token === MOCK_TOKENS.authority) return 'authority';
  if (token === MOCK_TOKENS.tourist) return 'tourist';
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Routing                                                             */
/* ------------------------------------------------------------------ */

/**
 * The destination list with each band recomputed for the current month.
 *
 * `GET /api/destinations` is documented as returning the *current* band, so
 * "current" is taken literally here. A destination whose forecast has moved it
 * into another band this month shows that band on the map and on the risk
 * view, because both are reading the same forecast.
 */
function destinationsForCurrentMonth(): ApiEnvelope<DestinationsResponse> {
  const month = new Date().getMonth() + 1;
  return envelope({
    destinations: mockDestinations.data.destinations.map((destination) => {
      const risk = riskFor(destination.id, month);
      return risk ? { ...destination, band: risk.data.band } : destination;
    }),
  });
}

/**
 * A destination's name.
 *
 * The risk and alternatives responses no longer carry one — the real API does
 * not send it — so anything in the mock that needs a name looks it up from the
 * destination list, which is where names actually live.
 */
function destinationName(id: number): string {
  return (
    mockDestinations.data.destinations.find((d) => d.id === id)?.name ??
    `Destination ${id}`
  );
}

/** Pulls the numeric id out of a path like `/api/risk/3`. */
function idFrom(segment: string | undefined): number | undefined {
  if (segment === undefined) return undefined;
  const id = Number.parseInt(segment, 10);
  return Number.isNaN(id) ? undefined : id;
}

/** Pulls `month` out of a query string like `?month=9`. */
function monthFrom(query: string | undefined): number | undefined {
  if (query === undefined) return undefined;
  const raw = new URLSearchParams(query).get('month');
  if (raw === null) return undefined;
  const month = Number.parseInt(raw, 10);
  return Number.isNaN(month) ? undefined : month;
}

/**
 * A mock standing in for an HTTP error response rather than a success.
 *
 * Without this the only failure a mock could produce was "no mock defined",
 * which is a developer mistake, not something the UI should ever handle. A
 * request for a destination that does not exist is a perfectly ordinary 404
 * and the app has to cope with it, so the mock layer has to be able to say so.
 */
export interface MockErrorResponse {
  status: number;
  body: ApiErrorBody;
}

export type MockResult = ApiEnvelope<unknown> | MockErrorResponse;

export function isMockError(result: MockResult): result is MockErrorResponse {
  return 'status' in result && 'body' in result;
}

function notFound(what: string): MockErrorResponse {
  return {
    status: 404,
    body: { error: { code: 'not_found', message: `${what} was not found.` } },
  };
}

/**
 * Maps a method and path to a mock response.
 *
 * Returns `undefined` only when the *route itself* is unknown, which
 * `lib/api.ts` turns into a loud error — that means a mock is missing and a
 * developer needs to add one. A known route with an unknown id returns a 404
 * instead, because that is a real condition the UI has to handle rather than a
 * gap in the mocks.
 *
 * `body` is the request body for a POST; only `/api/recommend` reads it, for
 * the budget and duration filter F2 describes. The query string is read only
 * by `/api/risk`, for `?month=`. `token` is the bearer token, read only by
 * `/api/dashboard/summary`, so the 401 and 403 paths can be exercised.
 */
export function resolveMock(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): MockResult | undefined {
  const [pathname, query] = path.split('?');
  const segments = (pathname ?? '').split('/').filter(Boolean); // ['api', 'risk', '3']
  const [, resource, idSegment] = segments;
  const id = idFrom(idSegment);
  const verb = method.toUpperCase();

  if (verb === 'POST') {
    switch (resource) {
      case 'recommend':
        return recommendFor(body);
      case 'simulate':
        return simulateFor(body) ?? notFound('That destination');
      case 'auth':
        return idSegment === 'login' ? loginFor(body) : undefined;
      default:
        return undefined;
    }
  }

  if (verb !== 'GET') return undefined;

  switch (resource) {
    case 'destinations': {
      // The list's `band` is derived from the same forecast the risk view
      // uses, for the current calendar month, rather than being a second
      // stored copy. F7 requires the map's marker colours to match the bands
      // shown elsewhere in the app, and two hardcoded lists would eventually
      // disagree the moment one of them was edited.
      if (id === undefined) return destinationsForCurrentMonth();
      const detail = mockDestinationDetail[id];
      if (!detail) return notFound('That destination');
      // The simulator's starting values are derived here rather than in the
      // UI, so there is exactly one rule and reset cannot drift off the
      // original score.
      return envelope(detail.data);
    }
    case 'risk': {
      if (id === undefined) return undefined;
      const month = monthFrom(query) ?? 9;
      return riskFor(id, month) ?? notFound('That destination');
    }
    case 'alternatives': {
      if (id === undefined) return undefined;
      const params = new URLSearchParams(query ?? '');
      const asNumber = (key: string): number | undefined => {
        const raw = params.get(key);
        if (raw === null) return undefined;
        const value = Number.parseInt(raw, 10);
        return Number.isNaN(value) ? undefined : value;
      };
      return (
        alternativesFor(id, {
          month: asNumber('month') ?? 9,
          budget_lkr: asNumber('budget_lkr'),
          duration_days: asNumber('duration_days'),
        }) ?? notFound('That destination')
      );
    }
    case 'dashboard': {
      if (idSegment !== 'summary') return undefined;
      // F8: a tourist-role token must get a 403, not a blank page. The real
      // API decides this from verified JWT claims; the mock reads the role
      // straight off its stand-in token.
      const role = roleFromMockToken(token);
      if (role === undefined) {
        return {
          status: 401,
          body: {
            error: {
              code: 'unauthenticated',
              message: 'Sign in to view the authority dashboard.',
            },
          },
        };
      }
      if (role !== 'authority') {
        return {
          status: 403,
          body: {
            error: {
              code: 'forbidden',
              message:
                'This account does not have access to the authority dashboard.',
            },
          },
        };
      }
      return dashboardSummaryFor(new Date().getMonth() + 1);
    }
    default:
      return undefined;
  }
}
