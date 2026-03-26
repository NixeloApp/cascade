/**
 * CHECK: Lifecycle timestamp ownership
 *
 * Enforced. Raw repeated lifecycle bundles in Convex write paths must go
 * through the shared ownership helpers instead of being copied inline.
 *
 * Current owned bundle:
 * - outreach enrollment completion / terminal-state fields
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createValidatorResult } from "./result-utils.js";
import { ROOT, relPath, walkDir } from "./utils.js";

const CONVEX_DIR = path.join(ROOT, "convex");
const OWNERSHIP_HELPER_FILE = path.join(CONVEX_DIR, "lib", "lifecyclePatches.ts");
const OUTREACH_TERMINAL_STATUSES = new Set(["completed", "replied", "bounced", "unsubscribed"]);

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
  return null;
}

function getObjectPropertyNames(node) {
  const names = new Set();

  for (const property of node.properties) {
    if (ts.isSpreadAssignment(property) && ts.isObjectLiteralExpression(property.expression)) {
      for (const nestedName of getObjectPropertyNames(property.expression)) {
        names.add(nestedName);
      }
      continue;
    }

    if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) {
      const propertyName = getPropertyName(property.name);
      if (propertyName) {
        names.add(propertyName);
      }
    }
  }

  return names;
}

function isCtxDbPatchCall(expression) {
  return (
    ts.isPropertyAccessExpression(expression) &&
    expression.name.text === "patch" &&
    ts.isPropertyAccessExpression(expression.expression) &&
    expression.expression.name.text === "db" &&
    ts.isIdentifier(expression.expression.expression) &&
    expression.expression.expression.text === "ctx"
  );
}

function isPatchContext(node) {
  const parent = node.parent;

  if (
    ts.isCallExpression(parent) &&
    parent.arguments.length >= 2 &&
    parent.arguments[1] === node &&
    isCtxDbPatchCall(parent.expression)
  ) {
    return true;
  }

  return false;
}

function getStatusLiteral(node) {
  for (let index = node.properties.length - 1; index >= 0; index -= 1) {
    const property = node.properties[index];
    if (ts.isSpreadAssignment(property) && ts.isObjectLiteralExpression(property.expression)) {
      const nestedStatus = getStatusLiteral(property.expression);
      if (nestedStatus) {
        return nestedStatus;
      }
      continue;
    }

    if (!ts.isPropertyAssignment(property) || getPropertyName(property.name) !== "status") {
      continue;
    }

    if (ts.isStringLiteral(property.initializer)) {
      return property.initializer.text;
    }
  }

  return null;
}

function getOwnershipIssue(node, filePath, sourceFile) {
  if (filePath === OWNERSHIP_HELPER_FILE || !isPatchContext(node)) {
    return null;
  }

  const relativeFile = relPath(filePath);
  const propertyNames = getObjectPropertyNames(node);
  const hasCompletedAt = propertyNames.has("completedAt");
  const hasNextSendAt = propertyNames.has("nextSendAt");

  const message =
    hasCompletedAt &&
    hasNextSendAt &&
    relativeFile.startsWith("convex/outreach/") &&
    OUTREACH_TERMINAL_STATUSES.has(getStatusLiteral(node) ?? "")
      ? "Use buildCompletedEnrollmentPatch()/buildTerminalEnrollmentPatch() for outreach enrollment terminal-state fields."
      : null;

  if (!message) {
    return null;
  }

  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    file: relativeFile,
    line: line + 1,
    message,
  };
}

export function collectLifecycleTimestampOwnershipIssues(content, filePath) {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const issues = [];

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const issue = getOwnershipIssue(node, filePath, sourceFile);
      if (issue) {
        issues.push(issue);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}

export function run() {
  const files = walkDir(CONVEX_DIR, { extensions: new Set([".ts"]) }).filter((filePath) => {
    const relative = relPath(filePath);
    return (
      !relative.includes("/_generated/") &&
      !relative.includes("/node_modules/") &&
      !relative.endsWith(".test.ts") &&
      !relative.endsWith(".test-helper.ts")
    );
  });

  const issues = files.flatMap((filePath) =>
    collectLifecycleTimestampOwnershipIssues(fs.readFileSync(filePath, "utf8"), filePath),
  );

  return createValidatorResult({
    errors: issues.length,
    detail:
      issues.length > 0
        ? `${issues.length} raw lifecycle bundle${issues.length === 1 ? "" : "s"} bypassing ownership helpers`
        : "owned lifecycle timestamp bundles use shared helpers",
    messages: issues.map((issue) => `  ERROR ${issue.file}:${issue.line} - ${issue.message}`),
  });
}
