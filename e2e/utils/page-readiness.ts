/**
 * Shared page-readiness helpers for route captures and deep E2E state setup.
 *
 * These waits are intentionally page-object based so screenshot capture and
 * product E2E flows can point to the same readiness path instead of keeping a
 * separate screenshot-only dispatcher.
 */

import { expect, type Locator, type Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { AnalyticsPage } from "../pages/analytics.page";
import { AuthPage } from "../pages/auth.page";
import { BacklogPage } from "../pages/backlog.page";
import { CalendarPage } from "../pages/calendar.page";
import { ClientPortalPage } from "../pages/client-portal.page";
import { DashboardPage } from "../pages/dashboard.page";
import { DocumentsPage } from "../pages/documents.page";
import { InboxPage } from "../pages/inbox.page";
import { IssueDetailPage } from "../pages/issue-detail.page";
import { IssuesPage } from "../pages/issues.page";
import { JoinPage } from "../pages/join.page";
import { LandingPage } from "../pages/landing.page";
import { MeetingsPage } from "../pages/meetings.page";
import { MyIssuesPage } from "../pages/my-issues.page";
import { NotificationsPage } from "../pages/notifications.page";
import { OutreachPage } from "../pages/outreach.page";
import { ProjectsPage } from "../pages/projects.page";
import { RoadmapPage } from "../pages/roadmap.page";
import { SettingsPage } from "../pages/settings.page";
import { TeamPage } from "../pages/team.page";
import { UnsubscribePage } from "../pages/unsubscribe.page";
import { WorkspacesPage } from "../pages/workspaces.page";
import { URL_PATTERNS } from "../screenshot-lib/routing";
import { getPageHeaderOrGenericEmptyState } from "./locator-state";
import { testUserService } from "./test-user-service";
import {
  waitForAllSpinnersToClear,
  waitForAnimation,
  waitForLoadingSkeletonsToClear,
} from "./wait-helpers";

/**
 * Placeholder orgSlug used when constructing page objects purely for
 * waitUntilReady() calls (no navigation). The screenshot tool already
 * navigated to the page — we just need the readiness check.
 */
const READINESS_ONLY_SLUG = "__readiness__";

export async function waitForDuplicateDetectionSearchReady(
  orgSlug: string,
  projectKey: string,
  query: string,
  timeoutMs = 30000,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const result = await testUserService.checkProjectIssueDuplicates(
          orgSlug,
          projectKey,
          query,
        );
        return result.success && (result.matchCount ?? 0) > 0;
      },
      {
        timeout: timeoutMs,
        intervals: [1000, 2000, 3000],
        message: `Duplicate search not ready for ${projectKey} in ${orgSlug}`,
      },
    )
    .toBe(true);
}

export async function waitForPublicPageReady(page: Page, name: string): Promise<void> {
  if (name === "landing") {
    await new LandingPage(page, READINESS_ONLY_SLUG).waitForCaptureReady();
    return;
  }

  if (
    name === "signin" ||
    name === "signup" ||
    name === "forgot-password" ||
    name === "signup-verify" ||
    name === "forgot-password-reset" ||
    name === "verify-email" ||
    name === "verify-2fa"
  ) {
    await new AuthPage(page, READINESS_ONLY_SLUG).waitForCaptureReady(name);
    return;
  }

  if (
    name === "invite" ||
    name === "invite-invalid" ||
    name === "invite-expired" ||
    name === "invite-revoked" ||
    name === "invite-accepted"
  ) {
    await new JoinPage(page).waitForCaptureReady(name);
    return;
  }

  if (name === "unsubscribe") {
    await new UnsubscribePage(page).waitForCaptureReady();
    return;
  }

  if (name === "portal" || name === "portal-project") {
    await new ClientPortalPage(page).waitForCaptureReady(name);
  }
}

export async function waitForSpinnersHidden(page: Page, timeout = 5000): Promise<void> {
  try {
    await waitForAllSpinnersToClear(page, timeout);
  } catch {
    // Spinner may have cleared between polls — non-critical
  }
}

export async function waitForCalendarReady(page: Page): Promise<boolean> {
  return new CalendarPage(page, READINESS_ONLY_SLUG).ensureReady();
}

export async function waitForCalendarModeSelected(
  page: Page,
  mode: "day" | "week" | "month",
): Promise<void> {
  await new CalendarPage(page, READINESS_ONLY_SLUG).expectModeSelected(mode);
}

export function getCalendarModeTestId(mode: "day" | "week" | "month"): string {
  switch (mode) {
    case "day":
      return TEST_IDS.CALENDAR.MODE_DAY;
    case "week":
      return TEST_IDS.CALENDAR.MODE_WEEK;
    case "month":
      return TEST_IDS.CALENDAR.MODE_MONTH;
  }
}

export async function selectCalendarMode(
  page: Page,
  mode: "day" | "week" | "month",
): Promise<void> {
  await new CalendarPage(page, READINESS_ONLY_SLUG).switchToMode(mode);
}

export async function waitForCalendarEvents(page: Page, timeoutMs = 8000): Promise<boolean> {
  return new CalendarPage(page, READINESS_ONLY_SLUG).waitForEvents(timeoutMs);
}

export async function focusCalendarTimedContentForCapture(page: Page): Promise<void> {
  await new CalendarPage(page, READINESS_ONLY_SLUG).focusFirstEvent();
}

export async function waitForCalendarMonthReady(page: Page): Promise<void> {
  await new CalendarPage(page, READINESS_ONLY_SLUG).ensureMonthView();
}

export function supportsCalendarDragAndDropCapture(configPrefix: string): boolean {
  return configPrefix !== "mobile-light";
}

export async function waitForCalendarMonthGrid(
  page: Page,
  options?: { requireQuickAddButtons?: boolean },
): Promise<void> {
  await new CalendarPage(page, READINESS_ONLY_SLUG).waitForMonthGrid(options);
}

export async function waitForBoardReady(page: Page): Promise<boolean> {
  return new ProjectsPage(page, READINESS_ONLY_SLUG).ensureBoardReady();
}

export async function waitForProjectsReady(page: Page): Promise<void> {
  await new ProjectsPage(page, READINESS_ONLY_SLUG).waitUntilReady();
  await waitForSpinnersHidden(page);
}

export async function waitForIssuesReady(page: Page): Promise<void> {
  await new IssuesPage(page, READINESS_ONLY_SLUG).waitUntilReady();
  await waitForSpinnersHidden(page);
}

export type CalendarDragState = {
  sourceIndex: number | null;
  targetIndex: number | null;
  dayCellCount: number;
  eventItemCount: number;
};

export async function getCalendarDragState(page: Page): Promise<CalendarDragState> {
  return new CalendarPage(page, READINESS_ONLY_SLUG).getDragState();
}

export async function waitForWorkspacesReady(page: Page): Promise<void> {
  await new WorkspacesPage(page, READINESS_ONLY_SLUG).waitUntilReady();
  await waitForSpinnersHidden(page);
}

export async function waitForWorkspaceBacklogReady(page: Page): Promise<void> {
  await new BacklogPage(page, READINESS_ONLY_SLUG).waitUntilReady();
  await waitForSpinnersHidden(page);
}

export async function waitForTeamDetailReady(page: Page): Promise<void> {
  await new TeamPage(page, READINESS_ONLY_SLUG).waitUntilReady();
}

export async function waitForIssueDetailReady(page: Page): Promise<void> {
  await new IssueDetailPage(page, READINESS_ONLY_SLUG).waitUntilReady();
  await waitForSpinnersHidden(page);
}

export async function waitForDocumentsReady(page: Page): Promise<void> {
  await waitForSpinnersHidden(page, 15000);
  await new DocumentsPage(page, READINESS_ONLY_SLUG).waitUntilReady();
}

export async function waitForDocumentEditorReady(page: Page): Promise<void> {
  const docsPage = new DocumentsPage(page, READINESS_ONLY_SLUG);
  await docsPage.expectEditorVisible();
  await waitForSpinnersHidden(page);
}

export async function waitForAnalyticsReady(page: Page): Promise<void> {
  await new AnalyticsPage(page, READINESS_ONLY_SLUG).waitUntilReady();
  await waitForSpinnersHidden(page);
}

export async function waitForProjectAnalyticsReady(page: Page): Promise<void> {
  const projectsPage = new ProjectsPage(page, READINESS_ONLY_SLUG);
  await projectsPage.expectAnalyticsLoaded();
  await waitForSpinnersHidden(page);
  await waitForLoadingSkeletonsToClear(page, 4000);
}

export async function scrollSectionNearViewportTop(
  locator: Locator,
  page: Page,
  offset = 24,
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const handle = await locator.elementHandle();
  if (!handle) {
    throw new Error("Could not acquire element handle for section scroll alignment");
  }
  const targetScrollTop = await page.evaluate(
    ({ element, topOffset }) => {
      const unclampedTargetTop = element.getBoundingClientRect().top + window.scrollY - topOffset;
      const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const clampedTargetTop = Math.min(Math.max(0, unclampedTargetTop), maxScrollTop);
      window.scrollTo({ top: clampedTargetTop, behavior: "auto" });
      return clampedTargetTop;
    },
    { element: handle, topOffset: offset },
  );
  await page.waitForFunction(
    (expectedScrollTop) => Math.abs(window.scrollY - expectedScrollTop) <= 2,
    targetScrollTop,
    { timeout: 5000 },
  );
  await waitForAnimation(page);
}

export async function waitForRoadmapReady(page: Page): Promise<void> {
  await new RoadmapPage(page, READINESS_ONLY_SLUG).waitUntilReady();
  await waitForSpinnersHidden(page);
}

export async function waitForExpectedContent(
  page: Page,
  url: string,
  name: string,
  prefix?: string,
): Promise<void> {
  if (prefix === "public") {
    await waitForPublicPageReady(page, name);
    return;
  }

  if (URL_PATTERNS.dashboard.test(url) || name === "dashboard") {
    await new DashboardPage(page, READINESS_ONLY_SLUG).waitForCaptureReady();
    await waitForSpinnersHidden(page);
    await waitForLoadingSkeletonsToClear(page, 4000);
    return;
  }

  if (URL_PATTERNS.projectBoard.test(url) || URL_PATTERNS.projectBacklog.test(url)) {
    await waitForBoardReady(page);
    return;
  }

  if (URL_PATTERNS.settings.test(url) || name === "settings" || name === "settings-profile") {
    const pathname = new URL(url, "http://cascade.local").pathname;
    const [orgSlug] = pathname.split("/").filter(Boolean);
    const settingsPage = new SettingsPage(page, orgSlug || READINESS_ONLY_SLUG);
    await settingsPage.waitForCaptureReady(
      name as
        | "settings"
        | "settings-profile"
        | "settings-notifications"
        | "settings-security"
        | "settings-apikeys"
        | "settings-integrations"
        | "settings-admin"
        | "settings-offline",
    );
    await waitForSpinnersHidden(page);
    return;
  }

  // --- Pages with unique readiness logic ---

  if (URL_PATTERNS.projects.test(url) || name === "projects") {
    await waitForProjectsReady(page);
    return;
  }

  if (URL_PATTERNS.issues.test(url) || name === "issues") {
    await waitForIssuesReady(page);
    return;
  }

  if (URL_PATTERNS.workspaces.test(url) || name === "workspaces") {
    await waitForWorkspacesReady(page);
    return;
  }

  if (URL_PATTERNS.issueDetail.test(url)) {
    await waitForIssueDetailReady(page);
    return;
  }

  if (name === "documents" || /\/[^/]+\/documents\/?$/.test(url)) {
    await waitForDocumentsReady(page);
    return;
  }

  if (name === "documents-templates" || /\/[^/]+\/documents\/templates\/?$/.test(url)) {
    await new DocumentsPage(page, READINESS_ONLY_SLUG).waitForTemplatesReady();
    await waitForSpinnersHidden(page);
    return;
  }

  if (URL_PATTERNS.documentEditor.test(url) || name === "document-editor") {
    await waitForDocumentEditorReady(page);
    return;
  }

  if (URL_PATTERNS.projectAnalytics.test(url)) {
    await waitForProjectAnalyticsReady(page);
    return;
  }

  if (URL_PATTERNS.analytics.test(url) || name === "org-analytics") {
    await new AnalyticsPage(page, READINESS_ONLY_SLUG).waitUntilReady();
    await waitForSpinnersHidden(page);
    return;
  }

  if (URL_PATTERNS.projectRoadmap.test(url)) {
    await waitForRoadmapReady(page);
    return;
  }

  if (URL_PATTERNS.projectInbox.test(url) || name === "projectInbox") {
    await new InboxPage(page, READINESS_ONLY_SLUG, READINESS_ONLY_SLUG).waitUntilReady();
    await waitForSpinnersHidden(page);
    return;
  }

  if (URL_PATTERNS.notifications.test(url) || name === "notifications") {
    await new NotificationsPage(page, READINESS_ONLY_SLUG).waitForCaptureReady();
    await waitForSpinnersHidden(page);
    return;
  }

  if (URL_PATTERNS.meetings.test(url) || name === "meetings") {
    await new MeetingsPage(page, READINESS_ONLY_SLUG).waitForCaptureReady();
    await waitForSpinnersHidden(page);
    return;
  }

  if (URL_PATTERNS.outreach.test(url) || name === "outreach" || name.startsWith("outreach-")) {
    await new OutreachPage(page, READINESS_ONLY_SLUG).waitUntilReady();
    await waitForSpinnersHidden(page);
    return;
  }

  // --- Calendar pages (project, workspace, team, org) ---

  if (
    URL_PATTERNS.projectCalendar.test(url) ||
    URL_PATTERNS.workspaceCalendar.test(url) ||
    URL_PATTERNS.teamCalendar.test(url) ||
    name === "calendar-event-modal" ||
    /^calendar-(day|week|month)$/.test(name)
  ) {
    await waitForCalendarReady(page);
    await waitForCalendarEvents(page, 5000);
    await focusCalendarTimedContentForCapture(page);
    return;
  }

  if (
    (URL_PATTERNS.orgCalendar.test(url) &&
      !url.includes("/projects/") &&
      !url.includes("/workspaces/")) ||
    name === "org-calendar"
  ) {
    await waitForCalendarReady(page);
    await waitForCalendarEvents(page, 5000);
    return;
  }

  if (URL_PATTERNS.myIssues.test(url) || name === "my-issues") {
    const myIssuesPage = new MyIssuesPage(page, READINESS_ONLY_SLUG);
    await myIssuesPage.waitUntilReady();
    return;
  }

  // --- Board pages (project, workspace backlog, team) ---

  if (URL_PATTERNS.workspaceBacklog.test(url)) {
    await waitForWorkspaceBacklogReady(page);
    return;
  }

  if (
    URL_PATTERNS.teamDetail.test(url) ||
    URL_PATTERNS.teamBoard.test(url) ||
    /^team-[^-]+-board$/.test(name)
  ) {
    await waitForTeamDetailReady(page);
    return;
  }

  // --- Default fallback: wait for page header + spinners ---
  // Covers: authentication, add-ons, assistant, mcp-server, invoices,
  // clients, my-issues, inbox, time-tracking, workspace detail,
  // workspace settings, workspace sprints, workspace dependencies,
  // workspace wiki, team settings, team wiki, document templates,
  // project activity, project timesheet, project sprints, project
  // billing, project settings, project members
  await getPageHeaderOrGenericEmptyState(page).waitFor({ state: "visible", timeout: 20000 });
  await waitForSpinnersHidden(page);
}
