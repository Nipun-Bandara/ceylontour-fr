import type { Config } from 'tailwindcss';
import {
  bandColors,
  bandSurfaceColors,
  brandColors,
  contributionColors,
  neutralColors,
} from './design-tokens';

/**
 * Every colour here comes from design-tokens.ts. Do not add a hex value
 * directly to this file, and do not add one to a component either — add a
 * token and use the class name it generates.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // bg-band-low / text-band-medium / border-band-high
        band: bandColors,
        // bg-band-surface-low, for tinted pills
        'band-surface': bandSurfaceColors,
        // bg-contribution-exact / bg-contribution-estimated
        contribution: contributionColors,
        brand: brandColors,
        ...neutralColors,
      },
    },
  },
  plugins: [],
};

export default config;
