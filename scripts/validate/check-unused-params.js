/**
 * CHECK: Underscore-Prefixed Bindings
 *
 * Flags underscore-prefixed bindings that usually indicate intentionally unused values.
 * These often indicate:
 * - Dead code that should be removed
 * - Props passed but never used
 * - API mismatches between caller and callee
 *
 * Instead of using underscore prefix to silence linter warnings,
 * remove the binding entirely, restructure the API, or use the value.
 *
 * @strictness ERROR - Underscore-prefixed bindings fail validation
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Directories to check
const CHECK_DIRS = ["src/components", "src/hooks", "src/lib", "src/routes", "convex"];

// Files/directories to skip
const SKIP_PATTERNS = [
  /\.test\.tsx?$/, // Tests often create unused setup variables
  /\.jules\.test\.tsx?$/, // AI-generated tests
  /\.stories\.tsx?$/, // Storybook files
  /routeTree\.gen\.ts$/, // Generated files
  /__tests__/, // Test directories
  /\.d\.ts$/, // Type definition files
  /node_modules/, // Dependencies
];

// Known allowlist - these have legitimate reasons for unused params
// Each entry should have a comment explaining why
const ALLOWLIST = new Set([
  // CVA/cva variants extract props for styling but don't use them in render
  // The color prop is destructured to prevent it from being spread to DOM
  "src/components/ui/Card.tsx",
  "src/components/ui/Alert.tsx",
  // Documented TODO: projectId filter planned for future CalendarView integration
  "src/components/Calendar/ProjectCalendar.tsx",
  // Interface defines onIssueReorder for future fine-grained reordering within columns
  "src/components/Kanban/KanbanColumn.tsx",
]);

/**
 * Find underscore-prefixed bindings in destructuring patterns, parameters, and locals.
 */
function findUnusedParams(content) {
  const issues = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const patterns = [
      {
        regex: /(\w+):\s*(_[a-zA-Z]\w*)\s*(?:=\s*[^,}]+)?/g,
        createMessage: ([, propName, varName]) =>
          `Unused parameter: "${propName}" renamed to "${varName}". Consider removing if not needed.`,
      },
      {
        regex: /(?:^|[(,]\s*)(_[a-zA-Z]\w*)\s*(?::|[=,)])/g,
        createMessage: ([, varName]) =>
          `Underscore-prefixed parameter "${varName}". Remove it or restructure the callback to avoid unused positional args.`,
      },
      {
        regex: /\b(?:const|let|var)\s+(_[a-zA-Z]\w*)\b/g,
        createMessage: ([, varName]) =>
          `Underscore-prefixed local "${varName}". Remove it or rename it to the real domain concept.`,
      },
      {
        regex: /\[\s*(_[a-zA-Z]\w*)\s*,/g,
        createMessage: ([, varName]) =>
          `Underscore-prefixed state or tuple binding "${varName}". Omit the slot instead of naming an unused value.`,
      },
    ];

    for (const { regex, createMessage } of patterns) {
      regex.lastIndex = 0;

      let match = regex.exec(line);
      while (match !== null) {
        // Skip if it's in a comment
        const beforeMatch = line.slice(0, match.index);
        if (beforeMatch.includes("//") || beforeMatch.includes("/*")) {
          match = regex.exec(line);
          continue;
        }

        issues.push({
          line: i + 1,
          column: match.index + 1,
          message: createMessage(match),
        });

        match = regex.exec(line);
      }
    }
  }

  return issues;
}

export function run() {
  const issues = [];

  for (const dir of CHECK_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;

    for (const file of walkDir(fullDir)) {
      // Skip non-TS/TSX files
      if (!/\.(ts|tsx)$/.test(file)) continue;

      // Skip patterns
      if (SKIP_PATTERNS.some((p) => p.test(file))) continue;

      const rel = relPath(file);

      // Skip allowlisted files
      if (ALLOWLIST.has(rel)) continue;

      const content = fs.readFileSync(file, "utf8");
      const fileIssues = findUnusedParams(content);

      for (const issue of fileIssues) {
        issues.push({
          file: rel,
          line: issue.line,
          message: issue.message,
        });
      }
    }
  }

  // Report results
  if (issues.length > 0) {
    console.log(`${c.yellow}Found ${issues.length} underscore-prefixed binding(s):${c.reset}\n`);
    for (const issue of issues) {
      console.log(`  ${c.yellow}WARN${c.reset} ${issue.file}:${issue.line} - ${issue.message}`);
    }
    console.log();
  }

  return {
    passed: issues.length === 0,
    errors: issues.length,
    warnings: 0,
    detail: issues.length > 0 ? `${issues.length} underscore-prefixed binding(s)` : null,
  };
}
