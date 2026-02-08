/**
 * CHECK 1: Standards (AST)
 * Typography, className concat, dark mode, raw TW colors, shorthands
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");
  const IGNORE_DIRS = [
    "src/lib",
    "src/components/ui",
    "src/components/landing",
    "src/components/Calendar/shadcn-calendar",
  ];

  let errorCount = 0;
  const errors = [];

  function reportError(filePath, node, message) {
    const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());
    const rel = relPath(filePath);
    errors.push(`  ${c.red}ERROR${c.reset} ${rel}:${line + 1}:${character + 1} - ${message}`);
    errorCount++;
  }

  function getClassNameText(node) {
    const attr = node.attributes.properties.find(
      (p) => ts.isJsxAttribute(p) && p.name.getText() === "className",
    );
    const init = attr?.initializer;
    if (!init) return "";
    if (ts.isStringLiteral(init)) return init.text;
    if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)) {
      return init.expression.text;
    }
    return "";
  }

  const RAW_TW_COLORS =
    /\b(?:bg|text|border|ring|shadow|divide|outline|fill|stroke|from|to|via|decoration|placeholder|caret)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/;

  const tailwindShorthandMap = {
    "flex-shrink-0": "shrink-0",
    "flex-shrink": "shrink",
    "flex-grow-0": "grow-0",
    "flex-grow": "grow",
  };

  function getClassText(node) {
    let classText = "";
    if (node.initializer && ts.isStringLiteral(node.initializer)) {
      classText = node.initializer.text;
    } else if (
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression &&
      ts.isStringLiteral(node.initializer.expression)
    ) {
      classText = node.initializer.expression.text;
    }
    return classText;
  }

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (IGNORE_DIRS.some((d) => rel.startsWith(d))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node) {
      // Typography tags
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText();
        if (["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
          reportError(
            filePath,
            node,
            `Use <Typography> component instead of raw <${tagName}> tags.`,
          );
        }
        // Flex standard
        if (tagName === "div" || tagName === "span") {
          const classText = getClassNameText(node);
          const classes = classText.split(/\s+/);
          if (classes.includes("flex") || classes.includes("inline-flex")) {
            reportError(
              filePath,
              node,
              `Use <Flex> component instead of <${tagName} className="flex"> for one-dimensional layouts.`,
            );
          }
        }
      }

      // className checks
      if (ts.isJsxAttribute(node) && node.name.getText() === "className") {
        // Concatenation
        if (node.initializer && ts.isJsxExpression(node.initializer)) {
          const expr = node.initializer.expression;
          if (expr && (ts.isTemplateExpression(expr) || ts.isBinaryExpression(expr))) {
            reportError(
              filePath,
              node,
              "Avoid manual string concatenation in className. Use cn() utility instead.",
            );
          }
        }

        const classText = getClassText(node);
        const classes = classText.split(/\s+/);

        // Dark mode redundancy — semantic tokens use light-dark(), no dark: overrides needed
        const REDUNDANT_DARK_SEMANTIC =
          /(bg|text|border|ring)-(ui-bg|ui-text|ui-border|brand|accent|status|palette|priority|issue-type|landing)/;
        if (classes.some((cls) => cls.startsWith("dark:") && REDUNDANT_DARK_SEMANTIC.test(cls))) {
          reportError(
            filePath,
            node,
            "Redundant dark: prefix on semantic token. All semantic tokens use light-dark() and handle dark mode automatically.",
          );
        }

        // Raw Tailwind colors
        for (const cls of classes) {
          const bare = cls.replace(/^[a-z-]+:/g, "");
          if (RAW_TW_COLORS.test(bare)) {
            reportError(
              filePath,
              node,
              `Raw Tailwind color '${cls}' — use semantic tokens (brand-*, status-*, accent-*, ui-*) instead.`,
            );
          }
        }

        // Shorthands
        for (const cls of classes) {
          if (tailwindShorthandMap[cls]) {
            reportError(
              filePath,
              node,
              `Non-canonical Tailwind class: '${cls}'. Use '${tailwindShorthandMap[cls]}' instead.`,
            );
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".tsx"]) });
  for (const f of files) checkFile(f);

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : null,
    messages: errors,
  };
}
