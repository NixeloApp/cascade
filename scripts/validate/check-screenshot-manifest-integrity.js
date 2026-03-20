/**
 * CHECK: Screenshot Manifest Integrity
 *
 * Fails when the screenshot hash manifest references the same image hash more
 * than twice. Two references are the maximum legitimate case for dual-written
 * captures (for example, a modal baseline and a page-level alias). Three or
 * more references indicate a broken generic capture, typically a loading
 * spinner or app-shell fallback being reused across unrelated screenshots.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT } from "./utils.js";

const MANIFEST_PATH = path.join(ROOT, ".screenshot-hashes.json");
const MAX_REFERENCES_PER_HASH = 2;

export function run() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return {
      passed: false,
      errors: 1,
      detail: "missing .screenshot-hashes.json",
      messages: [
        `  ${c.red}ERROR${c.reset} Missing screenshot manifest at ${path.relative(ROOT, MANIFEST_PATH)}`,
      ],
    };
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  } catch (error) {
    return {
      passed: false,
      errors: 1,
      detail: "invalid .screenshot-hashes.json",
      messages: [
        `  ${c.red}ERROR${c.reset} Failed to parse .screenshot-hashes.json: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }

  const hashToFiles = new Map();
  for (const [filePath, hash] of Object.entries(manifest)) {
    if (typeof hash !== "string" || hash.length === 0) continue;
    const bucket = hashToFiles.get(hash) ?? [];
    bucket.push(filePath);
    hashToFiles.set(hash, bucket);
  }

  const violations = [...hashToFiles.entries()]
    .filter(([, filePaths]) => filePaths.length > MAX_REFERENCES_PER_HASH)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([hash, filePaths]) => ({
      hash,
      filePaths: [...filePaths].sort(),
    }));

  const messages = [];
  if (violations.length > 0) {
    messages.push(
      `  ${c.red}ERROR${c.reset} Screenshot hashes may appear at most ${MAX_REFERENCES_PER_HASH} times; higher counts usually mean spinner/app-shell captures were approved.`,
    );
    for (const violation of violations) {
      messages.push(
        `  ${c.bold}${violation.hash}${c.reset} (${violation.filePaths.length} references)`,
      );
      for (const filePath of violation.filePaths) {
        messages.push(`    ${c.dim}${filePath}${c.reset}`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    errors: violations.length,
    detail:
      violations.length > 0
        ? `${violations.length} hash group(s) exceed ${MAX_REFERENCES_PER_HASH} references`
        : "screenshot manifest hashes are within duplicate threshold",
    messages,
  };
}
