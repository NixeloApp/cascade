/**
 * CHECK: Project issue counters
 *
 * Enforced. Every project insert in Convex product code must initialize
 * `nextIssueNumber` explicitly so issue-key allocation never depends on a
 * missing counter.
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createValidatorResult } from "./result-utils.js";
import { ROOT, relPath, walkDir } from "./utils.js";

const CONVEX_DIR = path.join(ROOT, "convex");

export function collectProjectInsertCounterIssues(content, filePath) {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const issues = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.arguments.length >= 2 &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "insert" &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text === "projects" &&
      ts.isObjectLiteralExpression(node.arguments[1])
    ) {
      const hasNextIssueNumber = node.arguments[1].properties.some(
        (property) =>
          ts.isPropertyAssignment(property) &&
          ((ts.isIdentifier(property.name) && property.name.text === "nextIssueNumber") ||
            (ts.isStringLiteral(property.name) && property.name.text === "nextIssueNumber")),
      );

      if (!hasNextIssueNumber) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        issues.push({
          file: relPath(filePath),
          line: line + 1,
          message:
            "Project inserts must initialize `nextIssueNumber` explicitly (usually `nextIssueNumber: 0`).",
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
    collectProjectInsertCounterIssues(fs.readFileSync(filePath, "utf8"), filePath),
  );

  return createValidatorResult({
    errors: issues.length,
    detail:
      issues.length > 0
        ? `${issues.length} project insert${issues.length === 1 ? "" : "s"} missing nextIssueNumber`
        : "all project inserts initialize nextIssueNumber",
    messages: issues.map((issue) => `  ERROR ${issue.file}:${issue.line} - ${issue.message}`),
  });
}
