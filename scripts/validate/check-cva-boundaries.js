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
 * - Existing baselined base-only feature-local CVA definitions while cleanup is in flight
 * - Existing baselined single-use variant-bearing feature-local CVA helpers while cleanup is in flight
 *
 * Blocked:
 * - `buttonVariants`, `tabsTriggerVariants`, `cardRecipeVariants`, etc. in routes/components pages
 * - New or increased `cva()` definitions outside `src/components/ui/`
 * - New or increased base-only `cva()` definitions outside `src/components/ui/`
 * - New or increased single-use variant-bearing feature-local `cva()` helpers outside `src/components/ui/`
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const IMPORT_RE = /import\s*\{([\s\S]*?)\}\s*from\s*["'][^"']+["']/g;
const CVA_HELPER_RE = /\b[A-Za-z0-9_]*(?:Variants|Style)\b/;
const FEATURE_CVA_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "feature-cva-definitions-baseline.json",
);
const FEATURE_CVA_BASE_ONLY_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "feature-cva-base-only-baseline.json",
);
const FEATURE_CVA_SINGLE_USE_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "feature-cva-single-use-baseline.json",
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

function createSourceFile(filePath, content) {
  return ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function isCvaCallExpression(node, sourceFile) {
  return ts.isCallExpression(node) && node.expression.getText(sourceFile) === "cva";
}

function hasNonEmptyVariantsConfig(node, sourceFile) {
  if (!isCvaCallExpression(node, sourceFile) || !node.arguments[1]) {
    return false;
  }

  const config = node.arguments[1];
  if (!ts.isObjectLiteralExpression(config)) {
    return false;
  }

  for (const property of config.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      property.name.getText(sourceFile) === "variants" &&
      ts.isObjectLiteralExpression(property.initializer) &&
      property.initializer.properties.length > 0
    ) {
      return true;
    }
  }

  return false;
}

function getPropertyNameText(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }

  if (
    ts.isComputedPropertyName(nameNode) &&
    (ts.isStringLiteral(nameNode.expression) || ts.isNumericLiteral(nameNode.expression))
  ) {
    return nameNode.expression.text;
  }

  return null;
}

function collectFeatureCvaMetadata(filePath, content) {
  const sourceFile = createSourceFile(filePath, content);
  const cvaLines = [];
  const baseOnlyLines = [];
  const directHelpers = new Map();
  const objectHelpers = new Map();

  function registerHelper(helperName, node, hasVariants, store) {
    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const line = pos.line + 1;
    const helper = { name: helperName, line, callCount: 0, hasVariants };
    cvaLines.push(line);
    if (!hasVariants) {
      baseOnlyLines.push(line);
    }
    store.set(helperName, helper);
  }

  function visitDefinitions(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      if (isCvaCallExpression(node.initializer, sourceFile)) {
        registerHelper(
          node.name.text,
          node.initializer,
          hasNonEmptyVariantsConfig(node.initializer, sourceFile),
          directHelpers,
        );
      } else if (ts.isObjectLiteralExpression(node.initializer)) {
        for (const property of node.initializer.properties) {
          if (
            !ts.isPropertyAssignment(property) ||
            !isCvaCallExpression(property.initializer, sourceFile)
          ) {
            continue;
          }

          const propertyName = getPropertyNameText(property.name);
          if (!propertyName) continue;

          registerHelper(
            `${node.name.text}.${propertyName}`,
            property.initializer,
            hasNonEmptyVariantsConfig(property.initializer, sourceFile),
            objectHelpers,
          );
        }
      }
    }

    ts.forEachChild(node, visitDefinitions);
  }

  function visitCalls(node) {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression)) {
        const helper = directHelpers.get(node.expression.text);
        if (helper) {
          helper.callCount += 1;
        }
      } else if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression)
      ) {
        const helper = objectHelpers.get(
          `${node.expression.expression.text}.${node.expression.name.text}`,
        );
        if (helper) {
          helper.callCount += 1;
        }
      } else if (
        ts.isElementAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.argumentExpression &&
        (ts.isStringLiteral(node.expression.argumentExpression) ||
          ts.isNumericLiteral(node.expression.argumentExpression))
      ) {
        const helper = objectHelpers.get(
          `${node.expression.expression.text}.${node.expression.argumentExpression.text}`,
        );
        if (helper) {
          helper.callCount += 1;
        }
      }
    }

    ts.forEachChild(node, visitCalls);
  }

  visitDefinitions(sourceFile);
  visitCalls(sourceFile);

  const singleUseVariantHelpers = [...directHelpers.values(), ...objectHelpers.values()]
    .filter((helper) => helper.hasVariants && helper.callCount <= 1)
    .sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));

  return {
    cvaLines: cvaLines.sort((a, b) => a - b),
    baseOnlyLines: baseOnlyLines.sort((a, b) => a - b),
    singleUseVariantHelpers,
  };
}

export function run() {
  const SRC_DIR = path.join(ROOT, "src");
  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx"]) });
  const baselineByFile = loadCountBaseline(FEATURE_CVA_BASELINE_PATH, "cvaDefinitionsByFile");
  const baseOnlyBaselineByFile = loadCountBaseline(
    FEATURE_CVA_BASE_ONLY_BASELINE_PATH,
    "baseOnlyCvaDefinitionsByFile",
  );
  const singleUseVariantBaselineByFile = loadCountBaseline(
    FEATURE_CVA_SINGLE_USE_BASELINE_PATH,
    "singleUseVariantCvaDefinitionsByFile",
  );

  const importViolations = [];
  const cvaLinesByFile = {};
  const baseOnlyCvaLinesByFile = {};
  const singleUseVariantHelpersByFile = {};
  const errors = [];

  for (const filePath of files) {
    const rel = relPath(filePath);

    if (rel.includes(".test.") || rel.includes(".spec.") || rel.includes(".stories.")) continue;

    const content = fs.readFileSync(filePath, "utf8");

    if (!rel.startsWith("src/components/ui/")) {
      const { cvaLines, baseOnlyLines, singleUseVariantHelpers } = collectFeatureCvaMetadata(
        filePath,
        content,
      );
      if (cvaLines.length > 0) {
        cvaLinesByFile[rel] = cvaLines;
      }
      if (baseOnlyLines.length > 0) {
        baseOnlyCvaLinesByFile[rel] = baseOnlyLines;
      }
      if (singleUseVariantHelpers.length > 0) {
        singleUseVariantHelpersByFile[rel] = singleUseVariantHelpers;
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
  const baseOnlyRatchet = analyzeCountRatchet(baseOnlyCvaLinesByFile, baseOnlyBaselineByFile);
  const baseOnlyOverages = Object.entries(baseOnlyRatchet.overagesByKey)
    .map(([file, overage]) => ({
      file,
      baselineCount: overage.baselineCount,
      currentCount: overage.currentCount,
      lineNumbers: baseOnlyCvaLinesByFile[file] ?? [],
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
  const singleUseVariantRatchet = analyzeCountRatchet(
    singleUseVariantHelpersByFile,
    singleUseVariantBaselineByFile,
  );
  const singleUseVariantOverages = Object.entries(singleUseVariantRatchet.overagesByKey)
    .map(([file, overage]) => ({
      file,
      baselineCount: overage.baselineCount,
      currentCount: overage.currentCount,
      helpers: overage.overageItems,
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

  if (baseOnlyOverages.length > 0) {
    errors.push(
      `  ${c.red}ERROR${c.reset} Base-only feature-local \`cva()\` definitions are ratcheted outside \`src/components/ui/\`. If a helper has no variants, use a plain component, \`cn()\`, or move the shared API into an owned primitive.`,
    );

    for (const overage of baseOnlyOverages) {
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

  if (singleUseVariantOverages.length > 0) {
    errors.push(
      `  ${c.red}ERROR${c.reset} Single-use variant-bearing feature-local \`cva()\` helpers are ratcheted outside \`src/components/ui/\`. Inline the styles, use a plain component with props, or move the shared API into an owned primitive.`,
    );

    for (const overage of singleUseVariantOverages) {
      errors.push(
        `  ${c.bold}${overage.file}${c.reset} baseline ${overage.baselineCount} → current ${overage.currentCount}`,
      );
      const helperPreview = overage.helpers
        .map(
          (helper) =>
            `${helper.name} (line ${helper.line}, ${helper.callCount} call${helper.callCount === 1 ? "" : "s"})`,
        )
        .join(", ");
      if (helperPreview.length > 0) {
        errors.push(`    ${c.dim}${helperPreview}${c.reset}`);
      }
    }
  }

  const failureCount =
    importViolations.length +
    cvaOverages.length +
    baseOnlyOverages.length +
    singleUseVariantOverages.length;
  const passDetail = [
    `${ratchet.totalCurrent} baselined feature-local cva definition(s) across ${ratchet.activeKeyCount} file(s)`,
    `${baseOnlyRatchet.totalCurrent} baselined base-only feature-local cva definition(s) across ${baseOnlyRatchet.activeKeyCount} file(s)`,
    `${singleUseVariantRatchet.totalCurrent} baselined single-use variant-bearing feature-local cva helper(s) across ${singleUseVariantRatchet.activeKeyCount} file(s)`,
  ].join("; ");

  return {
    passed: failureCount === 0,
    errors: failureCount,
    detail: failureCount > 0 ? `${failureCount} violation(s)` : passDetail,
    messages: errors,
  };
}
