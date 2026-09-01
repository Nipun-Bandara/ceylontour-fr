/**
 * Design tokens — the single source of truth for colour in this app.
 *
 * Rule: components never write a raw hex value. They use the named Tailwind
 * classes generated from this file (`bg-band-low`, `text-ink`, and so on).
 * tailwind.config.ts is the only file that reads these values directly.
 *
 * The traffic-light bands are fixed by the feature spec: green = low pressure,
 * amber = medium, red = high. The map (F7), the risk view (F4) and the
 * authority dashboard (F8) all read from here, so they cannot disagree about
 * what colour a destination is.
 */

/** Pressure band colours. Green / amber / red, in that order. */
export const bandColors = {
  /** Low visitor pressure — green. */
  low: '#15803d',
  /** Medium visitor pressure — amber. */
  medium: '#b45309',
  /** High visitor pressure — red. */
  high: '#b91c1c',
} as const;

/**
 * Tinted backgrounds for the same three bands, for pills and card headers
 * where the solid colour would be too heavy behind text.
 */
export const bandSurfaceColors = {
  low: '#dcfce7',
  medium: '#fef3c7',
  high: '#fee2e2',
} as const;

/**
 * Contribution kinds (F3). Exact index contributions and estimated SHAP
 * values must be distinguishable without reading a tooltip, so they get
 * their own tokens rather than reusing the band colours.
 */
export const contributionColors = {
  /** Computed directly from the index weights — drawn as solid bars. */
  exact: '#0f766e',
  /** TreeSHAP estimate — drawn as hatched or outlined bars. */
  estimated: '#7c3aed',
} as const;

/**
 * Confidence labels (F2, and the cross-cutting confidence rule). `measured`
 * means the factor values came from real data, `estimated` means they came
 * from a proxy.
 *
 * These deliberately echo the contribution colours above — anything estimated
 * reads violet across the whole app — but they stay separate tokens, because
 * confidence is a property of the input data and contribution kind is a
 * property of the explanation. F3 can change one without disturbing the other.
 */
export const confidenceColors = {
  measured: '#0f766e',
  estimated: '#7c3aed',
} as const;

/** Tinted chip backgrounds for the same two labels. */
export const confidenceSurfaceColors = {
  measured: '#ccfbf1',
  estimated: '#ede9fe',
} as const;

/** Neutral text and surface colours. */
export const neutralColors = {
  /** Primary body text. */
  ink: '#0f172a',
  /** Secondary text, captions, footnotes. */
  muted: '#64748b',
  /** Hairline borders on cards and dividers. */
  line: '#e2e8f0',
  /** Page background behind cards. */
  surface: '#f8fafc',
} as const;

/** Brand colour, used for the header wordmark and primary actions. */
export const brandColors = {
  DEFAULT: '#065f46',
  dark: '#064e3b',
  light: '#ecfdf5',
} as const;

export type BandToken = keyof typeof bandColors;
export type ContributionToken = keyof typeof contributionColors;
export type ConfidenceToken = keyof typeof confidenceColors;
