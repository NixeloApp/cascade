/**
 * CHECK: File Headers
 *
 * Ensures non-trivial files have documentation headers.
 * Improves codebase navigation and helps developers understand file purpose.
 *
 * Rules:
 * 1. Files > 50 lines should have a /** ... *\/ header at the top
 * 2. Header should appear before any imports
 *
 * Ignored:
 * - index.ts files (re-exports only)
 * - *.test.tsx, *.spec.tsx, *.stories.tsx
 * - Auto-generated files (routeTree.gen.ts, _generated/)
 * - Type definition files (*.d.ts)
 * - Configuration files
 *
 * @strictness MEDIUM - Warns about missing headers but doesn't block CI.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");
  const CONVEX_DIR = path.join(ROOT, "convex");

  const MIN_LINES_FOR_HEADER = 50;

  // Files to ignore
  const IGNORE_PATTERNS = [
    /index\.tsx?$/,
    /\.test\.tsx?$/,
    /\.spec\.tsx?$/,
    /\.stories\.tsx?$/,
    /routeTree\.gen\.ts$/,
    /\.d\.ts$/,
    /vite-env\.d\.ts$/,
    /vite\.config\./,
    /tailwind\.config\./,
    /biome\.json$/,
    /tsconfig/,
  ];

  // Directories to ignore
  const IGNORE_DIRS = ["convex/_generated", "src/routeTree.gen.ts"];

  // Header pattern - must appear at start of file (optionally after shebang/use strict)
  const HEADER_PATTERN = /^(?:#!.*\n)?(?:"use strict";?\n)?\s*\/\*\*[\s\S]*?\*\//;

  const violations = [];

  function shouldIgnoreFile(filePath) {
    const rel = relPath(filePath);
    if (IGNORE_PATTERNS.some((p) => p.test(rel))) return true;
    if (IGNORE_DIRS.some((dir) => rel.startsWith(dir) || rel.includes(dir))) return true;
    return false;
  }

  function checkFile(filePath) {
    if (shouldIgnoreFile(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rel = relPath(filePath);

    // Skip small files
    if (lines.length < MIN_LINES_FOR_HEADER) return;

    // Check if file starts with a header comment
    const hasHeader = HEADER_PATTERN.test(content);

    if (!hasHeader) {
      violations.push({
        file: rel,
        lines: lines.length,
      });
    }
  }

  // Check src and convex directories
  const srcFiles = walkDir(SRC_DIR, { extensions: new Set([".tsx", ".ts"]) });
  const convexFiles = walkDir(CONVEX_DIR, { extensions: new Set([".ts"]) });

  for (const f of [...srcFiles, ...convexFiles]) {
    checkFile(f);
  }

  // Sort by line count (largest files first - they need headers most)
  violations.sort((a, b) => b.lines - a.lines);

  const messages = [];

  // Show top 10 files missing headers
  for (const { file, lines } of violations.slice(0, 10)) {
    messages.push(`  ${c.bold}${file}${c.reset} (${lines} lines)`);
  }

  if (violations.length > 10) {
    messages.push(`  ${c.dim}... and ${violations.length - 10} more files${c.reset}`);
  }

  return {
    passed: true, // Warnings only, doesn't block
    errors: 0,
    warnings: violations.length,
    detail: violations.length > 0 ? `${violations.length} files missing headers` : null,
    messages,
  };
}
