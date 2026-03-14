/**
 * CHECK: Tech Debt Comments
 * Tracks TODO, FIXME, HACK, XXX comments in the codebase.
 * These should be minimized and tracked.
 *
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Maximum allowed tech debt comments before failing
const MAX_ALLOWED = 10;

export function run() {
  const DIRS = [path.join(ROOT, "src"), path.join(ROOT, "convex")];

  // Skip these paths
  const IGNORE_PATTERNS = [
    /\.test\.tsx?$/, // Test files
    /\.spec\.tsx?$/, // Spec files
    /\.stories\.tsx?$/, // Storybook files
    /routeTree\.gen\.ts$/, // Generated route tree
  ];

  // Only match TODO/FIXME/HACK at start of comment (after // or *)
  // Avoids false positives like "todo" status or "xxx" in URLs
  const DEBT_PATTERNS = [
    { regex: /(?:\/\/|\/\*|\*)\s*TODO\b/, type: "TODO" },
    { regex: /(?:\/\/|\/\*|\*)\s*FIXME\b/, type: "FIXME" },
    { regex: /(?:\/\/|\/\*|\*)\s*HACK\b/, type: "HACK" },
  ];

  let totalCount = 0;
  const findings = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (IGNORE_PATTERNS.some((p) => p.test(rel))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      for (const { regex, type } of DEBT_PATTERNS) {
        if (regex.test(line)) {
          findings.push({
            file: rel,
            line: index + 1,
            type,
            text: line.trim().slice(0, 80),
          });
          totalCount++;
          break; // Count each line only once
        }
      }
    });
  }

  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = walkDir(dir, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
    for (const f of files) checkFile(f);
  }

  // Group by type for summary
  const byType = {};
  for (const f of findings) {
    byType[f.type] = (byType[f.type] || 0) + 1;
  }

  const summary = Object.entries(byType)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");

  return {
    passed: totalCount <= MAX_ALLOWED,
    errors: totalCount > MAX_ALLOWED ? totalCount - MAX_ALLOWED : 0,
    detail: totalCount > 0 ? `${totalCount} tech debt comment(s): ${summary}` : null,
    messages:
      totalCount > MAX_ALLOWED
        ? findings.map(
            (f) => `  ${c.yellow}WARN${c.reset} ${f.file}:${f.line} - ${f.type}: ${f.text}`,
          )
        : [],
  };
}
