/**
 * CHECK: Recipe Drift
 *
 * Detects visual class patterns that appear multiple times across files,
 * requiring them to be extracted into owned recipes or shared primitives.
 *
 * This validator focuses on:
 * 1. Repeated "rounded + bg + border + shadow" combinations
 * 2. Similar visual shells that should not remain duplicated in feature code
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Patterns that indicate visual surface styling (when combined)
const SURFACE_CLASS_PATTERNS = [
  /\brounded-(?:md|lg|xl|2xl|3xl|full)\b/,
  /\bbg-(?!transparent)(?:ui-|brand-|linear-to)[^\s"']+/,
  /\bborder-(?:ui-|brand-)[^\s"']+/,
  /\bshadow-(?:soft|card|elevated|none)\b/,
];

// Files/directories to skip
const SKIP_PATTERNS = ["node_modules", ".test.", ".spec.", ".stories.", "src/components/ui/"];

/**
 * Extract visual surface class combinations from a className value.
 */
function extractSurfacePatterns(classNameValue) {
  const patterns = [];

  // Check if this looks like a visual surface (has multiple styling aspects)
  const hasRounded = SURFACE_CLASS_PATTERNS[0].test(classNameValue);
  const hasBg = SURFACE_CLASS_PATTERNS[1].test(classNameValue);
  const hasBorder = SURFACE_CLASS_PATTERNS[2].test(classNameValue);
  const hasShadow = SURFACE_CLASS_PATTERNS[3].test(classNameValue);

  // A visual surface typically has at least 3 of these 4 aspects
  const matchCount = [hasRounded, hasBg, hasBorder, hasShadow].filter(Boolean).length;
  if (matchCount >= 3) {
    // Extract the key parts to create a signature
    const rounded = classNameValue.match(SURFACE_CLASS_PATTERNS[0])?.[0] || "";
    const bg = classNameValue.match(SURFACE_CLASS_PATTERNS[1])?.[0] || "";
    const border = classNameValue.match(SURFACE_CLASS_PATTERNS[2])?.[0] || "";
    const shadow = classNameValue.match(SURFACE_CLASS_PATTERNS[3])?.[0] || "";

    // Create a normalized pattern signature
    const signature = [rounded, bg, border, shadow].filter(Boolean).sort().join(" ");
    if (signature) {
      patterns.push(signature);
    }
  }

  return patterns;
}

/**
 * Extract className values from a line of code.
 */
function extractClassNames(line) {
  const classNames = [];

  // Match className="..." or className='...'
  const doubleQuoteMatch = line.match(/className\s*=\s*"([^"]+)"/g);
  const singleQuoteMatch = line.match(/className\s*=\s*'([^']+)'/g);

  if (doubleQuoteMatch) {
    for (const match of doubleQuoteMatch) {
      const value = match.match(/className\s*=\s*"([^"]+)"/)?.[1];
      if (value) classNames.push(value);
    }
  }

  if (singleQuoteMatch) {
    for (const match of singleQuoteMatch) {
      const value = match.match(/className\s*=\s*'([^']+)'/)?.[1];
      if (value) classNames.push(value);
    }
  }

  return classNames;
}

export function run() {
  const srcDir = path.join(ROOT, "src/components");
  const files = walkDir(srcDir, { extensions: new Set([".tsx"]) });

  // Track pattern occurrences: signature -> [{ file, line }]
  const patternOccurrences = new Map();

  for (const filePath of files) {
    const rel = relPath(filePath);

    // Skip test files, stories, and ui/ primitives
    if (SKIP_PATTERNS.some((p) => rel.includes(p))) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("className")) continue;

      // Skip if using recipe/chrome props (already using design system)
      if (line.includes('recipe="') || line.includes("recipe='")) continue;
      if (line.includes('chrome="') || line.includes("chrome='")) continue;

      const classNames = extractClassNames(line);
      for (const className of classNames) {
        const patterns = extractSurfacePatterns(className);
        for (const pattern of patterns) {
          const occurrences = patternOccurrences.get(pattern) || [];
          occurrences.push({ file: rel, line: i + 1 });
          patternOccurrences.set(pattern, occurrences);
        }
      }
    }
  }

  // Find patterns that appear in multiple files
  const duplicatePatterns = [];
  for (const [pattern, occurrences] of patternOccurrences) {
    const uniqueFiles = new Set(occurrences.map((o) => o.file));
    if (uniqueFiles.size >= 2) {
      duplicatePatterns.push({
        pattern,
        files: [...uniqueFiles],
        count: occurrences.length,
      });
    }
  }

  // Sort by occurrence count (most duplicated first)
  duplicatePatterns.sort((a, b) => b.count - a.count);

  const messages = [];
  if (duplicatePatterns.length > 0) {
    messages.push(`${c.red}Recipe drift detected (repeated visual patterns):${c.reset}`);
    for (const { pattern, files, count } of duplicatePatterns.slice(0, 5)) {
      messages.push(`  ${c.red}ERROR${c.reset} Pattern: ${pattern}`);
      messages.push(
        `    Used ${count}x in ${files.length} files: ${files.slice(0, 3).join(", ")}${files.length > 3 ? "..." : ""}`,
      );
    }
    if (duplicatePatterns.length > 5) {
      messages.push(`  ... and ${duplicatePatterns.length - 5} more patterns`);
    }
  }

  return {
    passed: duplicatePatterns.length === 0,
    errors: duplicatePatterns.length,
    detail:
      duplicatePatterns.length > 0 ? `${duplicatePatterns.length} repeated visual patterns` : null,
    messages,
  };
}
