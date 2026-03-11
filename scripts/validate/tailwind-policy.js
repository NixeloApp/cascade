/**
 * Shared policy and helpers for Tailwind/design-system validation checks.
 */

export const RAW_TAILWIND_ALLOWED_DIRS = [
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
  "src/components/Admin/",
  "src/components/Settings/",
  "src/components/TimeTracking/",
  "src/components/TimeTracker/",
  "src/components/IssueDetail/",
  "src/components/ProjectSettings/",
  "src/components/FuzzySearch/",
  "src/components/ImportExport/",
  "src/components/Fields/",
  "src/components/Templates/",
  "src/components/AdvancedSearchModal/",
  "src/components/Analytics/",
  "src/components/Automation/",
  "src/components/Dashboard/",
];

export const RAW_TAILWIND_ALLOWED_FILES = [
  "/AppSidebar.tsx",
  "/AppHeader.tsx",
  "/PortalProjectView.tsx",
  "/PortalTimeline.tsx",
  "/BulkOperationsBar.tsx",
  "/CommandPalette.tsx",
  "/CreateIssueModal.tsx",
  "/CommentReactions.tsx",
  "/CommentRenderer.tsx",
  "/CreateProjectFromTemplate.tsx",
  "/Dashboard.tsx",
  "/DocumentHeader.tsx",
  "/DocumentSidebar.tsx",
  "/DocumentTemplatesManager.tsx",
  "/FilterBar.tsx",
  "/GlobalSearch.tsx",
  "/ImportExportModal.tsx",
  "/InboxList.tsx",
  "/InvoiceEditor.tsx",
  "/InvoicePdfTemplate.tsx",
  "/IssueCard.tsx",
  "/IssueComments.tsx",
  "/IssueDependencies.tsx",
  "/IssueDetailSheet.tsx",
  "/IssuesCalendarView.tsx",
  "/KanbanBoard.tsx",
  "/KeyboardShortcutsHelp.tsx",
  "/DocumentTree.tsx",
  "/LabelsManager.tsx",
  "/layout/PageHeader.tsx",
  "/MentionInput.tsx",
  "/NotificationCenter.tsx",
  "/NotificationItem.tsx",
  "/PlateEditor.tsx",
  "/ProjectsList.tsx",
  "/RoadmapView.tsx",
  "/SprintManager.tsx",
  "/SprintProgressBar.tsx",
  "/SprintWorkload.tsx",
  "/TimeTracker.tsx",
  "/UserActivityFeed.tsx",
  "/UserMenu.tsx",
  "/UserProfile.tsx",
  "/VersionHistory.tsx",
];

export const RAW_TAILWIND_ALLOWED_EXTENSIONS = [".stories.tsx", ".test.tsx", ".example.tsx"];

export const RAW_TAILWIND_PATTERNS = [
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

export const DESIGN_SYSTEM_TARGET_FILES = [
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

export const DESIGN_SYSTEM_ESCAPE_HATCHES = [
  "cardVariants(",
  "cardRecipeVariants(",
  "buttonVariants(",
  "buttonChromeVariants(",
  "tabsTriggerVariants(",
  "tabsListVariants(",
  'chrome="',
  "chrome='",
  'variant="',
  "variant='",
  'recipe="',
  "recipe='",
];

/**
 * Pattern to detect legacy surfaceRecipes imports.
 * Matches both single-line and multiline imports where surfaceRecipes
 * may appear on its own line within destructured imports.
 * Example multiline:
 *   import {
 *     surfaceRecipes,
 *   } from "./recipes";
 */
export const LEGACY_RECIPE_IMPORT_PATTERN = /\bsurfaceRecipes\b/;

export const DESIGN_SYSTEM_TOKEN_PATTERNS = {
  background: /\bbg-(?!transparent)\S+/,
  border: /\bborder(?:-[^"'\s}]+)?/,
  radius: /\brounded(?:-[^"'\s}]+)?/,
  shadow: /\bshadow(?:-[^"'\s}]+)?/,
  spacing: /\b(?:p|px|py|pt|pr|pb|pl)-\d/,
  typography:
    /\b(?:text-(?:xs|sm|base|lg|xl|\d)|font-(?:thin|light|normal|medium|semibold|bold)|tracking-(?:tight|tighter|wide|wider|widest))/,
};

export const LAYOUT_PROP_GAP_MAP = {
  0: "none",
  1: "xs",
  2: "sm",
  3: "md",
  4: "lg",
  6: "xl",
  8: "2xl",
};

export const LAYOUT_PROP_PATTERNS = [
  {
    pattern: /<Flex(?![^>]*\bgap=)[^>]*className=["'][^"']*(?<![a-z]:)\bgap-(\d+)(?!\.)\b/,
    component: "Flex",
    prop: "gap",
  },
  {
    pattern: /<Stack(?![^>]*\bgap=)[^>]*className=["'][^"']*(?<![a-z]:)\bgap-(\d+)(?!\.)\b/,
    component: "Stack",
    prop: "gap",
  },
  {
    pattern: /<Flex(?![^>]*\bgap=)[^>]*className=["'][^"']*(?<![a-z]:)\bspace-x-(\d+)(?!\.)\b/,
    component: "Flex",
    prop: "gap",
  },
  {
    pattern: /<Stack(?![^>]*\bgap=)[^>]*className=["'][^"']*(?<![a-z]:)\bspace-y-(\d+)(?!\.)\b/,
    component: "Stack",
    prop: "gap",
  },
  {
    pattern:
      /<Flex(?![^>]*\balign=)[^>]*className=["'][^"']*(?<![a-z]:)\bitems-(start|center|end|stretch|baseline)\b/,
    component: "Flex",
    prop: "align",
    tokenType: "align",
  },
  {
    pattern:
      /<Flex(?![^>]*\bjustify=)[^>]*className=["'][^"']*(?<![a-z]:)\bjustify-(start|center|end|between|around|evenly)\b/,
    component: "Flex",
    prop: "justify",
    tokenType: "justify",
  },
  {
    pattern: /<Flex(?![^>]*\bdirection=)[^>]*className=["'][^"']*(?<![a-z]:)\bflex-(row|col)\b/,
    component: "Flex",
    prop: "direction",
    tokenType: "direction",
  },
  {
    pattern:
      /<Stack(?![^>]*\balign=)[^>]*className=["'][^"']*(?<![a-z]:)\bitems-(start|center|end|stretch)\b/,
    component: "Stack",
    prop: "align",
    tokenType: "align",
  },
  {
    pattern:
      /<Stack[^>]*className=["'][^"']*(?<![a-z]:)\bjustify-(start|center|end|between|around|evenly)\b/,
    component: "Stack",
    prop: "justify",
    tokenType: "stack-unsupported-justify",
  },
];

export function isAllowedByPolicy(rel, dirs, files, extensions) {
  if (dirs.some((dir) => rel.includes(dir))) return true;
  if (files.some((file) => rel.endsWith(file))) return true;
  if (extensions.some((extension) => rel.endsWith(extension))) return true;
  return false;
}

export function countMatchingTokenGroups(text, tokenPatterns) {
  return Object.values(tokenPatterns).filter((pattern) => pattern.test(text)).length;
}

export function findOpeningTag(lines, classNameLineIndex) {
  let tagContent = "";

  for (let index = classNameLineIndex; index >= Math.max(0, classNameLineIndex - 10); index--) {
    const line = lines[index];
    tagContent = `${line} ${tagContent}`;
    if (line.includes("<")) {
      break;
    }
  }

  for (
    let index = classNameLineIndex;
    index < Math.min(lines.length, classNameLineIndex + 10);
    index++
  ) {
    if (index > classNameLineIndex) {
      tagContent += ` ${lines[index]}`;
    }
    if (lines[index].includes(">")) {
      break;
    }
  }

  return tagContent;
}

/**
 * Collects the full className attribute span, handling multiline cases:
 * - className={cn(...)} with unbalanced braces/parens
 * - className="...\n..." with unclosed quotes spanning lines
 *
 * @param {string[]} lines - All lines of the file
 * @param {number} startIndex - Line index where className appears
 * @returns {{ span: string, endIndex: number }} - Full span and ending line index
 */
export function collectClassNameSpan(lines, startIndex) {
  let span = lines[startIndex];
  let endIndex = startIndex;

  // Check for unclosed string quotes (className="... or className='...)
  const classNameMatch = span.match(/className\s*=\s*(["'])/);
  if (classNameMatch) {
    const quote = classNameMatch[1];
    // Count quotes after className= to check if closed on same line
    const afterClassName = span.slice(span.indexOf("className"));
    const quoteMatches = afterClassName.match(new RegExp(quote, "g")) || [];
    // Odd number means unclosed quote
    if (quoteMatches.length % 2 === 1) {
      for (let index = startIndex + 1; index < lines.length && index < startIndex + 20; index++) {
        const nextLine = lines[index];
        span += ` ${nextLine}`;
        endIndex = index;
        if (nextLine.includes(quote)) {
          break;
        }
      }
      return { span, endIndex };
    }
  }

  // Handle className={...} with unbalanced braces/parens
  const openBraces = (span.match(/\{/g) || []).length;
  const closeBraces = (span.match(/\}/g) || []).length;
  const openParens = (span.match(/\(/g) || []).length;
  const closeParens = (span.match(/\)/g) || []).length;

  if (openBraces !== closeBraces || openParens !== closeParens) {
    let braceCount = openBraces - closeBraces;
    let parenCount = openParens - closeParens;

    for (let index = startIndex + 1; index < lines.length && index < startIndex + 20; index++) {
      const nextLine = lines[index];
      span += ` ${nextLine}`;
      endIndex = index;

      braceCount += (nextLine.match(/\{/g) || []).length;
      braceCount -= (nextLine.match(/\}/g) || []).length;
      parenCount += (nextLine.match(/\(/g) || []).length;
      parenCount -= (nextLine.match(/\)/g) || []).length;

      if (braceCount <= 0 && parenCount <= 0) {
        break;
      }
    }
  }

  return { span, endIndex };
}

export function groupByFile(items) {
  return items.reduce((groups, item) => {
    const bucket = groups[item.file] ?? [];
    bucket.push(item);
    groups[item.file] = bucket;
    return groups;
  }, {});
}
