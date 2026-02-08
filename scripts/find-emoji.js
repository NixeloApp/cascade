#!/usr/bin/env node
/**
 * Find all emoji in the codebase that should be replaced with Lucide icons.
 *
 * Usage: node scripts/find-emoji.js
 *
 * Excludes:
 * - Test files (*.test.tsx)
 * - Story files (*.stories.tsx)
 * - CommentReactions.tsx (intentional emoji for reactions)
 * - node_modules, dist, .git
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

// Files/patterns to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /\.next/,
  /\.test\.tsx?$/,
  /\.stories\.tsx?$/,
  /CommentReactions\.tsx$/,
  /\.md$/,
  /\.json$/,
  /\.css$/,
  /\.svg$/,
  /\.png$/,
  /\.ico$/,
];

// Emoji regex - matches most common emoji ranges
// This catches emoji but not keyboard symbols like ⌘
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{203C}\u{2049}]|[\u{20E3}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[✓✅❌⚠️⬆️⬇️↗️↘️➡️↑↓→←]/gu;

// Additional patterns that look like icon usage
const ICON_PATTERNS = [
  /icon[=:]?\s*["'`][^"'`]*[\u{1F300}-\u{1F9FF}]/gu,
  /className.*text-[24]xl.*>[^<]*[\u{1F300}-\u{1F9FF}]/gu,
  /<span[^>]*>[^<]*[\u{1F300}-\u{1F9FF}][^<]*<\/span>/gu,
];

function shouldSkip(filePath) {
  return SKIP_PATTERNS.some(pattern => pattern.test(filePath));
}

function findFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    if (shouldSkip(fullPath)) continue;

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findFiles(fullPath, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

function findEmoji(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const results = [];

  lines.forEach((line, index) => {
    const matches = line.match(EMOJI_REGEX);
    if (matches) {
      // Skip keyboard shortcut symbols (⌘, ⌥, ⇧, etc.)
      const filtered = matches.filter(m => !/[⌘⌥⇧⌃⏎⎋]/.test(m));
      if (filtered.length > 0) {
        results.push({
          line: index + 1,
          emoji: [...new Set(filtered)],
          content: line.trim().substring(0, 100),
        });
      }
    }
  });

  return results;
}

// Main
console.log("🔍 Scanning for emoji in source files...\n");

const files = findFiles(join(ROOT, "src"));
const allResults = [];

for (const file of files) {
  const results = findEmoji(file);
  if (results.length > 0) {
    allResults.push({
      file: relative(ROOT, file),
      matches: results,
    });
  }
}

if (allResults.length === 0) {
  console.log("✅ No emoji found! Codebase is clean.\n");
  process.exit(0);
}

console.log(`Found emoji in ${allResults.length} files:\n`);

for (const { file, matches } of allResults) {
  console.log(`\n📄 ${file}`);
  for (const { line, emoji, content } of matches) {
    console.log(`   Line ${line}: ${emoji.join(" ")} → ${content}`);
  }
}

console.log(`\n\n📊 Summary: ${allResults.reduce((sum, r) => sum + r.matches.length, 0)} emoji occurrences in ${allResults.length} files`);
console.log("\nReplace with Lucide icons from @/lib/icons using <Icon icon={...} /> component.\n");
