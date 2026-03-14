/**
 * CHECK: Surface Shells
 *
 * Blocks raw reusable surface recipes outside the owned primitive boundary.
 * This is stricter than generic raw Tailwind policing: it specifically targets
 * class stacks that define a component shell's visual identity.
 */

import fs from "node:fs";
import path from "node:path";
import {
  collectClassNameSpan,
  DESIGN_SYSTEM_ESCAPE_HATCHES,
  findOpeningTag,
  groupByFile,
  isRawTailwindBoundary,
} from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const SURFACE_SHELL_TOKEN_PATTERNS = {
  radius: /\brounded(?:-[^"'\s}]+)?\b/,
  background: /\bbg-(?!transparent)(?:ui-|brand-|accent-|status-|linear-to)[^"'\s}]+/,
  border: /\bborder(?:-[^"'\s}]+)?\b/,
  shadow: /\bshadow(?:-[^"'\s}]+)?\b/,
  overflow: /\boverflow-hidden\b/,
  shellState:
    /\b(?:hover:(?:bg|border|shadow)|data-\[state=(?:active|open|selected)\]:(?:bg|border|shadow)|aria-[^"'\s}]+:(?:bg|border|shadow))\b/,
};

function countMatchingShellGroups(text) {
  return Object.values(SURFACE_SHELL_TOKEN_PATTERNS).filter((pattern) => pattern.test(text)).length;
}

export function run() {
  const srcDir = path.join(ROOT, "src/components");
  const files = walkDir(srcDir, { extensions: new Set([".tsx"]) });
  const violations = [];

  for (const filePath of files) {
    const rel = relPath(filePath);

    if (isRawTailwindBoundary(rel)) {
      continue;
    }

    const lines = fs.readFileSync(filePath, "utf-8").split("\n");

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

      if (countMatchingShellGroups(span) < 3) {
        index = endIndex;
        continue;
      }

      violations.push({
        file: rel,
        line: index + 1,
        replacement: "move surface shell into Card recipe/variant or shared primitive",
      });

      index = endIndex;
    }
  }

  const messages = [];
  if (violations.length > 0) {
    messages.push(`${c.red}Surface-shell ownership violations:${c.reset}`);
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
      violations.length > 0 ? `${violations.length} surface-shell violations` : "owned boundary",
    messages,
  };
}
