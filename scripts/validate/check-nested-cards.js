/**
 * CHECK: Nested Card consistency
 * Detects Cards nested inside other Cards that don't use appropriate visual treatment.
 * Nested cards should use:
 * - A recipe (for semantic nesting)
 * - variant="flat" or variant="ghost" (for softer appearance)
 * - radius="md" or smaller (to differentiate from parent)
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Directories to skip entirely
const IGNORE_DIRS = ["src/lib", "src/components/ui"];

// Files with known nested Card issues - baseline to track and fix over time
// These are pre-existing violations; new violations will fail CI
const BASELINE_FILES = new Set([
  "src/components/Admin/IpRestrictionsSettings.tsx",
  "src/components/Admin/UserTypeManager.tsx",
  "src/components/Dashboard/MyIssuesList.tsx",
  "src/components/IssueDependencies.tsx",
  "src/components/LabelsManager.tsx",
  "src/components/Onboarding/OnboardingChecklist.tsx",
  "src/components/PlateEditor.tsx",
  "src/components/ProjectSettings/DangerZone.tsx",
  "src/components/ProjectSettings/LabelSettings.tsx",
  "src/components/ProjectSettings/MemberManagement.tsx",
  "src/components/ProjectSettings/WorkflowSettings.tsx",
  "src/components/Settings/GitHubIntegration.tsx",
  "src/components/Settings/GoogleCalendarIntegration.tsx",
  "src/components/Settings/OfflineTab.tsx",
  "src/components/Settings/ProfileContent.tsx",
  "src/components/Settings/SlackIntegration.tsx",
  "src/components/Settings/TwoFactorSettings.tsx",
  "src/components/TimeTracker/Timesheet.tsx",
  "src/components/TimeTracker.tsx",
  "src/components/Webhooks/WebhookLogs.tsx",
  "src/routes/_auth/_app/$orgSlug/clients/index.tsx",
]);

// Variants that are appropriate for nested cards (softer appearance)
const NESTED_CARD_VARIANTS = new Set(["flat", "ghost", "soft"]);

// Radius values appropriate for nested cards (smaller than default lg)
const NESTED_CARD_RADII = new Set(["none", "sm", "md"]);

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

  /** Extract string value from a JSX attribute */
  function getAttributeValue(node, attrName) {
    const attr = node.attributes.properties.find(
      (p) => ts.isJsxAttribute(p) && p.name.getText() === attrName,
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
    return null;
  }

  /** Check if a JSX attribute exists (regardless of value) */
  function hasAttribute(node, attrName) {
    return node.attributes.properties.some(
      (p) => ts.isJsxAttribute(p) && p.name.getText() === attrName,
    );
  }

  /** Check if a nested Card has appropriate visual differentiation */
  function hasNestedCardTreatment(jsxNode) {
    const variant = getAttributeValue(jsxNode, "variant");
    const radius = getAttributeValue(jsxNode, "radius");
    const hasRecipe = hasAttribute(jsxNode, "recipe");

    if (hasRecipe) return true;
    if (variant && NESTED_CARD_VARIANTS.has(variant)) return true;
    if (radius && NESTED_CARD_RADII.has(radius)) return true;
    return false;
  }

  function checkFile(filePath) {
    const rel = relPath(filePath);

    // Skip ignored directories
    if (IGNORE_DIRS.some((d) => rel.startsWith(d))) return;

    // Skip baselined files (existing violations tracked separately)
    if (BASELINE_FILES.has(rel)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node, cardDepth = 0) {
      // Handle JsxElement (opening + children + closing)
      if (ts.isJsxElement(node)) {
        const opening = node.openingElement;
        const tagName = opening.tagName.getText();

        if (tagName === "Card") {
          // Check if this Card is nested
          if (cardDepth > 0 && !hasNestedCardTreatment(opening)) {
            reportError(
              filePath,
              opening,
              `Nested Card without visual differentiation. Use recipe, variant="flat|ghost|soft", or radius="md|sm|none".`,
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

        if (tagName === "Card" && cardDepth > 0 && !hasNestedCardTreatment(node)) {
          reportError(
            filePath,
            node,
            `Nested Card without visual differentiation. Use recipe, variant="flat|ghost|soft", or radius="md|sm|none".`,
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
