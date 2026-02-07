/**
 * Convex URL utilities
 */

/**
 * Get the Convex HTTP site URL from the environment
 *
 * Derives the site URL from VITE_CONVEX_URL:
 * - https://xxx.convex.cloud -> https://xxx.convex.site
 */
export function getConvexSiteUrl(): string {
  return (import.meta.env.VITE_CONVEX_URL as string).replace(".convex.cloud", ".convex.site");
}
