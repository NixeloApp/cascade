/**
 * CHECK 1: Standards (AST)
 * Typography, className concat, dark mode, raw TW colors, shorthands, font styles,
 * raw form elements (input/select/textarea/button)
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// ============================================================================
// Configuration
// ============================================================================

const IGNORE_DIRS = ["src/lib", "src/components/ui", "src/components/Calendar/shadcn-calendar"];

// Files/directories where raw <a> tags are allowed
// NOTE: <a> inside <Button asChild> is automatically allowed by the validator
const ALLOW_RAW_LINKS_PATTERNS = [
  ".test.tsx",
  "/FileAttachments.tsx",
  "/CustomFieldValues.tsx",
  "/EventDetailsModal.tsx",
  "/onboarding.tsx",
  "/CommentRenderer.tsx",
  "/LinkElement.tsx",
  "src/components/Landing/",
  "src/routes/_auth/_app/$orgSlug/route.tsx",
];

// Files where <strong>/<em> for inline emphasis is allowed
// Only CommentRenderer needs this (renders user-authored markdown)
const ALLOW_INLINE_STRONG_FILES = ["/CommentRenderer.tsx"];

// Raw Tailwind color pattern
const RAW_TW_COLORS =
  /\b(?:bg|text|border|ring|shadow|divide|outline|fill|stroke|from|to|via|decoration|placeholder|caret)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/;

// Non-canonical Tailwind shorthands
const TAILWIND_SHORTHAND_MAP = {
  "flex-shrink-0": "shrink-0",
  "flex-shrink": "shrink",
  "flex-grow-0": "grow-0",
  "flex-grow": "grow",
};

// Font-related classes that should only be in UI components
const FONT_STYLE_PATTERN =
  /^(font-(mono|sans|serif|thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|caption)|leading-|tracking-)$/;

// Flex item classes that should use FlexItem component
const FLEX_ITEM_PATTERN =
  /^(flex-(1|auto|initial|none)|grow|grow-0|shrink|shrink-0|self-(auto|start|center|end|stretch|baseline))$/;

// Elements that should NOT have font/flex styles (use Typography, FlexItem, etc.)
const RAW_ELEMENTS = new Set(["div", "span", "li", "ul", "ol"]);

// ============================================================================
// Helpers
// ============================================================================

/** Get string value from a JSX attribute */
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

/** Get className string from a JSX element */
function getClassNameText(node) {
  return getAttributeValue(node, "className") || "";
}

/** Get static className text from a JSX attribute, including cn("...") literals */
function getStaticClassNameTextFromAttribute(attribute) {
  if (!attribute?.initializer) return "";

  if (ts.isStringLiteral(attribute.initializer)) {
    return attribute.initializer.text;
  }

  if (
    ts.isJsxExpression(attribute.initializer) &&
    attribute.initializer.expression &&
    ts.isStringLiteral(attribute.initializer.expression)
  ) {
    return attribute.initializer.expression.text;
  }

  if (
    ts.isJsxExpression(attribute.initializer) &&
    attribute.initializer.expression &&
    ts.isCallExpression(attribute.initializer.expression) &&
    ts.isIdentifier(attribute.initializer.expression.expression) &&
    attribute.initializer.expression.expression.text === "cn"
  ) {
    return attribute.initializer.expression.arguments
      .filter((arg) => ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))
      .map((arg) => arg.text)
      .join(" ");
  }

  return "";
}

/** Check if file matches any pattern in list */
function matchesPattern(rel, patterns) {
  return patterns.some((pattern) => rel.endsWith(pattern) || rel.includes(pattern));
}

/** Check if file is a test file */
function isTestFile(rel) {
  return rel.includes(".test.tsx") || rel.includes(".spec.tsx");
}

/** Check if file is in ui/ directory */
function isUiFile(rel) {
  return rel.includes("src/components/ui/");
}

/** Check if file is a route file */
function isRouteFile(rel) {
  return rel.startsWith("src/routes/");
}

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

    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node, ancestors = []) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText();
        const classNameAttr = node.attributes.properties.find(
          (property) => ts.isJsxAttribute(property) && property.name.getText() === "className",
        );

        // ── Typography tags ──
        if (["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
          reportError(filePath, node, `Use <Typography> instead of raw <${tagName}>.`);
        }

        // ── Inline styling tags ──
        if (["strong", "b", "em", "i"].includes(tagName)) {
          if (!matchesPattern(rel, ALLOW_INLINE_STRONG_FILES)) {
            const suggestion =
              tagName === "em" || tagName === "i"
                ? `<Typography as="em">`
                : `<Typography variant="label"> or <Typography as="strong">`;
            reportError(filePath, node, `Use ${suggestion} instead of raw <${tagName}>.`);
          }
        }

        // ── Raw button ──
        if (tagName === "button" && !isTestFile(rel)) {
          reportError(filePath, node, `Use <Button> instead of raw <button>.`);
        }

        // ── Raw select ──
        if (tagName === "select" && !isTestFile(rel)) {
          reportError(filePath, node, `Use <Select> from ui/ instead of raw <select>.`);
        }

        // ── Raw input ──
        if (tagName === "input") {
          const typeValue = getAttributeValue(node, "type");
          const isFileInput = typeValue === "file";
          if (!isFileInput && !isTestFile(rel) && !isUiFile(rel)) {
            reportError(filePath, node, `Use <Input> from ui/ instead of raw <input>.`);
          }
        }

        // ── Raw textarea ──
        if (tagName === "textarea" && !isTestFile(rel) && !isUiFile(rel)) {
          reportError(filePath, node, `Use <Textarea> from ui/ instead of raw <textarea>.`);
        }

        // ── Raw anchor ──
        if (tagName === "a") {
          const isInsideButtonAsChild = ancestors.some((ancestor) => {
            if (ts.isJsxElement(ancestor)) {
              const opening = ancestor.openingElement;
              if (opening.tagName.getText() !== "Button") return false;
              return opening.attributes.properties.some(
                (p) => ts.isJsxAttribute(p) && p.name.getText() === "asChild",
              );
            }
            return false;
          });

          if (!isInsideButtonAsChild && !matchesPattern(rel, ALLOW_RAW_LINKS_PATTERNS)) {
            reportError(
              filePath,
              node,
              `Use <Link> for internal routes or <Button asChild> for styled links.`,
            );
          }
        }

        // ── Flex on div/span ──
        if (tagName === "div" || tagName === "span") {
          const classes = getClassNameText(node).split(/\s+/);
          if (classes.includes("flex") || classes.includes("inline-flex")) {
            reportError(filePath, node, `Use <Flex> instead of <${tagName} className="flex">.`);
          }
        }

        // ── Font styles on raw elements ──
        if (RAW_ELEMENTS.has(tagName)) {
          const classes = getClassNameText(node).split(/\s+/);
          for (const cls of classes) {
            if (FONT_STYLE_PATTERN.test(cls)) {
              reportError(
                filePath,
                node,
                `Font style '${cls}' on raw <${tagName}>. Use Typography or Badge.`,
              );
              break;
            }
          }
        }

        // ── Flex item classes on raw elements ──
        if (RAW_ELEMENTS.has(tagName)) {
          const classes = getClassNameText(node).split(/\s+/);
          for (const cls of classes) {
            if (FLEX_ITEM_PATTERN.test(cls)) {
              reportError(
                filePath,
                node,
                `Flex item '${cls}' on raw <${tagName}>. Use <FlexItem>.`,
              );
              break;
            }
          }
        }

        // ── Grid on raw elements ──
        if (RAW_ELEMENTS.has(tagName)) {
          const classes = getClassNameText(node).split(/\s+/);
          if (classes.includes("grid")) {
            reportError(filePath, node, `Use <Grid> instead of <${tagName} className="grid">.`);
          }
        }

        // ── Page-level layout misuse ──
        if (tagName === "PageLayout" && isRouteFile(rel) && classNameAttr) {
          const classNameText = getStaticClassNameTextFromAttribute(classNameAttr);
          const classes = classNameText.split(/\s+/).filter(Boolean);
          if (
            classes.some((cls) => cls === "mx-auto" || cls.startsWith("max-w-") || cls === "w-full")
          ) {
            reportError(
              filePath,
              node,
              "PageLayout owns outer width and centering. Use the maxWidth prop instead of className shell overrides.",
            );
          }
        }
      }

      // ── className attribute checks ──
      if (ts.isJsxAttribute(node) && node.name.getText() === "className") {
        // String concatenation
        if (node.initializer && ts.isJsxExpression(node.initializer)) {
          const expr = node.initializer.expression;
          if (expr && (ts.isTemplateExpression(expr) || ts.isBinaryExpression(expr))) {
            reportError(filePath, node, "Use cn() instead of manual className concatenation.");
          }
        }

        const classText =
          node.initializer && ts.isStringLiteral(node.initializer)
            ? node.initializer.text
            : node.initializer &&
                ts.isJsxExpression(node.initializer) &&
                node.initializer.expression &&
                ts.isStringLiteral(node.initializer.expression)
              ? node.initializer.expression.text
              : "";
        const classes = classText.split(/\s+/);

        // Redundant dark: on semantic tokens
        const REDUNDANT_DARK_SEMANTIC =
          /(bg|text|border|ring)-(ui-bg|ui-text|ui-border|brand|accent|status|palette|priority|issue-type|landing)/;
        if (classes.some((cls) => cls.startsWith("dark:") && REDUNDANT_DARK_SEMANTIC.test(cls))) {
          reportError(
            filePath,
            node,
            "Redundant dark: on semantic token. Semantic tokens handle dark mode automatically.",
          );
        }

        // Raw Tailwind colors
        for (const cls of classes) {
          const bare = cls.replace(/^[a-z-]+:/g, "");
          if (RAW_TW_COLORS.test(bare)) {
            reportError(filePath, node, `Raw Tailwind color '${cls}'. Use semantic tokens.`);
          }
        }

        // Non-canonical shorthands
        for (const cls of classes) {
          if (TAILWIND_SHORTHAND_MAP[cls]) {
            reportError(
              filePath,
              node,
              `Use '${TAILWIND_SHORTHAND_MAP[cls]}' instead of '${cls}'.`,
            );
          }
        }
      }

      // Track ancestors for Button asChild check
      const updatedAncestors =
        ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)
          ? [...ancestors, node]
          : ancestors;
      ts.forEachChild(node, (child) => visit(child, updatedAncestors));
    }

    visit(sourceFile, []);
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
