/**
 * CHECK 6: Type Consistency
 * Ensures TypeScript types are imported from canonical sources, not duplicated.
 *
 * Canonical sources:
 * - IssueType, IssuePriority → src/lib/issue-utils.ts
 * - Convex validators (issueTypes, issuePriorities, etc.) → convex/validators/index.ts
 *
 * Flags:
 * - Local type definitions that duplicate canonical types
 * - Type annotations using string literals instead of importing the type
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Canonical type sources
const CANONICAL_TYPES = {
  IssueType: "@/lib/issue-utils",
  IssuePriority: "@/lib/issue-utils",
};

// Files that ARE the canonical sources (don't flag these)
const CANONICAL_SOURCE_FILES = ["src/lib/issue-utils.ts", "convex/validators/index.ts"];

// Files/dirs to skip completely
const IGNORE_PATTERNS = ["node_modules", "dist", ".next", ".git", "convex/_generated"];

// Convex backend files - they use validators, not TypeScript types
// These files should use `convex/validators/index.ts` validators, not `@/lib/issue-utils`
const CONVEX_FILE_PATTERN = /^convex\//;

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  let errorCount = 0;
  const messages = [];

  function report(filePath, line, message) {
    const rel = relPath(filePath);
    messages.push(`  ${c.red}ERROR${c.reset} ${rel}:${line} - ${message}`);
    errorCount++;
  }

  function isCanonicalSource(filePath) {
    const rel = relPath(filePath);
    return CANONICAL_SOURCE_FILES.some((f) => rel === f);
  }

  function shouldIgnore(filePath) {
    const rel = relPath(filePath);
    return IGNORE_PATTERNS.some((p) => rel.includes(p));
  }

  /**
   * Check for duplicated type alias definitions.
   * E.g., `type IssueType = "task" | "bug" | ...`
   */
  function checkForDuplicateTypes(filePath, sourceFile) {
    function visit(node) {
      // Check type alias declarations
      if (ts.isTypeAliasDeclaration(node)) {
        const typeName = node.name.getText();

        if (CANONICAL_TYPES[typeName]) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          report(
            filePath,
            line + 1,
            `Duplicate type definition '${typeName}'. Import from '${CANONICAL_TYPES[typeName]}' instead.`,
          );
        }
      }

      // Check interface declarations (less common but possible)
      if (ts.isInterfaceDeclaration(node)) {
        const typeName = node.name.getText();

        if (CANONICAL_TYPES[typeName]) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          report(
            filePath,
            line + 1,
            `Duplicate interface definition '${typeName}'. Import from '${CANONICAL_TYPES[typeName]}' instead.`,
          );
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  /**
   * Check for inline string literal unions that should use the type.
   * E.g., `type: "task" | "bug" | "story"` instead of `type: IssueType`
   *
   * This is a heuristic check - it looks for patterns that match known types.
   */
  function checkForInlineUnions(filePath, sourceFile) {
    const content = sourceFile.getFullText();

    // Patterns for inline unions that should be IssueType
    const issueTypePattern =
      /:\s*["'](?:task|bug|story|epic|subtask)["']\s*\|\s*["'](?:task|bug|story|epic|subtask)["']/g;
    const issuePriorityPattern =
      /:\s*["'](?:lowest|low|medium|high|highest)["']\s*\|\s*["'](?:lowest|low|medium|high|highest)["']/g;

    // Check for issue type inline unions
    const issueTypeMatches = content.matchAll(issueTypePattern);
    for (const match of issueTypeMatches) {
      const pos = match.index;
      const { line } = sourceFile.getLineAndCharacterOfPosition(pos);
      report(
        filePath,
        line + 1,
        "Inline string union matches IssueType pattern. Use 'IssueType' from '@/lib/issue-utils'.",
      );
    }

    // Check for priority inline unions
    const priorityMatches = content.matchAll(issuePriorityPattern);
    for (const match of priorityMatches) {
      const pos = match.index;
      const { line } = sourceFile.getLineAndCharacterOfPosition(pos);
      report(
        filePath,
        line + 1,
        "Inline string union matches IssuePriority pattern. Use 'IssuePriority' from '@/lib/issue-utils'.",
      );
    }
  }

  function isConvexFile(filePath) {
    const rel = relPath(filePath);
    return CONVEX_FILE_PATTERN.test(rel);
  }

  /**
   * Check a single file for type consistency issues.
   */
  function checkFile(filePath) {
    if (shouldIgnore(filePath)) return;
    if (isCanonicalSource(filePath)) return;

    // Skip Convex backend files - they use runtime validators, not TypeScript types
    // The types there are defined by Convex validators (issueTypes, issuePriorities)
    if (isConvexFile(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    checkForDuplicateTypes(filePath, sourceFile);
    checkForInlineUnions(filePath, sourceFile);
  }

  // Walk src directory only (convex files use runtime validators, not TS types)
  const srcFiles = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx"]) });

  for (const f of srcFiles) {
    checkFile(f);
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : null,
    messages,
  };
}
