/**
 * CHECK: Control chrome drift audit
 *
 * Blocking audit for feature code that restyles owned interactive
 * primitives with raw chrome classes instead of extending the primitive or
 * adding a variant.
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const SRC_DIR = path.join(ROOT, "src");
const TARGET_COMPONENTS = new Set(["Button", "Badge", "Input", "Textarea", "TabsTrigger"]);
const CHROME_OVERRIDE_PATTERN =
  /\b(?:rounded(?:-[^\s"'`}]*)?|shadow(?:-[^\s"'`}]*)?|border(?:-[^\s"'`}]*)?|ring(?:-[^\s"'`}]*)?|outline(?:-[^\s"'`}]*)?|bg-[^\s"'`}]*)\b|\b(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)|font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|(?:h|min-h|px|py|pl|pr|pt|pb)-[^\s"'`}]*)\b/;

function isIgnoredFile(rel) {
  return (
    rel.startsWith("src/components/ui/") ||
    rel.startsWith("src/lib/") ||
    rel.includes(".test.") ||
    rel.includes(".spec.") ||
    rel.includes(".stories.")
  );
}

function getClassNameText(node) {
  const attr = node.attributes.properties.find(
    (property) => ts.isJsxAttribute(property) && property.name.getText() === "className",
  );

  if (!attr?.initializer) return null;

  if (ts.isStringLiteral(attr.initializer)) {
    return attr.initializer.text;
  }

  if (
    ts.isJsxExpression(attr.initializer) &&
    attr.initializer.expression &&
    ts.isStringLiteral(attr.initializer.expression)
  ) {
    return attr.initializer.expression.text;
  }

  if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
    const expression = attr.initializer.expression;

    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
      return expression.text;
    }

    if (
      ts.isCallExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === "cn"
    ) {
      return expression.arguments
        .filter((arg) => ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))
        .map((arg) => arg.text)
        .join(" ");
    }
  }

  return null;
}

export function run() {
  const findings = [];
  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (isIgnoredFile(rel)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const componentName = node.tagName.getText();
        if (TARGET_COMPONENTS.has(componentName)) {
          const classNameText = getClassNameText(node);
          if (classNameText && CHROME_OVERRIDE_PATTERN.test(classNameText)) {
            const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            findings.push({
              componentName,
              file: rel,
              line: pos.line + 1,
              className: classNameText,
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  const messages = [];
  if (findings.length > 0) {
    messages.push(
      `${c.yellow}Owned controls restyled with raw chrome/state classes (${findings.length}):${c.reset}`,
    );
    for (const finding of findings.slice(0, 40)) {
      messages.push(
        `  ${c.dim}${finding.file}:${finding.line}${c.reset} <${finding.componentName} className="${finding.className}">`,
      );
    }
    if (findings.length > 40) {
      messages.push(`  ${c.dim}... ${findings.length - 40} more${c.reset}`);
    }
  }

  return {
    passed: findings.length === 0,
    errors: findings.length,
    detail:
      findings.length > 0
        ? `${findings.length} control chrome drift finding(s)`
        : "no control chrome drift found",
    messages,
  };
}
