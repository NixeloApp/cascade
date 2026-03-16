/**
 * Re-export ROUTES from convex/shared for E2E tests
 * This avoids path alias issues in Playwright tests
 */
export { ROUTES } from "../../convex/shared/routes";

/**
 * Convert a ROUTES path to a regex pattern for URL assertions.
 * Replaces dynamic segments ($orgSlug, $key, etc.) with [^/]+ wildcards.
 *
 * @example
 *   // Instead of: toHaveURL(new RegExp(ROUTES.projects.board.path.replace(/\$\w+/g, "[^/]+")))
 *   // Use:        toHaveURL(routePattern(ROUTES.projects.board.path))
 */
export function routePattern(path: string, suffix = ""): RegExp {
  return new RegExp(path.replace(/\$\w+/g, "[^/]+") + suffix);
}
