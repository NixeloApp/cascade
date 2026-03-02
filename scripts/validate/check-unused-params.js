/**
 * CHECK: Unused Parameters (underscore-prefixed)
 *
 * Flags underscore-prefixed parameters that indicate unused variables.
 * These often indicate:
 * - Dead code that should be removed
 * - Props passed but never used
 * - API mismatches between caller and callee
 *
 * Instead of using underscore prefix to silence linter warnings,
 * remove the unused parameter entirely or use it.
 *
 * @strictness WARN - Reports issues, does not block CI (yet)
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Directories to check
const CHECK_DIRS = ["src/components", "src/hooks", "src/lib", "convex"];

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
 * Find underscore-prefixed parameters in destructuring patterns
 * Matches patterns like: { foo: _foo }, { bar: _bar = [] }
 */
function findUnusedParams(content) {
  const issues = [];
  const lines = content.split("\n");

  // Pattern matches: propertyName: _variableName (with optional default value)
  // Examples: "projectId: _projectId", "mentions: _mentions = []"
  const pattern = /(\w+):\s*(_[a-zA-Z]\w*)\s*(?:=\s*[^,}]+)?/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Reset regex state for each line
    pattern.lastIndex = 0;

    let match = pattern.exec(line);
    while (match !== null) {
      const [, propName, varName] = match;

      // Skip if it's in a comment
      const beforeMatch = line.slice(0, match.index);
      if (beforeMatch.includes("//") || beforeMatch.includes("/*")) {
        match = pattern.exec(line);
        continue;
      }

      issues.push({
        line: i + 1,
        column: match.index + 1,
        propName,
        varName,
        message: `Unused parameter: "${propName}" renamed to "${varName}". Consider removing if not needed.`,
      });

      match = pattern.exec(line);
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
    console.log(`${c.yellow}Found ${issues.length} unused parameter(s):${c.reset}\n`);
    for (const issue of issues) {
      console.log(`  ${c.yellow}WARN${c.reset} ${issue.file}:${issue.line} - ${issue.message}`);
    }
    console.log();
  }

  return {
    passed: true, // Warn-only, doesn't fail CI
    errors: 0,
    warnings: issues.length,
    detail: issues.length > 0 ? `${issues.length} unused parameter(s)` : null,
  };
}
