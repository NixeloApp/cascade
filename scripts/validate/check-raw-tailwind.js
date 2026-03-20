/**
 * CHECK: Raw Tailwind
 * Flags generic raw Tailwind usage outside the owned primitive boundary.
 *
 * This check is intentionally narrow:
 * - generic raw utility policing lives here
 * - design-system ownership lives in check-design-system-ownership.js
 * - JSX prop misuse lives in check-layout-prop-usage.js
 *
 * NOTE: This validator has been tightened. New violations are blocked,
 * but existing violations are baselined and tracked for gradual cleanup.
 */

import fs from "node:fs";
import path from "node:path";
import {
  collectClassNameSpan,
  findOpeningTag,
  isRawTailwindBoundary,
  RAW_TAILWIND_PATTERNS,
} from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const ROUTE_CLUSTER_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "raw-tailwind-route-clusters-baseline.json",
);
const ROUTE_CLUSTER_MIN_REUSE_COUNT = 3;
const ROUTE_CLUSTER_MIN_TOKEN_COUNT = 3;

// Baseline: files with existing violations that predate stricter enforcement.
// New files must pass; existing files tracked for gradual migration.
// Run `node scripts/validate/check-raw-tailwind.js --audit` to see all violations.
const BASELINE_FILES = new Set([
  "src/components/AI/AIAssistantPanel.tsx",
  "src/components/AI/AIChat.tsx",
  "src/components/AI/AIErrorFallback.tsx",
  "src/components/AI/AISuggestionsPanel.tsx",
  "src/components/ActivityFeed.tsx",
  "src/components/Admin/HourComplianceDashboard.tsx",
  "src/components/Admin/IpRestrictionsSettings.tsx",
  "src/components/Admin/OrganizationSettings.tsx",
  "src/components/Admin/UserManagement.tsx",
  "src/components/Admin/UserTypeManager.tsx",
  "src/components/AdvancedSearchModal/SearchResultsList.tsx",
  "src/components/Analytics/BarChart.tsx",
  "src/components/Analytics/ChartCard.tsx",
  "src/components/Analytics/RecentActivity.tsx",
  "src/components/Analytics/SprintBurnChart.tsx",
  "src/components/AnalyticsDashboard.tsx",
  "src/components/App/AppHeader.tsx",
  "src/components/App/AppSidebar.tsx",
  "src/components/AttachmentList.tsx",
  "src/components/AttachmentUpload.tsx",
  "src/components/Auth/AppSplashScreen.tsx",
  "src/components/Auth/AuthPageLayout.tsx",
  "src/components/Auth/EmailVerificationForm.tsx",
  "src/components/Auth/GoogleAuthButton.tsx",
  "src/components/Auth/ResetPasswordForm.tsx",
  "src/components/Auth/SignInForm.tsx",
  "src/components/Auth/SignUpForm.tsx",
  "src/components/Automation/AutomationRuleCard.tsx",
  "src/components/AutomationRulesManager.tsx",
  "src/components/Calendar/CreateEventModal.tsx",
  "src/components/Calendar/EventDetailsModal.tsx",
  "src/components/Calendar/RoadmapView.tsx",
  "src/components/Calendar/UnifiedCalendarView.tsx",
  "src/components/Calendar/shadcn-calendar/body/day/calendar-body-margin-day-margin.tsx",
  "src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx",
  "src/components/Calendar/shadcn-calendar/body/week/calendar-body-week.tsx",
  "src/components/Calendar/shadcn-calendar/calendar-event.tsx",
  "src/components/Calendar/shadcn-calendar/header/date/calendar-header-date-chevrons.tsx",
  "src/components/Calendar/shadcn-calendar/header/date/calendar-header-date.tsx",
  "src/components/ClientPortal/PortalHeader.tsx",
  "src/components/CommentReactions.tsx",
  "src/components/CreateProjectFromTemplate.tsx",
  "src/components/CreateTeamModal.tsx",
  "src/components/CustomFieldValues.tsx",
  "src/components/CustomFieldsManager.tsx",
  "src/components/Dashboard.tsx",
  "src/components/Dashboard/FocusZone.tsx",
  "src/components/Dashboard/Greeting.tsx",
  "src/components/Dashboard/MyIssuesList.tsx",
  "src/components/Dashboard/QuickStats.tsx",
  "src/components/Dashboard/RecentActivity.tsx",
  "src/components/Dashboard/WorkspacesList.tsx",
  "src/components/Documents/DocumentComments.tsx",
  "src/components/Documents/DocumentHeader.tsx",
  "src/components/Documents/DocumentSidebar.tsx",
  "src/components/Documents/DocumentTemplatesManager.tsx",
  "src/components/Documents/DocumentTree.tsx",
  "src/components/ErrorBoundary.tsx",
  "src/components/ExportButton.tsx",
  "src/components/FilterBar.tsx",
  "src/components/GlobalSearch.tsx",
  "src/components/InboxList.tsx",
  "src/components/IssueComments.tsx",
  "src/components/IssueDependencies.tsx",
  "src/components/IssueDetail/CreateIssueModal.tsx",
  "src/components/IssueDetail/IssueCard.tsx",
  "src/components/IssueDetail/IssueDetailContent.tsx",
  "src/components/IssueDetail/IssueDetailHeader.tsx",
  "src/components/IssueDetail/IssueDetailSidebar.tsx",
  "src/components/IssueDetail/SubtasksList.tsx",
  "src/components/IssueDetailModal.tsx",
  "src/components/IssueDetailSheet.tsx",
  "src/components/IssueWatchers.tsx",
  "src/components/IssuesCalendarView.tsx",
  "src/components/Kanban/BoardToolbar.tsx",
  "src/components/Kanban/DisplayPropertiesSelector.tsx",
  "src/components/Kanban/KanbanColumn.tsx",
  "src/components/Kanban/SwimlanRow.tsx",
  "src/components/Kanban/SwimlanSelector.tsx",
  "src/components/KanbanBoard.tsx",
  "src/components/LabelsManager.tsx",
  "src/components/Landing/AIFeatureDemo.tsx",
  "src/components/Landing/CircuitFlowLines.tsx",
  "src/components/Landing/FeaturesSection.tsx",
  "src/components/Landing/FinalCTASection.tsx",
  "src/components/Landing/Footer.tsx",
  "src/components/Landing/HeroSection.tsx",
  "src/components/Landing/LogoBar.tsx",
  "src/components/Landing/NavHeader.tsx",
  "src/components/Landing/PricingSection.tsx",
  "src/components/Landing/ProductShowcase.tsx",
  "src/components/Landing/WhyChooseSection.tsx",
  "src/components/MentionInput.tsx",
  "src/components/MoveDocumentDialog.tsx",
  "src/components/NotFoundPage.tsx",
  "src/components/Notifications/NotificationCenter.tsx",
  "src/components/Notifications/NotificationItem.tsx",
  "src/components/Onboarding/FeatureHighlights.tsx",
  "src/components/Onboarding/InvitedWelcome.tsx",
  "src/components/Onboarding/LeadOnboarding.tsx",
  "src/components/Onboarding/MemberOnboarding.tsx",
  "src/components/Onboarding/OnboardingChecklist.tsx",
  "src/components/Onboarding/ProjectWizard.tsx",
  "src/components/Onboarding/RoleSelector.tsx",
  "src/components/Plate/SlashMenu.tsx",
  "src/components/PlateEditor.tsx",
  "src/components/ProjectSettings/DangerZone.tsx",
  "src/components/ProjectSettings/GeneralSettings.tsx",
  "src/components/ProjectSettings/MemberManagement.tsx",
  "src/components/ProjectSettings/WorkflowSettings.tsx",
  "src/components/ProjectsList.tsx",
  "src/components/RoadmapView.tsx",
  "src/components/Settings.tsx",
  "src/components/Settings/ApiKeysManager.tsx",
  "src/components/Settings/AvatarUploadModal.tsx",
  "src/components/Settings/CoverImageUploadModal.tsx",
  "src/components/Settings/GitHubIntegration.tsx",
  "src/components/Settings/LinkedRepositories.tsx",
  "src/components/Settings/NotificationsTab.tsx",
  "src/components/Settings/OfflineTab.tsx",
  "src/components/Settings/PreferencesTab.tsx",
  "src/components/Settings/ProfileContent.tsx",
  "src/components/Settings/PumbleIntegration.tsx",
  "src/components/Settings/SSOSettings.tsx",
  "src/components/Settings/SlackIntegration.tsx",
  "src/components/Sprints/SprintManager.tsx",
  "src/components/Sprints/SprintProgressBar.tsx",
  "src/components/Sprints/SprintWorkload.tsx",
  "src/components/Templates/TemplateCard.tsx",
  "src/components/Templates/TemplateForm.tsx",
  "src/components/TemplatesManager.tsx",
  "src/components/TimeTracker/BillingReport.tsx",
  "src/components/TimeTracker/Timesheet.tsx",
  "src/components/TimeTracking/ManualTimeEntryModal.tsx",
  "src/components/TimeTracking/TimeEntryModal.tsx",
  "src/components/TimeTracking/TimeTrackingPage.tsx",
  "src/components/TimeTracking/UserRatesManagement.tsx",
  "src/components/UserActivityFeed.tsx",
  "src/components/UserMenu.tsx",
  "src/components/VersionHistory.tsx",
  "src/components/Webhooks/WebhookCard.tsx",
  "src/components/Webhooks/WebhookForm.tsx",
  "src/components/Webhooks/WebhookLogs.tsx",
  "src/components/WebhooksManager.tsx",
  "src/components/layout/PageHeader.tsx",
]);

/**
 * Escape hatches for raw Tailwind check.
 * If a tag uses recipe/chrome/variant props or variant function calls,
 * it's using the design system and raw utilities are acceptable.
 */
const RAW_TW_ESCAPE_HATCHES = [
  // Direct props on components
  'recipe="',
  "recipe='",
  'chrome="',
  "chrome='",
  'variant="',
  "variant='",
  // Programmatic variant calls
  "cardVariants(",
  "cardRecipeVariants(",
  "getCardRecipeClassName(",
  "getCardVariantClassName(",
  "buttonVariants(",
  "buttonChromeVariants(",
  "tabsTriggerVariants(",
  "tabsListVariants(",
];

function normalizeClassNameLiteral(value) {
  return value.trim().replace(/\s+/g, " ");
}

function extractLiteralClassName(span) {
  const match = span.match(/className\s*=\s*(?:"([\s\S]*?)"|'([\s\S]*?)')/);
  if (!match) {
    return null;
  }

  const literal = normalizeClassNameLiteral(match[1] ?? match[2] ?? "");
  return literal.length > 0 ? literal : null;
}

function loadRouteClusterBaseline() {
  if (!fs.existsSync(ROUTE_CLUSTER_BASELINE_PATH)) {
    return new Map();
  }

  const parsed = JSON.parse(fs.readFileSync(ROUTE_CLUSTER_BASELINE_PATH, "utf-8"));
  return new Map(Object.entries(parsed.clusters ?? {}));
}

function collectRouteClusterGroups() {
  const routesDir = path.join(ROOT, "src/routes");
  const files = walkDir(routesDir, { extensions: new Set([".tsx"]) });
  const groups = new Map();

  for (const filePath of files) {
    const rel = relPath(filePath);
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");

    for (let index = 0; index < lines.length; index++) {
      if (!/\bclassName\s*=/.test(lines[index])) continue;

      const { span, endIndex } = collectClassNameSpan(lines, index);
      const literal = extractLiteralClassName(span);

      if (!literal) {
        index = endIndex;
        continue;
      }

      const tokenCount = literal.split(/\s+/).filter(Boolean).length;
      if (tokenCount < ROUTE_CLUSTER_MIN_TOKEN_COUNT) {
        index = endIndex;
        continue;
      }

      if (!RAW_TAILWIND_PATTERNS.some(({ pattern }) => pattern.test(literal))) {
        index = endIndex;
        continue;
      }

      const locations = groups.get(literal) ?? [];
      locations.push({ file: rel, line: index + 1 });
      groups.set(literal, locations);
      index = endIndex;
    }
  }

  return [...groups.entries()]
    .filter(([, locations]) => locations.length >= ROUTE_CLUSTER_MIN_REUSE_COUNT)
    .map(([cluster, locations]) => ({ cluster, locations }))
    .sort(
      (left, right) =>
        right.locations.length - left.locations.length || left.cluster.localeCompare(right.cluster),
    );
}

export function run() {
  const srcDir = path.join(ROOT, "src/components");
  const files = walkDir(srcDir, { extensions: new Set([".tsx"]) });
  const violations = [];
  const baselineViolations = [];
  const routeClusterBaseline = loadRouteClusterBaseline();
  const routeClusterViolations = [];
  const baselinedRouteClusters = [];

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (isRawTailwindBoundary(rel)) {
      continue;
    }

    const isBaselined = BASELINE_FILES.has(rel);
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (!/\bclassName\s*=/.test(line)) continue;

      // Collect full className span for multiline attributes
      const { span, endIndex } = collectClassNameSpan(lines, index);

      // Get the opening tag to check for escape hatches
      const tagText = findOpeningTag(lines, index);

      // Skip if using design system APIs (recipe, chrome, variant props or variant calls)
      if (RAW_TW_ESCAPE_HATCHES.some((token) => span.includes(token) || tagText.includes(token))) {
        index = endIndex;
        continue;
      }

      for (const { pattern, replacement } of RAW_TAILWIND_PATTERNS) {
        if (!pattern.test(span)) continue;

        const violation = {
          file: rel,
          line: index + 1,
          replacement,
        };

        if (isBaselined) {
          baselineViolations.push(violation);
        } else {
          violations.push(violation);
        }
        break;
      }

      // Skip past multiline spans to avoid double-counting
      index = endIndex;
    }
  }

  for (const group of collectRouteClusterGroups()) {
    const baselineCount = routeClusterBaseline.get(group.cluster) ?? 0;
    if (group.locations.length > baselineCount) {
      routeClusterViolations.push({ ...group, baselineCount });
      continue;
    }

    baselinedRouteClusters.push(group);
  }

  const messages = [];

  // Report new violations (blocking)
  if (violations.length > 0) {
    messages.push(`${c.red}Raw Tailwind violations (new files):${c.reset}`);
    const byFile = violations.reduce((groups, item) => {
      const bucket = groups[item.file] ?? [];
      bucket.push(item);
      groups[item.file] = bucket;
      return groups;
    }, {});

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

  if (routeClusterViolations.length > 0) {
    messages.push(`${c.red}Repeated raw Tailwind route clusters:${c.reset}`);
    for (const item of routeClusterViolations) {
      messages.push(`  ${c.bold}${item.locations.length}x${c.reset} ${item.cluster}`);
      for (const location of item.locations.slice(0, 3)) {
        messages.push(`    ${c.dim}${location.file}:L${location.line}${c.reset}`);
      }
      if (item.locations.length > 3) {
        messages.push(`    ${c.dim}... and ${item.locations.length - 3} more${c.reset}`);
      }
      if (item.baselineCount > 0) {
        messages.push(`    ${c.dim}baseline ${item.baselineCount}x${c.reset}`);
      }
      messages.push(`    ${c.dim}extract a route-local component or variant${c.reset}`);
    }
  }

  // Summary of baselined violations (info only)
  const baselineDetails = [];
  if (baselineViolations.length > 0) {
    baselineDetails.push(`${baselineViolations.length} baselined in ${BASELINE_FILES.size} files`);
  }
  if (baselinedRouteClusters.length > 0) {
    baselineDetails.push(`${baselinedRouteClusters.length} baselined route clusters`);
  }

  // Compute which baseline files are now clean (zero violations)
  const baselineFilesWithViolations = new Set(baselineViolations.map((v) => v.file));
  const cleanBaselineFiles = [...BASELINE_FILES].filter((f) => !baselineFilesWithViolations.has(f));

  return {
    passed: violations.length === 0 && routeClusterViolations.length === 0,
    errors: violations.length + routeClusterViolations.length,
    detail:
      violations.length > 0 || routeClusterViolations.length > 0
        ? [
            violations.length > 0 ? `${violations.length} raw Tailwind violations` : null,
            routeClusterViolations.length > 0
              ? `${routeClusterViolations.length} repeated route class cluster(s)`
              : null,
          ]
            .filter(Boolean)
            .join(", ")
        : `owned boundary${baselineDetails.length > 0 ? ` (${baselineDetails.join(", ")})` : ""}`,
    messages,
    cleanBaselineFiles,
  };
}

// Standalone audit mode: node scripts/validate/check-raw-tailwind.js --audit
if (process.argv.includes("--audit")) {
  const result = run();
  const clean = result.cleanBaselineFiles;
  console.log(`\nBaseline: ${BASELINE_FILES.size} files`);
  console.log(`Clean (removable): ${clean.length}`);
  console.log(`Still violating: ${BASELINE_FILES.size - clean.length}\n`);
  if (clean.length > 0) {
    console.log("Remove from BASELINE_FILES:");
    for (const f of clean.sort()) console.log(`  "${f}",`);
  }
}
