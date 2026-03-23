/** Shared formatting helpers for Convex server functions. */

/** Format a number as USD currency (e.g., "$1,234.56"). */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
}
