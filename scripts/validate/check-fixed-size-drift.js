/**
 * CHECK: Fixed size drift
 *
 * Ratchets raw square height/width utility pairs in product code.
 *
 * Intended contract:
 * - prefer `size-*` for square shells and icon sizing
 * - prefer owned primitives like `Icon` when a shared icon API exists
 *
 * This stays narrow on purpose:
 * - only square width/height pairs with the same token are flagged
 * - only product code is scanned (routes + non-ui components)
 * - tests, stories, examples, and shared ui internals are skipped
 */

import fs from "node:fs";
import path from "node:path";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { createCountRatchetResult } from "./result-utils.js";
import { collectClassNameSpan, findOpeningTag } from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const SRC_DIRS = [path.join(ROOT, "src", "components"), path.join(ROOT, "src", "routes")];
const BASELINE_PATH = path.join(ROOT, "scripts", "ci", "fixed-size-drift-baseline.json");
const SKIP_FILE_MARKERS = [".test.", ".spec.", ".stories.", ".example."];
const SIZE_TOKEN_RE = /!?((?:[A-Za-z0-9_-]+:)*)((?:h|w|size))-(\d+(?:\.\d+)?)\b/g;

function shouldSkipFile(rel) {
  return (
    rel.includes("src/components/ui/") || SKIP_FILE_MARKERS.some((marker) => rel.includes(marker))
  );
}

function parseSizeToken(token) {
  const match = token.match(/^(!?)((?:[A-Za-z0-9_-]+:)*)((?:h|w|size))-(\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }

  return {
    important: match[1],
    prefix: match[2],
    axis: match[3],
    value: match[4],
  };
}

function collectSquareSizeFindings(span, openingTag, rel, line) {
  const normalizedTokens = new Map();

  for (const match of span.matchAll(SIZE_TOKEN_RE)) {
    const token = match[0];
    const parsed = parseSizeToken(token);
    if (!parsed) {
      continue;
    }

    const key = `${parsed.important}${parsed.prefix}${parsed.value}`;
    const bucket = normalizedTokens.get(key) ?? { h: null, w: null, size: null };
    bucket[parsed.axis] = token;
    normalizedTokens.set(key, bucket);
  }

  const findings = [];
  for (const pair of normalizedTokens.values()) {
    if (!pair.h || !pair.w || pair.size) {
      continue;
    }

    findings.push({
      file: rel,
      line,
      openingTag,
      pair: `${pair.h} ${pair.w}`,
    });
  }

  return findings;
}

export function run() {
  const findingsByFile = {};
  const baselineByFile = loadCountBaseline(BASELINE_PATH, "squareSizeDriftByFile");

  for (const srcDir of SRC_DIRS) {
    const files = walkDir(srcDir, { extensions: new Set([".tsx"]) });

    for (const filePath of files) {
      const rel = relPath(filePath);
      if (shouldSkipFile(rel)) {
        continue;
      }

      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      for (let index = 0; index < lines.length; index++) {
        if (!/\bclassName\s*=/.test(lines[index])) continue;

        const { span, endIndex } = collectClassNameSpan(lines, index);
        const openingTag = findOpeningTag(lines, index);
        const findings = collectSquareSizeFindings(span, openingTag, rel, index + 1);

        if (findings.length > 0) {
          const bucket = findingsByFile[rel] ?? [];
          bucket.push(...findings);
          findingsByFile[rel] = bucket;
        }

        index = endIndex;
      }
    }
  }

  const ratchet = analyzeCountRatchet(findingsByFile, baselineByFile);
  const overageEntries = Object.entries(ratchet.overagesByKey).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  const messages = [];
  if (overageEntries.length > 0) {
    messages.push(
      `${c.red}Square h-*/w-* utility pairs are ratcheted:${c.reset} use \`size-*\` for square shells/icon sizing, or an owned primitive API when one exists.`,
    );

    for (const [, overage] of overageEntries) {
      for (const finding of overage.overageItems) {
        messages.push(
          `  ${c.dim}${finding.file}:${finding.line}${c.reset} ${finding.pair} → use size-* or an owned icon/component size API instead of raw square h/w pairs`,
        );
      }
    }
  }

  return createCountRatchetResult({
    analysis: ratchet,
    overageEntries,
    countBy: "entries",
    messages,
    overageDetail: `${overageEntries.length} file(s) exceed square size drift baseline`,
    baselineDetail: `${ratchet.totalBaselined} baselined square size drift occurrence(s) across ${ratchet.activeKeyCount} file(s)`,
  });
}
