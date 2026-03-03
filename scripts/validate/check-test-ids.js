/**
 * CHECK 7: Test ID Consistency
 *
 * Ensures all data-testid attributes use TEST_IDS constants from src/lib/test-ids.ts
 * instead of hardcoded strings.
 *
 * Rules:
 * 1. In src/components: data-testid must use TEST_IDS.X.Y (not string literals)
 * 2. In e2e tests: getByTestId must use TEST_IDS.X.Y (not string literals)
 * 3. In e2e specs: getByTestId should be in page objects, not directly in spec files
 *
 * @strictness STRICT - Blocks CI. Test IDs must use centralized constants.
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_COMPONENTS = path.join(ROOT, "src/components");
  const E2E_DIR = path.join(ROOT, "e2e");

  // Directories to ignore (third-party UI components, etc.)
  const IGNORE_DIRS = [
    "src/components/ui", // Base UI primitives (some may not need TEST_IDS)
    "src/components/landing", // Marketing pages
    "src/components/Calendar/shadcn-calendar", // Third-party calendar
  ];

  let errorCount = 0;
  let warnCount = 0;
  const messages = [];

  function reportError(filePath, line, col, message) {
    const rel = relPath(filePath);
    messages.push(`  ${c.red}ERROR${c.reset} ${rel}:${line}:${col} - ${message}`);
    errorCount++;
  }

  function reportWarn(filePath, line, col, message) {
    const rel = relPath(filePath);
    messages.push(`  ${c.yellow}WARN${c.reset} ${rel}:${line}:${col} - ${message}`);
    warnCount++;
  }

  /**
   * Check a component file for hardcoded data-testid strings
   */
  function checkComponentFile(filePath) {
    const rel = relPath(filePath);
    if (IGNORE_DIRS.some((d) => rel.startsWith(d))) return;
    // Skip test files - they may mock components with arbitrary test IDs
    if (rel.includes(".test.") || rel.includes(".spec.")) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node) {
      // Look for JSX attributes named "data-testid"
      if (ts.isJsxAttribute(node)) {
        const attrName = node.name.getText();
        if (attrName === "data-testid") {
          const init = node.initializer;
          if (init) {
            // BAD: data-testid="some-string"
            if (ts.isStringLiteral(init)) {
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              reportError(
                filePath,
                line + 1,
                character + 1,
                `Use TEST_IDS constant instead of hardcoded string: data-testid="${init.text}"`,
              );
            }
            // BAD: data-testid={"some-string"}
            else if (ts.isJsxExpression(init) && init.expression) {
              if (ts.isStringLiteral(init.expression)) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(
                  node.getStart(),
                );
                reportError(
                  filePath,
                  line + 1,
                  character + 1,
                  `Use TEST_IDS constant instead of hardcoded string: data-testid={"${init.expression.text}"}`,
                );
              }
              // GOOD: data-testid={TEST_IDS.X.Y} - property access is okay
              // GOOD: data-testid={someVar} - variable reference is okay (assume it's from TEST_IDS)
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  /**
   * Check an E2E test file for hardcoded test ID strings in getByTestId calls
   */
  function checkE2EFile(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node) {
      // Look for method calls like page.getByTestId("...")
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        // Check for .getByTestId() calls
        if (ts.isPropertyAccessExpression(expr) && expr.name.getText() === "getByTestId") {
          const args = node.arguments;
          if (args.length > 0) {
            const firstArg = args[0];
            // BAD: getByTestId("some-string") or getByTestId(`some-string`)
            if (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              reportError(
                filePath,
                line + 1,
                character + 1,
                `Use TEST_IDS constant instead of hardcoded string: getByTestId("${firstArg.text}")`,
              );
            }
            // BAD: getByTestId(`template-${literal}`)
            else if (ts.isTemplateExpression(firstArg)) {
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              reportError(
                filePath,
                line + 1,
                character + 1,
                `Use TEST_IDS constant instead of template literal in getByTestId()`,
              );
            }
            // GOOD: getByTestId(TEST_IDS.X.Y) - property access is okay
          }
        }

        // Also check for locator('[data-testid="..."]') patterns
        if (ts.isPropertyAccessExpression(expr) && expr.name.getText() === "locator") {
          const args = node.arguments;
          if (args.length > 0 && ts.isStringLiteral(args[0])) {
            const selectorText = args[0].text;
            const testIdMatch = selectorText.match(/data-testid=["']([^"']+)["']/);
            if (testIdMatch) {
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              reportError(
                filePath,
                line + 1,
                character + 1,
                `Use getByTestId(TEST_IDS.X.Y) instead of locator with data-testid: "${testIdMatch[1]}"`,
              );
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  // Check component files
  const componentFiles = walkDir(SRC_COMPONENTS, { extensions: new Set([".tsx"]) });
  for (const file of componentFiles) {
    checkComponentFile(file);
  }

  // Directories where getByTestId is allowed (page objects, helpers)
  const ALLOWED_TESTID_DIRS = ["/pages/", "/fixtures/", "/utils/", "/locators/"];

  /**
   * Check if getByTestId is used directly in spec files (should be in page objects)
   * NOTE: This is a warning, not error - gradual migration to page object pattern
   */
  function checkTestIdLocation(filePath) {
    const rel = relPath(filePath);
    // Only check spec files
    if (!rel.endsWith(".spec.ts")) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node) {
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        if (ts.isPropertyAccessExpression(expr) && expr.name.getText() === "getByTestId") {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          reportWarn(
            filePath,
            line + 1,
            character + 1,
            `getByTestId() should be in page objects (e2e/pages/), not in spec files`,
          );
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  // Check E2E test files
  const e2eFiles = walkDir(E2E_DIR, { extensions: new Set([".ts"]) });
  for (const file of e2eFiles) {
    const rel = relPath(file);
    // Skip allowed directories for constant checks
    if (ALLOWED_TESTID_DIRS.some((d) => rel.includes(d))) {
      checkE2EFile(file); // Still check for TEST_IDS constants
      continue;
    }
    checkE2EFile(file);
    checkTestIdLocation(file);
  }

  const detail = [];
  if (errorCount > 0) detail.push(`${errorCount} error(s)`);
  if (warnCount > 0) detail.push(`${warnCount} warning(s)`);

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: detail.length > 0 ? detail.join(", ") : undefined,
    messages: messages.length > 0 ? messages : undefined,
  };
}
