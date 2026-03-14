/**
 * CHECK: Console Usage
 * Bans console.log/info in production code.
 * console.warn/error/debug are allowed for legitimate dev warnings and error logging.
 *
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  // Skip these paths
  const IGNORE_PATTERNS = [
    /\.test\.tsx?$/, // Test files
    /\.spec\.tsx?$/, // Spec files
    /\.stories\.tsx?$/, // Storybook files
    /routeTree\.gen\.ts$/, // Generated route tree
  ];

  let errorCount = 0;
  const errors = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (IGNORE_PATTERNS.some((p) => p.test(rel))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Ban console.log and console.info only
      // console.warn/error/debug are allowed for dev warnings and error logging
      const match = line.match(/\bconsole\.(log|info)\s*\(/);
      if (match) {
        errors.push({
          file: rel,
          line: index + 1,
          method: match[1],
        });
        errorCount++;
      }
    });
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  for (const f of files) checkFile(f);

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} console.log/info statement(s)` : null,
    messages: errors.map(
      (e) =>
        `  ${c.red}ERROR${c.reset} ${e.file}:${e.line} - console.${e.method}() is banned. Use console.debug for dev logging or remove.`,
    ),
  };
}
