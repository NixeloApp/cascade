/**
 * CHECK 4: Query issues
 * N+1 queries, unbounded .collect(), missing indexes
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const convexDir = path.join(ROOT, "convex");

  const SEVERITY = { HIGH: "HIGH", MEDIUM: "MEDIUM", LOW: "LOW" };
  const EXCLUDED_FILES = [
    "boundedQueries.ts",
    "softDeleteHelpers.ts",
    "batchHelpers.ts",
    "purge.ts",
    "e2e.ts",
    "testUtils.ts",
    "migrateDocuments.ts", // Migration needs unbounded collect for batch processing
    "yjs.ts", // Y.js sync uses unbounded collect for awareness cleanup
  ];

  function findTsFiles(dir) {
    return walkDir(dir, { extensions: new Set([".ts", ".tsx"]) }).filter((f) => {
      const name = path.basename(f);
      return !(name.includes(".test.") || name.endsWith(".d.ts") || EXCLUDED_FILES.includes(name));
    });
  }

  function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const issues = [];

    let inLoopContext = false;
    let loopStartLine = 0;
    let braceDepth = 0;
    let loopBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      // Detect loop starts
      const surroundingForFilter = lines.slice(Math.max(0, i - 5), i + 1).join("\n");
      const isQueryFilter =
        /\.filter\s*\(/.test(line) &&
        (surroundingForFilter.includes("ctx.db") ||
          surroundingForFilter.includes(".query(") ||
          /\.filter\s*\(\s*(notDeleted|onlyDeleted)\s*\)/.test(line) ||
          /\.filter\s*\(\s*\(?\s*q\s*\)?\s*=>/.test(line));
      const isSortOrOther = /\.(sort|find|some|every|includes)\s*\(/.test(line);
      const isArrayMethod =
        /\.(map|forEach|reduce)\s*\(/.test(line) || (/\.filter\s*\(/.test(line) && !isQueryFilter);
      const isActualLoop = /\b(for|while)\s*\(/.test(line) || (isArrayMethod && !isSortOrOther);

      if (isActualLoop && !inLoopContext) {
        inLoopContext = true;
        loopStartLine = lineNum;
        loopBraceDepth = braceDepth;
      }

      if (inLoopContext) {
        if (braceDepth < loopBraceDepth) {
          inLoopContext = false;
        }
        if (
          /\)\s*;?\s*$/.test(line) &&
          braceDepth <= loopBraceDepth &&
          !/^\s*(for|while|if|else)\s*\(/.test(lines[i + 1] || "")
        ) {
          const nextLine = lines[i + 1] || "";
          if (!/^\s*\./.test(nextLine)) inLoopContext = false;
        }
        if (/\]\s*[0-9]*\s*;?\s*$/.test(line)) inLoopContext = false;
      }

      // Unbounded .collect()
      if (/\.collect\s*\(\s*\)/.test(line)) {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
        const contextLines = lines.slice(Math.max(0, i - 5), i + 1).join("\n");
        const hasBound = /\.take\s*\(/.test(contextLines) || /\.first\s*\(/.test(contextLines);
        if (!hasBound) {
          issues.push({
            type: "UNBOUNDED_COLLECT",
            severity: SEVERITY.HIGH,
            line: lineNum,
            code: trimmed,
            message: "Unbounded .collect() - add .take(BOUNDED_LIST_LIMIT) or use .first()",
          });
        }
      }

      // N+1 queries
      if (inLoopContext) {
        const trimmedLine = line.trim();
        if (
          trimmedLine.startsWith("//") ||
          trimmedLine.startsWith("*") ||
          trimmedLine.startsWith("/*")
        )
          continue;

        if (/ctx\.db\.(get|query)\s*\(/.test(line) || /await\s+ctx\.db\.(get|query)/.test(line)) {
          const surroundingContext = lines
            .slice(Math.max(0, i - 3), Math.min(lines.length, i + 3))
            .join("\n");
          const functionContext = lines.slice(Math.max(0, i - 40), i + 1).join("\n");
          const isDeleteHelper =
            /function\s+delete\w*\s*\(/.test(functionContext) ||
            /async\s+function\s+delete\w*/.test(functionContext) ||
            /\bdelete\w*\s*=\s*async/.test(functionContext);
          if (
            !(
              /Promise\.all/.test(surroundingContext) ||
              /batch/i.test(surroundingContext) ||
              isDeleteHelper
            )
          ) {
            issues.push({
              type: "N_PLUS_1",
              severity: SEVERITY.HIGH,
              line: lineNum,
              loopLine: loopStartLine,
              code: trimmedLine,
              message: `Database query inside loop (loop at line ${loopStartLine})`,
            });
          }
        }
      }

      // Sequential awaits in loops
      const loopLine = lines[loopStartLine - 1] || "";
      const isWhileLoop = /\bwhile\s*\(/.test(loopLine);
      const nearbyContext = lines.slice(Math.max(0, i - 10), i + 1).join("\n");
      const isInSwitch =
        /switch\s*\([^)]+\)\s*\{/.test(nearbyContext) && /\bcase\s+/.test(nearbyContext);
      const functionContext = lines.slice(Math.max(0, i - 40), i + 1).join("\n");
      const isDeleteOrCleanup =
        /function\s+(delete|cleanup|purge|cascade|handleDelete)\w*/i.test(functionContext) ||
        /async\s+function\s+(cascade|handleDelete)/i.test(functionContext) ||
        /autoRetry/i.test(functionContext);

      if (
        inLoopContext &&
        !isWhileLoop &&
        !isInSwitch &&
        !isDeleteOrCleanup &&
        /await\s+/.test(line) &&
        !/Promise\.all/.test(line)
      ) {
        if (/ctx\.(db|storage|scheduler)/.test(line)) {
          const surroundingContext = lines
            .slice(Math.max(0, i - 5), Math.min(lines.length, i + 1))
            .join("\n");
          if (!/Promise\.all/.test(surroundingContext)) {
            const widerContext = lines
              .slice(Math.max(0, loopStartLine - 2), Math.min(lines.length, i + 15))
              .join("\n");
            const assignmentMatch = lines[loopStartLine - 1]?.match(/const\s+(\w+)\s*=.*\.map/);
            const variableName = assignmentMatch?.[1];
            const promiseAllPattern = variableName
              ? new RegExp(`Promise\\.all\\s*\\(\\s*${variableName}`)
              : /Promise\.all\s*\(/;
            if (!promiseAllPattern.test(widerContext)) {
              issues.push({
                type: "SEQUENTIAL_AWAIT",
                severity: SEVERITY.MEDIUM,
                line: lineNum,
                loopLine: loopStartLine,
                code: line.trim(),
                message: "Sequential await in loop - consider Promise.all",
              });
            }
          }
        }
      }

      // Missing index
      if (/\.query\s*\([^)]+\)/.test(line)) {
        const queryContext = lines.slice(i, Math.min(lines.length, i + 5)).join("\n");
        const hasIndex =
          /\.withIndex\s*\(/.test(queryContext) || /\.withSearchIndex\s*\(/.test(queryContext);
        if (!hasIndex && /\.filter\s*\(/.test(queryContext)) {
          issues.push({
            type: "MISSING_INDEX",
            severity: SEVERITY.LOW,
            line: lineNum,
            code: line.trim(),
            message: "Query uses .filter() without .withIndex()",
          });
        }
      }

      // Large .take()
      const takeMatch = line.match(/\.take\s*\(\s*(\d+)\s*\)/);
      if (takeMatch) {
        const takeValue = parseInt(takeMatch[1], 10);
        if (takeValue > 1000) {
          issues.push({
            type: "LARGE_TAKE",
            severity: SEVERITY.MEDIUM,
            line: lineNum,
            code: line.trim(),
            message: `Large .take(${takeValue}) - consider pagination`,
          });
        }
      }
    }

    return issues;
  }

  const files = findTsFiles(convexDir);
  const allIssues = [];

  for (const file of files) {
    const issues = analyzeFile(file);
    if (issues.length > 0) {
      allIssues.push(...issues.map((issue) => ({ ...issue, file: relPath(file) })));
    }
  }

  const highCount = allIssues.filter((i) => i.severity === SEVERITY.HIGH).length;
  const medCount = allIssues.filter((i) => i.severity === SEVERITY.MEDIUM).length;
  const lowCount = allIssues.filter((i) => i.severity === SEVERITY.LOW).length;

  const messages = [];
  for (const issue of allIssues) {
    const color =
      issue.severity === SEVERITY.HIGH
        ? c.red
        : issue.severity === SEVERITY.MEDIUM
          ? c.yellow
          : c.dim;
    messages.push(
      `  ${color}[${issue.severity}]${c.reset} ${issue.file}:${issue.line} ${issue.type} — ${issue.message}`,
    );
  }

  // Only HIGH severity issues are errors; MEDIUM and LOW are warnings
  let detail;
  if (highCount > 0 || medCount > 0 || lowCount > 0) {
    const parts = [];
    if (highCount > 0) parts.push(`${highCount} high`);
    if (medCount > 0) parts.push(`${medCount} medium`);
    if (lowCount > 0) parts.push(`${lowCount} low`);
    detail = parts.join(", ");
  } else {
    detail = "0 high severity";
  }

  return {
    passed: highCount === 0,
    errors: highCount,
    detail,
    messages: highCount > 0 ? messages.filter((m) => m.includes("[HIGH]")) : [],
  };
}
