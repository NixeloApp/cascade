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
