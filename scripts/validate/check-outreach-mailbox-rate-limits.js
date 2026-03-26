/**
 * CHECK: Outreach mailbox rate limits
 *
 * Enforced. Every outreach mailbox insert in Convex product code must initialize
 * the minute-window counter fields explicitly so send throttling never depends
 * on a missing rollout-era shape.
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createValidatorResult } from "./result-utils.js";
import { ROOT, relPath, walkDir } from "./utils.js";

const CONVEX_DIR = path.join(ROOT, "convex");
const REQUIRED_KEYS = new Set(["minuteSendLimit", "minuteSendCount", "minuteWindowStartedAt"]);

function hasRateLimitSpread(property) {
  return (
    ts.isSpreadAssignment(property) &&
    ts.isIdentifier(property.expression) &&
    property.expression.text === "rateLimitDefaults"
  );
}

function getObjectKey(propertyName) {
  if (ts.isIdentifier(propertyName) || ts.isStringLiteral(propertyName)) {
    return propertyName.text;
  }

  return null;
}

export function collectOutreachMailboxRateLimitIssues(content, filePath) {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const issues = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.arguments.length >= 2 &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "insert" &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text === "outreachMailboxes" &&
      ts.isObjectLiteralExpression(node.arguments[1])
    ) {
      const properties = node.arguments[1].properties;
      const hasRateLimitDefaults = properties.some(hasRateLimitSpread);
      const missingKeys = [...REQUIRED_KEYS].filter(
        (key) =>
          !properties.some(
            (property) => ts.isPropertyAssignment(property) && getObjectKey(property.name) === key,
          ),
      );

      if (!hasRateLimitDefaults && missingKeys.length > 0) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        issues.push({
          file: relPath(filePath),
          line: line + 1,
          message: `Outreach mailbox inserts must initialize minute-window counters explicitly (${missingKeys.join(", ")}).`,
        });
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
    collectOutreachMailboxRateLimitIssues(fs.readFileSync(filePath, "utf8"), filePath),
  );

  return createValidatorResult({
    errors: issues.length,
    detail:
      issues.length > 0
        ? `${issues.length} outreach mailbox insert${issues.length === 1 ? "" : "s"} missing minute counters`
        : "all outreach mailbox inserts initialize minute counters",
    messages: issues.map((issue) => `  ERROR ${issue.file}:${issue.line} - ${issue.message}`),
  });
}
