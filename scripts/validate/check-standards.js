/**
 * CHECK 1: Standards (AST)
 * Typography, className concat, dark mode, raw TW colors, shorthands, font styles
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
    "src/components/Kanban", // Contains complex drag-and-drop logic that uses raw divs
  ];

  // Files/directories where raw <a> tags are allowed (external links, downloads, etc.)
  const ALLOW_RAW_LINKS_PATTERNS = [
    ".test.tsx", // Test files mock elements
    "/AttachmentList.tsx", // Download links
    "/FileAttachments.tsx", // Download links
    "/ApiKeysManager.tsx", // External docs links
    "/PumbleIntegration.tsx", // External integration links
    "/CustomFieldValues.tsx", // URL field type
    "/EventDetailsModal.tsx", // External event links (Google Meet, etc.)
    "/onboarding.tsx", // External link to docs
    "src/components/Landing/", // Landing page navigation (public-facing)
    "src/components/Auth/", // Auth page legal links
  ];

  // Files where <strong> for inline emphasis is allowed (inside Typography)
  // These use <strong> for semantic emphasis within text, which is valid HTML
  const ALLOW_INLINE_STRONG_FILES = [
    "/ActivityFeed.tsx", // User names in activity messages
    "/RecentActivity.tsx", // User names in activity messages
    "/Greeting.tsx", // Emphasized counts and names
    "/FocusZone.tsx", // Emphasized text
    "/MemberOnboarding.tsx", // Emphasized text in onboarding
    "/ApiKeysManager.tsx", // Emphasized warnings
    "/HourComplianceDashboard.tsx", // Emphasized data
    "/EmailVerificationRequired.tsx", // Emphasized email
    "/ResetPasswordForm.tsx", // Emphasized email
    "/forgot-password.tsx", // Emphasized email
    "/invite.$token.tsx", // Emphasized names
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

  // Font-related classes that should only be used in UI components
  const FONT_STYLE_PATTERN =
    /^(font-(mono|sans|serif|thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|caption)|leading-|tracking-)$/;

  // Flex item classes that should use FlexItem component
  const FLEX_ITEM_PATTERN =
    /^(flex-(1|auto|initial|none)|grow|grow-0|shrink|shrink-0|self-(auto|start|center|end|stretch|baseline))$/;

  // Elements that should NOT have font styles (use Typography, Badge, etc. instead)
  const RAW_ELEMENTS = new Set([
    "div",
    "span",
    "section",
    "article",
    "aside",
    "header",
    "footer",
    "main",
    "nav",
    "li",
    "ul",
    "ol",
  ]);

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
        // Inline text styling tags — use Typography with appropriate variant
        // Allow <strong> for inline emphasis within text (semantically correct for accessibility)
        if (["strong", "b", "em", "i"].includes(tagName)) {
          const isAllowed = ALLOW_INLINE_STRONG_FILES.some((pattern) => rel.endsWith(pattern));
          if (!isAllowed) {
            const suggestion =
              tagName === "em" || tagName === "i"
                ? `<Typography as="em">` // emphasis
                : `<Typography variant="label"> or <Typography as="strong">`; // importance
            reportError(filePath, node, `Use ${suggestion} instead of raw <${tagName}> tags.`);
          }
        }
        // Raw anchor tags — use Link component or Button with asChild
        // Allow in test files, download links, and files with external links
        if (tagName === "a") {
          const isAllowed = ALLOW_RAW_LINKS_PATTERNS.some(
            (pattern) => rel.endsWith(pattern) || rel.includes(pattern),
          );
          if (!isAllowed) {
            reportError(
              filePath,
              node,
              `Use <Link> component or <Button asChild><a>...</a></Button> instead of raw <a> tags.`,
            );
          }
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

        // Font styles on raw elements — use Typography, Badge, etc. instead
        if (RAW_ELEMENTS.has(tagName)) {
          const classText = getClassNameText(node);
          const classes = classText.split(/\s+/);
          for (const cls of classes) {
            if (FONT_STYLE_PATTERN.test(cls)) {
              reportError(
                filePath,
                node,
                `Font style '${cls}' on raw <${tagName}>. Use Typography, Badge, or other UI components for text styling.`,
              );
              break; // Only report once per element
            }
          }
        }

        // Flex item classes on raw elements — use FlexItem component instead
        if (RAW_ELEMENTS.has(tagName)) {
          const classText = getClassNameText(node);
          const classes = classText.split(/\s+/);
          for (const cls of classes) {
            if (FLEX_ITEM_PATTERN.test(cls)) {
              reportError(
                filePath,
                node,
                `Flex item class '${cls}' on raw <${tagName}>. Use <FlexItem> component instead.`,
              );
              break; // Only report once per element
            }
          }
        }

        // Grid classes on raw elements — use Grid component instead
        if (RAW_ELEMENTS.has(tagName)) {
          const classText = getClassNameText(node);
          const classes = classText.split(/\s+/);
          if (classes.includes("grid")) {
            reportError(
              filePath,
              node,
              `Use <Grid> component instead of <${tagName} className="grid"> for grid layouts.`,
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
