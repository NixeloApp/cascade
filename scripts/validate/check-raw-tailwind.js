/**
 * CHECK: Raw Tailwind
 * Flags raw Tailwind classes outside allowed directories.
 * Also checks for component prop misuse (gap/spacing in className instead of props).
 * Part of Phase 7: Zero Raw Tailwind enforcement.
 *
 * @strictness STRICT - Blocks CI. ~40 files/dirs in allowlist for edge cases.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC = path.join(ROOT, "src/components");

  // Directories/patterns where raw Tailwind is allowed
  // These contain internal UI components or are complex enough to warrant raw TW
  const ALLOWED_DIRS = [
    "src/components/ui/",
    "src/components/Landing/",
    "src/components/Kanban/",
    "src/components/Calendar/",
    "src/components/Auth/",
    "src/components/Editor/",
    "src/components/AI/",
    "src/components/Sidebar/",
    "src/components/Plate/",
    "src/components/Onboarding/",
    "src/components/Admin/", // Tables with semantic HTML (td/th padding)
    "src/components/Settings/", // Form-heavy with input styling
    "src/components/TimeTracking/", // Complex forms and tables
    "src/components/TimeTracker/", // Time entry components
    "src/components/IssueDetail/", // Issue detail components (consolidated)
    "src/components/ProjectSettings/", // Settings forms
    "src/components/FuzzySearch/", // Search dropdowns with custom styling
    "src/components/ImportExport/", // Import/export UI
    "src/components/Fields/", // Custom field forms
    "src/components/Templates/", // Template forms
    "src/components/AdvancedSearchModal/", // Search results
    "src/components/Analytics/", // Dashboard components
    "src/components/Automation/", // Automation forms
    "src/components/Dashboard/", // Dashboard widgets
  ];

  // Individual files with edge case patterns (responsive, semantic HTML, etc.)
  const ALLOWED_FILES = [
    "/AppSidebar.tsx", // Contains NavItem, CollapsibleSection internal components
    "/AppHeader.tsx", // Navigation header with internal components
    "/PortalProjectView.tsx", // Client portal layout
    "/PortalTimeline.tsx", // Client portal timeline
    "/BulkOperationsBar.tsx", // Responsive layout patterns
    "/CommandPalette.tsx", // Keyboard shortcut styling
    "/CreateIssueModal.tsx", // Inline label creation popover
    "/CommentReactions.tsx", // Popover overrides
    "/CommentRenderer.tsx", // Inline markdown code element styling
    "/CreateProjectFromTemplate.tsx", // Responsive button layout
    "/Dashboard.tsx", // Main dashboard with decorative gradients and complex layout
    "/DocumentHeader.tsx", // Header with breadcrumbs
    "/DocumentSidebar.tsx", // Sidebar with TOC and info sections
    "/DocumentTemplatesManager.tsx", // Template cards with gradients
    "/FilterBar.tsx", // Filter dropdowns
    "/GlobalSearch.tsx", // Search modal
    "/ImportExportModal.tsx", // flex-1 on Button components
    "/InboxList.tsx", // TabsContent styling
    "/InvoiceEditor.tsx", // CardContent spacing with space-y-4
    "/InvoicePdfTemplate.tsx", // CardContent spacing with space-y-4
    "/IssueCard.tsx", // Responsive card layout
    "/IssueComments.tsx", // Button asChild with inline-flex pattern
    "/IssueDependencies.tsx", // min-w-0 truncation pattern
    "/IssueDetailSheet.tsx", // Sheet panel styling
    "/IssuesCalendarView.tsx", // Calendar grid styling
    "/KanbanBoard.tsx", // Board columns with specific widths
    "/KeyboardShortcutsHelp.tsx", // kbd element styling
    "/DocumentTree.tsx", // Tree expand/collapse button (p-0.5 h-5 w-5)
    "/LabelsManager.tsx", // Inline link button styling (p-0 h-auto)
    "/layout/PageHeader.tsx", // Responsive header layout with Typography size overrides
    "/MentionInput.tsx", // Dropdown positioning
    "/NotificationCenter.tsx", // Popover with badge positioning
    "/NotificationItem.tsx", // Link with flex styling
    "/PlateEditor.tsx", // Document editor with sidebar layout
    "/ProjectsList.tsx", // Project avatar styling
    "/RoadmapView.tsx", // Timeline/roadmap styling
    "/SprintManager.tsx", // Progress bars, responsive layout
    "/SprintProgressBar.tsx", // Progress bar styling
    "/SprintWorkload.tsx", // Popover with assignee breakdown
    "/TimeTracker.tsx", // Time element styling
    "/UserActivityFeed.tsx", // Empty state with rounded border styling
    "/UserMenu.tsx", // Dropdown menu styling
    "/UserProfile.tsx", // Dialog overrides
    "/VersionHistory.tsx", // Dialog with flex layout
  ];

  // File extensions to always allow
  const ALLOWED_EXTENSIONS = [".stories.tsx", ".test.tsx", ".example.tsx"];

  // Patterns that should use CVA components instead
  const RAW_PATTERNS = [
    { pattern: /className=.*\bflex\b/, replacement: "<Flex>" },
    { pattern: /className=.*\binline-flex\b/, replacement: "<Flex inline>" },
    { pattern: /\bgrid\b/, replacement: "<Grid>" },
    { pattern: /\bgap-\d+/, replacement: "<Flex gap='...'>" },
    { pattern: /\bp-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bpx-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bpy-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bspace-y-\d+/, replacement: "<Stack gap='...'>" },
    { pattern: /\bspace-x-\d+/, replacement: "<Flex gap='...'>" },
    { pattern: /\brounded-(?!none|full)/, replacement: "<Card>" },
    { pattern: /\btext-(?:xs|sm|base|lg|xl|\d)/, replacement: "<Typography>" },
    {
      pattern: /\bfont-(?:thin|light|normal|medium|semibold|bold)/,
      replacement: "<Typography>",
    },
  ];

  const violations = [];
  const recipeViolations = [];

  const RECIPE_ENFORCEMENT_FILES = [
    "/AppHeader.tsx",
    "/GlobalSearch.tsx",
    "/KeyboardShortcutsHelp.tsx",
    "/AdvancedSearchModal.tsx",
    "/Landing/HeroSection.tsx",
    "/Landing/ProductShowcase.tsx",
    "/NotificationCenter.tsx",
    "/TimerWidget.tsx",
    "/DocumentHeader.tsx",
  ];

  const RECIPE_ESCAPE_HATCHES = [
    "cardVariants(",
    "cardRecipeVariants(",
    "buttonVariants(",
    "buttonChromeVariants(",
    "tabsTriggerVariants(",
    "tabsListVariants(",
    "chromeButtonVariants(",
    'chrome="', // Button chrome prop
    "chrome='", // Button chrome prop (single quote)
    'variant="', // Component variant prop
    "variant='", // Component variant prop (single quote)
  ];

  const LEGACY_RECIPE_IMPORT_PATTERN = /^\s*import\s+.*\bsurfaceRecipes\b.*$/m;

  const RECIPE_TOKEN_PATTERNS = {
    background: /\bbg-(?!transparent)\S+/,
    border: /\bborder(?:-[^"'\s}]+)?/,
    radius: /\brounded(?:-[^"'\s}]+)?/,
    shadow: /\bshadow(?:-[^"'\s}]+)?/,
    spacing: /\b(?:p|px|py|pt|pr|pb|pl)-\d/,
    typography:
      /\b(?:text-(?:xs|sm|base|lg|xl|\d)|font-(?:thin|light|normal|medium|semibold|bold)|tracking-(?:tight|tighter|wide|wider|widest))/,
  };

  function isAllowed(filePath) {
    const rel = relPath(filePath);
    // Check allowed directories
    if (ALLOWED_DIRS.some((dir) => rel.includes(dir))) return true;
    // Check allowed individual files
    if (ALLOWED_FILES.some((file) => rel.endsWith(file))) return true;
    // Check allowed extensions
    if (ALLOWED_EXTENSIONS.some((ext) => rel.endsWith(ext))) return true;
    return false;
  }

  function checkFile(filePath) {
    if (isAllowed(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rel = relPath(filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("className")) continue;

      for (const { pattern, replacement } of RAW_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: rel,
            line: i + 1,
            pattern: pattern.toString(),
            replacement,
            snippet: line.trim().slice(0, 80),
          });
          break; // One violation per line is enough
        }
      }
    }
  }

  const files = walkDir(SRC, { extensions: new Set([".tsx"]) });
  for (const f of files) checkFile(f);

  function countRecipeTokens(text) {
    return Object.values(RECIPE_TOKEN_PATTERNS).filter((pattern) => pattern.test(text)).length;
  }

  /**
   * Find the opening tag that contains a className at the given line index.
   * Returns the full tag text from < to > (may span multiple lines).
   */
  function findOpeningTag(lines, classNameLineIndex) {
    // Search backward to find the opening <
    let tagContent = "";

    for (let j = classNameLineIndex; j >= Math.max(0, classNameLineIndex - 10); j--) {
      const line = lines[j];
      tagContent = line + " " + tagContent;
      if (line.includes("<")) {
        break;
      }
    }

    // Search forward to find the closing > of the opening tag
    for (let j = classNameLineIndex; j < Math.min(lines.length, classNameLineIndex + 10); j++) {
      if (j > classNameLineIndex) {
        tagContent += " " + lines[j];
      }
      // Check for end of opening tag (> but not /> or ><)
      if (lines[j].includes(">")) {
        break;
      }
    }

    return tagContent;
  }

  /**
   * Collect the full className attribute span, which may span multiple lines.
   * Returns the concatenated text and the ending line index.
   */
  function collectClassNameSpan(lines, startIndex) {
    let span = lines[startIndex];
    let endIndex = startIndex;

    // Quick check: if the line has balanced quotes/braces, it's single-line
    const openBraces = (span.match(/\{/g) || []).length;
    const closeBraces = (span.match(/\}/g) || []).length;
    const openParens = (span.match(/\(/g) || []).length;
    const closeParens = (span.match(/\)/g) || []).length;

    // If braces/parens are unbalanced, collect more lines
    if (openBraces !== closeBraces || openParens !== closeParens) {
      let braceCount = openBraces - closeBraces;
      let parenCount = openParens - closeParens;

      for (let j = startIndex + 1; j < lines.length && j < startIndex + 20; j++) {
        const nextLine = lines[j];
        span += " " + nextLine;
        endIndex = j;

        braceCount += (nextLine.match(/\{/g) || []).length;
        braceCount -= (nextLine.match(/\}/g) || []).length;
        parenCount += (nextLine.match(/\(/g) || []).length;
        parenCount -= (nextLine.match(/\)/g) || []).length;

        if (braceCount <= 0 && parenCount <= 0) break;
      }
    }

    return { span, endIndex };
  }

  function checkRecipeEnforcement(filePath) {
    const rel = relPath(filePath);
    if (!RECIPE_ENFORCEMENT_FILES.some((file) => rel.endsWith(file))) {
      return;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    const legacyMatch = content.match(LEGACY_RECIPE_IMPORT_PATTERN);
    if (legacyMatch && legacyMatch.index != null) {
      recipeViolations.push({
        file: rel,
        line: content.slice(0, legacyMatch.index).split("\n").length,
        replacement: "move legacy surfaceRecipes usage into Card/Button/Dialog recipe props",
      });
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("className")) continue;

      // Collect the full className span (may be multiline)
      const { span, endIndex } = collectClassNameSpan(lines, i);

      // Find the current opening tag to check for escape hatch props
      const tagText = findOpeningTag(lines, i);

      // Skip if any escape hatch token is present in the span or tag
      if (RECIPE_ESCAPE_HATCHES.some((token) => span.includes(token) || tagText.includes(token))) {
        i = endIndex; // Skip to end of this span
        continue;
      }

      const tokenCount = countRecipeTokens(span);
      if (tokenCount < 4) {
        i = endIndex; // Skip to end of this span
        continue;
      }

      recipeViolations.push({
        file: rel,
        line: i + 1,
        replacement:
          "extract to Card/Button/Dialog recipe APIs or cardRecipeVariants/buttonChromeVariants",
      });

      i = endIndex; // Skip to end of this span to avoid duplicate reports
    }
  }

  for (const f of files) checkRecipeEnforcement(f);

  // === Component Prop Misuse Check ===
  // Detects when components use className with spacing classes instead of props
  // This applies to ALL files, including allowed dirs, since it's about prop consistency
  // Gap class to prop mapping (based on Flex/Stack gapClasses)
  // Values > 8 have no direct prop and require custom className
  const GAP_MAP = {
    0: "none",
    1: "xs",
    2: "sm",
    3: "md",
    4: "lg",
    6: "xl",
    8: "2xl",
    // Values 5, 7, 9+ have no direct prop equivalent
  };

  const COMPONENT_PROP_PATTERNS = [
    // Flex with gap classes instead of gap prop
    // Excludes responsive variants (sm:gap-4, md:gap-4, etc.) since those need className
    // Excludes cases where component already has gap prop (responsive override pattern)
    // Only matches whole numbers (gap-2, gap-4) not decimals (gap-0.5, gap-1.5)
    {
      pattern: /<Flex(?![^>]*\bgap=)[^>]*className=["'][^"']*(?<![a-z]:)\bgap-(\d+)(?!\.)\b/,
      component: "Flex",
      prop: "gap",
    },
    // Stack with gap classes instead of gap prop
    {
      pattern: /<Stack(?![^>]*\bgap=)[^>]*className=["'][^"']*(?<![a-z]:)\bgap-(\d+)(?!\.)\b/,
      component: "Stack",
      prop: "gap",
    },
    // Flex with space-x instead of gap prop
    {
      pattern: /<Flex(?![^>]*\bgap=)[^>]*className=["'][^"']*(?<![a-z]:)\bspace-x-(\d+)(?!\.)\b/,
      component: "Flex",
      prop: "gap",
    },
    // Stack with space-y instead of gap prop
    {
      pattern: /<Stack(?![^>]*\bgap=)[^>]*className=["'][^"']*(?<![a-z]:)\bspace-y-(\d+)(?!\.)\b/,
      component: "Stack",
      prop: "gap",
    },
    // Flex with align classes instead of align prop
    {
      pattern:
        /<Flex(?![^>]*\balign=)[^>]*className=["'][^"']*(?<![a-z]:)\bitems-(start|center|end|stretch|baseline)\b/,
      component: "Flex",
      prop: "align",
      tokenType: "align",
    },
    // Flex with justify classes instead of justify prop
    {
      pattern:
        /<Flex(?![^>]*\bjustify=)[^>]*className=["'][^"']*(?<![a-z]:)\bjustify-(start|center|end|between|around|evenly)\b/,
      component: "Flex",
      prop: "justify",
      tokenType: "justify",
    },
    // Flex with direction classes instead of direction prop
    {
      pattern: /<Flex(?![^>]*\bdirection=)[^>]*className=["'][^"']*(?<![a-z]:)\bflex-(row|col)\b/,
      component: "Flex",
      prop: "direction",
      tokenType: "direction",
    },
    // Stack with items-* should use align prop
    {
      pattern:
        /<Stack(?![^>]*\balign=)[^>]*className=["'][^"']*(?<![a-z]:)\bitems-(start|center|end|stretch)\b/,
      component: "Stack",
      prop: "align",
      tokenType: "align",
    },
    // Stack should not use justify-* (no justify prop on Stack)
    {
      pattern:
        /<Stack[^>]*className=["'][^"']*(?<![a-z]:)\bjustify-(start|center|end|between|around|evenly)\b/,
      component: "Stack",
      prop: "justify",
      tokenType: "stack-unsupported-justify",
    },
  ];

  const propViolations = [];

  function checkComponentProps(filePath) {
    // Skip test and story files
    if (filePath.endsWith(".test.tsx") || filePath.endsWith(".stories.tsx")) return;
    // Skip ui/ directory (these are the component definitions themselves)
    const rel = relPath(filePath);
    if (rel.includes("src/components/ui/")) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip if no className in this line
      if (!line.includes("className")) continue;

      for (const { pattern, component, prop, tokenType } of COMPONENT_PROP_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          let replacement = "";

          if (tokenType === "gap" || !tokenType) {
            const num = Number.parseInt(match[1], 10);
            const propValue = GAP_MAP[num];
            if (propValue) {
              replacement = `<${component} ${prop}="${propValue}">`;
            } else {
              // No direct prop equivalent - keep as className but note it
              replacement = `gap-${num} has no prop (max: 2xl=gap-8)`;
            }
          } else if (tokenType === "align") {
            replacement = `<${component} ${prop}="${match[1]}">`;
          } else if (tokenType === "justify") {
            replacement = `<${component} ${prop}="${match[1]}">`;
          } else if (tokenType === "direction") {
            const directionValue = match[1] === "col" ? "column" : "row";
            replacement = `<${component} ${prop}="${directionValue}">`;
          } else if (tokenType === "stack-unsupported-justify") {
            replacement =
              'Stack does not support justify-*; use <Flex direction="column" justify="..."> or a wrapper';
          }
          propViolations.push({
            file: rel,
            line: i + 1,
            replacement,
            snippet: line.trim().slice(0, 80),
          });
          break; // One violation per line is enough
        }
      }
    }
  }

  for (const f of files) checkComponentProps(f);

  const messages = [];

  // Raw Tailwind violations (errors - block CI)
  if (violations.length > 0) {
    messages.push(`${c.red}Raw Tailwind violations:${c.reset}`);
    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 3)) {
        messages.push(`    ${c.dim}L${item.line}${c.reset} → use ${item.replacement}`);
      }
      if (items.length > 3) {
        messages.push(`    ${c.dim}... and ${items.length - 3} more${c.reset}`);
      }
    }
  }

  // Component prop violations (warnings for now - track but don't block)
  if (propViolations.length > 0) {
    if (messages.length > 0) messages.push(""); // Add spacing
    messages.push(`${c.yellow}Component prop misuse (use props instead of className):${c.reset}`);
    const byFile = {};
    for (const v of propViolations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 3)) {
        messages.push(`    ${c.dim}L${item.line}${c.reset} → use ${item.replacement}`);
      }
      if (items.length > 3) {
        messages.push(`    ${c.dim}... and ${items.length - 3} more${c.reset}`);
      }
    }
  }

  if (recipeViolations.length > 0) {
    if (messages.length > 0) messages.push("");
    messages.push(`${c.red}Recipe enforcement violations:${c.reset}`);
    const byFile = {};
    for (const v of recipeViolations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 4)) {
        messages.push(`    ${c.dim}L${item.line}${c.reset} → ${item.replacement}`);
      }
      if (items.length > 4) {
        messages.push(`    ${c.dim}... and ${items.length - 4} more${c.reset}`);
      }
    }
  }

  // Build result
  const totalErrors = violations.length + recipeViolations.length;
  const totalWarnings = propViolations.length;
  let detail = null;
  if (totalErrors > 0 || totalWarnings > 0) {
    const parts = [];
    if (violations.length > 0) parts.push(`${violations.length} raw Tailwind violations`);
    if (recipeViolations.length > 0)
      parts.push(`${recipeViolations.length} recipe enforcement violations`);
    if (totalWarnings > 0) parts.push(`${totalWarnings} component prop issues`);
    detail = parts.join(", ");
  }

  // Phase 7 migration complete - raw Tailwind is a hard check
  // Component prop misuse is a warning (new check, needs baseline cleanup)
  return {
    passed: violations.length === 0 && recipeViolations.length === 0,
    errors: violations.length + recipeViolations.length,
    warnings: propViolations.length,
    detail,
    messages,
  };
}
