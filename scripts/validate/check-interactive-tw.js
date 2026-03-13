/**
 * CHECK: Interactive Tailwind
 *
 * Flags hover:/focus:/active:/disabled: Tailwind variants outside of ui/ folder.
 * Interactive states should be encapsulated in CVA component variants for consistency.
 */

import fs from "node:fs";
import path from "node:path";
import { collectClassNameSpan } from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

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
  const errors = [];

  // Get all TSX files in components (excluding ui/)
  const files = walkDir(SRC_DIR, { extensions: new Set([".tsx"]) });

  for (const filePath of files) {
    const rel = relPath(filePath);

    // Skip ui/ folder - CVA components live here
    if (rel.includes("components/ui/")) continue;

    // Skip test files
    if (rel.includes(".test.")) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/\bclassName\s*=/.test(line)) continue;

      const { span, endIndex } = collectClassNameSpan(lines, i);

      for (const pattern of INTERACTIVE_PATTERNS) {
        if (pattern.test(span)) {
          errors.push(
            `  ${c.red}ERROR${c.reset} ${rel}:${i + 1} - Interactive Tailwind variant outside ui/. Move to CVA component.`,
          );
          errorCount++;
          break; // Only report once per line
        }
      }

      i = endIndex;
    }
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : "direct enforcement",
    messages: errors,
  };
}
