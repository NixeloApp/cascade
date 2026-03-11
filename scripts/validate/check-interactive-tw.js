/**
 * CHECK: Interactive Tailwind
 *
 * Flags hover:/focus:/active:/disabled: Tailwind variants outside of ui/ folder.
 * Interactive states should be encapsulated in CVA component variants for consistency.
 *
 * Allowed in:
 * - src/components/ui/ (CVA components live here)
 * - Files in ALLOWED_FILES list (gradual migration)
 *
 * @strictness MEDIUM - Warnings only. ~230 files in migration allowlist.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

/**
 * Files allowed to have interactive Tailwind variants (hover:/focus:/etc).
 *
 * MIGRATION NOTE: This list is intentionally minimal. Interactive states
 * should be encapsulated in CVA components (Button, IconButton, Card hoverable, etc).
 *
 * Only files that genuinely need low-level interactive control are allowed:
 * - Third-party integrations (Plate editor)
 * - Complex drag-and-drop surfaces
 */
const ALLOWED_FILES = [
  // Third-party editor integration - needs low-level control
  "Plate/",
  "PlateEditor.tsx",
];

// Interactive variant patterns to detect
const INTERACTIVE_PATTERNS = [
  /\bhover:/,
  /\bfocus:/,
  /\bactive:/,
  /\bdisabled:/,
  /\bfocus-within:/,
  /\bfocus-visible:/,
  /\bgroup-hover:/,
  /\bpeer-hover:/,
];

export function run() {
  const SRC_DIR = path.join(ROOT, "src/components");

  let errorCount = 0;
  let allowedCount = 0;
  const errors = [];

  // Get all TSX files in components (excluding ui/)
  const files = walkDir(SRC_DIR, { extensions: new Set([".tsx"]) });

  for (const filePath of files) {
    const rel = relPath(filePath);

    // Skip ui/ folder - CVA components live here
    if (rel.includes("components/ui/")) continue;

    // Skip test files
    if (rel.includes(".test.")) continue;

    // Check if file is in allowed list
    const isAllowed = ALLOWED_FILES.some((pattern) => rel.includes(pattern));

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip comments
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

      // Check for interactive patterns
      for (const pattern of INTERACTIVE_PATTERNS) {
        if (pattern.test(line)) {
          if (isAllowed) {
            allowedCount++;
          } else {
            errors.push(
              `  ${c.red}ERROR${c.reset} ${rel}:${i + 1} - Interactive Tailwind variant outside ui/. Move to CVA component.`,
            );
            errorCount++;
          }
          break; // Only report once per line
        }
      }
    }
  }

  const detail =
    errorCount > 0
      ? `${errorCount} violation(s), ${allowedCount} allowed`
      : `${allowedCount} in migration allowlist`;

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail,
    messages: errors,
  };
}
