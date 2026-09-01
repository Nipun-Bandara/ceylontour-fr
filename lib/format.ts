/**
 * Display formatting. Kept in one place so a budget looks the same wherever
 * it is shown.
 */

// Grouping only. The `LKR` currency style renders "LKR 50,000", which is
// correct but reads like an exchange rate; "Rs 50,000" is what a traveller in
// Sri Lanka expects to see. The locale is pinned so the server and the browser
// format identically and hydration does not mismatch.
const GROUPED = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 });

/** `50000` becomes `Rs 50,000`. */
export function formatLkr(amount: number): string {
  return `Rs ${GROUPED.format(amount)}`;
}

/** `1` becomes `1 day`, `4` becomes `4 days`. */
export function formatDays(days: number): string {
  return days === 1 ? '1 day' : `${days} days`;
}
