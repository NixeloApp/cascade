/**
 * CHECK: E2E Raw Locator Ratchet
 *
 * Ratchets direct page-level locator creation in specs and screenshot flows.
 *
 * Rationale:
 * - Page objects and locator factories are the sanctioned abstraction layer for
 *   selectors that should stay stable and reusable.
 * - Some existing raw selectors remain in screenshot helpers and a few specs
 *   for pragmatic reasons, but they should not quietly spread.
 * - This check baselines the current debt per file and blocks any increase.
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const E2E_DIR = path.join(ROOT, "e2e");
const BASELINE_PATH = path.join(ROOT, "scripts", "ci", "e2e-raw-locators-baseline.json");
const TARGET_EXTENSIONS = new Set([".ts", ".tsx"]);
const TARGET_METHODS = new Set([
  "frameLocator",
  "getByAltText",
  "getByLabel",
  "getByPlaceholder",
  "getByRole",
  "getByTestId",
  "getByText",
  "getByTitle",
  "locator",
]);
const SKIP_FILES = new Set([
  "e2e/config.ts",
  "e2e/constants.ts",
  "e2e/fixtures.ts",
  "e2e/global-setup.ts",
  "e2e/global-teardown.ts",
  "e2e/globals.d.ts",
]);
const SKIP_PATH_SEGMENTS = ["/fixtures/", "/locators/", "/pages/", "/utils/"];

function isTrackedFile(relativePath) {
  if (SKIP_FILES.has(relativePath)) {
    return false;
  }

  return !SKIP_PATH_SEGMENTS.some((segment) => relativePath.includes(segment));
}

function unwrapExpression(expression) {
  if (ts.isParenthesizedExpression(expression) || ts.isNonNullExpression(expression)) {
    return unwrapExpression(expression.expression);
  }

  return expression;
}

function isPageRootExpression(expression) {
  const unwrapped = unwrapExpression(expression);

  if (ts.isIdentifier(unwrapped)) {
    return unwrapped.text === "page";
  }

  return ts.isPropertyAccessExpression(unwrapped) && unwrapped.name.text === "page";
}

function collectRawLocatorCalls(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const findings = [];

  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const methodName = node.expression.name.text;
      if (TARGET_METHODS.has(methodName) && isPageRootExpression(node.expression.expression)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.expression.name.getStart());
        findings.push({
          file: relPath(filePath),
          line: line + 1,
          methodName,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return findings.sort((left, right) => left.line - right.line);
}

export function run() {
  if (!fs.existsSync(E2E_DIR)) {
    return { passed: true, errors: 0, detail: "No e2e/ directory", messages: [] };
  }

  const rawLocatorCallsByFile = {};
  const files = walkDir(E2E_DIR, { extensions: TARGET_EXTENSIONS });

  for (const filePath of files) {
    const relativePath = relPath(filePath);
    if (!isTrackedFile(relativePath)) {
      continue;
    }

    const findings = collectRawLocatorCalls(filePath);
    if (findings.length > 0) {
      rawLocatorCallsByFile[relativePath] = findings;
    }
  }

  const baselineByFile = loadCountBaseline(BASELINE_PATH, "rawLocatorCallsByFile");
  const ratchet = analyzeCountRatchet(rawLocatorCallsByFile, baselineByFile);
  const overageFindings = Object.values(ratchet.overagesByKey)
    .flatMap((entry) => entry.overageItems)
    .sort((left, right) =>
      left.file === right.file ? left.line - right.line : left.file.localeCompare(right.file),
    );

  const messages = overageFindings.map(
    (finding) =>
      `  ${c.red}ERROR${c.reset} ${finding.file}:${finding.line} - Raw page-level locator call \`${finding.methodName}(...)\` exceeds the ratcheted baseline for this file. Route new selectors through page objects, locator helpers, or TEST_ID-backed abstractions.`,
  );

  return {
    passed: overageFindings.length === 0,
    errors: overageFindings.length,
    currentCountByFile: ratchet.currentCountByKey,
    detail:
      overageFindings.length > 0
        ? `${overageFindings.length} raw locator overage(s)`
        : ratchet.totalCurrent > 0
          ? `${ratchet.totalCurrent} baselined raw locator call(s) across ${ratchet.activeKeyCount} file(s)`
          : "no blocking issues",
    messages,
  };
}
