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
 * PROVISIONAL. The contract shows `"nature"` as an example but does not list
 * the allowed values. This set is the frontend's assumption so the form can
 * render a fixed set of choices; confirm with N and pin it in section 7.
 */
export type Interest =
  | 'nature'
  | 'culture'
  | 'adventure'
  | 'beach'
  | 'wildlife';

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
 * PROVISIONAL. Derived from the `destinations` table and the endpoint's stated
 * purpose, "all destinations with coordinates and current band".
 */
export interface DestinationSummary {
  destination_id: number;
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
 * PROVISIONAL. Derived from the `destinations` and `destination_factors`
 * tables. `source_ref` and `confidence` are not optional in the schema, and
 * they are the answer when a judge asks where a number came from.
 */
export interface DestinationDetail extends DestinationSummary {
  landscape_type: string;
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

/** PROVISIONAL. Query parameters for `GET /api/risk/{id}`. */
export interface RiskQuery {
  month: TravelMonth;
}

/**
 * PROVISIONAL. Derived from F4 and the `pressure_forecast` table.
 *
 * `contributions` is `EstimatedContribution[]` and not the wider union: every
 * value here is TreeSHAP output, so there is nothing exact to mix in.
 */
export interface RiskResponse {
  destination_id: number;
  name: string;
  /** Pressure is forecast per region, never per site. */
  region: string;
  month: TravelMonth;
  /** Predicted occupancy rate as a percentage, 0 to 100. */
  predicted_pressure: number;
  band: PressureBand;
  contributions: EstimatedContribution[];
  explanation: string;
  /**
   * Plain-language statement that this is a regional indicator, not a per-site
   * one. The data does not support per-site claims, and F4 requires the
   * *response* to say so — so the sentence is served, never written into the
   * UI. If the backend stops sending it, the line disappears rather than the
   * app quietly making a claim the data does not support.
   */
  scope: string;
}

/* ------------------------------------------------------------------ */
/* GET /api/alternatives/{id}  (F5) — PROVISIONAL                      */
/* ------------------------------------------------------------------ */

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
export interface AlternativesResponse {
  destination_id: number;
  name: string;
  band: PressureBand;
  alternatives: Alternative[];
  message: string | null;
}

/* ------------------------------------------------------------------ */
/* POST /api/simulate  (F6) — PROVISIONAL                              */
/* ------------------------------------------------------------------ */

/** PROVISIONAL. The three sliders in F6. */
export interface SimulateRequest {
  destination_id: number;
  /** Expected visitors per month. */
  expected_tourists: number;
  /** Waste management level, 0 to 100. */
  waste_management_level: number;
  /** Infrastructure level, 0 to 100. */
  infrastructure_level: number;
}

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
  /** Set when the change drops the score by more than 10 points, else null. */
  warning: string | null;
}

/* ------------------------------------------------------------------ */
/* GET /api/dashboard/summary  (F8) — PROVISIONAL                      */
/* ------------------------------------------------------------------ */

/** PROVISIONAL. How many monitored destinations sit in each band. */
export type BandCounts = Record<PressureBand, number>;

/** PROVISIONAL. One high-pressure destination on the authority dashboard. */
export interface DashboardHotspot {
  destination_id: number;
  name: string;
  region: string;
  predicted_pressure: number;
  band: PressureBand;
  /** Generated from the data, never hardcoded. */
  recommended_action: string;
}

/** PROVISIONAL. One bar in the global SHAP feature importance chart. */
export interface FeatureImportance {
  feature: string;
  /** Mean absolute SHAP value across the training set. */
  importance: number;
}

/** PROVISIONAL. Response `data` for `GET /api/dashboard/summary`. */
export interface DashboardSummaryResponse {
  destinations_monitored: number;
  band_counts: BandCounts;
  /** Highest-pressure destinations first. */
  highest_pressure: DashboardHotspot[];
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

/** PROVISIONAL. Response `data` for `POST /api/auth/login`. */
export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  role: UserRole;
  /** Token lifetime in seconds. */
  expires_in: number;
}
