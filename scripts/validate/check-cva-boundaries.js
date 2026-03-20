/**
 * CHECK: CVA Boundaries
 *
 * Blocks importing exported CVA recipe helpers outside the shared ui layer and
 * ratchets feature-local `cva()` definitions outside `src/components/ui/`.
 * App code should consume typed component APIs, not import another component's
 * internal `*Variants` recipe and reuse it on unrelated elements, and new CVA
 * sprawl should not spread across feature code.
 *
 * Allowed:
 * - Imports inside `src/components/ui/` (shared primitives composing other primitives)
 * - Existing baselined feature-local CVA definitions while cleanup is in flight
 *
 * Blocked:
 * - `buttonVariants`, `tabsTriggerVariants`, `cardRecipeVariants`, etc. in routes/components pages
 * - New or increased `cva()` definitions outside `src/components/ui/`
 */

import fs from "node:fs";
import path from "node:path";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const IMPORT_RE = /import\s*\{([\s\S]*?)\}\s*from\s*["'][^"']+["']/g;
const CVA_HELPER_RE = /\b[A-Za-z0-9_]*(?:Variants|Style)\b/;
const CVA_CALL_RE = /\bcva\s*\(/g;
const FEATURE_CVA_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "feature-cva-definitions-baseline.json",
);

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function parseImportedNames(rawSpecifiers) {
  return rawSpecifiers
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/^type\s+/, ""))
    .map((part) => part.split(/\s+as\s+/)[0]?.trim() ?? "")
    .filter(Boolean);
}

export function run() {
  const SRC_DIR = path.join(ROOT, "src");
  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx"]) });
  const baselineByFile = loadCountBaseline(FEATURE_CVA_BASELINE_PATH, "cvaDefinitionsByFile");

  const importViolations = [];
  const cvaLinesByFile = {};
  const errors = [];

  for (const filePath of files) {
    const rel = relPath(filePath);

    if (rel.includes(".test.") || rel.includes(".spec.") || rel.includes(".stories.")) continue;

    const content = fs.readFileSync(filePath, "utf8");

    if (!rel.startsWith("src/components/ui/")) {
      const cvaMatches = [...content.matchAll(CVA_CALL_RE)];
      if (cvaMatches.length > 0) {
        cvaLinesByFile[rel] = cvaMatches.map((match) => getLineNumber(content, match.index ?? 0));
      }
    }

    if (rel.startsWith("src/components/ui/")) continue;

    for (const match of content.matchAll(IMPORT_RE)) {
      const specifiers = match[1] ?? "";
      const importedNames = parseImportedNames(specifiers);
      const cvaImports = importedNames.filter((name) => CVA_HELPER_RE.test(name));

      if (cvaImports.length === 0) continue;

      const line = getLineNumber(content, match.index ?? 0);
      importViolations.push(
        `  ${c.red}ERROR${c.reset} ${rel}:${line} - Imported CVA helper(s) ${cvaImports.join(
          ", ",
        )}. Keep CVA inside the owning component or add a dedicated primitive instead.`,
      );
    }
  }

  const ratchet = analyzeCountRatchet(cvaLinesByFile, baselineByFile);
  const cvaOverages = Object.entries(ratchet.overagesByKey)
    .map(([file, overage]) => ({
      file,
      baselineCount: overage.baselineCount,
      currentCount: overage.currentCount,
      lineNumbers: cvaLinesByFile[file] ?? [],
    }))
    .sort((a, b) => a.file.localeCompare(b.file));

  errors.push(...importViolations);

  if (cvaOverages.length > 0) {
    errors.push(
      `  ${c.red}ERROR${c.reset} Feature-local \`cva()\` definitions are ratcheted outside \`src/components/ui/\`. Add or extend a shared primitive instead, or update the baseline only after intentional cleanup review.`,
    );

    for (const overage of cvaOverages) {
      const linePreview = overage.lineNumbers.slice(0, 12).join(", ");
      const remaining = overage.lineNumbers.length - Math.min(overage.lineNumbers.length, 12);
      errors.push(
        `  ${c.bold}${overage.file}${c.reset} baseline ${overage.baselineCount} → current ${overage.currentCount}`,
      );
      if (linePreview.length > 0) {
        errors.push(
          `    ${c.dim}lines ${linePreview}${remaining > 0 ? `, ... +${remaining} more` : ""}${c.reset}`,
        );
      }
    }
  }

  const failureCount = importViolations.length + cvaOverages.length;
  const passDetail = `${ratchet.totalCurrent} baselined feature-local cva definition(s) across ${ratchet.activeKeyCount} file(s)`;

  return {
    passed: failureCount === 0,
    errors: failureCount,
    detail: failureCount > 0 ? `${failureCount} violation(s)` : passDetail,
    messages: errors,
  };
}
