/**
 * Screenshot Diff Tool
 *
 * Compares current screenshots against a stored hash manifest to detect
 * visual changes. Used to track screenshot drift across PRs.
 *
 * Usage:
 *   node scripts/screenshot-diff.js          # compare current vs manifest
 *   node scripts/screenshot-diff.js --approve # update manifest to current state
 *
 * Exit codes:
 *   0 — no changes (or --approve succeeded)
 *   1 — changes detected (new, removed, or modified screenshots)
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MANIFEST_PATH = path.join(ROOT, ".screenshot-hashes.json");

// Directories that contain screenshots
const SCREENSHOT_DIRS = [
  path.join(ROOT, "docs", "design", "specs", "pages"),
  path.join(ROOT, "docs", "design", "specs", "modals", "screenshots"),
  path.join(ROOT, "e2e", "screenshots"),
];

function collectPngFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".png") && !entry.name.startsWith("reference-")) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

function buildCurrentManifest() {
  const manifest = {};
  for (const dir of SCREENSHOT_DIRS) {
    for (const filePath of collectPngFiles(dir)) {
      const relPath = path.relative(ROOT, filePath);
      manifest[relPath] = hashFile(filePath);
    }
  }
  return manifest;
}

function loadStoredManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

function saveManifest(manifest) {
  const sorted = Object.keys(manifest)
    .sort()
    .reduce((acc, key) => {
      acc[key] = manifest[key];
      return acc;
    }, {});
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
}

function diff(stored, current) {
  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];

  // Files in current but not in stored → added
  for (const [file, hash] of Object.entries(current)) {
    if (!(file in stored)) {
      added.push(file);
    } else if (stored[file] !== hash) {
      changed.push(file);
    } else {
      unchanged.push(file);
    }
  }

  // Files in stored but not in current → removed
  for (const file of Object.keys(stored)) {
    if (!(file in current)) {
      removed.push(file);
    }
  }

  return { added, removed, changed, unchanged };
}

function printSection(label, files, color) {
  if (files.length === 0) return;
  console.log(`\n  ${color}${label} (${files.length}):\x1b[0m`);
  for (const file of files.sort()) {
    console.log(`    ${file}`);
  }
}

function run() {
  const args = process.argv.slice(2);
  const isApprove = args.includes("--approve");

  console.log("\n  Screenshot Diff");
  console.log("  ───────────────");

  const current = buildCurrentManifest();
  const totalCurrent = Object.keys(current).length;

  if (isApprove) {
    saveManifest(current);
    console.log(`\n  ✓ Manifest updated: ${totalCurrent} screenshots approved`);
    console.log(`  → ${path.relative(ROOT, MANIFEST_PATH)}\n`);
    return;
  }

  const stored = loadStoredManifest();

  if (!stored) {
    console.log(`\n  No manifest found at ${path.relative(ROOT, MANIFEST_PATH)}`);
    console.log(`  Run with --approve to create the initial baseline.\n`);
    console.log(`  ${totalCurrent} screenshots found.\n`);
    process.exit(1);
  }

  const result = diff(stored, current);
  const hasChanges =
    result.added.length > 0 || result.removed.length > 0 || result.changed.length > 0;

  // Summary line
  const parts = [];
  if (result.added.length > 0) parts.push(`\x1b[32m+${result.added.length} new\x1b[0m`);
  if (result.removed.length > 0) parts.push(`\x1b[31m-${result.removed.length} removed\x1b[0m`);
  if (result.changed.length > 0) parts.push(`\x1b[33m~${result.changed.length} changed\x1b[0m`);
  parts.push(`${result.unchanged.length} unchanged`);

  console.log(`\n  ${parts.join("  │  ")}`);

  // Details
  printSection("NEW", result.added, "\x1b[32m");
  printSection("REMOVED", result.removed, "\x1b[31m");
  printSection("CHANGED", result.changed, "\x1b[33m");

  if (hasChanges) {
    console.log(
      `\n  Run \x1b[1mnode scripts/screenshot-diff.js --approve\x1b[0m to accept these changes.\n`,
    );
    process.exit(1);
  }

  console.log(`\n  ✓ No changes. ${totalCurrent} screenshots match the manifest.\n`);
}

run();
