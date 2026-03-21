/**
 * CHECK: Global CSS drift
 *
 * Ratchets page/section-specific named classes in `src/index.css`.
 *
 * Allowed in the global stylesheet:
 * - shared utilities (`animate-*`, `transition-*`, `tracking-*`, `text-*`)
 * - editor/third-party selectors (`bn-*`, `ProseMirror`)
 * - explicitly shared/global surfaces and helpers (`public-page-bg`, `scrollbar-subtle`, etc.)
 *
 * Blocked:
 * - new page/section-specific named classes in the global stylesheet
 * - moving one-off feature styling into `index.css` to avoid Tailwind or primitive ownership
 */

import fs from "node:fs";
import path from "node:path";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { c, ROOT, relPath } from "./utils.js";

const INDEX_CSS_PATH = path.join(ROOT, "src", "index.css");
const BASELINE_PATH = path.join(ROOT, "scripts", "ci", "global-css-page-class-baseline.json");

const ALLOWED_GLOBAL_CLASS_NAMES = new Set([
  "ProseMirror",
  "accent-text",
  "active-press",
  "app-page-surface",
  "app-shell-bg",
  "bg-auth-gradient",
  "card-subtle",
  "drag-over",
  "dragging",
  "hover-lift",
  "hover-scale",
  "public-page-bg",
  "scrollbar-subtle",
]);

const ALLOWED_GLOBAL_CLASS_PREFIXES = [
  "animate-",
  "bn-",
  "line-clamp-",
  "text-",
  "tracking-",
  "transition-",
];

function isApprovedGlobalClass(className) {
  return (
    ALLOWED_GLOBAL_CLASS_NAMES.has(className) ||
    ALLOWED_GLOBAL_CLASS_PREFIXES.some((prefix) => className.startsWith(prefix))
  );
}

function collectPageSpecificGlobalClasses(content, rel) {
  const findingsByClassName = {};
  const lines = content.split("\n");

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/^\.(?<className>[A-Za-z][A-Za-z0-9_-]*)\s*\{/);
    const className = match?.groups?.className;
    if (!className || isApprovedGlobalClass(className)) {
      continue;
    }

    const bucket = findingsByClassName[className] ?? [];
    bucket.push({
      file: rel,
      line: index + 1,
      className,
    });
    findingsByClassName[className] = bucket;
  }

  return findingsByClassName;
}

export function run() {
  if (!fs.existsSync(INDEX_CSS_PATH)) {
    return {
      passed: true,
      errors: 0,
      detail: "src/index.css not present",
      messages: [],
    };
  }

  const rel = relPath(INDEX_CSS_PATH);
  const content = fs.readFileSync(INDEX_CSS_PATH, "utf8");
  const baselineByClassName = loadCountBaseline(
    BASELINE_PATH,
    "pageSpecificGlobalCssSelectorsByName",
  );
  const findingsByClassName = collectPageSpecificGlobalClasses(content, rel);
  const ratchet = analyzeCountRatchet(findingsByClassName, baselineByClassName);
  const overageEntries = Object.entries(ratchet.overagesByKey).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  const messages = [];
  if (overageEntries.length > 0) {
    messages.push(
      `${c.red}Page/section-specific named classes in src/index.css are ratcheted:${c.reset} keep one-off styling in Tailwind or promote it to a truly shared/global abstraction.`,
    );
    for (const [, overage] of overageEntries) {
      for (const finding of overage.overageItems) {
        messages.push(
          `  ${c.dim}${finding.file}:${finding.line}${c.reset} .${finding.className} → page-specific global CSS class; move this back to Tailwind or a shared primitive/surface abstraction`,
        );
      }
    }
  }

  return {
    passed: overageEntries.length === 0,
    errors: overageEntries.length,
    detail:
      overageEntries.length > 0
        ? `${overageEntries.length} page-specific global CSS selector(s) exceed baseline`
        : `${ratchet.totalBaselined} baselined page-specific global CSS selector(s) in src/index.css`,
    messages,
  };
}
