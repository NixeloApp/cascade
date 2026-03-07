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
 * Enforced. Underscore-prefixed bindings fail validation.
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

  // Track multi-line comment state
  let inMultiLineComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle multi-line comments
    let lineToCheck = line;
    let commentCheckPos = 0;

    // Process the line character by character to track comment state
    while (commentCheckPos < lineToCheck.length) {
      if (inMultiLineComment) {
        const endPos = lineToCheck.indexOf("*/", commentCheckPos);
        if (endPos === -1) {
          // Entire remaining line is in comment
          lineToCheck = lineToCheck.slice(0, commentCheckPos);
          break;
        } else {
          // Remove commented portion
          lineToCheck =
            lineToCheck.slice(0, commentCheckPos) +
            " ".repeat(endPos - commentCheckPos + 2) +
            lineToCheck.slice(endPos + 2);
          commentCheckPos = endPos + 2;
          inMultiLineComment = false;
        }
      } else {
        const startPos = lineToCheck.indexOf("/*", commentCheckPos);
        const singleLinePos = lineToCheck.indexOf("//", commentCheckPos);

        // Single-line comment takes rest of line
        if (singleLinePos !== -1 && (startPos === -1 || singleLinePos < startPos)) {
          lineToCheck = lineToCheck.slice(0, singleLinePos);
          break;
        }

        if (startPos === -1) break;

        // Check if multi-line comment ends on same line
        const endPos = lineToCheck.indexOf("*/", startPos + 2);
        if (endPos === -1) {
          // Comment continues to next line
          lineToCheck = lineToCheck.slice(0, startPos);
          inMultiLineComment = true;
          break;
        } else {
          // Comment ends on same line - blank it out
          lineToCheck =
            lineToCheck.slice(0, startPos) +
            " ".repeat(endPos - startPos + 2) +
            lineToCheck.slice(endPos + 2);
          commentCheckPos = endPos + 2;
        }
      }
    }

    const patterns = [
      {
        regex: /(\w+):\s*(_[a-zA-Z]\w*)\s*(?:=\s*[^,}]+)?/g,
        createMessage: ([, propName, varName]) =>
          `Unused parameter: "${propName}" renamed to "${varName}". Consider removing if not needed.`,
      },
      {
        // Match underscore params: at start of line (with optional indent), after ( or ,
        regex: /(?:^[\s]*|[(,]\s*)(_[a-zA-Z]\w*)\s*(?::|[=,)])/g,
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

      let match = regex.exec(lineToCheck);
      while (match !== null) {
        issues.push({
          line: i + 1,
          column: match.index + 1,
          message: createMessage(match),
        });

        match = regex.exec(lineToCheck);
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
    console.log(`${c.red}Found ${issues.length} underscore-prefixed binding(s):${c.reset}\n`);
    for (const issue of issues) {
      console.log(`  ${c.red}ERROR${c.reset} ${issue.file}:${issue.line} - ${issue.message}`);
    }
    console.log();
  }

  return {
    passed: issues.length === 0,
    errors: issues.length,
    detail: issues.length > 0 ? `${issues.length} underscore-prefixed binding(s)` : null,
  };
}
