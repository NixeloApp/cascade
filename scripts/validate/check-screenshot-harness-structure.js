/**
 * CHECK: Screenshot Harness Structure
 *
 * Ratchets private top-level helper counts inside the screenshot capture tool
 * so the modular harness does not drift back toward a single oversized module.
 *
 * The check is intentionally per-file and baseline-backed:
 * - Existing private helpers are allowed up to the stored baseline.
 * - New private helpers above that baseline fail validation.
 * - Exported functions are ignored because they define the public harness API.
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const SCREENSHOT_HARNESS_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "screenshot-harness-private-functions-baseline.json",
);

function hasExportModifier(node) {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ===
      true
  );
}

function collectScreenshotHarnessFiles() {
  const screenshotHarnessFiles = new Set([path.join(ROOT, "e2e", "screenshot-pages.ts")]);
  const screenshotLibDir = path.join(ROOT, "e2e", "screenshot-lib");
  for (const file of walkDir(screenshotLibDir, { extensions: new Set([".ts"]) })) {
    screenshotHarnessFiles.add(file);
  }

  return [...screenshotHarnessFiles].filter((file) => fs.existsSync(file)).sort();
}

function collectPrivateTopLevelHelpers(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const privateHelpers = [];

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      if (!statement.name || hasExportModifier(statement)) {
        continue;
      }
      const { line } = sourceFile.getLineAndCharacterOfPosition(statement.name.getStart());
      privateHelpers.push({
        file: relPath(filePath),
        line: line + 1,
        name: statement.name.text,
      });
      continue;
    }

    if (!ts.isVariableStatement(statement) || hasExportModifier(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        !declaration.initializer ||
        (!ts.isArrowFunction(declaration.initializer) &&
          !ts.isFunctionExpression(declaration.initializer))
      ) {
        continue;
      }

      const { line } = sourceFile.getLineAndCharacterOfPosition(declaration.name.getStart());
      privateHelpers.push({
        file: relPath(filePath),
        line: line + 1,
        name: declaration.name.text,
      });
    }
  }

  return privateHelpers.sort((left, right) => left.line - right.line);
}

export function run() {
  const privateHelpersByFile = {};

  for (const filePath of collectScreenshotHarnessFiles()) {
    const helpers = collectPrivateTopLevelHelpers(filePath);
    if (helpers.length > 0) {
      privateHelpersByFile[relPath(filePath)] = helpers;
    }
  }

  const baselineByFile = loadCountBaseline(
    SCREENSHOT_HARNESS_BASELINE_PATH,
    "privateFunctionCountByFile",
  );
  const ratchet = analyzeCountRatchet(privateHelpersByFile, baselineByFile);
  const overageHelpers = Object.values(ratchet.overagesByKey)
    .flatMap((entry) => entry.overageItems)
    .sort((left, right) =>
      left.file === right.file ? left.line - right.line : left.file.localeCompare(right.file),
    );

  const messages = overageHelpers.map(
    (helper) =>
      `  ${c.red}ERROR${c.reset} ${helper.file}:${helper.line} - Private screenshot helper "${helper.name}" exceeds the ratcheted baseline for this module.`,
  );

  return {
    passed: overageHelpers.length === 0,
    errors: overageHelpers.length,
    currentCountByFile: ratchet.currentCountByKey,
    detail:
      overageHelpers.length > 0
        ? `${overageHelpers.length} screenshot harness helper overage(s)`
        : ratchet.totalCurrent > 0
          ? `no blocking issues (${ratchet.totalCurrent} baselined private screenshot helper(s))`
          : "no blocking issues",
    messages: messages.length > 0 ? messages : undefined,
  };
}
