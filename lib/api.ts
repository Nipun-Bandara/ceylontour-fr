/**
 * The only place this app talks to the API from.
 *
 * Every component goes through the helpers at the bottom of this file. No
 * component calls `fetch` itself — that rule is what makes the mock switch,
 * the error handling and the envelope unwrapping work everywhere at once
 * instead of in whichever component remembered to do it.
 *
 * Three jobs:
 *   1. unwrap the `{ data, meta }` envelope so callers get the payload
 *   2. turn the `{ error: { code, message } }` shape into a thrown `ApiError`
 *   3. serve `lib/mocks.ts` instead of the network when
 *      `NEXT_PUBLIC_USE_MOCKS=true`, with a 300ms delay so loading states are
 *      actually visible while building against mocks
 */

import { isMockError, resolveMock } from '@/lib/mocks';
import type {
  AlternativesResponse,
  ApiEnvelope,
  ApiErrorBody,
  DashboardSummaryResponse,
  DestinationDetailResponse,
  DestinationsResponse,
  LoginRequest,
  LoginResponse,
  RecommendRequest,
  RecommendResponse,
  RiskResponse,
  SimulateRequest,
  SimulateResponse,
  TravelMonth,
} from '@/types/api';

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

/**
 * These two are read as full literal `process.env.NEXT_PUBLIC_*` expressions
 * on purpose. Next.js inlines them at build time by textual substitution, so
 * `process.env[someVariable]` would quietly be undefined in the browser.
 */
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/** How long the mock layer waits before resolving, in milliseconds. */
export const MOCK_DELAY_MS = 300;

/** True when this build is serving mock data instead of calling the API. */
export function isUsingMocks(): boolean {
  return USE_MOCKS;
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

/** Codes this wrapper raises itself, as opposed to codes the API sends back. */
export const CLIENT_ERROR_CODES = {
  /** `NEXT_PUBLIC_API_URL` is missing and mocks are off. */
  config: 'client_config_error',
  /** The request never got a response — server down, DNS, CORS, offline. */
  network: 'client_network_error',
  /** A response arrived but was not the agreed envelope shape. */
  invalidResponse: 'client_invalid_response',
  /** Mocks are on but `lib/mocks.ts` has nothing for this path. */
  mockMissing: 'client_mock_missing',
} as const;

/**
 * Every failure out of this module is an `ApiError`, so a component only ever
 * has one error type to handle.
 *
 * `status` is 0 for failures raised on this side of the network.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  /** True when the failure happened before the API could answer. */
  get isClientSide(): boolean {
    return this.status === 0;
  }
}

/** Narrowing helper, so `catch` blocks do not have to cast. */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/* ------------------------------------------------------------------ */
/* Envelope handling                                                   */
/* ------------------------------------------------------------------ */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Matches the `{ error: { code, message } }` shape from the contract. */
function asErrorBody(value: unknown): ApiErrorBody | undefined {
  if (!isObject(value) || !isObject(value.error)) return undefined;
  const { code, message } = value.error;
  if (typeof code !== 'string' || typeof message !== 'string') return undefined;
  return { error: { code, message } };
}

/** Matches the `{ data, meta }` shape from the contract. */
function asEnvelope<T>(value: unknown): ApiEnvelope<T> | undefined {
  if (!isObject(value)) return undefined;
  if (!('data' in value) || !isObject(value.meta)) return undefined;
  const { model_version, index_version } = value.meta;
  if (typeof model_version !== 'string' || typeof index_version !== 'string') {
    return undefined;
  }
  return {
    data: value.data as T,
    meta: { model_version, index_version },
  };
}

/* ------------------------------------------------------------------ */
/* The request                                                         */
/* ------------------------------------------------------------------ */

export interface RequestOptions {
  method?: 'GET' | 'POST';
  /** Serialised as JSON. Leave unset for GET. */
  body?: unknown;
  /** Bearer token, for the endpoints behind auth. */
  token?: string;
  signal?: AbortSignal;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function serveMock<T>(
  method: string,
  path: string,
  body: unknown
): Promise<ApiEnvelope<T>> {
  await delay(MOCK_DELAY_MS);
  const mock = resolveMock(method, path, body);
  if (!mock) {
    throw new ApiError(
      CLIENT_ERROR_CODES.mockMissing,
      `No mock defined for ${method} ${path}. Add one to lib/mocks.ts.`
    );
  }
  // A mock can stand in for an error response as well as a success one, so
  // that failures like a 404 are thrown exactly as they would be against the
  // real API and the UI handling is genuinely exercised.
  if (isMockError(mock)) {
    throw new ApiError(mock.body.error.code, mock.body.error.message, mock.status);
  }
  return mock as ApiEnvelope<T>;
}

/**
 * Calls the API and returns the whole envelope, `meta` included.
 *
 * Use this when a component needs `model_version` or `index_version` to show
 * alongside a result. Most callers want `apiFetch` instead.
 */
export async function apiFetchWithMeta<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiEnvelope<T>> {
  const method = options.method ?? 'GET';

  if (USE_MOCKS) {
    return serveMock<T>(method, path, options.body);
  }

  if (!API_BASE_URL) {
    throw new ApiError(
      CLIENT_ERROR_CODES.config,
      'NEXT_PUBLIC_API_URL is not set. Set it, or set NEXT_PUBLIC_USE_MOCKS=true to run without a backend.'
    );
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (cause) {
    // Let an intentional abort surface as itself rather than as a failure.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(
      CLIENT_ERROR_CODES.network,
      'Could not reach the CeylonTour API. Check that it is running.'
    );
  }

  // 204 and friends have no body to parse.
  const raw = await response.text();
  let parsed: unknown = undefined;
  if (raw.length > 0) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = undefined;
    }
  }

  if (!response.ok) {
    const errorBody = asErrorBody(parsed);
    if (errorBody) {
      throw new ApiError(
        errorBody.error.code,
        errorBody.error.message,
        response.status
      );
    }
    // A non-2xx that did not follow the contract. Still an ApiError, so
    // callers never have to handle a second error type.
    throw new ApiError(
      CLIENT_ERROR_CODES.invalidResponse,
      `The API returned ${response.status} without the agreed error shape.`,
      response.status
    );
  }

  const envelope = asEnvelope<T>(parsed);
  if (!envelope) {
    throw new ApiError(
      CLIENT_ERROR_CODES.invalidResponse,
      'The API response was not the agreed { data, meta } envelope.',
      response.status
    );
  }

  return envelope;
}

/**
 * Calls the API and returns just the payload, with the envelope unwrapped.
 * This is what components use.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data } = await apiFetchWithMeta<T>(path, options);
  return data;
}

/* ------------------------------------------------------------------ */
/* The eight endpoints                                                 */
/* ------------------------------------------------------------------ */

/** F2, F3 — ranked destinations with scores and contributions. */
export function postRecommend(
  request: RecommendRequest,
  options: RequestOptions = {}
): Promise<RecommendResponse> {
  return apiFetch<RecommendResponse>('/api/recommend', {
    ...options,
    method: 'POST',
    body: request,
  });
}

/** F7 — all destinations with coordinates and current band. */
export function getDestinations(
  options: RequestOptions = {}
): Promise<DestinationsResponse> {
  return apiFetch<DestinationsResponse>('/api/destinations', {
    ...options,
    method: 'GET',
  });
}

/** F7 — one destination in full. */
export function getDestination(
  id: number,
  options: RequestOptions = {}
): Promise<DestinationDetailResponse> {
  return apiFetch<DestinationDetailResponse>(`/api/destinations/${id}`, {
    ...options,
    method: 'GET',
  });
}

/**
 * F4 — pressure forecast, band and SHAP breakdown for a month.
 *
 * The only helper that hands back the whole envelope rather than just `data`.
 * F4 requires the model version to be shown next to the forecast, so that any
 * number a user was given can be traced back to the model that produced it,
 * and that version lives in `meta`. The other helpers will want the same
 * treatment as soon as a view of theirs displays a version.
 */
export function getRisk(
  id: number,
  month: TravelMonth,
  options: RequestOptions = {}
): Promise<ApiEnvelope<RiskResponse>> {
  return apiFetchWithMeta<RiskResponse>(`/api/risk/${id}?month=${month}`, {
    ...options,
    method: 'GET',
  });
}

/** F5 — similar destinations with lower pressure. */
export function getAlternatives(
  id: number,
  options: RequestOptions = {}
): Promise<AlternativesResponse> {
  return apiFetch<AlternativesResponse>(`/api/alternatives/${id}`, {
    ...options,
    method: 'GET',
  });
}

/** F6 — score recomputed from adjusted inputs. */
export function postSimulate(
  request: SimulateRequest,
  options: RequestOptions = {}
): Promise<SimulateResponse> {
  return apiFetch<SimulateResponse>('/api/simulate', {
    ...options,
    method: 'POST',
    body: request,
  });
}

/** F8 — authority overview. Needs a token. */
export function getDashboardSummary(
  token: string,
  options: RequestOptions = {}
): Promise<DashboardSummaryResponse> {
  return apiFetch<DashboardSummaryResponse>('/api/dashboard/summary', {
    ...options,
    method: 'GET',
    token,
  });
}

/** F8 — issue a JWT for an authority user. */
export function postLogin(
  request: LoginRequest,
  options: RequestOptions = {}
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    ...options,
    method: 'POST',
    body: request,
  });
}
