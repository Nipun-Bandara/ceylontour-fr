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

import type {
  AlternativesResponse,
  ApiEnvelope,
  ApiMeta,
  DashboardSummaryResponse,
  DestinationDetailResponse,
  DestinationsResponse,
  LoginResponse,
  RecommendResponse,
  RiskResponse,
  SimulateResponse,
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
      contributions: [
        { factor: 'environmental', percent: 34, type: 'exact' },
        { factor: 'crowd', percent: 24, type: 'exact' },
        { factor: 'community', percent: 18, type: 'exact' },
        { factor: 'suitability', percent: 15, type: 'exact' },
        { factor: 'infrastructure', percent: 9, type: 'exact' },
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
      contributions: [
        { factor: 'infrastructure', percent: 26, type: 'exact' },
        { factor: 'suitability', percent: 24, type: 'exact' },
        { factor: 'community', percent: 20, type: 'exact' },
        { factor: 'environmental', percent: 18, type: 'exact' },
        { factor: 'crowd', percent: 12, type: 'exact' },
      ],
      explanation:
        'Ranked below Kalpitiya mainly because of high visitor pressure.',
      confidence: 'measured',
    },
  ],
});

/* ------------------------------------------------------------------ */
/* GET /api/destinations                                               */
/* ------------------------------------------------------------------ */

export const mockDestinations: ApiEnvelope<DestinationsResponse> = envelope({
  destinations: [
    {
      destination_id: MOCK_IDS.belihuloya,
      name: 'Belihuloya',
      lat: 6.7167,
      lon: 80.7833,
      district: 'Ratnapura',
      region: 'Sabaragamuwa',
      band: 'low',
      sustainability_score: 89,
    },
    {
      destination_id: MOCK_IDS.meemure,
      name: 'Meemure',
      lat: 7.3667,
      lon: 80.8333,
      district: 'Kandy',
      region: 'Central',
      band: 'low',
      sustainability_score: 86,
    },
    {
      destination_id: MOCK_IDS.knuckles,
      name: 'Knuckles',
      lat: 7.45,
      lon: 80.7833,
      district: 'Matale',
      region: 'Central',
      band: 'medium',
      sustainability_score: 79,
    },
    {
      destination_id: MOCK_IDS.kalpitiya,
      name: 'Kalpitiya',
      lat: 8.2333,
      lon: 79.7667,
      district: 'Puttalam',
      region: 'North Western',
      band: 'medium',
      sustainability_score: 72,
    },
    {
      destination_id: MOCK_IDS.ella,
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

export const mockDestinationDetail: Record<
  number,
  ApiEnvelope<DestinationDetailResponse>
> = {
  [MOCK_IDS.belihuloya]: envelope({
    destination_id: MOCK_IDS.belihuloya,
    name: 'Belihuloya',
    lat: 6.7167,
    lon: 80.7833,
    district: 'Ratnapura',
    region: 'Sabaragamuwa',
    band: 'low',
    sustainability_score: 89,
    landscape_type: 'montane river valley',
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
    destination_id: MOCK_IDS.meemure,
    name: 'Meemure',
    lat: 7.3667,
    lon: 80.8333,
    district: 'Kandy',
    region: 'Central',
    band: 'low',
    sustainability_score: 86,
    landscape_type: 'remote forest village',
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
    destination_id: MOCK_IDS.knuckles,
    name: 'Knuckles',
    lat: 7.45,
    lon: 80.7833,
    district: 'Matale',
    region: 'Central',
    band: 'medium',
    sustainability_score: 79,
    landscape_type: 'montane cloud forest',
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
    destination_id: MOCK_IDS.kalpitiya,
    name: 'Kalpitiya',
    lat: 8.2333,
    lon: 79.7667,
    district: 'Puttalam',
    region: 'North Western',
    band: 'medium',
    sustainability_score: 72,
    landscape_type: 'coastal lagoon and peninsula',
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
    destination_id: MOCK_IDS.ella,
    name: 'Ella',
    lat: 6.8667,
    lon: 81.0466,
    district: 'Badulla',
    region: 'Uva',
    band: 'high',
    sustainability_score: 58,
    landscape_type: 'hill country town',
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
    name: 'Ella',
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
    scope_note: SCOPE_NOTE,
  }),
  [MOCK_IDS.kalpitiya]: envelope({
    destination_id: MOCK_IDS.kalpitiya,
    name: 'Kalpitiya',
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
    scope_note: SCOPE_NOTE,
  }),
  [MOCK_IDS.knuckles]: envelope({
    destination_id: MOCK_IDS.knuckles,
    name: 'Knuckles',
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
    scope_note: SCOPE_NOTE,
  }),
  [MOCK_IDS.belihuloya]: envelope({
    destination_id: MOCK_IDS.belihuloya,
    name: 'Belihuloya',
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
    scope_note: SCOPE_NOTE,
  }),
  [MOCK_IDS.meemure]: envelope({
    destination_id: MOCK_IDS.meemure,
    name: 'Meemure',
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
    scope_note: SCOPE_NOTE,
  }),
};

/* ------------------------------------------------------------------ */
/* GET /api/alternatives/{id}                                          */
/* ------------------------------------------------------------------ */

export const mockAlternatives: Record<
  number,
  ApiEnvelope<AlternativesResponse>
> = {
  [MOCK_IDS.ella]: envelope({
    destination_id: MOCK_IDS.ella,
    name: 'Ella',
    band: 'high',
    alternatives: [
      {
        destination_id: MOCK_IDS.belihuloya,
        name: 'Belihuloya',
        similarity_percent: 82,
        predicted_pressure: 28,
        band: 'low',
        reason:
          'Similar hill country walking and waterfalls, with far fewer visitors this month.',
      },
      {
        destination_id: MOCK_IDS.knuckles,
        name: 'Knuckles',
        similarity_percent: 76,
        predicted_pressure: 55,
        band: 'medium',
        reason:
          'Similar montane landscape and trekking, with moderate visitor pressure.',
      },
      {
        destination_id: MOCK_IDS.meemure,
        name: 'Meemure',
        similarity_percent: 68,
        predicted_pressure: 19,
        band: 'low',
        reason:
          'Similar climate and hiking, and the lowest forecast pressure of any comparable destination.',
      },
    ],
    message: null,
  }),
  // The empty case. F5 requires saying so rather than returning a bad match,
  // so the shell has something real to build the empty state against.
  [MOCK_IDS.meemure]: envelope({
    destination_id: MOCK_IDS.meemure,
    name: 'Meemure',
    band: 'low',
    alternatives: [],
    message:
      'Meemure already has the lowest forecast pressure of any similar destination, so there is nothing quieter to suggest.',
  }),
};

/* ------------------------------------------------------------------ */
/* POST /api/simulate                                                  */
/* ------------------------------------------------------------------ */

/**
 * The mock ignores the slider values and always returns this one drop, so the
 * simulator page has both a recomputed score and a warning to render. The real
 * endpoint recalculates from the request.
 */
export const mockSimulate: ApiEnvelope<SimulateResponse> = envelope({
  destination_id: MOCK_IDS.belihuloya,
  sustainability_score: 74,
  baseline_score: 89,
  delta: -15,
  factors: {
    environmental: 71,
    community: 86,
    crowd: 62,
    infrastructure: 79,
    suitability: 90,
  },
  contributions: [
    { factor: 'crowd', percent: 30, type: 'exact' },
    { factor: 'environmental', percent: 28, type: 'exact' },
    { factor: 'community', percent: 20, type: 'exact' },
    { factor: 'suitability', percent: 13, type: 'exact' },
    { factor: 'infrastructure', percent: 9, type: 'exact' },
  ],
  warning:
    'This many visitors drops the sustainability score by 15 points, mostly through crowding and environmental strain.',
});

/* ------------------------------------------------------------------ */
/* GET /api/dashboard/summary                                          */
/* ------------------------------------------------------------------ */

export const mockDashboardSummary: ApiEnvelope<DashboardSummaryResponse> =
  envelope({
    destinations_monitored: 5,
    band_counts: { low: 2, medium: 2, high: 1 },
    highest_pressure: [
      {
        destination_id: MOCK_IDS.ella,
        name: 'Ella',
        region: 'Uva',
        predicted_pressure: 84,
        band: 'high',
        recommended_action:
          'Uva is forecast at 84% occupancy for September. Consider promoting Belihuloya and Meemure as alternatives.',
      },
      {
        destination_id: MOCK_IDS.kalpitiya,
        name: 'Kalpitiya',
        region: 'North Western',
        predicted_pressure: 61,
        band: 'medium',
        recommended_action:
          'Pressure is rising in North Western. Monitor lagoon capacity through the kitesurfing season.',
      },
      {
        destination_id: MOCK_IDS.knuckles,
        name: 'Knuckles',
        region: 'Central',
        predicted_pressure: 55,
        band: 'medium',
        recommended_action:
          'Trekking permits in Central are within capacity but should be reviewed monthly.',
      },
    ],
    global_feature_importance: [
      { feature: 'month', importance: 0.31 },
      { feature: 'recent_occupancy', importance: 0.27 },
      { feature: 'arrival_trend', importance: 0.19 },
      { feature: 'region', importance: 0.16 },
      { feature: 'holiday_indicator', importance: 0.07 },
    ],
  });

/* ------------------------------------------------------------------ */
/* POST /api/auth/login                                                */
/* ------------------------------------------------------------------ */

/**
 * Not a real token and not a real credential check. The mock always succeeds.
 * Real auth is D's work on the backend; nothing here ever validates anything.
 */
export const mockLogin: ApiEnvelope<LoginResponse> = envelope({
  access_token: 'mock.jwt.token-not-a-real-credential',
  token_type: 'bearer',
  role: 'authority',
  expires_in: 3600,
});

/* ------------------------------------------------------------------ */
/* Routing                                                             */
/* ------------------------------------------------------------------ */

/** Pulls the numeric id out of a path like `/api/risk/3`. */
function idFrom(segment: string | undefined): number | undefined {
  if (segment === undefined) return undefined;
  const id = Number.parseInt(segment, 10);
  return Number.isNaN(id) ? undefined : id;
}

/**
 * Maps a method and path to a mock envelope. Returns `undefined` when nothing
 * matches, which `lib/api.ts` turns into a loud error rather than an empty
 * screen — a missing mock should be obvious immediately.
 *
 * The query string is ignored. `?month=` changes nothing in the mock data.
 */
export function resolveMock(
  method: string,
  path: string
): ApiEnvelope<unknown> | undefined {
  const [pathname] = path.split('?');
  const segments = (pathname ?? '').split('/').filter(Boolean); // ['api', 'risk', '3']
  const [, resource, idSegment] = segments;
  const id = idFrom(idSegment);
  const verb = method.toUpperCase();

  if (verb === 'POST') {
    switch (resource) {
      case 'recommend':
        return mockRecommend;
      case 'simulate':
        return mockSimulate;
      case 'auth':
        return idSegment === 'login' ? mockLogin : undefined;
      default:
        return undefined;
    }
  }

  if (verb !== 'GET') return undefined;

  switch (resource) {
    case 'destinations':
      if (id === undefined) return mockDestinations;
      return mockDestinationDetail[id];
    case 'risk':
      return id === undefined ? undefined : mockRisk[id];
    case 'alternatives':
      return id === undefined ? undefined : mockAlternatives[id];
    case 'dashboard':
      return idSegment === 'summary' ? mockDashboardSummary : undefined;
    default:
      return undefined;
  }
}
