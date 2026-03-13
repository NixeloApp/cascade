/**
 * CHECK: Underscore-Prefixed Bindings
 *
 * Flags underscore-prefixed bindings that usually indicate intentionally unused values.
 * These often indicate:
 * - Dead code that should be removed
 * - Props passed but never used
 * - API mismatches between caller and callee
 *
 * Instead of using underscore prefix to silence linter noise,
 * remove the binding entirely, restructure the API, or use the value.
 *
 * Enforced. Underscore-prefixed bindings fail validation.
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Directories to check
const CHECK_DIRS = ["src/components", "src/hooks", "src/lib", "src/routes", "convex"];

// Files/directories to skip
const SKIP_PATTERNS = [
  /\.test\.tsx?$/, // Tests often create unused setup variables
  /\.jules\.test\.tsx?$/, // AI-generated tests
  /\.stories\.tsx?$/, // Storybook files
  /routeTree\.gen\.ts$/, // Generated files
  /__tests__/, // Test directories
  /\.d\.ts$/, // Type definition files
  /node_modules/, // Dependencies
];

// Known allowlist - these have legitimate reasons for unused params
// Each entry should have a comment explaining why
const ALLOWLIST = new Set([
  // CVA/cva variants extract props for styling but don't use them in render
  // The color prop is destructured to prevent it from being spread to DOM
  "src/components/ui/Card.tsx",
  "src/components/ui/Alert.tsx",
]);

function isUnderscorePrefixed(name) {
  return /^_[a-zA-Z]\w*$/.test(name);
}

function getBindingKind(node) {
  let current = node;
  while (current.parent) {
    if (ts.isParameter(current.parent)) {
      return "parameter";
    }
    if (ts.isVariableDeclaration(current.parent)) {
      return "variable";
    }
    current = current.parent;
  }
  return null;
}

function reportIssue(sourceFile, node, message, issues) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  issues.push({
    line: line + 1,
    column: character + 1,
    message,
  });
}

function visitBindingName(name, sourceFile, issues) {
  if (ts.isIdentifier(name)) {
    if (!isUnderscorePrefixed(name.text)) return;

    const bindingKind = getBindingKind(name);
    if (bindingKind === "parameter") {
      reportIssue(
        sourceFile,
        name,
        `Underscore-prefixed parameter "${name.text}". Remove it or restructure the callback to avoid unused positional args.`,
        issues,
      );
      return;
    }

    if (bindingKind === "variable") {
      reportIssue(
        sourceFile,
        name,
        `Underscore-prefixed local "${name.text}". Remove it or rename it to the real domain concept.`,
        issues,
      );
    }
    return;
  }

  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const element of name.elements) {
      if (!ts.isBindingElement(element)) continue;

      const bindingKind = getBindingKind(element);
      const isTupleBinding = ts.isArrayBindingPattern(name) && bindingKind === "variable";

      if (ts.isIdentifier(element.name) && isUnderscorePrefixed(element.name.text)) {
        if (element.propertyName) {
          reportIssue(
            sourceFile,
            element.name,
            `Unused parameter: "${element.propertyName.getText(sourceFile)}" renamed to "${element.name.text}". Consider removing if not needed.`,
            issues,
          );
          continue;
        }

        if (bindingKind === "parameter") {
          reportIssue(
            sourceFile,
            element.name,
            `Underscore-prefixed parameter "${element.name.text}". Remove it or restructure the callback to avoid unused positional args.`,
            issues,
          );
          continue;
        }

        if (bindingKind === "variable") {
          const message = isTupleBinding
            ? `Underscore-prefixed state or tuple binding "${element.name.text}". Omit the slot instead of naming an unused value.`
            : `Underscore-prefixed local "${element.name.text}". Remove it or rename it to the real domain concept.`;
          reportIssue(sourceFile, element.name, message, issues);
        }
      }

      if (ts.isObjectBindingPattern(element.name) || ts.isArrayBindingPattern(element.name)) {
        visitBindingName(element.name, sourceFile, issues);
      }
    }
  }
}

/**
 * Find underscore-prefixed bindings in actual parameter/local binding positions.
 * Uses the TypeScript AST so type members like `_id: v.id(...)` are not false positives.
 */
function findUnusedParams(filePath, content) {
  const issues = [];
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  function visit(node) {
    if (ts.isParameter(node) || ts.isVariableDeclaration(node)) {
      visitBindingName(node.name, sourceFile, issues);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}

export function run() {
  const issues = [];

  for (const dir of CHECK_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;

    for (const file of walkDir(fullDir)) {
      if (!/\.(ts|tsx)$/.test(file)) continue;
      if (SKIP_PATTERNS.some((pattern) => pattern.test(file))) continue;

      const rel = relPath(file);
      if (ALLOWLIST.has(rel)) continue;

      const content = fs.readFileSync(file, "utf8");
      const fileIssues = findUnusedParams(file, content);

      for (const issue of fileIssues) {
        issues.push({
          file: rel,
          line: issue.line,
          column: issue.column,
          message: issue.message,
        });
      }
    }
  }

  if (issues.length > 0) {
    console.log(`${c.red}Found ${issues.length} underscore-prefixed binding(s):${c.reset}\n`);
    for (const issue of issues) {
      console.log(
        `  ${c.red}ERROR${c.reset} ${issue.file}:${issue.line}:${issue.column} - ${issue.message}`,
      );
    }
    console.log();
  }

  return {
    passed: issues.length === 0,
    errors: issues.length,
    detail: issues.length > 0 ? `${issues.length} underscore-prefixed binding(s)` : null,
  };
}
