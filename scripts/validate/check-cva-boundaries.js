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
 * - Existing baselined feature-local CVA style bundles while cleanup is in flight
 * - Existing baselined single-use variant-bearing feature-local CVA helpers while cleanup is in flight
 * - Existing baselined oversized variant axes while shared primitive cleanup is in flight
 *
 * Blocked:
 * - `buttonVariants`, `tabsTriggerVariants`, `cardRecipeVariants`, etc. in routes/components pages
 * - New or increased `cva()` definitions outside `src/components/ui/`
 * - New or increased base-only `cva()` definitions outside `src/components/ui/`
 * - New or increased feature-local object bundles that expose multiple `cva()` helpers as a local styling API
 * - New or increased single-use variant-bearing feature-local `cva()` helpers outside `src/components/ui/`
 * - New or increased oversized CVA variant axes with more than 10 options
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
const FEATURE_CVA_STYLE_BUNDLES_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "feature-cva-style-bundles-baseline.json",
);
const FEATURE_CVA_SINGLE_USE_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "feature-cva-single-use-baseline.json",
);
const OVERSIZED_CVA_VARIANT_AXIS_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "oversized-cva-variant-axis-baseline.json",
);
const MAX_VARIANT_OPTIONS_PER_AXIS = 10;

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
  return getVariantAxes(node, sourceFile).length > 0;
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

function getVariantAxes(node, sourceFile) {
  if (!isCvaCallExpression(node, sourceFile) || !node.arguments[1]) {
    return [];
  }

  const config = node.arguments[1];
  if (!ts.isObjectLiteralExpression(config)) {
    return [];
  }

  for (const property of config.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      property.name.getText(sourceFile) !== "variants" ||
      !ts.isObjectLiteralExpression(property.initializer)
    ) {
      continue;
    }

    return property.initializer.properties
      .flatMap((axisProperty) => {
        if (
          !ts.isPropertyAssignment(axisProperty) ||
          !ts.isObjectLiteralExpression(axisProperty.initializer)
        ) {
          return [];
        }

        const axisName = getPropertyNameText(axisProperty.name);
        if (!axisName) {
          return [];
        }

        const axisPos = sourceFile.getLineAndCharacterOfPosition(axisProperty.getStart(sourceFile));
        const optionEntries = axisProperty.initializer.properties
          .flatMap((optionProperty) => {
            if (
              !ts.isPropertyAssignment(optionProperty) &&
              !ts.isShorthandPropertyAssignment(optionProperty)
            ) {
              return [];
            }

            const optionName = getPropertyNameText(optionProperty.name);
            if (!optionName) {
              return [];
            }

            const optionPos = sourceFile.getLineAndCharacterOfPosition(
              optionProperty.getStart(sourceFile),
            );
            return [{ name: optionName, line: optionPos.line + 1 }];
          })
          .sort((left, right) => left.name.localeCompare(right.name) || left.line - right.line);

        return [
          {
            name: axisName,
            line: axisPos.line + 1,
            optionEntries,
          },
        ];
      })
      .sort((left, right) => left.line - right.line || left.name.localeCompare(right.name));
  }

  return [];
}

function collectFeatureCvaMetadata(filePath, content) {
  const sourceFile = createSourceFile(filePath, content);
  const cvaLines = [];
  const baseOnlyLines = [];
  const directHelpers = new Map();
  const objectHelpers = new Map();
  const styleBundles = [];

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
        const styleBundleHelpers = [];
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
          styleBundleHelpers.push({
            name: propertyName,
            hasVariants: hasNonEmptyVariantsConfig(property.initializer, sourceFile),
          });
        }

        if (styleBundleHelpers.length >= 2) {
          const pos = sourceFile.getLineAndCharacterOfPosition(
            node.initializer.getStart(sourceFile),
          );
          styleBundles.push({
            name: node.name.text,
            line: pos.line + 1,
            helperCount: styleBundleHelpers.length,
            variantBearingHelperCount: styleBundleHelpers.filter((helper) => helper.hasVariants)
              .length,
            baseOnlyHelperCount: styleBundleHelpers.filter((helper) => !helper.hasVariants).length,
            helperNames: styleBundleHelpers
              .map((helper) => helper.name)
              .sort((a, b) => a.localeCompare(b)),
          });
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
    styleBundles: styleBundles.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name)),
    singleUseVariantHelpers,
  };
}

function collectOversizedVariantAxes(filePath, content) {
  const sourceFile = createSourceFile(filePath, content);
  const rel = relPath(filePath);
  const oversizedAxes = [];

  function registerOversizedAxes(helperName, node) {
    const variantAxes = getVariantAxes(node, sourceFile);
    for (const axis of variantAxes) {
      if (axis.optionEntries.length <= MAX_VARIANT_OPTIONS_PER_AXIS) {
        continue;
      }

      oversizedAxes.push({
        key: `${rel}#${helperName}.${axis.name}`,
        file: rel,
        helperName,
        axisName: axis.name,
        line: axis.line,
        optionEntries: axis.optionEntries,
      });
    }
  }

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      if (isCvaCallExpression(node.initializer, sourceFile)) {
        registerOversizedAxes(node.name.text, node.initializer);
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

          registerOversizedAxes(`${node.name.text}.${propertyName}`, property.initializer);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return oversizedAxes.sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.helperName.localeCompare(right.helperName) ||
      left.axisName.localeCompare(right.axisName),
  );
}

export function run() {
  const SRC_DIR = path.join(ROOT, "src");
  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx"]) });
  const baselineByFile = loadCountBaseline(FEATURE_CVA_BASELINE_PATH, "cvaDefinitionsByFile");
  const baseOnlyBaselineByFile = loadCountBaseline(
    FEATURE_CVA_BASE_ONLY_BASELINE_PATH,
    "baseOnlyCvaDefinitionsByFile",
  );
  const styleBundlesBaselineByFile = loadCountBaseline(
    FEATURE_CVA_STYLE_BUNDLES_BASELINE_PATH,
    "featureCvaStyleBundlesByFile",
  );
  const singleUseVariantBaselineByFile = loadCountBaseline(
    FEATURE_CVA_SINGLE_USE_BASELINE_PATH,
    "singleUseVariantCvaDefinitionsByFile",
  );
  const oversizedVariantAxisBaselineByKey = loadCountBaseline(
    OVERSIZED_CVA_VARIANT_AXIS_BASELINE_PATH,
    "variantOptionsByAxis",
  );

  const importViolations = [];
  const cvaLinesByFile = {};
  const baseOnlyCvaLinesByFile = {};
  const styleBundlesByFile = {};
  const singleUseVariantHelpersByFile = {};
  const oversizedVariantAxisOptionsByKey = {};
  const oversizedVariantAxisMetadataByKey = {};
  const errors = [];

  for (const filePath of files) {
    const rel = relPath(filePath);

    if (rel.includes(".test.") || rel.includes(".spec.") || rel.includes(".stories.")) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const oversizedVariantAxes = collectOversizedVariantAxes(filePath, content);
    for (const axis of oversizedVariantAxes) {
      oversizedVariantAxisOptionsByKey[axis.key] = axis.optionEntries;
      oversizedVariantAxisMetadataByKey[axis.key] = axis;
    }

    if (!rel.startsWith("src/components/ui/")) {
      const { cvaLines, baseOnlyLines, styleBundles, singleUseVariantHelpers } =
        collectFeatureCvaMetadata(filePath, content);
      if (cvaLines.length > 0) {
        cvaLinesByFile[rel] = cvaLines;
      }
      if (baseOnlyLines.length > 0) {
        baseOnlyCvaLinesByFile[rel] = baseOnlyLines;
      }
      if (styleBundles.length > 0) {
        styleBundlesByFile[rel] = styleBundles;
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
  const styleBundlesRatchet = analyzeCountRatchet(styleBundlesByFile, styleBundlesBaselineByFile);
  const styleBundleOverages = Object.entries(styleBundlesRatchet.overagesByKey)
    .map(([file, overage]) => ({
      file,
      baselineCount: overage.baselineCount,
      currentCount: overage.currentCount,
      bundles: overage.overageItems,
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
  const oversizedVariantAxisRatchet = analyzeCountRatchet(
    oversizedVariantAxisOptionsByKey,
    oversizedVariantAxisBaselineByKey,
  );
  const oversizedVariantAxisOverages = Object.entries(oversizedVariantAxisRatchet.overagesByKey)
    .map(([key, overage]) => ({
      ...oversizedVariantAxisMetadataByKey[key],
      baselineCount: overage.baselineCount,
      currentCount: overage.currentCount,
      newOptions: overage.overageItems,
    }))
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        left.line - right.line ||
        left.helperName.localeCompare(right.helperName) ||
        left.axisName.localeCompare(right.axisName),
    );

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

  if (styleBundleOverages.length > 0) {
    errors.push(
      `  ${c.red}ERROR${c.reset} Feature-local object bundles that expose multiple \`cva()\` helpers are ratcheted outside \`src/components/ui/\`. These style maps become a shadow design system; use plain strings/\`cn()\`, a real component, or move the shared API into an owned primitive.`,
    );

    for (const overage of styleBundleOverages) {
      errors.push(
        `  ${c.bold}${overage.file}${c.reset} baseline ${overage.baselineCount} → current ${overage.currentCount}`,
      );
      const bundlePreview = overage.bundles
        .map((bundle) => {
          const helperPreview = bundle.helperNames.slice(0, 6).join(", ");
          const remaining = bundle.helperNames.length - Math.min(bundle.helperNames.length, 6);
          return `${bundle.name} (line ${bundle.line}, ${bundle.helperCount} helpers, ${bundle.variantBearingHelperCount} variant-bearing, ${bundle.baseOnlyHelperCount} base-only${helperPreview.length > 0 ? `: ${helperPreview}${remaining > 0 ? `, ... +${remaining} more` : ""}` : ""})`;
        })
        .join("; ");
      if (bundlePreview.length > 0) {
        errors.push(`    ${c.dim}${bundlePreview}${c.reset}`);
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

  if (oversizedVariantAxisOverages.length > 0) {
    errors.push(
      `  ${c.red}ERROR${c.reset} Oversized CVA variant axes are ratcheted at ${MAX_VARIANT_OPTIONS_PER_AXIS} options per axis. Split the helper, extract a semantic primitive, or shrink the axis instead of extending an already-bloated enum.`,
    );

    for (const overage of oversizedVariantAxisOverages) {
      errors.push(
        `  ${c.bold}${overage.file}${c.reset} ${overage.helperName}.${overage.axisName} (line ${overage.line}) baseline ${overage.baselineCount} → current ${overage.currentCount}`,
      );
      const optionPreview = overage.newOptions
        .slice(0, 8)
        .map((option) => `${option.name} (line ${option.line})`)
        .join(", ");
      if (optionPreview.length > 0) {
        errors.push(`    ${c.dim}${optionPreview}${c.reset}`);
      }
      if (overage.newOptions.length > 8) {
        errors.push(`    ${c.dim}... and ${overage.newOptions.length - 8} more${c.reset}`);
      }
    }
  }

  const failureCount =
    importViolations.length +
    cvaOverages.length +
    baseOnlyOverages.length +
    styleBundleOverages.length +
    singleUseVariantOverages.length +
    oversizedVariantAxisOverages.length;
  const passDetail = [
    `${ratchet.totalCurrent} baselined feature-local cva definition(s) across ${ratchet.activeKeyCount} file(s)`,
    `${baseOnlyRatchet.totalCurrent} baselined base-only feature-local cva definition(s) across ${baseOnlyRatchet.activeKeyCount} file(s)`,
    `${styleBundlesRatchet.totalCurrent} baselined feature-local cva style bundle(s) across ${styleBundlesRatchet.activeKeyCount} file(s)`,
    `${singleUseVariantRatchet.totalCurrent} baselined single-use variant-bearing feature-local cva helper(s) across ${singleUseVariantRatchet.activeKeyCount} file(s)`,
    `${oversizedVariantAxisRatchet.totalCurrent} baselined oversized cva variant option(s) across ${oversizedVariantAxisRatchet.activeKeyCount} axis/axes`,
  ].join("; ");

  return {
    passed: failureCount === 0,
    errors: failureCount,
    detail: failureCount > 0 ? `${failureCount} violation(s)` : passDetail,
    messages: errors,
  };
}
