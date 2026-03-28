/**
 * CHECK: Raw Styling
 * Flags raw styling outside the owned primitive boundary — both className
 * (Tailwind utilities) and inline style props (hardcoded CSS values).
 *
 * This check is intentionally narrow:
 * - generic raw utility policing lives here
 * - design-system ownership lives in check-design-system-ownership.js
 * - JSX prop misuse lives in check-layout-prop-usage.js
 *
 * NOTE: This validator is ratcheted. New violations are blocked,
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
  'variant="',
  "variant='",
  // Programmatic variant calls
  "cardVariants(",
  "cardRecipeVariants(",
  "getCardRecipeClassName(",
  "getCardVariantClassName(",
  "buttonVariants(",
  "tabsTriggerVariants(",
  "tabsListVariants(",
];

/**
 * Inline style CSS properties that map to the same design-system concerns
 * as the raw Tailwind patterns. Only hardcoded literal values are flagged;
 * dynamic/computed values (variables, template literals, expressions) are OK.
 */
const INLINE_STYLE_PATTERNS = [
  {
    props: ["width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight"],
    replacement: "component prop or design token",
  },
  {
    props: [
      "padding",
      "paddingLeft",
      "paddingRight",
      "paddingTop",
      "paddingBottom",
      "paddingInline",
      "paddingBlock",
    ],
    replacement: "component padding prop or design token",
  },
  {
    props: [
      "margin",
      "marginLeft",
      "marginRight",
      "marginTop",
      "marginBottom",
      "marginInline",
      "marginBlock",
    ],
    replacement: "component spacing or design token",
  },
  { props: ["gap"], replacement: "gap prop on Flex/Stack/Grid" },
  {
    props: ["fontSize", "fontWeight"],
    replacement: "Typography component",
  },
  { props: ["borderRadius"], replacement: "Card or design token" },
  { props: ["opacity"], replacement: "opacity token" },
];

/**
 * Build a combined regex that matches any flagged CSS property name as an
 * object key in a JSX style prop: `propName:` or `propName :`.
 */
const INLINE_STYLE_PROP_REGEX = new RegExp(
  `\\b(${INLINE_STYLE_PATTERNS.flatMap((p) => p.props).join("|")})\\s*:`,
);

/**
 * Collect the full style={{ ... }} span starting from a line that contains
 * `style=`. Returns the concatenated text and the ending line index.
 */
function collectStyleSpan(lines, startIndex) {
  const startCol = lines[startIndex].indexOf("style=");
  if (startCol === -1) return { span: "", endIndex: startIndex };

  let span = lines[startIndex].slice(startCol);
  let endIndex = startIndex;
  let braces = 0;
  let started = false;

  for (const ch of span) {
    if (ch === "{") {
      braces++;
      started = true;
    }
    if (ch === "}") braces--;
    if (started && braces <= 0) return { span, endIndex };
  }

  // Multiline — keep reading until braces balance
  for (let j = startIndex + 1; j < Math.min(lines.length, startIndex + 30); j++) {
    span += ` ${lines[j]}`;
    endIndex = j;
    for (const ch of lines[j]) {
      if (ch === "{") braces++;
      if (ch === "}") braces--;
    }
    if (braces <= 0) break;
  }

  return { span, endIndex };
}

/**
 * Check whether a style value for a given property is a hardcoded literal
 * (string, number) rather than a dynamic expression.
 *
 * We flag: `width: 0`, `width: 64`, `width: "16rem"`, `height: "100%"`
 * We skip: `width: someVar`, `left: \`${offset}px\``, `width: x + 10`
 */
function isHardcodedStyleValue(span, propName) {
  // Find the property in the span
  const propRegex = new RegExp(`\\b${propName}\\s*:`);
  const match = propRegex.exec(span);
  if (!match) return false;

  const afterColon = span.slice(match.index + match[0].length).trim();

  // Number literal (including negative): 0, 64, -1, 0.5, 600
  if (/^-?\d+(\.\d+)?[,}\s]/.test(afterColon)) return true;

  // String literal: "16rem", "100%", "1.5rem", "0.5rem"
  if (/^["']/.test(afterColon)) {
    // But skip if it contains var() — that's a token reference
    const stringMatch = afterColon.match(/^["']([^"']*?)["']/);
    if (stringMatch && !stringMatch[1].includes("var(")) return true;
  }

  return false;
}

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

      // ── className violations (existing logic) ──
      if (/\bclassName\s*=/.test(line)) {
        // Collect full className span for multiline attributes
        const { span, endIndex } = collectClassNameSpan(lines, index);

        // Get the opening tag to check for escape hatches
        const tagText = findOpeningTag(lines, index);

        // Skip if using design system APIs (recipe, chrome, variant props or variant calls)
        if (
          RAW_TW_ESCAPE_HATCHES.some((token) => span.includes(token) || tagText.includes(token))
        ) {
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

          const suffix = isConstRef ? " (hidden in const — still raw styling)" : "";
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
        continue;
      }

      // ── Inline style violations ──
      if (/\bstyle\s*=\s*\{/.test(line)) {
        const tagText = findOpeningTag(lines, index);

        // Same escape hatches apply — design system components can use inline styles
        if (RAW_TW_ESCAPE_HATCHES.some((token) => tagText.includes(token))) {
          continue;
        }

        // Skip Skeleton components
        if (
          RAW_TAILWIND_STRUCTURAL_ALLOWLIST.some(
            (allow) => allow.source.startsWith("^<") && allow.test(tagText.trim()),
          )
        ) {
          continue;
        }

        const { span: styleSpan, endIndex } = collectStyleSpan(lines, index);

        // Only flag if the span contains a property we care about
        if (!INLINE_STYLE_PROP_REGEX.test(styleSpan)) {
          index = endIndex;
          continue;
        }

        // Check each pattern group for hardcoded values
        for (const { props, replacement } of INLINE_STYLE_PATTERNS) {
          let found = false;
          for (const prop of props) {
            const propRegex = new RegExp(`\\b${prop}\\s*:`);
            if (propRegex.test(styleSpan) && isHardcodedStyleValue(styleSpan, prop)) {
              const violation = {
                line: index + 1,
                replacement: `${replacement} (inline style "${prop}")`,
              };
              const bucket = violationsByFile[rel] ?? [];
              bucket.push(violation);
              violationsByFile[rel] = bucket;
              found = true;
              break;
            }
          }
          if (found) break;
        }

        index = endIndex;
      }
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
  const rawStylingOverages = Object.entries(fileViolationRatchet.overagesByKey)
    .map(([file, overage]) => ({
      file,
      baselineCount: overage.baselineCount,
      currentCount: overage.currentCount,
      violations: overage.overageItems,
    }))
    .sort((a, b) => a.file.localeCompare(b.file));

  const messages = [];

  if (rawStylingOverages.length > 0) {
    messages.push(
      `${c.red}Raw styling violations are ratcheted by file:${c.reset} shrink existing debt instead of keeping files on a permanent allowlist.`,
    );

    for (const item of rawStylingOverages) {
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
      rawStylingOverages.length === 0 &&
      crossFileClusterViolations.length === 0 &&
      routeClusterViolations.length === 0,
    errors:
      rawStylingOverages.length + crossFileClusterViolations.length + routeClusterViolations.length,
    detail:
      rawStylingOverages.length > 0 ||
      crossFileClusterViolations.length > 0 ||
      routeClusterViolations.length > 0
        ? [
            rawStylingOverages.length > 0
              ? `${rawStylingOverages.length} file(s) exceed raw styling baseline`
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

// Standalone audit mode: node scripts/validate/check-raw-styling.js --audit
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
