/**
 * TypeScript mirror of the API contract in `docs/api-contract.md`.
 *
 * This file is the only place API shapes are declared. If the contract
 * changes, it changes here and nowhere else.
 *
 * Types marked PROVISIONAL are not in section 7 of the contract. Section 7
 * writes out the body of `POST /api/recommend` only; the other seven endpoints
 * are named but not specified. Those types are derived from `features.md` and
 * the schema in `plan.md` section 8, and need N's sign-off before they can be
 * treated as agreed.
 */

/* ------------------------------------------------------------------ */
/* Envelope                                                            */
/* ------------------------------------------------------------------ */

/**
 * Returned with every successful response. Both versions are required by the
 * traceability rule: any explanation shown to a user has to be reproducible
 * later, which means knowing which model and which weights produced it.
 */
export interface ApiMeta {
  model_version: string;
  index_version: string;
}

/** The success envelope every endpoint wraps its payload in. */
export interface ApiEnvelope<T> {
  data: T;
  meta: ApiMeta;
}

/** The body returned alongside a non-2xx status. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/* ------------------------------------------------------------------ */
/* Shared vocabulary                                                   */
/* ------------------------------------------------------------------ */

/**
 * The five Sustainability Index factors. Fixed by the index definition in
 * `features.md` — a sixth factor would be a change to the model, not just
 * to the API.
 */
export interface FactorScores {
  environmental: number;
  community: number;
  crowd: number;
  infrastructure: number;
  suitability: number;
}

/** `"environmental" | "community" | "crowd" | "infrastructure" | "suitability"` */
export type FactorName = keyof FactorScores;

/** Traffic-light pressure band. Green, amber, red — see `design-tokens.ts`. */
export type PressureBand = 'low' | 'medium' | 'high';

/**
 * Whether the underlying factor values came from real data or from proxies.
 * Surfaced in the UI on every score.
 */
export type Confidence = 'measured' | 'estimated';

/* ------------------------------------------------------------------ */
/* Contributions — the discriminated union                             */
/* ------------------------------------------------------------------ */

/**
 * An exact contribution. Computed directly from the index weights, so the
 * number is arithmetic rather than inference. Rendered as a solid bar.
 *
 * `factor` is always one of the five index factors.
 */
export interface ExactContribution {
  type: 'exact';
  factor: FactorName;
  percent: number;
}

/**
 * An estimated contribution. A TreeSHAP value from the pressure model, so the
 * number is a model estimate with error attached. Rendered as a hatched or
 * outlined bar, plus a tooltip saying it is an estimate.
 *
 * `factor` here is a *model feature* (month, region, recent occupancy, arrival
 * trend, holiday indicator), not one of the five index factors, so it stays a
 * plain string. The exact feature names come from N's model.
 */
export interface EstimatedContribution {
  type: 'estimated';
  factor: string;
  percent: number;
}

/**
 * Discriminated on `type`. Narrow on it before rendering — this is what stops
 * an exact calculation and a model estimate being drawn as the same bar, which
 * is the single marking point the whole project turns on.
 *
 *     if (c.type === 'exact')  → solid bar, c.factor is a FactorName
 *     else                     → hatched bar + estimate tooltip
 */
export type Contribution = ExactContribution | EstimatedContribution;

/* ------------------------------------------------------------------ */
/* POST /api/recommend  (F2, F3) — specified in the contract           */
/* ------------------------------------------------------------------ */

/** How much crowding the traveller will accept. */
export type CrowdPreference = 'low' | 'medium' | 'high';

/** How hard the index should lean towards sustainability over personal fit. */
export type SustainabilityWeight = 'low' | 'medium' | 'high';

/**
 * CONFIRMED against the API's OpenAPI schema, 3 September 2026. The backend
 * enum is the source of truth; `relaxation` was missing from the frontend's
 * earlier guess and is now here.
 */
export type Interest =
  | 'nature'
  | 'culture'
  | 'adventure'
  | 'wildlife'
  | 'beach'
  | 'relaxation';

/** Calendar month, 1 = January through 12 = December. */
export type TravelMonth = number;

export interface RecommendRequest {
  budget_lkr: number;
  duration_days: number;
  interest: Interest;
  crowd_preference: CrowdPreference;
  sustainability_weight: SustainabilityWeight;
  travel_month: TravelMonth;
}

export interface Recommendation {
  destination_id: number;
  name: string;
  /** Total Sustainability Index score, 0 to 100. */
  sustainability_score: number;
  factors: FactorScores;
  /**
   * Typed as the union rather than `ExactContribution[]` on purpose. Today
   * this endpoint returns index contributions only, so every entry is
   * `"exact"`, but typing it this way forces every component to narrow on
   * `type` before drawing a bar. If SHAP values are ever folded into this
   * response, no component silently mislabels them.
   */
  contributions: Contribution[];
  /** Filled from a fixed template. Never free-text generation. */
  explanation: string;
  confidence: Confidence;
}

/** Response `data` for `POST /api/recommend`. */
export interface RecommendResponse {
  results: Recommendation[];
}

/* ------------------------------------------------------------------ */
/* GET /api/destinations  (F7) — PROVISIONAL                           */
/* ------------------------------------------------------------------ */

/**
 * CONFIRMED against the API's OpenAPI schema.
 *
 * Note the key is `id`, not `destination_id`. Every other endpoint calls it
 * `destination_id`; the two destinations endpoints call it `id`. That is the
 * backend's shape, so it is this one's too — see the note at the bottom of
 * `docs/api-contract.md`.
 */
export interface DestinationSummary {
  id: number;
  name: string;
  lat: number;
  lon: number;
  district: string;
  region: string;
  /** Current forecast band for the destination's region. */
  band: PressureBand;
  sustainability_score: number;
}

/** PROVISIONAL. Response `data` for `GET /api/destinations`. */
export interface DestinationsResponse {
  destinations: DestinationSummary[];
}

/* ------------------------------------------------------------------ */
/* GET /api/destinations/{id}  (F7) — PROVISIONAL                      */
/* ------------------------------------------------------------------ */

/**
 * CONFIRMED against the API's OpenAPI schema.
 *
 * Two fields the frontend used to assume are **not** here, and both were
 * removed rather than left as wishful thinking:
 *
 * - `landscape_type` does not exist. It was never rendered.
 * - `simulation_baseline` does not exist. The F6 simulator now derives its
 *   starting slider positions from `factors` instead. See the note in
 *   `components/SimulatorView.tsx`.
 */
export interface DestinationDetail extends DestinationSummary {
  activities: string[];
  cost_band: string;
  /** Typical trip length in days. */
  typical_days: number;
  factors: FactorScores;
  /** Where the factor values came from, e.g. an SLTDA report reference. */
  source_ref: string;
  confidence: Confidence;
}

/** PROVISIONAL. Response `data` for `GET /api/destinations/{id}`. */
export type DestinationDetailResponse = DestinationDetail;

/* ------------------------------------------------------------------ */
/* GET /api/risk/{id}?month=  (F4) — PROVISIONAL                       */
/* ------------------------------------------------------------------ */

/** CONFIRMED. `month` is a required query parameter, not optional. */
export interface RiskQuery {
  month: TravelMonth;
}

/**
 * PROVISIONAL. Derived from F4 and the `pressure_forecast` table.
 *
 * `contributions` is `EstimatedContribution[]` and not the wider union: every
 * value here is TreeSHAP output, so there is nothing exact to mix in.
 */
/**
 * CONFIRMED against the API's OpenAPI schema.
 *
 * Two fields the frontend expected are **not** sent:
 *
 * - `name`. The risk page needs the destination's name for its heading, so it
 *   now fetches `GET /api/destinations/{id}` alongside the forecast.
 * - `explanation`. Every other explanation in the app is a sentence from the
 *   API; this one has none, so the panel renders bars without a sentence.
 *   Both are listed as asks in `docs/api-contract.md`.
 *
 * `predicted_pressure` is a float here, not an integer — round it for display.
 */
export interface RiskResponse {
  destination_id: number;
  /** Pressure is forecast per region, never per site. */
  region: string;
  month: TravelMonth;
  /** Predicted occupancy rate as a percentage, 0 to 100. May be fractional. */
  predicted_pressure: number;
  band: PressureBand;
  contributions: EstimatedContribution[];
  /**
   * Plain-language statement that this is a regional indicator, not a per-site
   * one. The API sends a fixed sentence; the UI renders whatever arrives and
   * never writes its own.
   */
  scope: string;
}

/* ------------------------------------------------------------------ */
/* GET /api/alternatives/{id}  (F5) — PROVISIONAL                      */
/* ------------------------------------------------------------------ */

/**
 * PROVISIONAL. Query parameters for `GET /api/alternatives/{id}`.
 *
 * None of these are in section 7, which lists the endpoint with no parameters
 * at all. They are here because F5 cannot be satisfied without them:
 *
 *   - `budget_lkr` and `duration_days` because F5 requires that an alternative
 *     is never outside the filters the traveller already set. The endpoint
 *     cannot honour a filter it was never told about.
 *   - `month` because "lower pressure" only means anything for a given month.
 *     A destination that is quieter in June may be busier in December.
 *
 * All three are optional so the endpoint still answers when the caller has no
 * search behind it — opening a risk view straight from a link, for instance.
 * In that case the alternatives come back unfiltered.
 */
export interface AlternativesQuery {
  budget_lkr?: number;
  duration_days?: number;
}

/** PROVISIONAL. One suggested alternative destination. */
export interface Alternative {
  destination_id: number;
  name: string;
  /** Cosine similarity over the attribute vector, 0 to 100. */
  similarity_percent: number;
  predicted_pressure: number;
  band: PressureBand;
  /** One sentence, from a template. */
  reason: string;
}

/**
 * PROVISIONAL. Derived from F5.
 *
 * `alternatives` can legitimately be empty: when nothing similar has lower
 * pressure, F5 requires saying so rather than returning a bad match. In that
 * case `message` carries the explanation.
 */
/**
 * CONFIRMED. The response carries only the id, the list and the message — the
 * source destination's own `name` and `band` are not repeated, because the
 * caller already knows them.
 */
export interface AlternativesResponse {
  destination_id: number;
  alternatives: Alternative[];
  message: string | null;
}

/* ------------------------------------------------------------------ */
/* POST /api/simulate  (F6) — PROVISIONAL                              */
/* ------------------------------------------------------------------ */

/**
 * PROVISIONAL. The three sliders in F6, all on the same 0 to 100 scale.
 *
 * `expected_visitor_level` was called `expected_tourists` and documented as a
 * count of visitors per month. It is a 0 to 100 level now, because all three
 * sliders share one scale and a field named `expected_tourists` holding `45`
 * would almost certainly be implemented on the other side as forty-five
 * visitors. Renamed while the endpoint is still unsigned rather than after.
 */
export interface SimulateRequest {
  destination_id: number;
  /**
   * How busy the place is expected to be, 0 to 100 — a slider position, not a
   * headcount. Higher means more visitors, so raising it can only lower the
   * score.
   *
   * The frontend briefly renamed this `expected_visitor_level` on the grounds
   * that `expected_tourists` reads like a count. The backend independently
   * settled on the same 0-100 meaning but kept the original name, and the
   * backend is the contract, so the name is back.
   */
  expected_tourists: number;
  /** Waste management level, 0 to 100. Higher is better. */
  waste_management_level: number;
  /** Infrastructure level, 0 to 100. Higher is better. */
  infrastructure_level: number;
}

/** The three slider fields on their own, for the reset baseline. */
export type SimulateInputs = Omit<SimulateRequest, 'destination_id'>;

/**
 * PROVISIONAL. Derived from F6. This re-runs the same index calculation with
 * changed inputs, so the contributions are exact, never estimated.
 */
export interface SimulateResponse {
  destination_id: number;
  /** Recomputed score, 0 to 100. */
  sustainability_score: number;
  /** The score before the sliders were moved, so the UI can show the delta. */
  baseline_score: number;
  /** `sustainability_score - baseline_score`. Negative means a worse outcome. */
  delta: number;
  factors: FactorScores;
  contributions: ExactContribution[];
  /**
   * Set when the change drops the score by more than 10 points, else null.
   * The API works this out, because the API is what knows the weights.
   */
  warning: string | null;
}

/* ------------------------------------------------------------------ */
/* GET /api/dashboard/summary  (F8) — PROVISIONAL                      */
/* ------------------------------------------------------------------ */

/** PROVISIONAL. How many monitored destinations sit in each band. */
export type BandCounts = Record<PressureBand, number>;

/**
 * CONFIRMED. One high-pressure destination on the authority dashboard.
 *
 * There is no per-row `recommended_action`; the dashboard carries a single
 * one at the top level.
 */
export interface DashboardHotspot {
  destination_id: number;
  name: string;
  region: string;
  /** May be fractional — round it for display. */
  predicted_pressure: number;
  band: PressureBand;
}

/** PROVISIONAL. One bar in the global SHAP feature importance chart. */
export interface FeatureImportance {
  feature: string;
  /** Mean absolute SHAP value across the training set. */
  importance: number;
}

/** CONFIRMED. Response `data` for `GET /api/dashboard/summary`. */
export interface DashboardSummaryResponse {
  destinations_monitored: number;
  band_counts: BandCounts;
  /** Highest-pressure destinations first. */
  highest_pressure: DashboardHotspot[];
  /** One overall action for the whole dashboard, generated from the data. */
  recommended_action: string;
  global_feature_importance: FeatureImportance[];
}

/* ------------------------------------------------------------------ */
/* POST /api/auth/login  (F8) — PROVISIONAL                            */
/* ------------------------------------------------------------------ */

export type UserRole = 'authority' | 'tourist';

/** PROVISIONAL. Request body for `POST /api/auth/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * CONFIRMED. Response `data` for `POST /api/auth/login`.
 *
 * There is no `expires_in`. The session cookie uses a fixed lifetime instead —
 * see `SESSION_MAX_AGE_SECONDS` in `lib/session.ts` — which is why that
 * constant needs to stay in step with the backend's JWT expiry.
 *
 * `role` is a plain string on the wire. It is narrowed here because the app
 * only understands two roles, and anything else is treated as "not an
 * official" rather than being trusted.
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
}
