/**
 * CHECK 4: Query issues
 * N+1 queries, unbounded .collect(), missing indexes
 *
 * Enforced. Query issues are reported as plain errors.
 */

import fs from "node:fs";
import path from "node:path";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { ROOT, relPath, walkDir } from "./utils.js";

const POST_FETCH_FILTER_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "post-fetch-js-filters-baseline.json",
);
const CLIENT_QUERY_FILTER_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "client-query-filters-baseline.json",
);
const MULTI_FILTER_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "multi-filter-query-results-baseline.json",
);
const QUERY_HOOK_PATTERN = /use(?:AuthenticatedQuery|Query|PaginatedQuery|SuspenseQuery)\s*\(/;

function lineFromIndex(source, index) {
  return source.slice(0, index).split("\n").length;
}

function getQueryHelperNames(content) {
  const helperNames = new Set();
  const functionPattern =
    /(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/g;

  for (const match of content.matchAll(functionPattern)) {
    const helperName = match[1];
    const body = match[2] ?? "";
    if (body.includes(".take(") || body.includes(".collect(") || body.includes("safeCollect(")) {
      helperNames.add(helperName);
    }
  }

  return helperNames;
}

function collectPostFetchFilters(content, file) {
  const detections = [];
  const seenDetections = new Set();
  const helperNames = getQueryHelperNames(content);
  const statementPattern =
    /(?:(?:const|let)\s+([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*))\s*=\s*await\s+([\s\S]*?);/g;

  for (const match of content.matchAll(statementPattern)) {
    const variableName = match[1] ?? match[2];
    const expression = match[3] ?? "";
    if (!variableName) continue;

    const usesDirectFetch =
      expression.includes(".take(") ||
      expression.includes(".collect(") ||
      expression.includes("safeCollect(");
    const usesHelperFetch = [...helperNames].some((helperName) =>
      new RegExp(`\\b${helperName}\\s*\\(`).test(expression),
    );

    if (!(usesDirectFetch || usesHelperFetch)) {
      continue;
    }

    const assignmentIndex = match.index ?? 0;
    const assignmentLine = lineFromIndex(content, assignmentIndex);
    const lookAheadStart = assignmentIndex + match[0].length;
    const lookAhead = content.slice(
      lookAheadStart,
      Math.min(content.length, lookAheadStart + 2400),
    );
    const filterPattern = new RegExp(
      `\\b${variableName}\\s*(?:=\\s*${variableName}\\s*)?\\.filter\\s*\\(`,
      "g",
    );

    for (const filterMatch of lookAhead.matchAll(filterPattern)) {
      const absoluteIndex = lookAheadStart + (filterMatch.index ?? 0);
      const line = lineFromIndex(content, absoluteIndex);
      const lineDelta = line - assignmentLine;
      if (lineDelta < 0 || lineDelta > 30) {
        continue;
      }

      const statementEnd = content.indexOf(");", absoluteIndex);
      const sliceEnd = statementEnd === -1 ? absoluteIndex + 300 : statementEnd + 2;
      const filterStatement = content
        .slice(absoluteIndex, Math.min(content.length, sliceEnd))
        .replace(/\s+/g, " ")
        .trim();

      if (
        filterStatement.includes(".includes(") ||
        filterStatement.includes(".has(") ||
        filterStatement.includes("notDeleted") ||
        filterStatement.includes("onlyDeleted") ||
        /\.filter\s*\(\s*\(?\s*q\s*\)?\s*=>/.test(filterStatement)
      ) {
        continue;
      }

      const paramMatch = filterStatement.match(/\.filter\s*\(\s*\(?\s*([A-Za-z_$][\w$]*)/);
      const paramName = paramMatch?.[1];
      if (!paramName || !new RegExp(`\\b${paramName}\\.`, "g").test(filterStatement)) {
        continue;
      }

      const detectionKey = `${file}:${line}:${variableName}`;
      if (seenDetections.has(detectionKey)) {
        continue;
      }
      seenDetections.add(detectionKey);

      detections.push({
        file,
        line,
        variableName,
        originLine: assignmentLine,
        code: filterStatement,
      });
    }
  }

  return detections;
}

function getClientQueryVariableNames(content) {
  const variableNames = new Set();
  const directAssignmentPattern =
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*use(?:AuthenticatedQuery|Query|PaginatedQuery|SuspenseQuery)\s*\(/g;
  const resultsDestructurePattern =
    /const\s+\{\s*results\s*:\s*([A-Za-z_$][\w$]*)[^}]*\}\s*=\s*usePaginatedQuery\s*\(/g;

  for (const match of content.matchAll(directAssignmentPattern)) {
    variableNames.add(match[1]);
  }

  for (const match of content.matchAll(resultsDestructurePattern)) {
    variableNames.add(match[1]);
  }

  return variableNames;
}

function collectClientQueryFilters(content, file) {
  const detections = [];
  const seenDetections = new Set();
  const queryVariables = getClientQueryVariableNames(content);

  for (const variableName of queryVariables) {
    const assignmentPattern = new RegExp(
      `const\\s+(?:\\{[^}]*\\bresults\\s*:\\s*${variableName}\\b[^}]*\\}|${variableName}\\b)[\\s\\S]*?${QUERY_HOOK_PATTERN.source}`,
      "g",
    );
    const assignmentMatch = assignmentPattern.exec(content);
    if (!assignmentMatch) {
      continue;
    }

    const assignmentLine = lineFromIndex(content, assignmentMatch.index ?? 0);
    const searchStart = (assignmentMatch.index ?? 0) + assignmentMatch[0].length;
    const searchArea = content.slice(searchStart);
    const filterPattern = new RegExp(`\\b${variableName}\\s*(?:\\?\\.|\\.)filter\\s*\\(`, "g");

    for (const filterMatch of searchArea.matchAll(filterPattern)) {
      const absoluteIndex = searchStart + (filterMatch.index ?? 0);
      const line = lineFromIndex(content, absoluteIndex);
      const statementEnd = content.indexOf(");", absoluteIndex);
      const sliceEnd = statementEnd === -1 ? absoluteIndex + 320 : statementEnd + 2;
      const filterStatement = content
        .slice(absoluteIndex, Math.min(content.length, sliceEnd))
        .replace(/\s+/g, " ")
        .trim();

      const paramMatch = filterStatement.match(/\.filter\s*\(\s*\(?\s*([A-Za-z_$][\w$]*)/);
      const paramName = paramMatch?.[1];
      if (!paramName) {
        continue;
      }

      const usesParamProperty = new RegExp(`\\b${paramName}\\.`, "g").test(filterStatement);
      const isTypeGuard =
        filterStatement.includes(`: ${paramName} is`) || /\bis\s+[A-Z]/.test(filterStatement);
      const isBooleanFilter = new RegExp(`=>\\s*!?${paramName}\\.[A-Za-z_$]`, "g").test(
        filterStatement,
      );
      const isComparatorFilter =
        /===|!==|>=|<=|>|<|\.includes\s*\(/.test(filterStatement) && usesParamProperty;

      if (!usesParamProperty || isTypeGuard || (!isBooleanFilter && !isComparatorFilter)) {
        continue;
      }

      const detectionKey = `${file}:${line}:${variableName}`;
      if (seenDetections.has(detectionKey)) {
        continue;
      }
      seenDetections.add(detectionKey);

      detections.push({
        file,
        line,
        variableName,
        originLine: assignmentLine,
        code: filterStatement,
      });
    }
  }

  return detections;
}

function collectMultiFilterGroups(detections) {
  const groupedDetections = new Map();

  for (const detection of detections) {
    const groupKey = `${detection.file}:${detection.variableName}:${detection.originLine ?? detection.line}`;
    const existingGroup = groupedDetections.get(groupKey);

    if (existingGroup) {
      existingGroup.filters.push(detection);
      continue;
    }

    groupedDetections.set(groupKey, {
      file: detection.file,
      variableName: detection.variableName,
      originLine: detection.originLine ?? detection.line,
      filters: [detection],
    });
  }

  return [...groupedDetections.values()]
    .filter((group) => group.filters.length >= 2)
    .sort((a, b) => {
      if (a.file !== b.file) {
        return a.file.localeCompare(b.file);
      }
      return a.originLine - b.originLine;
    });
}

export function run() {
  const convexDir = path.join(ROOT, "convex");
  const clientDirCandidates = [
    path.join(ROOT, "src", "components"),
    path.join(ROOT, "src", "routes"),
  ];

  const EXCLUDED_FILES = [
    "boundedQueries.ts",
    "softDeleteHelpers.ts",
    "batchHelpers.ts",
    "purge.ts",
    "e2e.ts",
    "testUtils.ts",
    "migrateDocuments.ts", // Migration needs unbounded collect for batch processing
    "yjs.ts", // Y.js sync uses unbounded collect for awareness cleanup
    "eventReminders.ts", // Complex background processing with acceptable N+1
    "inbox.ts", // Complex background processing with acceptable N+1
    "mutations.ts", // Bulk operations with acceptable N+1
    "documents.ts", // Complex background processing with acceptable N+1
    "pushNotifications.ts", // Complex background processing with acceptable N+1
    "templates.ts", // Complex background processing with acceptable N+1
    "documentTemplates.ts", // Migration function with sequential patches
    "slackCommandsCore.ts", // Slack search queries multiple projects (small count)
    "sendEngine.ts", // Click tracking inserts sequentially to capture Convex _ids for redirect URLs
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
        const hasIgnore =
          /@convex-validation-ignore\s+MISSING_INDEX/.test(lines[i - 1] || "") ||
          /@convex-validation-ignore\s+MISSING_INDEX/.test(lines[i - 2] || "");

        if (!hasIndex && /\.filter\s*\(/.test(queryContext) && !hasIgnore) {
          issues.push({
            type: "MISSING_INDEX",
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
            line: lineNum,
            code: line.trim(),
            message: `Large .take(${takeValue}) - consider pagination`,
          });
        }
      }

      // .take() before in-memory .filter() - silently drops results
      // Pattern: .take(N) followed by JS .filter() on the result variable
      if (/\.take\s*\(/.test(line)) {
        // Check for ignore comment
        const hasIgnore =
          /@convex-validation-ignore\s+TAKE_BEFORE_FILTER/.test(lines[i - 1] || "") ||
          /@convex-validation-ignore\s+TAKE_BEFORE_FILTER/.test(lines[i - 2] || "");
        if (hasIgnore) continue;

        // Look ahead for in-memory filter within 5 lines
        const lookAhead = lines.slice(i, Math.min(lines.length, i + 6)).join("\n");

        // Skip if filter is inside Map/Set constructor (legitimate data transformation)
        const isInsideMapSet = /new\s+(Map|Set)\s*\([^)]*\.filter\s*\(/.test(lookAhead);
        if (isInsideMapSet) continue;

        // Skip if filter uses .includes() (array membership - can't be done at query level)
        const usesIncludes = /\.filter\s*\([^)]*\.includes\s*\(/.test(lookAhead);
        if (usesIncludes) continue;

        // Skip if filter uses .has() (Set membership - can't be done at query level)
        const usesHas = /\.filter\s*\([^)]*\.has\s*\(/.test(lookAhead);
        if (usesHas) continue;

        // Extract the variable name assigned by this .take() line
        // Patterns: "const foo = await ctx.db..." or "foo = await ctx.db..."
        // Use the LAST (nearest) assignment to infer which variable .take() belongs to
        const takeContext = lines.slice(Math.max(0, i - 8), i + 1).join("\n");
        const takeVarMatches = [
          ...takeContext.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?ctx\.db/g),
        ];
        const takeVarMatch =
          takeVarMatches.length > 0 ? takeVarMatches[takeVarMatches.length - 1] : null;
        const takeVarName = takeVarMatch?.[1];

        // Match JS array .filter() - direct usage pattern
        // Looking for: variable.filter(item => item.field === value)
        const hasDirectFilter =
          /\)\s*;\s*\n\s*(return|const|let)\s+\w+\.filter\s*\(/.test(lookAhead) ||
          /\)\s*;\s*\n\s*\w+\s*=\s*\w+\.filter\s*\(/.test(lookAhead);

        // Exclude Convex query .filter() which uses (q) => q.eq/q.and/etc
        const isConvexFilter = /\.filter\s*\(\s*\(?\s*q\s*\)?\s*=>\s*q\./.test(lookAhead);

        // Exclude .filter() on a DIFFERENT variable than the .take() result
        let isFilterOnDifferentVar = false;
        if (takeVarName && hasDirectFilter) {
          // Check if the .filter() in the lookahead is on a different variable
          const filterMatch = lookAhead.match(/(\w+)\.filter\s*\(/g);
          if (filterMatch) {
            isFilterOnDifferentVar = filterMatch.every((f) => !f.startsWith(`${takeVarName}.`));
          }
        }

        if (hasDirectFilter && !isConvexFilter && !isFilterOnDifferentVar) {
          issues.push({
            type: "TAKE_BEFORE_FILTER",
            line: lineNum,
            code: line.trim(),
            message:
              ".take() before in-memory .filter() silently drops matching results - filter first or use .collect()",
          });
        }
      }
    }

    return issues;
  }

  const files = findTsFiles(convexDir);
  const allIssues = [];
  const postFetchFilterDetections = [];
  const clientQueryFilterDetections = [];
  const multiFilterDetections = [];

  for (const file of files) {
    const issues = analyzeFile(file);
    const content = fs.readFileSync(file, "utf-8");
    if (issues.length > 0) {
      allIssues.push(...issues.map((issue) => ({ ...issue, file: relPath(file) })));
    }
    const filePostFetchDetections = collectPostFetchFilters(content, relPath(file));
    postFetchFilterDetections.push(...filePostFetchDetections);
    multiFilterDetections.push(...filePostFetchDetections);
  }

  for (const dir of clientDirCandidates) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const clientFiles = walkDir(dir, { extensions: new Set([".ts", ".tsx"]) }).filter(
      (filePath) => !filePath.includes(".test.") && !filePath.endsWith(".d.ts"),
    );

    for (const filePath of clientFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const fileClientQueryDetections = collectClientQueryFilters(content, relPath(filePath));
      clientQueryFilterDetections.push(...fileClientQueryDetections);
      multiFilterDetections.push(...fileClientQueryDetections);
    }
  }

  const postFetchFilterBaselineByFile = loadCountBaseline(
    POST_FETCH_FILTER_BASELINE_PATH,
    "postFetchJsFiltersByFile",
  );
  const postFetchDetectionsByFile = {};
  for (const detection of postFetchFilterDetections) {
    const detectionsForFile = postFetchDetectionsByFile[detection.file] ?? [];
    detectionsForFile.push(detection);
    postFetchDetectionsByFile[detection.file] = detectionsForFile;
  }

  for (const detections of Object.values(postFetchDetectionsByFile)) {
    detections.sort((a, b) => a.line - b.line);
  }
  const postFetchRatchet = analyzeCountRatchet(
    postFetchDetectionsByFile,
    postFetchFilterBaselineByFile,
  );
  const ratchetViolations = Object.values(postFetchRatchet.overagesByKey).flatMap((entry) =>
    entry.overageItems.map((detection) => ({
      type: "POST_FETCH_JS_FILTER",
      file: detection.file,
      line: detection.line,
      code: detection.code,
      message:
        "Post-fetch JS filter after bounded query result - consider moving the filter into the query or adding an index",
    })),
  );

  allIssues.push(...ratchetViolations);

  const clientQueryBaselineByFile = loadCountBaseline(
    CLIENT_QUERY_FILTER_BASELINE_PATH,
    "clientQueryFiltersByFile",
  );
  const clientQueryDetectionsByFile = {};
  for (const detection of clientQueryFilterDetections) {
    const detectionsForFile = clientQueryDetectionsByFile[detection.file] ?? [];
    detectionsForFile.push(detection);
    clientQueryDetectionsByFile[detection.file] = detectionsForFile;
  }

  for (const detections of Object.values(clientQueryDetectionsByFile)) {
    detections.sort((a, b) => a.line - b.line);
  }
  const clientQueryRatchet = analyzeCountRatchet(
    clientQueryDetectionsByFile,
    clientQueryBaselineByFile,
  );
  const clientQueryRatchetViolations = Object.values(clientQueryRatchet.overagesByKey).flatMap(
    (entry) =>
      entry.overageItems.map((detection) => ({
        type: "CLIENT_QUERY_FILTER",
        file: detection.file,
        line: detection.line,
        code: detection.code,
        message:
          "Client-side filtering on query results - consider moving the filter into a query arg or backend selector",
      })),
  );

  allIssues.push(...clientQueryRatchetViolations);

  const multiFilterBaselineByFile = loadCountBaseline(
    MULTI_FILTER_BASELINE_PATH,
    "multiFilterQueryResultsByFile",
  );
  const multiFilterGroups = collectMultiFilterGroups(multiFilterDetections);
  const multiFilterGroupsByFile = {};
  for (const group of multiFilterGroups) {
    const groupsForFile = multiFilterGroupsByFile[group.file] ?? [];
    groupsForFile.push(group);
    multiFilterGroupsByFile[group.file] = groupsForFile;
  }

  for (const groups of Object.values(multiFilterGroupsByFile)) {
    groups.sort((a, b) => a.originLine - b.originLine);
  }
  const multiFilterRatchet = analyzeCountRatchet(
    multiFilterGroupsByFile,
    multiFilterBaselineByFile,
  );
  const multiFilterRatchetViolations = Object.values(multiFilterRatchet.overagesByKey).flatMap(
    (entry) =>
      entry.overageItems.map((group) => ({
        type: "MULTI_FILTER_QUERY_RESULT",
        file: group.file,
        line: group.originLine,
        code: group.filters.map((filter) => filter.code).join(" | "),
        message: `${group.variableName} is filtered ${group.filters.length} times after fetch/query result - combine passes or pre-aggregate`,
      })),
  );

  allIssues.push(...multiFilterRatchetViolations);

  const messages = [];
  if (allIssues.length > 0) {
    for (const issue of allIssues) {
      messages.push(`  ${issue.file}:${issue.line} ${issue.type} - ${issue.message}`);
    }
  }

  const baselineSummaryParts = [];
  if (postFetchRatchet.totalCurrent > 0) {
    baselineSummaryParts.push(
      `${postFetchRatchet.totalCurrent} baselined post-fetch JS filter(s) across ${postFetchRatchet.activeKeyCount} file(s)`,
    );
  }
  if (clientQueryRatchet.totalCurrent > 0) {
    baselineSummaryParts.push(
      `${clientQueryRatchet.totalCurrent} baselined client query filter(s) across ${clientQueryRatchet.activeKeyCount} file(s)`,
    );
  }
  if (multiFilterRatchet.totalCurrent > 0) {
    baselineSummaryParts.push(
      `${multiFilterRatchet.totalCurrent} baselined multi-filter query result group(s) across ${multiFilterRatchet.activeKeyCount} file(s)`,
    );
  }
  const combinedBaselineDetail =
    baselineSummaryParts.length > 0 ? ` (${baselineSummaryParts.join(", ")})` : "";

  return {
    passed: allIssues.length === 0,
    errors: allIssues.length,
    detail:
      allIssues.length > 0
        ? `${allIssues.length} query issue(s)`
        : `no blocking issues${combinedBaselineDetail}`,
    messages,
  };
}
