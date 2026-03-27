/**
 * Page Readiness Helpers for Screenshot Capture
 *
 * Functions that wait for specific page content and UI state to be ready
 * before a screenshot is captured. Includes the central waitForExpectedContent
 * dispatch function and per-page readiness checks.
 */

import { expect, type Locator, type Page } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { AnalyticsPage } from "../pages/analytics.page";
import { BacklogPage } from "../pages/backlog.page";
import { DocumentsPage } from "../pages/documents.page";
import { InboxPage } from "../pages/inbox.page";
import { IssueDetailPage } from "../pages/issue-detail.page";
import { IssuesPage } from "../pages/issues.page";
import { MeetingsPage } from "../pages/meetings.page";
import { MyIssuesPage } from "../pages/my-issues.page";
import { NotificationsPage } from "../pages/notifications.page";
import { OutreachPage } from "../pages/outreach.page";
import { ProjectsPage } from "../pages/projects.page";
import { RoadmapPage } from "../pages/roadmap.page";
import { SettingsPage } from "../pages/settings.page";
import { TeamPage } from "../pages/team.page";
import { WorkspacesPage } from "../pages/workspaces.page";
import {
  getLocatorCount,
  getPageHeaderOrGenericEmptyState,
  isLocatorVisible,
} from "../utils/locator-state";
import { testUserService } from "../utils/test-user-service";
import {
  waitForAnimation,
  waitForLoadingSkeletonsToClear,
  waitForScreenshotReady,
} from "../utils/wait-helpers";
import { URL_PATTERNS } from "./routing";

/**
 * Placeholder orgSlug used when constructing page objects purely for
 * waitUntilReady() calls (no navigation). The screenshot tool already
 * navigated to the page — we just need the readiness check.
 */
const READINESS_ONLY_SLUG = "__readiness__";

export async function waitForSpinnersHidden(page: Page, timeout = 5000): Promise<void> {
  try {
    await expect
      .poll(
        async () => {
          const spinner = page.getByTestId(TEST_IDS.LOADING.SPINNER);
          const count = await spinner.count();
          if (count === 0) return 0;
          let visible = 0;
          for (let i = 0; i < count; i++) {
            if (await isLocatorVisible(spinner.nth(i))) visible++;
          }
          return visible;
        },
        { timeout, intervals: [100, 200, 500] },
      )
      .toBe(0);
  } catch {
    // Spinner may have cleared between polls — non-critical
  }
}

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
    await page
      .getByRole("heading", { name: /replace scattered project tools/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page.getByText(/product control tower/i).waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (["signin", "signup", "forgot-password"].includes(name)) {
    await page.getByText(/secure account access/i).waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "signup-verify") {
    await page
      .getByRole("heading", { name: /create your account/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByRole("heading", { name: /verify your email/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByTestId(TEST_IDS.AUTH.VERIFICATION_CODE_INPUT)
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "forgot-password-reset") {
    await page
      .getByRole("heading", { name: /check your email/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByTestId(TEST_IDS.AUTH.RESET_CODE_INPUT)
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "verify-email") {
    await page
      .getByRole("heading", { name: /check your email/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByTestId(TEST_IDS.AUTH.VERIFICATION_CODE_INPUT)
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "invite") {
    await page
      .getByRole("heading", { name: /you're invited/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page.getByText(/has invited you to join/i).waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name.startsWith("invite-")) {
    const inviteStateHeadings: Partial<Record<string, RegExp>> = {
      "invite-invalid": /invalid invitation/i,
      "invite-expired": /invitation expired/i,
      "invite-revoked": /invitation revoked/i,
      "invite-accepted": /already accepted/i,
    };
    const inviteStateHeading = inviteStateHeadings[name];

    if (inviteStateHeading) {
      await page
        .getByRole("heading", { name: inviteStateHeading })
        .waitFor({ state: "visible", timeout: 12000 });
      await waitForScreenshotReady(page);
      return;
    }
  }

  if (name === "unsubscribe") {
    await page
      .getByRole("heading", { name: /unsubscribed/i })
      .or(page.getByRole("heading", { name: /invalid link/i }))
      .first()
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByText(/you've been unsubscribed from email notifications/i)
      .or(page.getByText(/this unsubscribe link is invalid or has expired/i))
      .first()
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "portal") {
    await page
      .getByRole("heading", { name: /client portal/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await page
      .getByText(/portal token received/i)
      .or(page.getByText(/no projects are available for this portal token/i))
      .first()
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
    return;
  }

  if (name === "portal-project") {
    // The portal-project route currently renders the parent portal entry page
    // (portal.$token.tsx lacks an Outlet for nested routes). Match what actually
    // appears so the screenshot captures the current state.
    await page
      .getByRole("heading", { name: /client portal|project view/i })
      .waitFor({ state: "visible", timeout: 12000 });
    await waitForScreenshotReady(page);
  }
}

export async function waitForCalendarReady(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.getByTestId(TEST_IDS.CALENDAR.MODE_WEEK).waitFor({
        state: "visible",
        timeout: 8000,
      });
      await page.getByTestId(TEST_IDS.CALENDAR.ROOT).waitFor({
        state: "visible",
        timeout: 4000,
      });
      await waitForLoadingSkeletonsToClear(page, 4000);
      return true;
    } catch {
      if (attempt === 0) {
        await page.goto(page.url(), { waitUntil: "domcontentloaded", timeout: 15000 });
        await waitForScreenshotReady(page);
      }
    }
  }
  return false;
}

export async function waitForCalendarModeSelected(
  page: Page,
  mode: "day" | "week" | "month",
): Promise<void> {
  const toggle = page.getByTestId(getCalendarModeTestId(mode));
  await expect(toggle).toHaveAttribute("aria-checked", "true", { timeout: 5000 });
  await expect(page.getByTestId(TEST_IDS.CALENDAR.GRID)).toHaveAttribute(
    "data-calendar-view",
    mode,
    {
      timeout: 5000,
    },
  );
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
  const toggle = page.getByTestId(getCalendarModeTestId(mode));
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await toggle.scrollIntoViewIfNeeded();
      await toggle.click();
      await waitForCalendarModeSelected(page, mode);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    try {
      await toggle.evaluate((element) => {
        if (element instanceof HTMLButtonElement) {
          element.click();
        }
      });
      await waitForCalendarModeSelected(page, mode);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `calendar-${mode} mode did not become active: ${lastError?.message ?? "unknown error"}`,
  );
}

export async function waitForCalendarEvents(page: Page, timeoutMs = 8000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  const eventItems = page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM);
  const previousButton = page.getByRole("button", { name: /^previous month$/i });
  const nextButton = page.getByRole("button", { name: /^next month$/i });

  const isExpired = () => Date.now() > deadline;
  const hasEvents = async () => (await getLocatorCount(eventItems)) > 0;

  const waitForCalendarState = async () => {
    await waitForScreenshotReady(page);
    await waitForCalendarReady(page);
  };

  const navigateUntilVisible = async (direction: "previous" | "next", steps: number) => {
    const button = direction === "previous" ? previousButton : nextButton;

    for (let step = 0; step < steps; step++) {
      if (isExpired()) return false;
      await button.click();
      await waitForCalendarState();
      if (await hasEvents()) return true;
    }

    return false;
  };

  // Quick check — events already visible?
  if (await hasEvents()) return true;

  // Try clicking "today" button
  await page.getByRole("button", { name: /^today$/i }).click();
  await waitForCalendarState();
  if (await hasEvents()) return true;

  if (isExpired()) return false;

  // Navigate backward then forward looking for events
  if (await navigateUntilVisible("previous", 2)) return true;
  if (isExpired()) return false;
  if (await navigateUntilVisible("next", 4)) return true;

  return false;
}

export async function focusCalendarTimedContentForCapture(page: Page): Promise<void> {
  const monthToggle = page.getByTestId(TEST_IDS.CALENDAR.MODE_MONTH);
  const monthModeSelected = (await monthToggle.getAttribute("aria-checked")) === "true";
  if (monthModeSelected) {
    return;
  }

  const eventItems = page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM);
  if ((await eventItems.count()) === 0) {
    return;
  }
  const firstEvent = eventItems.first();

  await firstEvent.evaluate((element) => {
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ block: "center", inline: "nearest" });
    }
  });
  await waitForScreenshotReady(page);
}

export async function waitForCalendarMonthReady(page: Page): Promise<void> {
  const monthToggle = page.getByTestId(TEST_IDS.CALENDAR.MODE_MONTH);
  const waitForMonthToggleSelected = async (timeout: number) => {
    await expect(monthToggle).toHaveAttribute("aria-checked", "true", { timeout });
  };

  await monthToggle.waitFor({ state: "visible", timeout: 5000 });

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const isSelected = (await monthToggle.getAttribute("aria-checked")) === "true";
    if (isSelected) {
      break;
    }

    try {
      await monthToggle.scrollIntoViewIfNeeded();
      await monthToggle.click();
      await waitForMonthToggleSelected(1000);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    try {
      await monthToggle.evaluate((element) => {
        if (element instanceof HTMLButtonElement) {
          element.click();
        }
      });
      await waitForMonthToggleSelected(1000);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt === 2) {
      throw new Error(
        `Calendar month toggle did not activate: ${lastError?.message ?? "unknown error"}`,
      );
    }
  }

  await waitForMonthToggleSelected(5000);
  await waitForScreenshotReady(page);
  await waitForCalendarReady(page);
  await waitForCalendarMonthGrid(page);
}

export function supportsCalendarDragAndDropCapture(configPrefix: string): boolean {
  return configPrefix !== "mobile-light";
}

export async function waitForCalendarMonthGrid(
  page: Page,
  options?: { requireQuickAddButtons?: boolean },
): Promise<void> {
  await expect
    .poll(() => page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL).count(), {
      timeout: 5000,
      intervals: [100, 200, 500],
    })
    .toBeGreaterThanOrEqual(28);

  if (options?.requireQuickAddButtons) {
    await expect
      .poll(() => page.getByTestId(TEST_IDS.CALENDAR.QUICK_ADD_DAY).count(), {
        timeout: 5000,
        intervals: [100, 200, 500],
      })
      .toBeGreaterThanOrEqual(28);
  }
}

export async function waitForBoardReady(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.getByTestId(TEST_IDS.BOARD.ROOT).waitFor({
        state: "visible",
        timeout: 10000,
      });
      await page.getByTestId(TEST_IDS.BOARD.COLUMN).waitFor({
        state: "visible",
        timeout: 6000,
      });
      await waitForLoadingSkeletonsToClear(page, 4000);
      await waitForSpinnersHidden(page, 4000);
      return true;
    } catch {
      if (attempt === 0) {
        await page.goto(page.url(), { waitUntil: "domcontentloaded", timeout: 15000 });
        await waitForScreenshotReady(page);
      }
    }
  }

  return false;
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
  const dayCells = page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL);
  const dayCellCount = await getLocatorCount(dayCells);
  const eventItemCount = await getLocatorCount(page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM));

  let sourceIndex: number | null = null;
  for (let index = 0; index < dayCellCount; index += 1) {
    const cellEventCount = await getLocatorCount(
      dayCells.nth(index).getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM),
    );
    if (cellEventCount > 0) {
      sourceIndex = index;
      break;
    }
  }

  if (sourceIndex == null) {
    return {
      sourceIndex: null,
      targetIndex: null,
      dayCellCount,
      eventItemCount,
    };
  }

  const targetIndex = sourceIndex + 1 < dayCellCount ? sourceIndex + 1 : null;
  return {
    sourceIndex,
    targetIndex,
    dayCellCount,
    eventItemCount,
  };
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
    // Wait for the sidebar to render — this proves the app shell + auth
    // has completed (splash screen is gone, org context loaded).
    await page
      .getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON)
      .waitFor({ state: "visible", timeout: 30000 });
    // Wait for dashboard heading (confirms route rendered)
    await page
      .getByTestId(TEST_IDS.PAGE.HEADER_TITLE)
      .waitFor({ state: "visible", timeout: 15000 });
    // Wait for dashboard shell to render
    await page.getByTestId(TEST_IDS.DASHBOARD.CONTENT).waitFor({
      state: "visible",
      timeout: 20000,
    });
    await waitForSpinnersHidden(page);
    await waitForLoadingSkeletonsToClear(page, 4000);
    return;
  }

  if (URL_PATTERNS.projectBoard.test(url) || URL_PATTERNS.projectBacklog.test(url)) {
    await waitForBoardReady(page);
    return;
  }

  if (URL_PATTERNS.settings.test(url) || name === "settings" || name === "settings-profile") {
    const settingsPage = new SettingsPage(page, READINESS_ONLY_SLUG);
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
