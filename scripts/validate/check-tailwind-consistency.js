/**
 * CHECK: Tailwind Consistency
 *
 * Validates consistent use of Tailwind patterns across the codebase:
 *
 * 1. Animation/Duration consistency - Use semantic tokens (duration-fast, transition-default)
 * 2. Focus ring consistency - All focusable elements should use consistent focus ring patterns
 * 3. Disabled state consistency - Use disabled:opacity-50 disabled:pointer-events-none
 * 4. Z-index sprawl - Warn about arbitrary z-index values
 * 5. Group-hover orphans - Flag group-hover: without parent group class
 * 6. Responsive breakpoint consistency - Ensure mobile-first approach
 * 7. Transition completeness - Warn when transition-* without corresponding state change
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// ============================================================
// 1. ANIMATION/DURATION CONSISTENCY
// ============================================================

// Allowed semantic duration classes
const SEMANTIC_DURATIONS = new Set([
  "duration-instant", // 75ms
  "duration-fast", // 150ms
  "duration-default", // 200ms
  "duration-medium", // 300ms
  "duration-slow", // 500ms
  "duration-enter", // 700ms
]);

// Allowed semantic transition classes
const SEMANTIC_TRANSITIONS = new Set([
  "transition-default",
  "transition-fast",
  "transition-slow",
  "transition-none",
  "transition-all", // Tailwind built-in, acceptable
  "transition-colors",
  "transition-opacity",
  "transition-transform",
  "transition-shadow",
  "transition-interactive", // Custom utility
  "transition-transform-shadow", // Custom utility
]);

// Raw duration patterns to flag (duration-75, duration-100, etc.)
const RAW_DURATION_PATTERN = /\bduration-(\d+)\b/g;

// ============================================================
// 2. FOCUS RING CONSISTENCY
// ============================================================

// Expected focus ring pattern
const CORRECT_FOCUS_RING =
  /focus-visible:ring-2\s+focus-visible:ring-brand-ring|focus-visible:ring-2\s+focus-visible:ring-offset-2\s+focus-visible:ring-brand-ring/;

// Inconsistent focus patterns to flag
const INCONSISTENT_FOCUS_PATTERNS = [
  { pattern: /\bfocus:ring-\d/, msg: "Use focus-visible: instead of focus:" },
  { pattern: /\bfocus-visible:ring-1\b/, msg: "Use ring-2 for focus rings, not ring-1" },
  {
    pattern: /\bfocus-visible:ring-(?!brand-ring|offset)/,
    msg: "Use ring-brand-ring for focus color",
  },
  {
    pattern: /\bfocus:outline-none\b(?!.*focus-visible)/,
    msg: "Don't remove focus outline without focus-visible alternative",
  },
];

// ============================================================
// 3. DISABLED STATE CONSISTENCY
// ============================================================

// Expected disabled pattern
const CORRECT_DISABLED =
  /disabled:opacity-50\s+disabled:pointer-events-none|disabled:pointer-events-none\s+disabled:opacity-50/;

// Inconsistent disabled patterns
const INCONSISTENT_DISABLED_PATTERNS = [
  { pattern: /\bdisabled:opacity-(?!50\b)\d+/, msg: "Use disabled:opacity-50 for consistency" },
  {
    pattern: /\bdisabled:cursor-not-allowed\b(?!.*disabled:pointer-events)/,
    msg: "Prefer disabled:pointer-events-none over cursor-not-allowed",
  },
];

// ============================================================
// 4. Z-INDEX SPRAWL
// ============================================================

// Allowed z-index classes (semantic or small values)
const ALLOWED_Z_INDEX = new Set([
  "z-0",
  "z-10",
  "z-20",
  "z-30",
  "z-40",
  "z-50",
  "z-auto",
  "z-toast-critical", // Semantic token
  "-z-10", // For background layers
]);

// Arbitrary z-index pattern
const ARBITRARY_Z_PATTERN = /\bz-\[(\d+)\]/g;

// High z-index (above 50) that should be tokens
const HIGH_Z_PATTERN = /\bz-(\d+)\b/g;

// ============================================================
// 5. GROUP-HOVER ORPHANS
// ============================================================

// Group variant patterns that need a parent with `group` class
const GROUP_VARIANT_PATTERN = /\b(group-hover|group-focus|group-active|peer-hover|peer-focus):/;

// ============================================================
// 6. RESPONSIVE BREAKPOINT CONSISTENCY
// ============================================================

// Mobile-first violations: larger breakpoint without smaller ones
// e.g., lg:flex without sm: or md: context
const BREAKPOINT_ORDER = ["sm", "md", "lg", "xl", "2xl"];

// ============================================================
// 7. TRANSITION COMPLETENESS
// ============================================================

// Transition classes that should have corresponding hover/focus states
const TRANSITION_CLASSES = /\btransition(?:-colors|-opacity|-transform|-shadow|-all)?\b/;

// Files/patterns to skip
const SKIP_PATTERNS = ["node_modules", ".test.", ".spec.", "test/", "__tests__"];

// Files to skip for specific checks (some are legacy or intentional)
const SKIP_FILES_ANIMATION = new Set([
  // Animation libraries/configs
  "tailwind.config",
  "index.css",
]);

export function run() {
  const SRC_DIR = path.join(ROOT, "src");
  const errors = [];
  const errorCount = 0;
  let warningCount = 0;

  // Counters for each check type
  const counts = {
    animation: 0,
    focusRing: 0,
    disabled: 0,
    zIndex: 0,
    groupHover: 0,
    responsive: 0,
    transition: 0,
  };

  // Get all TSX/TS files
  const files = walkDir(SRC_DIR, { extensions: new Set([".tsx", ".ts"]) });

  for (const filePath of files) {
    const rel = relPath(filePath);

    // Skip test files and node_modules
    if (SKIP_PATTERNS.some((p) => rel.includes(p))) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Track if file has `group` class for group-hover check
    const hasGroupClass = /\bgroup\b/.test(content) || /className.*group/.test(content);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip comments
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

      // ---- 1. Animation/Duration Check ----
      if (!SKIP_FILES_ANIMATION.has(path.basename(filePath))) {
        const durationMatches = line.matchAll(RAW_DURATION_PATTERN);
        for (const match of durationMatches) {
          const value = match[1];
          // Allow duration in keyframe definitions or CSS variables
          if (line.includes("@keyframes") || line.includes("--duration")) continue;

          counts.animation++;
          // Only error for now if it's outside ui/ - warn for ui/ files
          if (!rel.includes("components/ui/")) {
            errors.push(
              `  ${c.yellow}WARN${c.reset} ${rel}:${lineNum} - Raw duration-${value}. Use semantic token (duration-fast, duration-default, etc.)`,
            );
            warningCount++;
          }
        }
      }

      // ---- 2. Focus Ring Check ----
      for (const { pattern, msg } of INCONSISTENT_FOCUS_PATTERNS) {
        if (pattern.test(line)) {
          // Don't flag if the line also has correct pattern
          if (CORRECT_FOCUS_RING.test(line)) continue;
          // Skip ui/ files for now (they define the patterns)
          if (rel.includes("components/ui/")) continue;

          counts.focusRing++;
          errors.push(`  ${c.yellow}WARN${c.reset} ${rel}:${lineNum} - ${msg}`);
          warningCount++;
        }
      }

      // ---- 3. Disabled State Check ----
      if (/\bdisabled:/.test(line)) {
        for (const { pattern, msg } of INCONSISTENT_DISABLED_PATTERNS) {
          if (pattern.test(line)) {
            // Skip if it has the correct pattern too
            if (CORRECT_DISABLED.test(line)) continue;
            // Skip ui/ files
            if (rel.includes("components/ui/")) continue;

            counts.disabled++;
            errors.push(`  ${c.yellow}WARN${c.reset} ${rel}:${lineNum} - ${msg}`);
            warningCount++;
          }
        }
      }

      // ---- 4. Z-Index Sprawl Check ----
      // Check for arbitrary z-index
      const arbitraryZ = line.matchAll(ARBITRARY_Z_PATTERN);
      for (const match of arbitraryZ) {
        const value = match[1];
        counts.zIndex++;
        errors.push(
          `  ${c.yellow}WARN${c.reset} ${rel}:${lineNum} - Arbitrary z-[${value}]. Define a semantic token in index.css.`,
        );
        warningCount++;
      }

      // Check for high z-index values
      const highZ = line.matchAll(HIGH_Z_PATTERN);
      for (const match of highZ) {
        const zClass = `z-${match[1]}`;
        if (!ALLOWED_Z_INDEX.has(zClass) && parseInt(match[1]) > 50) {
          counts.zIndex++;
          errors.push(
            `  ${c.yellow}WARN${c.reset} ${rel}:${lineNum} - High z-index ${zClass}. Consider using a semantic token.`,
          );
          warningCount++;
        }
      }

      // ---- 5. Group-Hover Orphans Check ----
      if (GROUP_VARIANT_PATTERN.test(line)) {
        // Check if this file or this component has a group class
        // Simple heuristic: check if 'group' appears in the file
        if (
          !hasGroupClass &&
          !line.includes("group ") &&
          !line.includes('group"') &&
          !line.includes("group'")
        ) {
          // Check in a small window around this line
          const windowStart = Math.max(0, i - 20);
          const windowEnd = Math.min(lines.length, i + 20);
          const window = lines.slice(windowStart, windowEnd).join("\n");

          if (!/\bgroup\b/.test(window) && !/className=.*group/.test(window)) {
            counts.groupHover++;
            // This is more of a warning - the group might be in a parent component
            errors.push(
              `  ${c.dim}INFO${c.reset} ${rel}:${lineNum} - group-hover/peer-hover without visible group class. Ensure parent has 'group'.`,
            );
          }
        }
      }

      // ---- 6. Responsive Breakpoint Check ----
      // Check for larger breakpoints without smaller ones in the same property
      // This is complex to check properly, so we'll do a simple heuristic
      const hasLg = /\blg:/.test(line);
      const hasMd = /\bmd:/.test(line);
      const hasSm = /\bsm:/.test(line);

      // Flag if lg: is used without md: or sm: on what looks like the same property
      if (hasLg && !hasMd && !hasSm) {
        // Check if it's a responsive layout/display class
        if (
          /\blg:(flex|grid|block|hidden|inline)/.test(line) &&
          !/\b(sm|md):(flex|grid|block|hidden|inline)/.test(line)
        ) {
          // This might be intentional (desktop-only), so just count
          counts.responsive++;
        }
      }

      // ---- 7. Transition Completeness Check ----
      if (TRANSITION_CLASSES.test(line)) {
        // Check if the same element/line has hover: or focus: states
        const hasStateChange = /\b(hover:|focus:|active:|group-hover:)/.test(line);

        // If transition is defined but no state change, might be incomplete
        // This could be intentional (JS-driven transitions), so we won't error
        if (!hasStateChange) {
          // Check nearby lines for state changes
          const nearbyLines = lines
            .slice(Math.max(0, i - 3), Math.min(lines.length, i + 3))
            .join(" ");
          if (!/\b(hover:|focus:|active:)/.test(nearbyLines)) {
            counts.transition++;
            // Just count, don't warn - too many false positives
          }
        }
      }
    }
  }

  // Build detail string
  const details = [];
  if (counts.animation > 0) details.push(`${counts.animation} duration`);
  if (counts.focusRing > 0) details.push(`${counts.focusRing} focus-ring`);
  if (counts.disabled > 0) details.push(`${counts.disabled} disabled`);
  if (counts.zIndex > 0) details.push(`${counts.zIndex} z-index`);
  if (counts.groupHover > 0) details.push(`${counts.groupHover} group-hover`);
  if (counts.responsive > 0) details.push(`${counts.responsive} responsive`);
  if (counts.transition > 0) details.push(`${counts.transition} transition`);

  const detail =
    warningCount > 0
      ? `${warningCount} warnings (${details.join(", ")})`
      : "all patterns consistent";

  // For now, warnings don't fail the build - this is informational
  return {
    passed: true, // Warnings don't fail
    errors: 0,
    warnings: warningCount,
    detail,
    messages: errors.slice(0, 20), // Limit output
  };
}
