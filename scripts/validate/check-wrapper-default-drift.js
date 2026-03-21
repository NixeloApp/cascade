/**
 * CHECK: Wrapper default drift audit
 *
 * Blocking audit for shared UI wrappers that redundantly restate a primitive's
 * own default prop value instead of letting the primitive own that fallback.
 *
 * Initial narrow scope:
 * - Typography color="auto"
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const UI_DIR = path.join(ROOT, "src/components/ui");

const TARGET_RULES = [
  {
    componentName: "Typography",
    attributeName: "color",
    defaultValue: "auto",
    primitiveLabel: "Typography.color",
  },
];

function isIgnoredFile(rel) {
  return rel.includes(".test.") || rel.includes(".spec.") || rel.includes(".stories.");
}

function getJsxAttributeContext(identifier) {
  const jsxExpression = identifier.parent;
  if (!jsxExpression || !ts.isJsxExpression(jsxExpression)) return null;

  const attribute = jsxExpression.parent;
  if (!attribute || !ts.isJsxAttribute(attribute)) return null;

  const element = attribute.parent?.parent;
  if (!element) return null;

  if (ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element)) {
    return {
      componentName: element.tagName.getText(),
      attributeName: attribute.name.text,
    };
  }

  return null;
}

function collectIdentifierUsages(body, identifierName) {
  const usages = [];

  function visit(node) {
    if (ts.isIdentifier(node) && node.text === identifierName) {
      usages.push(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(body);
  return usages;
}

function getFunctionName(node) {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name.text;
  if (ts.isFunctionExpression(node) && node.name) return node.name.text;

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (parent && ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
  }

  return null;
}

function getMatchingRule(bindingElement) {
  if (!bindingElement.initializer || !ts.isStringLiteral(bindingElement.initializer)) {
    return null;
  }

  const defaultValue = bindingElement.initializer.text;
  return TARGET_RULES.find((rule) => rule.defaultValue === defaultValue) ?? null;
}

export function run() {
  const findings = [];
  const files = walkDir(UI_DIR, { extensions: new Set([".ts", ".tsx"]) });

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (isIgnoredFile(rel)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node) {
      if (
        (ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node)) &&
        node.body &&
        node.parameters.length > 0
      ) {
        const [firstParam] = node.parameters;
        if (ts.isObjectBindingPattern(firstParam.name)) {
          const functionName = getFunctionName(node) ?? "<anonymous>";

          for (const element of firstParam.name.elements) {
            if (!ts.isBindingElement(element) || !ts.isIdentifier(element.name)) continue;

            const rule = getMatchingRule(element);
            if (!rule) continue;

            const propName = element.name.text;
            const usages = collectIdentifierUsages(node.body, propName);
            if (usages.length === 0) continue;

            const isRedundantPassthrough = usages.every((usage) => {
              const context = getJsxAttributeContext(usage);
              return (
                context?.componentName === rule.componentName &&
                context.attributeName === rule.attributeName
              );
            });

            if (isRedundantPassthrough) {
              const pos = sourceFile.getLineAndCharacterOfPosition(element.getStart());
              findings.push({
                file: rel,
                line: pos.line + 1,
                functionName,
                propName,
                primitiveLabel: rule.primitiveLabel,
                defaultValue: rule.defaultValue,
              });
            }
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
      `${c.yellow}Shared wrappers restating primitive defaults (${findings.length}):${c.reset}`,
    );
    for (const finding of findings) {
      messages.push(
        `  ${c.dim}${finding.file}:${finding.line}${c.reset} ${finding.functionName}() sets ${finding.propName}="${finding.defaultValue}" but only forwards it to ${finding.primitiveLabel}; let the primitive own that default`,
      );
    }
  }

  return {
    passed: findings.length === 0,
    errors: findings.length,
    detail:
      findings.length > 0
        ? `${findings.length} redundant wrapper default(s)`
        : "no redundant wrapper defaults found",
    messages,
  };
}
