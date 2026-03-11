/**
 * CHECK: Design System Ownership
 * Enforces that high-drift feature surfaces use primitive-owned recipe/chrome APIs
 * instead of ad hoc visual class stacks.
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
      });
    }

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (!line.includes("className")) continue;

      const { span, endIndex } = collectClassNameSpan(lines, index);
      const tagText = findOpeningTag(lines, index);

      if (
        DESIGN_SYSTEM_ESCAPE_HATCHES.some(
          (token) => span.includes(token) || tagText.includes(token),
        )
      ) {
        index = endIndex;
        continue;
      }

      const tokenCount = countMatchingTokenGroups(span, DESIGN_SYSTEM_TOKEN_PATTERNS);
      if (tokenCount < 4) {
        index = endIndex;
        continue;
      }

      violations.push({
        file: rel,
        line: index + 1,
        replacement:
          "extract to Card/Button/Dialog recipe APIs or shared primitive recipe variants",
      });

      index = endIndex;
    }
  }

  const messages = [];
  if (violations.length > 0) {
    messages.push(`${c.red}Design-system ownership violations:${c.reset}`);
    const byFile = groupByFile(violations);

    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 4)) {
        messages.push(`    ${c.dim}L${item.line}${c.reset} → ${item.replacement}`);
      }
      if (items.length > 4) {
        messages.push(`    ${c.dim}... and ${items.length - 4} more${c.reset}`);
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
