/**
 * CHECK: Icon tone drift
 *
 * Ratchets shared Icon / IconCircle usage toward semantic tone ownership
 * instead of raw literal text-* color classes when the shared primitive
 * already exposes the corresponding tone.
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const SRC_DIR = path.join(ROOT, "src");
const BASELINE_PATH = path.join(ROOT, "scripts", "ci", "icon-tone-drift-baseline.json");
const BASELINE_KEY = "iconToneDriftByFile";
const ICON_IMPORT_PATH = "@/components/ui/Icon";
const ICON_CIRCLE_IMPORT_PATH = "@/components/ui/IconCircle";
const TONE_CLASS_TO_PROP = new Map([
  ["text-ui-text-secondary", "secondary"],
  ["text-ui-text-tertiary", "tertiary"],
  ["text-brand", "brand"],
  ["text-brand-active", "brandActive"],
  ["text-brand-foreground", "brandForeground"],
  ["text-status-success", "success"],
  ["text-status-success-text", "successText"],
  ["text-status-warning", "warning"],
  ["text-status-warning-text", "warningText"],
  ["text-status-error", "error"],
  ["text-status-error-text", "errorText"],
  ["text-status-info", "info"],
  ["text-status-info-text", "infoText"],
  ["text-accent", "accent"],
]);

function isIgnoredFile(rel) {
  return (
    rel.startsWith("src/components/ui/") ||
    rel.startsWith("src/lib/") ||
    rel.includes(".test.") ||
    rel.includes(".spec.") ||
    rel.includes(".stories.")
  );
}

function getImportedPrimitiveLocalNames(sourceFile) {
  const localNames = new Set();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const importPath = statement.moduleSpecifier.text;
    if (importPath !== ICON_IMPORT_PATH && importPath !== ICON_CIRCLE_IMPORT_PATH) continue;

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

    for (const element of namedBindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      if (
        (importPath === ICON_IMPORT_PATH && importedName === "Icon") ||
        (importPath === ICON_CIRCLE_IMPORT_PATH && importedName === "IconCircle")
      ) {
        localNames.add(element.name.text);
      }
    }
  }

  return localNames;
}

function getAttribute(node, name) {
  return node.attributes.properties.find(
    (property) => ts.isJsxAttribute(property) && property.name.getText() === name,
  );
}

function hasToneProp(node) {
  return Boolean(getAttribute(node, "tone"));
}

function getClassNameText(node) {
  const attr = getAttribute(node, "className");
  if (!attr?.initializer) return null;

  if (ts.isStringLiteral(attr.initializer)) {
    return attr.initializer.text;
  }

  if (
    ts.isJsxExpression(attr.initializer) &&
    attr.initializer.expression &&
    (ts.isStringLiteral(attr.initializer.expression) ||
      ts.isNoSubstitutionTemplateLiteral(attr.initializer.expression))
  ) {
    return attr.initializer.expression.text;
  }

  if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
    const expression = attr.initializer.expression;

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

function findSuggestedTone(classNameText) {
  const tokens = classNameText.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const suggestedTone = TONE_CLASS_TO_PROP.get(token);
    if (suggestedTone) {
      return { token, suggestedTone };
    }
  }
  return null;
}

export function run() {
  const baselineByFile = loadCountBaseline(BASELINE_PATH, BASELINE_KEY);
  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  const findingsByFile = {};

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (isIgnoredFile(rel)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    const primitiveLocalNames = getImportedPrimitiveLocalNames(sourceFile);

    if (primitiveLocalNames.size === 0) continue;

    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText();
        if (!primitiveLocalNames.has(tagName) || hasToneProp(node)) {
          ts.forEachChild(node, visit);
          return;
        }

        const classNameText = getClassNameText(node);
        const match = classNameText ? findSuggestedTone(classNameText) : null;
        if (match) {
          const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const bucket = findingsByFile[rel] ?? [];
          bucket.push({
            line: pos.line + 1,
            className: classNameText,
            token: match.token,
            suggestedTone: match.suggestedTone,
          });
          findingsByFile[rel] = bucket;
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  const analysis = analyzeCountRatchet(findingsByFile, baselineByFile);
  const overageEntries = Object.entries(analysis.overagesByKey).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  const messages = [];

  if (overageEntries.length > 0) {
    messages.push(
      `${c.yellow}Shared Icon/IconCircle color overrides should use semantic tone when available (${overageEntries.length} file(s) over baseline):${c.reset}`,
    );
    for (const [file, overage] of overageEntries) {
      for (const finding of overage.overageItems) {
        messages.push(
          `  ${c.dim}${file}:${finding.line}${c.reset} ${finding.token} -> tone="${finding.suggestedTone}"`,
        );
      }
    }
  }

  return {
    passed: overageEntries.length === 0,
    errors: overageEntries.reduce((sum, [, overage]) => sum + overage.overageItems.length, 0),
    detail: `${analysis.totalBaselined} baselined icon tone drift occurrence(s) across ${analysis.activeKeyCount} file(s)`,
    messages,
  };
}
