/**
 * CHECK: JSDoc Coverage
 *
 * Ensures exported functions and components have JSDoc documentation.
 * Improves code maintainability and enables better IDE support.
 *
 * Rules:
 * 1. Exported functions must have JSDoc above the declaration
 * 2. Exported React components must have JSDoc
 * 3. Hooks (use*) must have JSDoc explaining their purpose
 *
 * Ignored:
 * - index.ts files (re-exports only)
 * - *.test.tsx, *.spec.tsx, *.stories.tsx
 * - Auto-generated files (routeTree.gen.ts)
 * - Type-only exports (interfaces, types)
 *
 * @strictness MEDIUM - Warns about missing JSDoc but doesn't block CI.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");
  const CONVEX_DIR = path.join(ROOT, "convex");

  // Files to ignore
  const IGNORE_PATTERNS = [
    /index\.tsx?$/,
    /\.test\.tsx?$/,
    /\.spec\.tsx?$/,
    /\.stories\.tsx?$/,
    /routeTree\.gen\.ts$/,
    /\.d\.ts$/,
    /vite-env\.d\.ts$/,
  ];

  // Directories to ignore
  const IGNORE_DIRS = [
    "src/components/ui", // UI primitives have component-level docs
    "convex/_generated", // Auto-generated
    "convex/validators", // Simple validators
  ];

  // Patterns that require JSDoc
  const EXPORT_PATTERNS = [
    // Named function exports
    {
      pattern: /^export\s+(async\s+)?function\s+([A-Z_a-z]\w*)/,
      type: "function",
    },
    // Arrow function exports: export const foo = (...) =>
    {
      pattern: /^export\s+const\s+([a-z]\w*)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*\w+)?\s*=>/,
      type: "arrow",
    },
    // Hook exports: export function useX or export const useX
    {
      pattern: /^export\s+(?:const\s+|(?:async\s+)?function\s+)(use[A-Z]\w*)/,
      type: "hook",
    },
  ];

  // JSDoc pattern - must appear immediately before export
  const JSDOC_PATTERN = /\/\*\*[\s\S]*?\*\/\s*$/;

  const violations = [];

  function shouldIgnoreFile(filePath) {
    const rel = relPath(filePath);
    if (IGNORE_PATTERNS.some((p) => p.test(rel))) return true;
    if (IGNORE_DIRS.some((dir) => rel.startsWith(dir))) return true;
    return false;
  }

  function checkFile(filePath) {
    if (shouldIgnoreFile(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rel = relPath(filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const { pattern, type } of EXPORT_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          const name = match[2] || match[1];

          // Check if previous lines contain JSDoc
          let hasJSDoc = false;
          let j = i - 1;

          // Look backwards for JSDoc, skipping empty lines
          while (j >= 0 && lines[j].trim() === "") {
            j--;
          }

          if (j >= 0) {
            // Build up the comment block
            let commentEnd = j;
            while (j >= 0 && !lines[j].includes("/**")) {
              if (lines[j].includes("*/")) {
                commentEnd = j;
              }
              j--;
            }

            if (j >= 0 && lines[j].includes("/**")) {
              const commentBlock = lines.slice(j, commentEnd + 1).join("\n");
              hasJSDoc = JSDOC_PATTERN.test(commentBlock + "\n");
            }
          }

          if (!hasJSDoc) {
            violations.push({
              file: rel,
              line: i + 1,
              name,
              type,
            });
          }

          break; // One match per line
        }
      }
    }
  }

  // Check src and convex directories
  const srcFiles = walkDir(SRC_DIR, { extensions: new Set([".tsx", ".ts"]) });
  const convexFiles = walkDir(CONVEX_DIR, { extensions: new Set([".ts"]) });

  for (const f of [...srcFiles, ...convexFiles]) {
    checkFile(f);
  }

  // Group by file for output
  const byFile = {};
  for (const v of violations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  const messages = [];
  const sortedFiles = Object.entries(byFile).sort(([, a], [, b]) => b.length - a.length);

  // Show top 10 files with most violations
  for (const [file, items] of sortedFiles.slice(0, 10)) {
    messages.push(`  ${c.bold}${file}${c.reset} (${items.length} missing)`);
    for (const item of items.slice(0, 3)) {
      messages.push(`    ${c.dim}L${item.line}${c.reset} ${item.type}: ${item.name}`);
    }
    if (items.length > 3) {
      messages.push(`    ${c.dim}... and ${items.length - 3} more${c.reset}`);
    }
  }

  if (sortedFiles.length > 10) {
    const remaining = sortedFiles.slice(10).reduce((sum, [, items]) => sum + items.length, 0);
    messages.push(
      `  ${c.dim}... and ${remaining} more in ${sortedFiles.length - 10} other files${c.reset}`,
    );
  }

  // Calculate coverage
  const totalExports = violations.length; // This is just missing ones
  // Note: We'd need to count all exports for accurate %, but for now report count

  return {
    passed: true, // Warnings only, doesn't block
    errors: 0,
    warnings: violations.length,
    detail: violations.length > 0 ? `${violations.length} exports missing JSDoc` : null,
    messages,
  };
}
