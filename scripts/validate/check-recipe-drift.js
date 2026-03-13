/**
 * CHECK: Recipe Drift
 *
 * Detects visual class patterns that appear multiple times across files,
 * requiring them to be extracted into owned recipes or shared primitives.
 *
 * This validator focuses on:
 * 1. Repeated "rounded + bg + border + shadow" combinations
 * 2. Similar visual shells that should not remain duplicated in feature code
 * 3. Positioned command/menu shell chrome that should live behind owned overlay primitives
 */

import fs from "node:fs";
import path from "node:path";
import { collectClassNameSpan, findOpeningTag } from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Patterns that indicate visual surface styling (when combined)
const SURFACE_CLASS_PATTERNS = [
  /\brounded-(?:md|lg|xl|2xl|3xl|full)\b/,
  /\bbg-(?!transparent)(?:ui-|brand-|linear-to)[^\s"']+/,
  /\bborder-(?:ui-|brand-)[^\s"']+/,
  /\bshadow-(?:soft|card|elevated|none)\b/,
];
const OVERLAY_POSITION_PATTERN = /\b(?:absolute|fixed)\b/;
const OVERLAY_LAYER_PATTERN = /\bz-\d+\b/;
const OVERLAY_SHELL_PATTERNS = [
  /\brounded-(?:md|lg|xl|2xl|3xl|full|container)\b/,
  /\bbg-(?!transparent)(?:ui-|brand-|linear-to)[^\s"']+/,
  /\bborder-(?:ui-|brand-)[^\s"']+/,
  /\bshadow-(?:soft|card|elevated|lg|xl|2xl|none)\b/,
  /\boverflow-hidden\b/,
];
const OVERLAY_COMPONENT_PATTERN =
  /<(?:Command|PopoverContent|DropdownMenuContent|DropdownMenuSubContent)\b/;

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

function extractOverlayShellPattern(tagText, classNameValue) {
  if (!OVERLAY_COMPONENT_PATTERN.test(tagText)) return null;

  const hasPosition = OVERLAY_POSITION_PATTERN.test(classNameValue);
  const hasLayer = OVERLAY_LAYER_PATTERN.test(classNameValue);
  const matchingShellParts = OVERLAY_SHELL_PATTERNS.map(
    (pattern) => classNameValue.match(pattern)?.[0] || "",
  );
  const shellCount = matchingShellParts.filter(Boolean).length;

  if (!hasPosition || !hasLayer || shellCount < 2) return null;

  const componentMatch =
    tagText.match(OVERLAY_COMPONENT_PATTERN)?.[0]?.replace("<", "") || "overlay";
  const signature = [componentMatch, ...matchingShellParts.filter(Boolean)].join(" ");

  return {
    component: componentMatch,
    signature,
  };
}

export function run() {
  const srcDir = path.join(ROOT, "src/components");
  const files = walkDir(srcDir, { extensions: new Set([".tsx"]) });

  // Track pattern occurrences: signature -> [{ file, line }]
  const patternOccurrences = new Map();
  const overlayShellViolations = [];

  for (const filePath of files) {
    const rel = relPath(filePath);

    // Skip test files, stories, and ui/ primitives
    if (SKIP_PATTERNS.some((p) => rel.includes(p))) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("className")) continue;

      const { span, endIndex } = collectClassNameSpan(lines, i);
      const tagText = findOpeningTag(lines, i);

      // Skip if using recipe/chrome props (already using design system)
      if (
        span.includes('recipe="') ||
        span.includes("recipe='") ||
        tagText.includes('recipe="') ||
        tagText.includes("recipe='") ||
        span.includes('chrome="') ||
        span.includes("chrome='") ||
        tagText.includes('chrome="') ||
        tagText.includes("chrome='")
      ) {
        i = endIndex;
        continue;
      }

      const overlayShellPattern = extractOverlayShellPattern(tagText, span);
      if (overlayShellPattern) {
        overlayShellViolations.push({
          ...overlayShellPattern,
          file: rel,
          line: i + 1,
        });
      }

      const patterns = extractSurfacePatterns(span);
      for (const pattern of patterns) {
        const occurrences = patternOccurrences.get(pattern) || [];
        occurrences.push({ file: rel, line: i + 1 });
        patternOccurrences.set(pattern, occurrences);
      }

      i = endIndex;
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
  if (overlayShellViolations.length > 0) {
    messages.push(`${c.red}Overlay/menu shell drift detected:${c.reset}`);
    for (const { component, file, line, signature } of overlayShellViolations.slice(0, 5)) {
      messages.push(
        `  ${c.red}ERROR${c.reset} ${component} owns positioned shell chrome at ${file}:${line} (${signature})`,
      );
    }
    if (overlayShellViolations.length > 5) {
      messages.push(
        `  ... and ${overlayShellViolations.length - 5} more overlay/menu shell violations`,
      );
    }
  }

  const errorCount = duplicatePatterns.length + overlayShellViolations.length;
  const detailParts = [];
  if (duplicatePatterns.length > 0)
    detailParts.push(`${duplicatePatterns.length} repeated visual patterns`);
  if (overlayShellViolations.length > 0) {
    detailParts.push(`${overlayShellViolations.length} overlay/menu shell violations`);
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: detailParts.length > 0 ? detailParts.join(", ") : null,
    messages,
  };
}
