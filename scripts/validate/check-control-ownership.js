/**
 * CHECK: Control Ownership
 *
 * High-level app code should use semantic primitives:
 * - SegmentedControl for single-select mode/filter switches
 * - RouteNav for route/page navigation
 *
 * The low-level ToggleGroup primitive is reserved for shared UI internals and
 * special animated controls that cannot be expressed with SegmentedControl yet.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const TOGGLE_GROUP_IMPORT_RE =
  /import\s*\{[\s\S]*\bToggleGroup\b[\s\S]*\}\s*from\s*["'][^"']*ToggleGroup["']/;
const ALLOWED_TOGGLE_GROUP_FILES = new Set([
  "src/components/Calendar/shadcn-calendar/header/actions/calendar-header-actions-mode.tsx",
]);

export function run() {
  const SRC_DIR = path.join(ROOT, "src");
  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx"]) });

  let errorCount = 0;
  const errors = [];

  for (const filePath of files) {
    const rel = relPath(filePath);

    if (rel.includes(".test.") || rel.includes(".spec.") || rel.includes(".stories.")) continue;
    if (rel.startsWith("src/components/ui/")) continue;
    if (ALLOWED_TOGGLE_GROUP_FILES.has(rel)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    if (!TOGGLE_GROUP_IMPORT_RE.test(content)) continue;

    errors.push(
      `  ${c.red}ERROR${c.reset} ${rel}:1 - Imported ToggleGroup outside ui/. Use SegmentedControl, or explicitly model a specialized primitive.`,
    );
    errorCount++;
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : null,
    messages: errors,
  };
}
