/**
 * CHECK: CVA Boundaries
 *
 * Blocks importing exported CVA recipe helpers outside the shared ui layer.
 * App code should consume typed component APIs, not import another component's
 * internal `*Variants` recipe and reuse it on unrelated elements.
 *
 * Allowed:
 * - Imports inside `src/components/ui/` (shared primitives composing other primitives)
 *
 * Blocked:
 * - `buttonVariants`, `tabsTriggerVariants`, `cardRecipeVariants`, etc. in routes/components pages
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const IMPORT_RE = /import\s*\{([\s\S]*?)\}\s*from\s*["'][^"']+["']/g;
const CVA_HELPER_RE = /\b[A-Za-z0-9_]*(?:Variants|Style)\b/;

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

  let errorCount = 0;
  const errors = [];

  for (const filePath of files) {
    const rel = relPath(filePath);

    if (rel.includes(".test.") || rel.includes(".spec.") || rel.includes(".stories.")) continue;
    if (rel.startsWith("src/components/ui/")) continue;

    const content = fs.readFileSync(filePath, "utf8");

    for (const match of content.matchAll(IMPORT_RE)) {
      const specifiers = match[1] ?? "";
      const importedNames = parseImportedNames(specifiers);
      const cvaImports = importedNames.filter((name) => CVA_HELPER_RE.test(name));

      if (cvaImports.length === 0) continue;

      const line = getLineNumber(content, match.index ?? 0);
      errors.push(
        `  ${c.red}ERROR${c.reset} ${rel}:${line} - Imported CVA helper(s) ${cvaImports.join(
          ", ",
        )}. Keep CVA inside the owning component or add a dedicated primitive instead.`,
      );
      errorCount++;
    }
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : null,
    messages: errors,
  };
}
