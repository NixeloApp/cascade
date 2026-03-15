/**
 * CHECK: Nested Cards (banned)
 * Cards inside Cards is an anti-pattern. Use proper semantic components instead:
 * - Headers/dividers: use a div with border-b or a Separator
 * - List items: use a div with bg styling or a dedicated ListItem
 * - Sections: restructure to avoid nesting, or use a recipe on a div
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// ============================================================================
// Configuration
// ============================================================================

const IGNORE_DIRS = ["src/lib", "src/components/ui"];

// Files with known nested Card issues - baseline to track and fix over time
// These are pre-existing violations; new violations will fail CI
const BASELINE_FILES = new Set([
  "src/components/ActivityFeed.tsx",
  "src/components/Admin/HourComplianceDashboard.tsx",
  "src/components/Admin/IpRestrictionsSettings.tsx",
  "src/components/Admin/UserTypeManager.tsx",
  "src/components/AdvancedSearchModal/FilterCheckboxGroup.tsx",
  "src/components/AI/AIChat.tsx",
  "src/components/Analytics/RecentActivity.tsx",
  "src/components/App/AppHeader.tsx",
  "src/components/App/AppSidebar.tsx",
  "src/components/Auth/AuthPageLayout.tsx",
  "src/components/BulkOperationsBar.tsx",
  "src/components/Calendar/EventDetailsModal.tsx",
  "src/components/Calendar/RoadmapView.tsx",
  "src/components/Calendar/shadcn-calendar/body/day/calendar-body-day-events.tsx",
  "src/components/Calendar/shadcn-calendar/body/day/calendar-body-day.tsx",
  "src/components/Calendar/shadcn-calendar/body/day/calendar-body-margin-day-margin.tsx",
  "src/components/Calendar/shadcn-calendar/body/week/calendar-body-week.tsx",
  "src/components/Calendar/shadcn-calendar/header/date/calendar-header-date-icon.tsx",
  "src/components/ClientPortal/PortalTimeline.tsx",
  "src/components/Dashboard/MyIssuesList.tsx",
  "src/components/Dashboard/RecentActivity.tsx",
  "src/components/Dashboard/WorkspacesList.tsx",
  "src/components/InboxList.tsx",
  "src/components/Invoices/InvoicePdfTemplate.tsx",
  "src/components/IssueDependencies.tsx",
  "src/components/IssuesCalendarView.tsx",
  "src/components/KanbanBoard.tsx",
  "src/components/KeyboardShortcutsHelp.tsx",
  "src/components/LabelsManager.tsx",
  "src/components/Landing/AIFeatureDemo.tsx",
  "src/components/Landing/FinalCTASection.tsx",
  "src/components/Landing/NavHeader.tsx",
  "src/components/Landing/ProductShowcase.tsx",
  "src/components/Onboarding/InvitedWelcome.tsx",
  "src/components/Onboarding/LeadOnboarding.tsx",
  "src/components/Onboarding/MemberOnboarding.tsx",
  "src/components/Onboarding/OnboardingChecklist.tsx",
  "src/components/Onboarding/RoleSelector.tsx",
  "src/components/PlateEditor.tsx",
  "src/components/ProjectSettings/LabelSettings.tsx",
  "src/components/ProjectSettings/MemberManagement.tsx",
  "src/components/ProjectSettings/WorkflowSettings.tsx",
  "src/components/ProjectsList.tsx",
  "src/components/RoadmapView.tsx",
  "src/components/Settings/GoogleCalendarIntegration.tsx",
  "src/components/Settings/NotificationsTab.tsx",
  "src/components/Settings/OfflineTab.tsx",
  "src/components/Settings/ProfileContent.tsx",
  "src/components/Settings/PumbleIntegration.tsx",
  "src/components/Settings/TwoFactorSettings.tsx",
  "src/components/TimeTracker/Timesheet.tsx",
  "src/components/TimeTracker.tsx",
  "src/components/UserActivityFeed.tsx",
  "src/components/VersionHistory.tsx",
  "src/components/Webhooks/WebhookLogs.tsx",
  "src/routes/_auth/_app/$orgSlug/clients/index.tsx",
  "src/routes/_auth/_app/$orgSlug/workspaces/index.tsx",
]);

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
    if (BASELINE_FILES.has(rel)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node, cardDepth = 0) {
      // Handle JsxElement (opening + children + closing)
      if (ts.isJsxElement(node)) {
        const opening = node.openingElement;
        const tagName = opening.tagName.getText();

        if (tagName === "Card") {
          if (cardDepth > 0) {
            reportError(
              filePath,
              opening,
              `Card inside Card is banned. Use a div with appropriate styling instead.`,
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

        if (tagName === "Card" && cardDepth > 0) {
          reportError(
            filePath,
            node,
            `Card inside Card is banned. Use a div with appropriate styling instead.`,
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
