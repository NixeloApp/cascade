/**
 * CHECK: Lifecycle timestamp ownership
 *
 * Enforced. Raw repeated lifecycle bundles in Convex write paths must go
 * through the shared ownership helpers instead of being copied inline.
 *
 * Current owned bundles:
 * - issue archive / restore fields
 * - generic archive-state fields for archivable records
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
    if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) {
      const propertyName = getPropertyName(property.name);
      if (propertyName) {
        names.add(propertyName);
      }
    }
  }

  return names;
}

function isPatchContext(node) {
  const parent = node.parent;

  if (
    ts.isCallExpression(parent) &&
    parent.arguments.length >= 2 &&
    parent.arguments[1] === node &&
    ts.isPropertyAccessExpression(parent.expression) &&
    parent.expression.name.text === "patch"
  ) {
    return true;
  }

  return (
    ts.isPropertyAssignment(parent) &&
    getPropertyName(parent.name) === "patch" &&
    parent.initializer === node
  );
}

function getStatusLiteral(node) {
  for (const property of node.properties) {
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
  const hasArchivedAt = propertyNames.has("archivedAt");
  const hasArchivedBy = propertyNames.has("archivedBy");
  const hasIsArchived = propertyNames.has("isArchived");
  const hasUpdatedAt = propertyNames.has("updatedAt");
  const hasCompletedAt = propertyNames.has("completedAt");
  const hasNextSendAt = propertyNames.has("nextSendAt");

  let message = null;

  if (
    hasArchivedAt &&
    hasIsArchived &&
    (relativeFile === "convex/documents.ts" || relativeFile === "convex/notifications.ts")
  ) {
    message =
      "Use the shared archive-state helpers in lifecyclePatches.ts for archive state fields.";
  } else if (
    hasArchivedAt &&
    !hasIsArchived &&
    (hasArchivedBy || hasUpdatedAt) &&
    (relativeFile === "convex/autoArchive.ts" || relativeFile.startsWith("convex/issues/"))
  ) {
    message = "Use buildIssueArchivePatch()/buildIssueRestorePatch() for issue archive fields.";
  } else if (
    hasCompletedAt &&
    hasNextSendAt &&
    relativeFile.startsWith("convex/outreach/") &&
    OUTREACH_TERMINAL_STATUSES.has(getStatusLiteral(node) ?? "")
  ) {
    message =
      "Use buildCompletedEnrollmentPatch()/buildTerminalEnrollmentPatch() for outreach enrollment terminal-state fields.";
  }

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
