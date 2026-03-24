/**
 * CHECK: Nested Cards (banned)
 * Cards inside Cards is an anti-pattern. Use proper semantic components instead:
 * - Headers/dividers: use a div with border-b or a Separator
 * - List items: use a div with bg styling or a dedicated ListItem
 * - Sections: restructure to avoid nesting, or use a recipe on a div
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// ============================================================================
// Configuration
// ============================================================================

const IGNORE_DIRS = ["src/lib", "src/components/ui"];

// Files with known nested Card issues - baseline to track and fix over time
// These are pre-existing violations; new violations will fail CI
const BASELINE_FILES = new Set([]);

// ============================================================================
// Main
// ============================================================================

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  let errorCount = 0;
  const errors = [];

  function reportError(filePath, node, message) {
    const pos = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());
    const rel = relPath(filePath);
    errors.push(
      `  ${c.red}ERROR${c.reset} ${rel}:${pos.line + 1}:${pos.character + 1} - ${message}`,
    );
    errorCount++;
  }

  function checkFile(filePath) {
    const rel = relPath(filePath);

    if (IGNORE_DIRS.some((d) => rel.startsWith(d))) return;
    if (BASELINE_FILES.has(rel)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node, cardDepth = 0) {
      // Handle JsxElement (opening + children + closing)
      if (ts.isJsxElement(node)) {
        const opening = node.openingElement;
        const tagName = opening.tagName.getText();

        if (tagName === "Card") {
          if (cardDepth > 0) {
            reportError(
              filePath,
              opening,
              `Card inside Card is banned. Use CardSection or a div for inner surfaces.`,
            );
          }

          // Visit children with incremented depth
          for (const child of node.children) {
            visit(child, cardDepth + 1);
          }
          return;
        }
      }

      // Handle self-closing Card elements
      if (ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText();

        if (tagName === "Card" && cardDepth > 0) {
          reportError(
            filePath,
            node,
            `Card inside Card is banned. Use CardSection or a div for inner surfaces.`,
          );
        }
      }

      // Continue traversal
      ts.forEachChild(node, (child) => visit(child, cardDepth));
    }

    visit(sourceFile, 0);
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".tsx"]) });
  for (const f of files) {
    checkFile(f);
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : null,
    messages: errors,
  };
}
