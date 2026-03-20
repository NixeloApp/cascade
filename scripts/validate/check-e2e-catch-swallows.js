/**
 * CHECK: E2E Silent Catch Swallows
 *
 * Ratchets silent `.catch(() => {})` usage across the E2E suite, including the
 * screenshot harness in `e2e/screenshot-pages.ts`. These swallows hide real
 * failures and were a direct contributor to broken spinner/app-shell captures.
 *
 * The existing debt is baselined by file count so the rule can land without
 * blocking current work, but any new or increased silent swallow usage fails.
 */

import fs from "node:fs";
import path from "node:path";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const E2E_DIR = path.join(ROOT, "e2e");
const BASELINE_PATH = path.join(ROOT, "scripts", "ci", "e2e-catch-swallows-baseline.json");
const TARGET_EXTENSIONS = new Set([".ts", ".tsx"]);
const SILENT_CATCH_PATTERN = /\.catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/gms;

function lineFromIndex(source, index) {
  return source.slice(0, index).split("\n").length;
}

export function run() {
  if (!fs.existsSync(E2E_DIR)) {
    return { passed: true, errors: 0, detail: "No e2e/ directory", messages: [] };
  }

  const baselineByFile = loadCountBaseline(BASELINE_PATH, "silentCatchSwallowsByFile");
  const lineNumbersByFile = {};
  const files = walkDir(E2E_DIR, { extensions: TARGET_EXTENSIONS });

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf8");
    const rel = relPath(filePath);
    const matches = [...source.matchAll(SILENT_CATCH_PATTERN)];
    if (matches.length === 0) continue;

    lineNumbersByFile[rel] = matches.map((match) => lineFromIndex(source, match.index ?? 0));
  }

  const ratchet = analyzeCountRatchet(lineNumbersByFile, baselineByFile);
  const violations = Object.entries(ratchet.overagesByKey)
    .map(([file, overage]) => ({
      file,
      baselineCount: overage.baselineCount,
      currentCount: overage.currentCount,
      lineNumbers: lineNumbersByFile[file] ?? [],
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
  const messages = [];

  if (violations.length > 0) {
    messages.push(
      `  ${c.red}ERROR${c.reset} Silent \`.catch(() => {})\` swallows are ratcheted in e2e/. Replace them with explicit handling or update the baseline only after intentional cleanup review.`,
    );

    for (const violation of violations) {
      const linePreview = violation.lineNumbers.slice(0, 12).join(", ");
      const remaining = violation.lineNumbers.length - Math.min(violation.lineNumbers.length, 12);
      messages.push(
        `  ${c.bold}${violation.file}${c.reset} baseline ${violation.baselineCount} → current ${violation.currentCount}`,
      );
      if (linePreview.length > 0) {
        messages.push(
          `    ${c.dim}lines ${linePreview}${remaining > 0 ? `, ... +${remaining} more` : ""}${c.reset}`,
        );
      }
    }
  }

  return {
    passed: violations.length === 0,
    errors: violations.length,
    detail:
      violations.length > 0
        ? `${violations.length} file(s) exceed silent catch swallow baseline`
        : `${ratchet.totalCurrent} baselined swallow(s) across ${ratchet.activeKeyCount} file(s)`,
    messages,
  };
}
