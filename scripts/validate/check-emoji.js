/**
 * CHECK: Emoji Usage
 * Finds emoji in source code that should be replaced with Lucide icons.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  const SKIP_PATTERNS = [
    /\.test\.tsx?$/,
    /\.stories\.tsx?$/,
    /CommentReactions\.tsx$/, // Intentional emoji for reactions
    /DocumentTemplatesManager\.tsx$/, // User input field for template icons
    /routes\/signin\.tsx$/, // Arrow in link text (Mintlify pattern)
    /routes\/signup\.tsx$/, // Arrow in link text (Mintlify pattern)
    /routes\/forgot-password\.tsx$/, // Arrow in link text (Mintlify pattern)
    /src\/components\/KeyboardShortcutsHelp\.tsx$/, // Uses emoji for keyboard keys
  ];

  // Emoji regex - matches most common emoji ranges
  // Excludes keyboard symbols like ⌘, ⌥, ⇧, ⌃, ⏎, ⎋
  const EMOJI_REGEX =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}\u{2049}]|[\u{20E3}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[✓✅❌⚠️⬆️⬇️↗️↘️➡️↑↓→←]/gu;

  const KEYBOARD_SYMBOLS = /[⌘⌥⇧⌃⏎⎋]/;

  let errorCount = 0;
  const errors = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (SKIP_PATTERNS.some((p) => p.test(rel))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const matches = line.match(EMOJI_REGEX);
      if (matches) {
        // Filter out keyboard shortcut symbols
        const filtered = matches.filter((m) => !KEYBOARD_SYMBOLS.test(m));
        if (filtered.length > 0) {
          const unique = [...new Set(filtered)];
          errors.push(
            `  ${c.red}ERROR${c.reset} ${rel}:${index + 1} - Emoji ${unique.join(" ")} should be replaced with Lucide icon`,
          );
          errorCount++;
        }
      }
    });
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  for (const f of files) checkFile(f);

  let detail = null;
  if (errorCount > 0) {
    detail = `${errorCount} emoji occurrence(s)`;
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    warnings: 0,
    detail,
    messages: errors,
  };
}
