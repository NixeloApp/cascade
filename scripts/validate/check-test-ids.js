/**
 * CHECK 7: Test ID Consistency
 *
 * Ensures all data-testid attributes use TEST_IDS constants from src/lib/test-ids.ts
 * instead of hardcoded strings.
 *
 * Rules:
 * 1. In src/components: data-testid must use TEST_IDS.X.Y (not string literals)
 * 2. In e2e tests: getByTestId must use TEST_IDS.X.Y (not string literals)
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
  const messages = [];

  function reportError(filePath, line, col, message) {
    const rel = relPath(filePath);
    messages.push(`  ${c.red}ERROR${c.reset} ${rel}:${line}:${col} - ${message}`);
    errorCount++;
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

  // Check E2E test files
  const e2eFiles = walkDir(E2E_DIR, { extensions: new Set([".ts"]) });
  for (const file of e2eFiles) {
    // Skip locator factory files - they define helpers, not hardcoded strings
    if (file.includes("/locators/")) continue;
    checkE2EFile(file);
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} error(s)` : undefined,
    messages: messages.length > 0 ? messages : undefined,
  };
}
