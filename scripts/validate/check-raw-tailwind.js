/**
 * CHECK: Raw Tailwind
 * Flags generic raw Tailwind usage outside the approved component areas.
 *
 * This check is intentionally narrow:
 * - generic raw utility policing lives here
 * - design-system ownership lives in check-design-system-ownership.js
 * - JSX prop misuse lives in check-layout-prop-usage.js
 */

import fs from "node:fs";
import path from "node:path";
import {
  isAllowedByPolicy,
  RAW_TAILWIND_ALLOWED_DIRS,
  RAW_TAILWIND_ALLOWED_EXTENSIONS,
  RAW_TAILWIND_ALLOWED_FILES,
  RAW_TAILWIND_PATTERNS,
} from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const srcDir = path.join(ROOT, "src/components");
  const files = walkDir(srcDir, { extensions: new Set([".tsx"]) });
  const violations = [];

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (
      isAllowedByPolicy(
        rel,
        RAW_TAILWIND_ALLOWED_DIRS,
        RAW_TAILWIND_ALLOWED_FILES,
        RAW_TAILWIND_ALLOWED_EXTENSIONS,
      )
    ) {
      continue;
    }

    const lines = fs.readFileSync(filePath, "utf-8").split("\n");
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (!line.includes("className")) continue;

      for (const { pattern, replacement } of RAW_TAILWIND_PATTERNS) {
        if (!pattern.test(line)) continue;

        violations.push({
          file: rel,
          line: index + 1,
          replacement,
        });
        break;
      }
    }
  }

  const messages = [];
  if (violations.length > 0) {
    messages.push(`${c.red}Raw Tailwind violations:${c.reset}`);
    const byFile = violations.reduce((groups, item) => {
      const bucket = groups[item.file] ?? [];
      bucket.push(item);
      groups[item.file] = bucket;
      return groups;
    }, {});

    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 3)) {
        messages.push(`    ${c.dim}L${item.line}${c.reset} → use ${item.replacement}`);
      }
      if (items.length > 3) {
        messages.push(`    ${c.dim}... and ${items.length - 3} more${c.reset}`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    errors: violations.length,
    detail: violations.length > 0 ? `${violations.length} raw Tailwind violations` : null,
    messages,
  };
}
