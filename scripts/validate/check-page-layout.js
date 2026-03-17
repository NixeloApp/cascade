/**
 * CHECK: Page Layout Consistency
 * Flags route files that use ad-hoc `max-w-*` + `mx-auto` patterns instead of
 * PageLayout's `maxWidth` prop. Inner content constraints (max-w without mx-auto)
 * are allowed — only the "I am the page wrapper" pattern is flagged.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Only scan route files — components are allowed to use max-w internally
const ROUTES_DIR = path.join(ROOT, "src/routes/_auth/_app");

// Pattern: className containing both max-w-{size} and mx-auto
const MAX_W_RE = /max-w-(sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|screen-\w+)/;
const MX_AUTO_RE = /mx-auto/;

// Only flag container elements — not Typography, Badge, etc.
const CONTAINER_TAG_RE = /^\s*<(div|section|main|article)/;

// Files with known violations that are too complex to migrate now (baseline)
const BASELINE_FILES = new Set([
  // Custom header pages — deferred, too specialized for PageLayout
]);

/**
 * Walk backwards from a className line to find the opening JSX tag.
 * Returns the tag name or null if not found.
 */
function findTagName(lines, lineIndex) {
  // Check the current line first
  const match = lines[lineIndex].match(CONTAINER_TAG_RE);
  if (match) return match[1];

  // Look back up to 5 lines for the opening tag
  for (let j = lineIndex - 1; j >= Math.max(0, lineIndex - 5); j--) {
    const m = lines[j].match(CONTAINER_TAG_RE);
    if (m) return m[1];
    // If we hit a closing tag or another element, stop
    if (lines[j].match(/^\s*<\w/) || lines[j].includes("/>") || lines[j].includes("</")) break;
  }
  return null;
}

export function run() {
  const files = walkDir(ROUTES_DIR, { extensions: new Set([".tsx"]) });
  const issues = [];

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (filePath.endsWith(".test.tsx")) continue;
    if (BASELINE_FILES.has(rel)) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Quick check — only look at lines with className
      if (!line.includes("className")) continue;

      // Collect the full className value (may span multiple lines)
      let classSpan = line;
      if (line.includes("className") && !line.includes("/>") && !line.includes(">")) {
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          classSpan += " " + lines[j];
          if (lines[j].includes(">") || lines[j].includes("/>")) break;
        }
      }

      const hasMaxW = MAX_W_RE.test(classSpan);
      const hasMxAuto = MX_AUTO_RE.test(classSpan);

      if (hasMaxW && hasMxAuto) {
        // Only flag container elements, not Typography/Badge/etc.
        const tag = findTagName(lines, i);
        if (!tag) continue;

        const maxWMatch = classSpan.match(MAX_W_RE);
        issues.push({
          file: rel,
          line: i + 1,
          maxW: maxWMatch ? `max-w-${maxWMatch[1]}` : "max-w-*",
        });
      }
    }
  }

  const messages = [];
  if (issues.length > 0) {
    messages.push(
      `${c.red}Ad-hoc page layout wrappers (use PageLayout maxWidth prop instead):${c.reset}`,
    );
    for (const issue of issues) {
      messages.push(
        `  ${c.red}ERROR${c.reset} ${issue.file}:${issue.line} — ${issue.maxW} + mx-auto → use <PageLayout maxWidth="...">`,
      );
    }
  }

  return {
    passed: issues.length === 0,
    errors: issues.length,
    detail: issues.length > 0 ? `${issues.length} ad-hoc layout wrapper(s)` : null,
    messages,
  };
}
