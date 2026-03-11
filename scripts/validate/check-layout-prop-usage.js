/**
 * CHECK: Layout Prop Usage
 * Flags JSX usage sites that bypass layout component props with className utilities.
 *
 * This is separate from check-component-props.js:
 * - check-component-props.js validates layout component definitions
 * - this file validates call sites that should use those APIs
 */

import fs from "node:fs";
import path from "node:path";
import {
  collectClassNameSpan,
  findOpeningTag,
  groupByFile,
  LAYOUT_PROP_GAP_MAP,
  LAYOUT_PROP_PATTERNS,
} from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

function getReplacement(match, component, prop, tokenType) {
  if (tokenType === "align") {
    return `<${component} ${prop}="${match[1]}">`;
  }

  if (tokenType === "justify") {
    return `<${component} ${prop}="${match[1]}">`;
  }

  if (tokenType === "direction") {
    return `<${component} ${prop}="${match[1] === "col" ? "column" : "row"}">`;
  }

  if (tokenType === "stack-unsupported-justify") {
    return 'Stack does not support justify-*; use <Flex direction="column" justify="..."> or a wrapper';
  }

  const rawGap = Number.parseInt(match[1], 10);
  const propValue = LAYOUT_PROP_GAP_MAP[rawGap];
  return propValue ? `<${component} ${prop}="${propValue}">` : `gap-${rawGap} has no prop`;
}

export function run() {
  const srcDir = path.join(ROOT, "src/components");
  const files = walkDir(srcDir, { extensions: new Set([".tsx"]) });
  const issues = [];

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (filePath.endsWith(".test.tsx") || filePath.endsWith(".stories.tsx")) continue;
    if (rel.includes("src/components/ui/")) continue;

    const lines = fs.readFileSync(filePath, "utf-8").split("\n");
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (!line.includes("className")) continue;

      // Collect multiline className spans (up to 20 lines) for pattern matching.
      // Use the full span for layout token detection, not the truncated opening tag.
      const { span, endIndex } = collectClassNameSpan(lines, index);
      const tagText = findOpeningTag(lines, index);
      // Combine span and tagText to ensure we catch tokens in both className value and tag context
      const matchText = `${tagText} ${span}`;

      for (const { pattern, component, prop, tokenType } of LAYOUT_PROP_PATTERNS) {
        const match = matchText.match(pattern);
        if (!match) continue;

        issues.push({
          file: rel,
          line: index + 1,
          replacement: getReplacement(match, component, prop, tokenType),
        });
        index = endIndex;
        break;
      }
    }
  }

  const messages = [];
  if (issues.length > 0) {
    messages.push(`${c.red}Layout prop usage violations:${c.reset}`);
    const byFile = groupByFile(issues);

    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 3)) {
        messages.push(`    ${c.dim}L${item.line}${c.reset} → use ${item.replacement}`);
      }
      if (items.length > 3) {
        messages.push(`    ${c.dim}... and ${items.length - 3} more${c.reset}`);
      }
    }
  }

  return {
    passed: issues.length === 0,
    errors: issues.length,
    detail: issues.length > 0 ? `${issues.length} layout prop usage violations` : null,
    messages,
  };
}
