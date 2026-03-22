/**
 * CHECK: Raw Tailwind
 * Flags generic raw Tailwind usage outside the owned primitive boundary.
 *
 * This check is intentionally narrow:
 * - generic raw utility policing lives here
 * - design-system ownership lives in check-design-system-ownership.js
 * - JSX prop misuse lives in check-layout-prop-usage.js
 *
 * NOTE: This validator has been tightened. New violations are blocked,
 * but existing violations are baselined and tracked for gradual cleanup.
 */

import fs from "node:fs";
import path from "node:path";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import {
  collectClassNameSpan,
  detectClassStringHiding,
  findOpeningTag,
  isRawTailwindBoundary,
  RAW_TAILWIND_PATTERNS,
  RAW_TAILWIND_STRUCTURAL_ALLOWLIST,
} from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const ROUTE_CLUSTER_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "raw-tailwind-route-clusters-baseline.json",
);
const CROSS_FILE_CLUSTER_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "raw-tailwind-cross-file-clusters-baseline.json",
);
const FILE_VIOLATIONS_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "raw-tailwind-violations-baseline.json",
);
const ROUTE_CLUSTER_MIN_REUSE_COUNT = 3;
const ROUTE_CLUSTER_MIN_TOKEN_COUNT = 3;
const CROSS_FILE_CLUSTER_MIN_FILE_COUNT = 2;

/**
 * Escape hatches for raw Tailwind check.
 * If a tag uses recipe/chrome/variant props or variant function calls,
 * it's using the design system and raw utilities are acceptable.
 */
const RAW_TW_ESCAPE_HATCHES = [
  // Direct props on components
  'recipe="',
  "recipe='",
  'chrome="',
  "chrome='",
  'variant="',
  "variant='",
  // Programmatic variant calls
  "cardVariants(",
  "cardRecipeVariants(",
  "getCardRecipeClassName(",
  "getCardVariantClassName(",
  "buttonVariants(",
  "buttonChromeVariants(",
  "tabsTriggerVariants(",
  "tabsListVariants(",
];

function normalizeClassNameLiteral(value) {
  return value.trim().replace(/\s+/g, " ");
}

function extractLiteralClassName(span) {
  const match = span.match(/className\s*=\s*(?:"([\s\S]*?)"|'([\s\S]*?)')/);
  if (!match) {
    return null;
  }

  const literal = normalizeClassNameLiteral(match[1] ?? match[2] ?? "");
  return literal.length > 0 ? literal : null;
}

function loadRouteClusterBaseline() {
  if (!fs.existsSync(ROUTE_CLUSTER_BASELINE_PATH)) {
    return new Map();
  }

  const parsed = JSON.parse(fs.readFileSync(ROUTE_CLUSTER_BASELINE_PATH, "utf-8"));
  return new Map(Object.entries(parsed.clusters ?? {}));
}

function loadCrossFileClusterBaseline() {
  if (!fs.existsSync(CROSS_FILE_CLUSTER_BASELINE_PATH)) {
    return new Map();
  }

  const parsed = JSON.parse(fs.readFileSync(CROSS_FILE_CLUSTER_BASELINE_PATH, "utf-8"));
  return new Map(Object.entries(parsed.clusters ?? {}));
}

function collectLiteralRawTailwindClusterGroups(scanDir, options = {}) {
  const {
    extensions = new Set([".tsx"]),
    includeComponentsOnly = false,
    minReuseCount = ROUTE_CLUSTER_MIN_REUSE_COUNT,
    minFileCount = 1,
  } = options;
  const files = walkDir(scanDir, { extensions });
  const groups = new Map();

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (includeComponentsOnly && isRawTailwindBoundary(rel)) {
      continue;
    }
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");

    for (let index = 0; index < lines.length; index++) {
      if (!/\bclassName\s*=/.test(lines[index])) continue;

      const { span, endIndex } = collectClassNameSpan(lines, index);
      const literal = extractLiteralClassName(span);

      if (!literal) {
        index = endIndex;
        continue;
      }

      const tokenCount = literal.split(/\s+/).filter(Boolean).length;
      if (tokenCount < ROUTE_CLUSTER_MIN_TOKEN_COUNT) {
        index = endIndex;
        continue;
      }

      if (!RAW_TAILWIND_PATTERNS.some(({ pattern }) => pattern.test(literal))) {
        index = endIndex;
        continue;
      }

      const locations = groups.get(literal) ?? [];
      locations.push({ file: rel, line: index + 1 });
      groups.set(literal, locations);
      index = endIndex;
    }
  }

  return [...groups.entries()]
    .map(([cluster, locations]) => ({
      cluster,
      locations: locations.sort(
        (left, right) => left.file.localeCompare(right.file) || left.line - right.line,
      ),
      fileCount: new Set(locations.map((location) => location.file)).size,
    }))
    .filter((group) => group.locations.length >= minReuseCount && group.fileCount >= minFileCount)
    .sort(
      (left, right) =>
        right.locations.length - left.locations.length || left.cluster.localeCompare(right.cluster),
    );
}

function collectRouteClusterGroups() {
  return collectLiteralRawTailwindClusterGroups(path.join(ROOT, "src/routes"), {
    minReuseCount: ROUTE_CLUSTER_MIN_REUSE_COUNT,
  });
}

function collectCrossFileClusterGroups() {
  return collectLiteralRawTailwindClusterGroups(path.join(ROOT, "src/components"), {
    includeComponentsOnly: true,
    minReuseCount: ROUTE_CLUSTER_MIN_REUSE_COUNT,
    minFileCount: CROSS_FILE_CLUSTER_MIN_FILE_COUNT,
  });
}

export function run() {
  const srcDir = path.join(ROOT, "src/components");
  const files = walkDir(srcDir, { extensions: new Set([".tsx"]) });
  const fileViolationsBaseline = loadCountBaseline(
    FILE_VIOLATIONS_BASELINE_PATH,
    "rawTailwindViolationsByFile",
  );
  const violationsByFile = {};
  const crossFileClusterBaseline = loadCrossFileClusterBaseline();
  const crossFileClusterViolations = [];
  const baselinedCrossFileClusters = [];
  const routeClusterBaseline = loadRouteClusterBaseline();
  const routeClusterViolations = [];
  const baselinedRouteClusters = [];

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (isRawTailwindBoundary(rel)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Pre-scan: detect class-string hiding (const strings and object maps)
    const hiddenClassViolations = detectClassStringHiding(lines);
    const constStringMap = new Map();
    for (const v of hiddenClassViolations) {
      if (v.type === "const-string") {
        constStringMap.set(v.name, { value: v.value, line: v.line });
      }
    }

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (!/\bclassName\s*=/.test(line)) continue;

      // Collect full className span for multiline attributes
      const { span, endIndex } = collectClassNameSpan(lines, index);

      // Get the opening tag to check for escape hatches
      const tagText = findOpeningTag(lines, index);

      // Skip if using design system APIs (recipe, chrome, variant props or variant calls)
      if (RAW_TW_ESCAPE_HATCHES.some((token) => span.includes(token) || tagText.includes(token))) {
        index = endIndex;
        continue;
      }

      // Skip tag-based structural allowlist entries (e.g., Skeleton components)
      if (
        RAW_TAILWIND_STRUCTURAL_ALLOWLIST.some(
          (allow) => allow.source.startsWith("^<") && allow.test(tagText.trim()),
        )
      ) {
        index = endIndex;
        continue;
      }

      // Resolve className={CONST_VAR} references to their string value
      let resolvedSpan = span;
      let isConstRef = false;
      const varRefMatch = span.match(/className\s*=\s*\{([A-Za-z_]\w*)\}/);
      if (varRefMatch) {
        const entry = constStringMap.get(varRefMatch[1]);
        if (entry) {
          resolvedSpan = `className="${entry.value}"`;
          isConstRef = true;
        }
      }

      // Strip structurally-allowed tokens (per-token, not per-attribute)
      // so that e.g. "min-w-0 p-4" only strips min-w-0 and still flags p-4.
      const classBasedAllowlist = RAW_TAILWIND_STRUCTURAL_ALLOWLIST.filter(
        (allow) => !allow.source.startsWith("^<"),
      );
      let filteredSpan = resolvedSpan;
      if (classBasedAllowlist.length > 0) {
        filteredSpan = resolvedSpan.replace(/(?<=["'\s])(\S+)/g, (token) =>
          classBasedAllowlist.some((allow) => allow.test(token)) ? "" : token,
        );
      }

      for (const { pattern, replacement } of RAW_TAILWIND_PATTERNS) {
        if (!pattern.test(filteredSpan)) continue;

        const suffix = isConstRef ? " (hidden in const — still raw Tailwind)" : "";
        const violation = {
          line: index + 1,
          replacement: `${replacement}${suffix}`,
        };
        const bucket = violationsByFile[rel] ?? [];
        bucket.push(violation);
        violationsByFile[rel] = bucket;
        break;
      }

      // Skip past multiline spans to avoid double-counting
      index = endIndex;
    }

    // Report class-map hiding as separate violations
    for (const v of hiddenClassViolations.filter((h) => h.type === "object-map")) {
      const violation = {
        line: v.line + 1,
        replacement: `hidden style map "${v.name}" — use plain Tailwind or extract a component`,
      };
      const bucket = violationsByFile[rel] ?? [];
      bucket.push(violation);
      violationsByFile[rel] = bucket;
    }
  }

  for (const group of collectCrossFileClusterGroups()) {
    const baselineCount = crossFileClusterBaseline.get(group.cluster) ?? 0;
    if (group.locations.length > baselineCount) {
      crossFileClusterViolations.push({ ...group, baselineCount });
      continue;
    }

    baselinedCrossFileClusters.push(group);
  }

  for (const group of collectRouteClusterGroups()) {
    const baselineCount = routeClusterBaseline.get(group.cluster) ?? 0;
    if (group.locations.length > baselineCount) {
      routeClusterViolations.push({ ...group, baselineCount });
      continue;
    }

    baselinedRouteClusters.push(group);
  }

  const fileViolationRatchet = analyzeCountRatchet(violationsByFile, fileViolationsBaseline);
  const rawTailwindOverages = Object.entries(fileViolationRatchet.overagesByKey)
    .map(([file, overage]) => ({
      file,
      baselineCount: overage.baselineCount,
      currentCount: overage.currentCount,
      violations: overage.overageItems,
    }))
    .sort((a, b) => a.file.localeCompare(b.file));

  const messages = [];

  if (rawTailwindOverages.length > 0) {
    messages.push(
      `${c.red}Raw Tailwind violations are ratcheted by file:${c.reset} shrink existing debt instead of keeping files on a permanent allowlist.`,
    );

    for (const item of rawTailwindOverages) {
      messages.push(
        `  ${c.bold}${item.file}${c.reset} baseline ${item.baselineCount} → current ${item.currentCount}`,
      );
      for (const violation of item.violations.slice(0, 3)) {
        messages.push(`    ${c.dim}L${violation.line}${c.reset} → use ${violation.replacement}`);
      }
      if (item.violations.length > 3) {
        messages.push(`    ${c.dim}... and ${item.violations.length - 3} more${c.reset}`);
      }
    }
  }

  if (crossFileClusterViolations.length > 0) {
    messages.push(`${c.red}Repeated raw Tailwind clusters across component files:${c.reset}`);
    for (const item of crossFileClusterViolations) {
      messages.push(
        `  ${c.bold}${item.locations.length}x across ${item.fileCount} file(s)${c.reset} ${item.cluster}`,
      );
      for (const location of item.locations.slice(0, 4)) {
        messages.push(`    ${c.dim}${location.file}:L${location.line}${c.reset}`);
      }
      if (item.locations.length > 4) {
        messages.push(`    ${c.dim}... and ${item.locations.length - 4} more${c.reset}`);
      }
      if (item.baselineCount > 0) {
        messages.push(`    ${c.dim}baseline ${item.baselineCount}x${c.reset}`);
      }
      messages.push(`    ${c.dim}extract a shared component or owned variant${c.reset}`);
    }
  }

  if (routeClusterViolations.length > 0) {
    messages.push(`${c.red}Repeated raw Tailwind route clusters:${c.reset}`);
    for (const item of routeClusterViolations) {
      messages.push(`  ${c.bold}${item.locations.length}x${c.reset} ${item.cluster}`);
      for (const location of item.locations.slice(0, 3)) {
        messages.push(`    ${c.dim}${location.file}:L${location.line}${c.reset}`);
      }
      if (item.locations.length > 3) {
        messages.push(`    ${c.dim}... and ${item.locations.length - 3} more${c.reset}`);
      }
      if (item.baselineCount > 0) {
        messages.push(`    ${c.dim}baseline ${item.baselineCount}x${c.reset}`);
      }
      messages.push(`    ${c.dim}extract a route-local component or variant${c.reset}`);
    }
  }

  // Summary of baselined violations (info only)
  const baselineDetails = [];
  if (fileViolationRatchet.totalCurrent > 0) {
    baselineDetails.push(
      `${fileViolationRatchet.totalCurrent} baselined in ${fileViolationRatchet.activeKeyCount} files`,
    );
  }
  if (baselinedCrossFileClusters.length > 0) {
    baselineDetails.push(`${baselinedCrossFileClusters.length} baselined cross-file clusters`);
  }
  if (baselinedRouteClusters.length > 0) {
    baselineDetails.push(`${baselinedRouteClusters.length} baselined route clusters`);
  }

  const ratchetableBaselineFiles = Object.keys(fileViolationsBaseline)
    .filter((file) => (violationsByFile[file]?.length ?? 0) < (fileViolationsBaseline[file] ?? 0))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({
      file,
      baselineCount: fileViolationsBaseline[file] ?? 0,
      currentCount: violationsByFile[file]?.length ?? 0,
    }));

  return {
    passed:
      rawTailwindOverages.length === 0 &&
      crossFileClusterViolations.length === 0 &&
      routeClusterViolations.length === 0,
    errors:
      rawTailwindOverages.length +
      crossFileClusterViolations.length +
      routeClusterViolations.length,
    detail:
      rawTailwindOverages.length > 0 ||
      crossFileClusterViolations.length > 0 ||
      routeClusterViolations.length > 0
        ? [
            rawTailwindOverages.length > 0
              ? `${rawTailwindOverages.length} file(s) exceed raw Tailwind baseline`
              : null,
            crossFileClusterViolations.length > 0
              ? `${crossFileClusterViolations.length} repeated cross-file class cluster(s)`
              : null,
            routeClusterViolations.length > 0
              ? `${routeClusterViolations.length} repeated route class cluster(s)`
              : null,
          ]
            .filter(Boolean)
            .join(", ")
        : `owned boundary${baselineDetails.length > 0 ? ` (${baselineDetails.join(", ")})` : ""}`,
    messages,
    ratchetableBaselineFiles,
  };
}

// Standalone audit mode: node scripts/validate/check-raw-tailwind.js --audit
if (process.argv.includes("--audit")) {
  const result = run();
  const ratchetable = result.ratchetableBaselineFiles ?? [];
  console.log(`\nBaseline: ${ratchetable.length === 0 ? "current" : "stale"} counts loaded`);
  console.log(`Ratchetable baseline files: ${ratchetable.length}\n`);
  if (ratchetable.length > 0) {
    console.log("Lower rawTailwindViolationsByFile entries to:");
    for (const item of ratchetable) {
      console.log(`  "${item.file}": ${item.currentCount}, // was ${item.baselineCount}`);
    }
  }
}
