/**
 * CHECK: Console Logs
 * Bans console.log in production code. Only console.warn/error/debug allowed.
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
      // Match console.log but not console.warn/error/debug
      if (/\bconsole\.log\s*\(/.test(line)) {
        errors.push({
          type: "error",
          file: rel,
          line: index + 1,
          message:
            "console.log is banned in production code. Use console.debug for debugging or remove.",
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
    detail: errorCount > 0 ? `${errorCount} console.log(s)` : null,
    messages: errors.map((e) => `  ${c.red}ERROR${c.reset} ${e.file}:${e.line} - ${e.message}`),
  };
}
