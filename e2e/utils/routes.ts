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
  // Replace dynamic segments first, then escape remaining regex metacharacters
  const withWildcards = path.replace(/\$\w+/g, "__WILDCARD__");
  const escaped = withWildcards.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped.replace(/__WILDCARD__/g, "[^/]+") + suffix);
}

/**
 * Escape special regex characters in a string for safe use in `new RegExp()`.
 *
 * @example
 *   const escaped = escapeRegExp(issueTitle);
 *   await page.getByRole("button", { name: new RegExp(escaped) });
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
