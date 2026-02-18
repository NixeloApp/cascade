/**
 * CHECK: Raw Tailwind
 * Flags raw Tailwind classes outside allowed directories.
 * Part of Phase 7: Zero Raw Tailwind enforcement.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC = path.join(ROOT, "src/components");

  // Directories/patterns where raw Tailwind is allowed
  // These contain internal UI components or are complex enough to warrant raw TW
  const ALLOWED = [
    "src/components/ui/",
    "src/components/Landing/",
    "src/components/Kanban/",
    "src/components/Calendar/",
    "src/components/Auth/",
    "src/components/Editor/",
    "src/components/AI/",
    "src/components/Sidebar/",
    "src/components/Plate/",
    "src/components/Onboarding/",
    "AppSidebar.tsx", // Contains NavItem, CollapsibleSection internal components
    "AppHeader.tsx", // Navigation header with internal components
    ".stories.tsx",
    ".test.tsx",
  ];

  // Patterns that should use CVA components instead
  const RAW_PATTERNS = [
    { pattern: /className=.*\bflex\b/, replacement: "<Flex>" },
    { pattern: /className=.*\binline-flex\b/, replacement: "<Flex inline>" },
    { pattern: /\bgrid\b/, replacement: "<Grid>" },
    { pattern: /\bgap-\d+/, replacement: "<Flex gap='...'>" },
    { pattern: /\bp-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bpx-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bpy-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bspace-y-\d+/, replacement: "<Stack gap='...'>" },
    { pattern: /\bspace-x-\d+/, replacement: "<Flex gap='...'>" },
    { pattern: /\brounded-(?!none|full)/, replacement: "<Card>" },
    { pattern: /\btext-(?:xs|sm|base|lg|xl|\d)/, replacement: "<Typography>" },
    {
      pattern: /\bfont-(?:thin|light|normal|medium|semibold|bold)/,
      replacement: "<Typography>",
    },
  ];

  const violations = [];

  function isAllowed(filePath) {
    const rel = relPath(filePath);
    return ALLOWED.some((pattern) => rel.includes(pattern));
  }

  function checkFile(filePath) {
    if (isAllowed(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rel = relPath(filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("className")) continue;

      for (const { pattern, replacement } of RAW_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: rel,
            line: i + 1,
            pattern: pattern.toString(),
            replacement,
            snippet: line.trim().slice(0, 80),
          });
          break; // One violation per line is enough
        }
      }
    }
  }

  const files = walkDir(SRC, { extensions: new Set([".tsx"]) });
  for (const f of files) checkFile(f);

  const messages = [];
  if (violations.length > 0) {
    // Group by file
    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 3)) {
        // Show max 3 per file
        messages.push(`    ${c.dim}L${item.line}${c.reset} → use ${item.replacement}`);
      }
      if (items.length > 3) {
        messages.push(`    ${c.dim}... and ${items.length - 3} more${c.reset}`);
      }
    }
  }

  // During Phase 7 migration, this is a soft check (warnings only, doesn't fail CI)
  // Once migration is complete, change `passed: true` to `passed: violations.length === 0`
  return {
    passed: true, // Soft check - doesn't fail CI during migration
    errors: 0,
    warnings: violations.length,
    detail: violations.length > 0 ? `${violations.length} raw Tailwind (soft check)` : null,
    messages,
  };
}
