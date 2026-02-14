/**
 * CHECK 11: UI Patterns
 * Enforces component usage patterns:
 *   1. AuthPageLayout — Auth-related pages should use AuthPageLayout
 *
 * Note: DialogDescription is now enforced via TypeScript (required `description` prop)
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  // Routes that should use AuthPageLayout
  const AUTH_ROUTES_DIR = path.join(ROOT, "src/routes/(auth)");

  // Auth page components that should use AuthPageLayout (standalone pages, not forms)
  const AUTH_PAGE_PATTERNS = [/UnsubscribePage/i, /EmailVerificationRequired/i];

  // Form components are embedded in pages, they don't use AuthPageLayout themselves
  const AUTH_FORM_EXCLUSIONS = [/Form\.tsx$/i, /Button\.tsx$/i, /Link\.tsx$/i];

  let errorCount = 0;
  const errors = [];

  function reportError(filePath, line, message) {
    const rel = relPath(filePath);
    errors.push(`  ${c.red}ERROR${c.reset} ${rel}:${line} - ${message}`);
    errorCount++;
  }

  /**
   * Check: AuthPageLayout for auth routes
   */
  function checkAuthPageLayout(filePath) {
    const rel = relPath(filePath);

    if (AUTH_FORM_EXCLUSIONS.some((pattern) => pattern.test(rel))) return;

    const isAuthRoute = filePath.startsWith(AUTH_ROUTES_DIR);
    const isAuthPage = AUTH_PAGE_PATTERNS.some((pattern) => pattern.test(rel));

    if (!isAuthRoute && !isAuthPage) return;

    const content = fs.readFileSync(filePath, "utf-8");

    if (rel.includes(".test.") || rel.includes(".spec.")) return;
    if (rel.endsWith("layout.tsx") || rel.endsWith("__root.tsx")) return;

    const usesAuthPageLayout = content.includes("AuthPageLayout");
    const isPageComponent =
      content.includes("export function") ||
      content.includes("export const") ||
      content.includes("createFileRoute");

    if (isPageComponent && !usesAuthPageLayout) {
      const hasAuthUI =
        content.includes("<form") ||
        content.includes("<Input") ||
        content.includes("<Button") ||
        content.includes("useState");

      if (hasAuthUI) {
        reportError(filePath, 1, `Auth page should use AuthPageLayout for consistent styling.`);
      }
    }
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".tsx"]) });

  for (const f of files) {
    checkAuthPageLayout(f);
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : null,
    messages: errors,
  };
}
