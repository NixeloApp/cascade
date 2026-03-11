/**
 * CHECK: Native Confirm Dialog
 * Finds native confirm() usage that should use ConfirmDialog component.
 *
 * @strictness STRICT - Blocks CI. Use ConfirmDialog from @/components/ui/ConfirmDialog.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  const SKIP_PATTERNS = [
    /\.test\.tsx?$/,
    /\.stories\.tsx?$/,
    /ConfirmDialog\.tsx$/, // The component itself
  ];

  // Match confirm( or window.confirm(
  const CONFIRM_REGEX = /\b(?:window\.)?confirm\s*\(/g;

  let errorCount = 0;
  const errors = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (SKIP_PATTERNS.some((p) => p.test(rel))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Skip comments
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

      if (CONFIRM_REGEX.test(line)) {
        errors.push(
          `  ${c.red}ERROR${c.reset} ${rel}:${index + 1} - Use ConfirmDialog instead of native confirm()`,
        );
        errorCount++;
      }
      // Reset regex lastIndex
      CONFIRM_REGEX.lastIndex = 0;
    });
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  for (const f of files) checkFile(f);

  let detail = null;
  if (errorCount > 0) {
    detail = `${errorCount} native confirm() call(s)`;
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail,
    messages: errors,
  };
}
