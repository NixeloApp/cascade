/**
 * Shared policy and helpers for Tailwind/design-system validation checks.
 */

export const RAW_TAILWIND_ALLOWED_DIRS = [
  "src/components/ui/",
  "src/components/Calendar/shadcn-calendar/",
  "src/components/Auth/",
  "src/components/Plate/",
];

export const RAW_TAILWIND_ALLOWED_FILES = [
  // Explicit migration-debt exemptions replacing broad Settings/Admin/ProjectSettings directory escapes.
  "/BulkOperationsBar.tsx",
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
  "/AI/AIAssistantButton.tsx",
  "/AI/AIChat.tsx",
  "/AI/AIAssistantPanel.tsx",
  "/AI/AIErrorFallback.tsx",
  "/AI/AISuggestionsPanel.tsx",
  "/Analytics/RecentActivity.tsx",
  "/App/AppHeader.tsx",
  "/App/AppSidebar.tsx",
  "/BulkOperationsBar.tsx",
  "/CommandPalette.tsx",
  "/CreateProjectFromTemplate.tsx",
  "/Dashboard/RecentActivity.tsx",
  "/Dashboard/WorkspacesList.tsx",
  "/GlobalSearch.tsx",
  "/KeyboardShortcutsHelp.tsx",
  "/AdvancedSearchModal.tsx",
  "/AdvancedSearchModal/FilterCheckboxGroup.tsx",
  "/AdvancedSearchModal/SearchResultsList.tsx",
  "/Admin/HourComplianceDashboard.tsx",
  "/Admin/OAuthHealthDashboard.tsx",
  "/Admin/UserTypeManager.tsx",
  "/Admin/UserManagement.tsx",
  "/Dashboard.tsx",
  "/Documents/DocumentComments.tsx",
  "/Documents/DocumentHeader.tsx",
  "/Documents/DocumentSidebar.tsx",
  "/Documents/DocumentTree.tsx",
  "/Documents/DocumentTemplatesManager.tsx",
  "/ActivityFeed.tsx",
  "/Automation/AutomationRuleCard.tsx",
  "/Automation/AutomationRuleForm.tsx",
  "/AttachmentList.tsx",
  "/Calendar/CreateEventModal.tsx",
  "/Calendar/UnifiedCalendarView.tsx",
  "/CommentReactions.tsx",
  "/CommentRenderer.tsx",
  "/Calendar/EventDetailsModal.tsx",
  "/Calendar/RoadmapView.tsx",
  "/FuzzySearch/FuzzySearchInput.tsx",
  "/FilterBar.tsx",
  "/Landing/HeroSection.tsx",
  "/Landing/NavHeader.tsx",
  "/Landing/ProductShowcase.tsx",
  "/layout/PageHeader.tsx",
  "/layout/PageLayout.tsx",
  "/NotificationCenter.tsx",
  "/Notifications/NotificationCenter.tsx",
  "/Notifications/NotificationItem.tsx",
  "/InboxList.tsx",
  "/ImportExport/ImportPanel.tsx",
  "/ImportExport/ExportPanel.tsx",
  "/ImportExportModal.tsx",
  "/Invoices/InvoiceEditor.tsx",
  "/Invoices/InvoicePdfTemplate.tsx",
  "/IssuesCalendarView.tsx",
  "/KanbanBoard.tsx",
  "/FileAttachments.tsx",
  "/IssueDescriptionEditor.tsx",
  "/IssueComments.tsx",
  "/IssueDependencies.tsx",
  "/IssueDetailSheet.tsx",
  "/IssueDetail/IssueCard.tsx",
  "/IssueDetail/IssueDetailContent.tsx",
  "/IssueDetail/IssueDetailHeader.tsx",
  "/IssueDetail/IssueDetailLayout.tsx",
  "/IssueDetail/IssueDetailSidebar.tsx",
  "/IssueDetail/InlinePropertyEdit.tsx",
  "/IssueDetail/IssueMetadataSection.tsx",
  "/LabelsManager.tsx",
  "/MentionInput.tsx",
  "/Onboarding/FeatureHighlights.tsx",
  "/Onboarding/InvitedWelcome.tsx",
  "/Onboarding/LeadOnboarding.tsx",
  "/Onboarding/MemberOnboarding.tsx",
  "/Onboarding/RoleSelector.tsx",
  "/Onboarding/ProjectWizard.tsx",
  "/Onboarding/SampleProjectModal.tsx",
  "/ProjectsList.tsx",
  "/RoadmapView.tsx",
  "/Sprints/SprintProgressBar.tsx",
  "/Sprints/SprintWorkload.tsx",
  "/Settings/ApiKeysManager.tsx",
  "/Settings/AvatarUploadModal.tsx",
  "/Settings/CoverImageUploadModal.tsx",
  "/Settings/GoogleCalendarIntegration.tsx",
  "/Settings/NotificationsTab.tsx",
  "/Settings/ProfileContent.tsx",
  "/Settings/PumbleIntegration.tsx",
  "/IssueDetailModal.tsx",
  "/IssueDetail/CreateIssueModal.tsx",
  "/Kanban/BoardToolbar.tsx",
  "/Kanban/KanbanColumn.tsx",
  "/Kanban/SwimlanRow.tsx",
  "/Onboarding/OnboardingChecklist.tsx",
  "/Plate/ColorPickerButton.tsx",
  "/Plate/DragHandle.tsx",
  "/Plate/MentionInputElement.tsx",
  "/Plate/MentionElement.tsx",
  "/Plate/FloatingToolbar.tsx",
  "/PlateEditor.tsx",
  "/ClientPortal/PortalProjectView.tsx",
  "/ClientPortal/PortalTimeline.tsx",
  "/TimeTracking/BurnRateDashboard.tsx",
  "/TimeTracking/TimeEntriesList.tsx",
  "/TimeTracking/ManualTimeEntryModal.tsx",
  "/TimeTracking/TimeEntryModal.tsx",
  "/TimeTracking/UserRatesManagement.tsx",
  "/TimeTracker/BillingReport.tsx",
  "/TimeTracker/Timesheet.tsx",
  "/TimeTracker.tsx",
  "/Fields/CustomFieldCard.tsx",
  "/Fields/CustomFieldForm.tsx",
  "/Templates/TemplateCard.tsx",
  "/Templates/TemplateForm.tsx",
  "/Sprints/SprintManager.tsx",
  "/Sidebar/SidebarTeamItem.tsx",
  "/ProjectSettings/index.tsx",
  "/TimerWidget.tsx",
  "/UserActivityFeed.tsx",
  "/UserMenu.tsx",
  "/VersionHistory.tsx",
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
  focus:
    /\bfocus-visible:(?:outline-none|ring-\d|ring-[^"'\s}]+|ring-offset-\d|ring-offset-[^"'\s}]+)\b/,
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

// Layout prop patterns constrained to className values only (quoted strings or braced expressions)
// Uses (?:"[^"]*|'[^']*|\{[^}]*) to stay within className value, not scan into other props
export const LAYOUT_PROP_PATTERNS = [
  {
    pattern:
      /<Flex\b(?![^>]*\bgap=)[^>]*\bclassName\s*=\s*(?:"[^"]*|'[^']*|\{[^}]*)(?<![a-z]:)\bgap-(\d+)(?!\.)\b/,
    component: "Flex",
    prop: "gap",
  },
  {
    pattern:
      /<Stack\b(?![^>]*\bgap=)[^>]*\bclassName\s*=\s*(?:"[^"]*|'[^']*|\{[^}]*)(?<![a-z]:)\bgap-(\d+)(?!\.)\b/,
    component: "Stack",
    prop: "gap",
  },
  {
    pattern:
      /<Flex\b(?![^>]*\bgap=)[^>]*\bclassName\s*=\s*(?:"[^"]*|'[^']*|\{[^}]*)(?<!-)(?<![a-z]:)\bspace-x-(\d+)(?!\.)\b/,
    component: "Flex",
    prop: "gap",
  },
  {
    pattern:
      /<Stack\b(?![^>]*\bgap=)[^>]*\bclassName\s*=\s*(?:"[^"]*|'[^']*|\{[^}]*)(?<!-)(?<![a-z]:)\bspace-y-(\d+)(?!\.)\b/,
    component: "Stack",
    prop: "gap",
  },
  {
    pattern:
      /<Flex\b(?![^>]*\balign=)[^>]*\bclassName\s*=\s*(?:"[^"]*|'[^']*|\{[^}]*)(?<![a-z]:)\bitems-(start|center|end|stretch|baseline)\b/,
    component: "Flex",
    prop: "align",
    tokenType: "align",
  },
  {
    pattern:
      /<Flex\b(?![^>]*\bjustify=)[^>]*\bclassName\s*=\s*(?:"[^"]*|'[^']*|\{[^}]*)(?<![a-z]:)\bjustify-(start|center|end|between|around|evenly)\b/,
    component: "Flex",
    prop: "justify",
    tokenType: "justify",
  },
  {
    pattern:
      /<Flex\b(?![^>]*\bdirection=)[^>]*\bclassName\s*=\s*(?:"[^"]*|'[^']*|\{[^}]*)(?<![a-z]:)\bflex-(row|col)\b/,
    component: "Flex",
    prop: "direction",
    tokenType: "direction",
  },
  {
    pattern:
      /<Stack\b(?![^>]*\balign=)[^>]*\bclassName\s*=\s*(?:"[^"]*|'[^']*|\{[^}]*)(?<![a-z]:)\bitems-(start|center|end|stretch)\b/,
    component: "Stack",
    prop: "align",
    tokenType: "align",
  },
  {
    pattern:
      /<Stack\b[^>]*\bclassName\s*=\s*(?:"[^"]*|'[^']*|\{[^}]*)(?<![a-z]:)\bjustify-(start|center|end|between|around|evenly)\b/,
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
