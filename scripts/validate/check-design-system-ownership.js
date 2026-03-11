/**
 * CHECK: Design System Ownership
 * Enforces that high-drift feature surfaces use primitive-owned recipe/chrome APIs
 * instead of ad hoc visual class stacks.
 *
 * KEY ENFORCEMENT:
 * - Detects className with 4+ visual token groups (bg, border, rounded, shadow, etc.)
 * - Flags recipe/chrome props combined with excess visual overrides
 * - Identifies legacy surfaceRecipes usage
 */

import fs from "node:fs";
import path from "node:path";
import {
  collectClassNameSpan,
  countMatchingTokenGroups,
  DESIGN_SYSTEM_ESCAPE_HATCHES,
  DESIGN_SYSTEM_TARGET_FILES,
  DESIGN_SYSTEM_TOKEN_PATTERNS,
  findOpeningTag,
  groupByFile,
  LEGACY_RECIPE_IMPORT_PATTERN,
} from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

/**
 * Patterns that indicate a component is using design system props.
 * These DON'T escape scrutiny - they just provide context for better error messages.
 */
const RECIPE_PROP_PATTERNS = [/\brecipe\s*=\s*["']/, /\bchrome\s*=\s*["']/, /\bvariant\s*=\s*["']/];

/**
 * Visual classes that shouldn't be needed if recipe/chrome is properly configured.
 * These are redundant when the design system should handle them.
 */
const REDUNDANT_WITH_RECIPE_PATTERNS = {
  border: /\bborder(?:-[^"'\s}]+)?/,
  background: /\bbg-(?!transparent)\S+/,
  shadow: /\bshadow(?:-[^"'\s}]+)?/,
  text: /\btext-(?:xs|sm|base|lg|xl|\d|ui-)/,
};

function hasRecipeProp(tagText) {
  return RECIPE_PROP_PATTERNS.some((p) => p.test(tagText));
}

function countRedundantClasses(span) {
  return Object.values(REDUNDANT_WITH_RECIPE_PATTERNS).filter((p) => p.test(span)).length;
}

export function run() {
  const srcDir = path.join(ROOT, "src/components");
  const files = walkDir(srcDir, { extensions: new Set([".tsx"]) });
  const violations = [];

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (!DESIGN_SYSTEM_TARGET_FILES.some((file) => rel.endsWith(file))) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const legacyMatch = content.match(LEGACY_RECIPE_IMPORT_PATTERN);

    if (legacyMatch && legacyMatch.index != null) {
      violations.push({
        file: rel,
        line: content.slice(0, legacyMatch.index).split("\n").length,
        replacement: "move legacy surfaceRecipes usage into Card/Button/Dialog recipe props",
        severity: "high",
      });
    }

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (!line.includes("className")) continue;

      const { span, endIndex } = collectClassNameSpan(lines, index);
      const tagText = findOpeningTag(lines, index);

      // Only variant FUNCTION calls (e.g., cardVariants(...)) are full escapes
      // Recipe/chrome PROPS don't escape - we check for redundant classes
      if (
        DESIGN_SYSTEM_ESCAPE_HATCHES.some(
          (token) => span.includes(token) || tagText.includes(token),
        )
      ) {
        index = endIndex;
        continue;
      }

      const usesRecipeProp = hasRecipeProp(tagText);
      const tokenCount = countMatchingTokenGroups(span, DESIGN_SYSTEM_TOKEN_PATTERNS);
      const redundantCount = usesRecipeProp ? countRedundantClasses(span) : 0;

      // Violation scenarios:
      // 1. Using recipe prop + 2+ redundant visual classes = recipe should handle this
      // 2. No recipe prop + 4+ visual token groups = should use recipe API
      if (usesRecipeProp && redundantCount >= 2) {
        violations.push({
          file: rel,
          line: index + 1,
          replacement:
            "recipe/chrome prop present but className overrides visual styling. " +
            "Extract these classes into the recipe variant or use chrome prop",
          severity: "high",
        });
      } else if (!usesRecipeProp && tokenCount >= 4) {
        violations.push({
          file: rel,
          line: index + 1,
          replacement:
            "extract to Card/Button/Dialog recipe APIs or shared primitive recipe variants",
          severity: "medium",
        });
      }

      index = endIndex;
    }
  }

  const messages = [];
  if (violations.length > 0) {
    messages.push(`${c.red}Design-system ownership violations:${c.reset}`);
    const byFile = groupByFile(violations);

    for (const [file, items] of Object.entries(byFile).sort()) {
      const highCount = items.filter((i) => i.severity === "high").length;
      const severityNote = highCount > 0 ? ` (${highCount} high severity)` : "";
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})${severityNote}`);
      for (const item of items.slice(0, 6)) {
        const marker = item.severity === "high" ? c.red : c.yellow;
        messages.push(
          `    ${c.dim}L${item.line}${c.reset} ${marker}→${c.reset} ${item.replacement}`,
        );
      }
      if (items.length > 6) {
        messages.push(`    ${c.dim}... and ${items.length - 6} more${c.reset}`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    errors: violations.length,
    detail:
      violations.length > 0 ? `${violations.length} design-system ownership violations` : null,
    messages,
  };
}
