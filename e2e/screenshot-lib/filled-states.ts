/**
 * Filled States Screenshot Pass
 *
 * The main screenshot capture function that navigates through all authenticated
 * pages with seeded data. Captures dashboard, projects, boards, issues, documents,
 * calendar, workspaces, settings, and all their sub-states.
 */

import type { Locator, Page } from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import { TEST_IDS } from "../../src/lib/test-ids";
import { ProjectsPage } from "../pages";
import { OutreachPage } from "../pages/outreach.page";
import { getLocatorAttribute, getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { type SeedScreenshotResult, testUserService } from "../utils/test-user-service";
import {
  dismissAllDialogs,
  dismissIfOpen,
  waitForAnimation,
  waitForScreenshotReady,
} from "../utils/wait-helpers";
import {
  captureCurrentView,
  captureState,
  runCaptureStep,
  runRequiredCaptureStep,
  shouldCapture,
  shouldCaptureAny,
  takeScreenshot,
} from "./capture";
import { BASE_URL, MARKDOWN_IMPORT_PREVIEW } from "./config";
import {
  getUploadDialogReadyLocator,
  openMobileSidebarMenu,
  openStableAlertDialog,
  openStableDialog,
  waitForCreateIssueModalScreenshotReady,
  waitForDashboardCustomizeDialogReady,
} from "./dialog-helpers";
import {
  clearIssueDrafts,
  discoverDocumentId,
  discoverIssueKey,
  openDocumentActionsMenu,
  openDocumentEditorFloatingToolbarForCapture,
  openDocumentEditorForCapture,
  openDocumentEditorMentionPopoverForCapture,
  openDocumentEditorSlashMenuForCapture,
  openMarkdownImportPreviewDialog,
  primeDocumentEditorRichContent,
  seedIssueDraft,
} from "./helpers";
import {
  screenshotBoardInteractiveStates,
  screenshotBoardModals,
  screenshotDashboardLoadingState,
  screenshotDashboardModals,
  screenshotDocumentsStates,
  screenshotIssueInteractiveStates,
  screenshotIssuesStates,
  screenshotMeetingsStates,
  screenshotProjectInboxStates,
  screenshotProjectsModal,
  screenshotSprintInteractiveStates,
} from "./interactive-captures";
import {
  focusCalendarTimedContentForCapture,
  getCalendarDragState,
  scrollSectionNearViewportTop,
  selectCalendarMode,
  supportsCalendarDragAndDropCapture,
  waitForCalendarEvents,
  waitForCalendarMonthGrid,
  waitForCalendarMonthReady,
  waitForCalendarReady,
  waitForDuplicateDetectionSearchReady,
  waitForExpectedContent,
} from "./readiness";

export async function screenshotFilledStates(
  page: Page,
  orgSlug: string,
  seed: SeedScreenshotResult,
): Promise<void> {
  console.log("    --- Filled states ---");
  const p = "filled";
  const projectKey = seed.projectKey;
  const projectId = seed.projectId;
  const normalizedProjectKey = projectKey?.toLowerCase() ?? "";
  const firstIssueKey = seed.issueKeys?.[0];

  // Top-level pages
  await takeScreenshot(page, p, "dashboard", ROUTES.dashboard.build(orgSlug));
  await takeScreenshot(page, p, "projects", ROUTES.projects.list.build(orgSlug));
  await takeScreenshot(page, p, "issues", ROUTES.issues.list.build(orgSlug));
  await takeScreenshot(page, p, "documents", ROUTES.documents.list.build(orgSlug));
  await takeScreenshot(page, p, "documents-templates", ROUTES.documents.templates.build(orgSlug));
  await takeScreenshot(page, p, "workspaces", ROUTES.workspaces.list.build(orgSlug));
  await takeScreenshot(page, p, "time-tracking", ROUTES.timeTracking.build(orgSlug));
  await takeScreenshot(page, p, "notifications", ROUTES.notifications.build(orgSlug));
  await takeScreenshot(page, p, "my-issues", ROUTES.myIssues.build(orgSlug));
  await takeScreenshot(page, p, "org-calendar", ROUTES.calendar.build(orgSlug));
  await takeScreenshot(page, p, "org-analytics", ROUTES.analytics.build(orgSlug));
  await takeScreenshot(page, p, "invoices", ROUTES.invoices.list.build(orgSlug));
  await takeScreenshot(page, p, "clients", ROUTES.clients.list.build(orgSlug));
  await takeScreenshot(page, p, "meetings", ROUTES.meetings.build(orgSlug));
  await takeScreenshot(page, p, "outreach", ROUTES.outreach.build(orgSlug));
  await takeScreenshot(page, p, "settings", ROUTES.settings.profile.build(orgSlug));
  await takeScreenshot(page, p, "settings-profile", ROUTES.settings.profile.build(orgSlug));
  await takeScreenshot(
    page,
    p,
    "settings-integrations",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=integrations`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-admin",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=admin`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-notifications",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=notifications`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-security",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=security`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-apikeys",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=apikeys`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-preferences",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=preferences`,
  );
  await takeScreenshot(
    page,
    p,
    "settings-offline",
    `${ROUTES.settings.profile.build(orgSlug)}?tab=offline`,
  );
  await takeScreenshot(page, p, "authentication", ROUTES.authentication.build(orgSlug));
  await takeScreenshot(page, p, "add-ons", ROUTES.addOns.build(orgSlug));
  await takeScreenshot(page, p, "assistant", ROUTES.assistant.build(orgSlug));
  await takeScreenshot(page, p, "mcp-server", ROUTES.mcp.build(orgSlug));

  if (
    shouldCaptureAny(p, [
      "dashboard-omnibox",
      "dashboard-advanced-search-modal",
      "dashboard-shortcuts-modal",
      "dashboard-time-entry-modal",
      "dashboard-loading-skeletons",
    ])
  ) {
    await screenshotDashboardModals(page, orgSlug, p);
    await screenshotDashboardLoadingState(page, orgSlug, p);
  }
  if (shouldCaptureAny(p, ["projects-create-project-modal"])) {
    await screenshotProjectsModal(page, orgSlug, p);
  }

  if (shouldCaptureAny(p, ["documents-search-filtered", "documents-search-empty"])) {
    await screenshotDocumentsStates(page, orgSlug, p);
  }

  if (
    shouldCaptureAny(p, [
      "meetings-detail",
      "meetings-transcript-search",
      "meetings-memory-lens",
      "meetings-processing",
      "meetings-filter-empty",
      "meetings-schedule-dialog",
    ])
  ) {
    await screenshotMeetingsStates(page, orgSlug, p);
  }

  if (
    shouldCaptureAny(p, [
      "outreach-sequences",
      "outreach-contacts",
      "outreach-mailboxes",
      "outreach-analytics",
      "outreach-contact-dialog",
      "outreach-import-dialog",
      "outreach-sequence-dialog",
      "outreach-enroll-dialog",
      "outreach-mailbox-disconnect-confirm",
    ])
  ) {
    await screenshotOutreachStates(page, orgSlug, p);
  }

  if (
    shouldCaptureAny(p, [
      "settings-profile-avatar-upload-modal",
      "settings-profile-cover-upload-modal",
      "settings-notifications-permission-denied",
    ])
  ) {
    const settingsUrl = ROUTES.settings.profile.build(orgSlug);

    if (shouldCapture(p, "settings-profile-avatar-upload-modal")) {
      await runCaptureStep("settings profile avatar upload modal", async () => {
        await page.goto(`${BASE_URL}${settingsUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, settingsUrl, "settings-profile", p);
        await waitForScreenshotReady(page);
        await dismissAllDialogs(page);
        const trigger = page.getByRole("button", { name: /^change avatar$/i });
        const dialog = await openStableDialog(
          page,
          trigger,
          page.getByRole("dialog", { name: /^upload avatar$/i }),
          getUploadDialogReadyLocator(page.getByRole("dialog", { name: /^upload avatar$/i })),
          "avatar upload",
        );
        await captureCurrentView(page, p, "settings-profile-avatar-upload-modal");
        await dismissIfOpen(page, dialog);
      });
    }

    if (shouldCapture(p, "settings-profile-cover-upload-modal")) {
      await runCaptureStep("settings profile cover upload modal", async () => {
        await page.goto(`${BASE_URL}${settingsUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, settingsUrl, "settings-profile", p);
        await waitForScreenshotReady(page);
        await dismissAllDialogs(page);
        const trigger = page.getByRole("button", { name: /^(add|change) cover$/i });
        const dialog = await openStableDialog(
          page,
          trigger,
          page.getByRole("dialog", { name: /^upload cover image$/i }),
          getUploadDialogReadyLocator(page.getByRole("dialog", { name: /^upload cover image$/i })),
          "cover image upload",
        );
        await captureCurrentView(page, p, "settings-profile-cover-upload-modal");
        await dismissIfOpen(page, dialog);
      });
    }

    if (shouldCapture(p, "settings-notifications-permission-denied")) {
      await runCaptureStep("settings notifications permission denied", async () => {
        const permissionPage = await page.context().newPage();
        try {
          await permissionPage.addInitScript(() => {
            window.__NIXELO_E2E_NOTIFICATION_PERMISSION__ = "denied";
            window.__NIXELO_E2E_WEB_PUSH_SUPPORTED__ = true;
            window.__NIXELO_E2E_VAPID_PUBLIC_KEY__ = "e2e-screenshot-vapid-key";
          });

          const notificationsSettingsUrl = `${settingsUrl}?tab=notifications`;
          await permissionPage.goto(`${BASE_URL}${notificationsSettingsUrl}`, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          await waitForExpectedContent(permissionPage, settingsUrl, "settings-profile", p);
          await permissionPage
            .getByText(/browser notifications blocked/i)
            .waitFor({ state: "visible", timeout: 5000 });
          await permissionPage
            .getByRole("button", { name: /^blocked$/i })
            .waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(permissionPage);
          await captureCurrentView(permissionPage, p, "settings-notifications-permission-denied");
        } finally {
          if (!permissionPage.isClosed()) {
            await permissionPage.close();
          }
        }
      });
    }
  }

  // Project sub-pages
  if (projectKey) {
    const tabs = [
      "board",
      "backlog",
      "inbox",
      "sprints",
      "roadmap",
      "calendar",
      "activity",
      "analytics",
      "billing",
      "timesheet",
      "settings",
    ];
    const selectedProjectTabs = tabs.filter((tab) =>
      shouldCapture(p, `project-${normalizedProjectKey}-${tab}`),
    );
    for (const tab of selectedProjectTabs) {
      await takeScreenshot(
        page,
        p,
        `project-${normalizedProjectKey}-${tab}`,
        `/${orgSlug}/projects/${projectKey}/${tab}`,
      );
    }

    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-members`,
        `project-${normalizedProjectKey}-members-confirm-dialog`,
      ])
    ) {
      await runCaptureStep("project members", async () => {
        const settingsUrl = `/${orgSlug}/projects/${projectKey}/settings`;
        await page.goto(`${BASE_URL}${settingsUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, settingsUrl, `project-${normalizedProjectKey}-members`);
        const membersHeading = page.getByRole("heading", { name: /^members$/i });
        await scrollSectionNearViewportTop(membersHeading, page);
        await waitForScreenshotReady(page);
        await captureCurrentView(page, p, `project-${normalizedProjectKey}-members`);

        if (shouldCapture(p, `project-${normalizedProjectKey}-members-confirm-dialog`)) {
          const removeButton = page.getByRole("button", { name: /^remove$/i }).first();
          const dialog = await openStableDialog(
            page,
            removeButton,
            page.getByRole("alertdialog", { name: /^remove member$/i }),
            page
              .getByRole("alertdialog", { name: /^remove member$/i })
              .getByText(/lose access to all project resources\./i),
            "remove member",
          );
          await captureCurrentView(
            page,
            p,
            `project-${normalizedProjectKey}-members-confirm-dialog`,
          );
          await dismissIfOpen(page, dialog);
        }
      });
    }

    if (shouldCapture(p, `project-${normalizedProjectKey}-settings-delete-alert-dialog`)) {
      await runCaptureStep("project settings delete alert dialog", async () => {
        const settingsUrl = `/${orgSlug}/projects/${projectKey}/settings`;
        await page.goto(`${BASE_URL}${settingsUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, settingsUrl, `project-${normalizedProjectKey}-settings`);
        await waitForScreenshotReady(page);
        await dismissAllDialogs(page);
        const trigger = page.getByRole("button", { name: /^delete project$/i });
        const confirmInput = page.getByPlaceholder(`Type ${projectKey} to confirm`);
        await trigger.waitFor({ state: "visible", timeout: 8000 });
        const dialog = await openStableAlertDialog(page, trigger, confirmInput);
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-settings-delete-alert-dialog`,
        );
        await dismissIfOpen(page, dialog);
      });
    }

    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-create-issue-modal`,
        `project-${normalizedProjectKey}-issue-detail-modal`,
        `project-${normalizedProjectKey}-issue-detail-modal-inline-editing`,
      ])
    ) {
      await screenshotBoardModals(page, orgSlug, projectKey, firstIssueKey, p);
    }

    // Create issue — "create another" toggle
    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-create-another`)) {
      await runCaptureStep("create issue create-another toggle", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await dismissAllDialogs(page);
        await projectsPage.openCreateIssueModal();
        await waitForCreateIssueModalScreenshotReady(page, projectsPage);
        // Toggle "Create another" switch
        const toggle = page.getByLabel(/create another/i);
        await toggle.waitFor({ state: "visible", timeout: 5000 });
        await toggle.click();
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-create-issue-create-another`,
        );
        await dismissIfOpen(page, projectsPage.createIssueModal);
      });
    }

    // Create issue — form validation errors (submit with empty title)
    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-validation`)) {
      await runCaptureStep("create issue validation errors", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await dismissAllDialogs(page);
        await projectsPage.openCreateIssueModal();
        await waitForCreateIssueModalScreenshotReady(page, projectsPage);
        // Wait for dialog, then find submit button
        const modal = await waitForDialogOpen(page);
        const submitBtn = modal.getByRole("button", { name: /create issue/i }).last();
        await submitBtn.click();
        await waitForScreenshotReady(page);
        // Wait for validation error text to appear
        await page
          .getByText(/required|title is required|cannot be empty/i)
          .first()
          .waitFor({ state: "visible", timeout: 3000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-create-issue-validation`,
        );
        await dismissIfOpen(page, projectsPage.createIssueModal);
      });
    }

    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-success-toast`)) {
      await runCaptureStep("create issue success toast", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        const issueTitle = "Screenshot toast issue";
        let createdIssue = false;
        let deferredError: Error | null = null;
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await dismissAllDialogs(page);
        await projectsPage.openCreateIssueModal();
        await waitForCreateIssueModalScreenshotReady(page, projectsPage);
        const modal = await waitForDialogOpen(page);
        const titleInput = modal
          .getByPlaceholder(/title|issue.*title/i)
          .or(modal.getByRole("textbox", { name: /title/i }))
          .first();
        const submitButton = modal.getByRole("button", { name: /^create issue$/i }).last();
        try {
          await titleInput.fill(issueTitle);
          await submitButton.click();
          await modal.waitFor({ state: "hidden", timeout: 8000 });
          createdIssue = true;
          const successToast = page
            .getByTestId(TEST_IDS.TOAST.SUCCESS)
            .filter({ hasText: /issue created successfully/i })
            .first();
          await successToast.waitFor({ state: "visible", timeout: 8000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(
            page,
            p,
            `project-${normalizedProjectKey}-create-issue-success-toast`,
          );
        } catch (error) {
          deferredError = error instanceof Error ? error : new Error(String(error));
        }

        if (createdIssue && projectKey) {
          const cleanupResult = await testUserService.deleteSeededProjectIssue(
            orgSlug,
            projectKey,
            issueTitle,
          );
          if (!cleanupResult.success || (cleanupResult.deleted ?? 0) < 1) {
            const cleanupError = new Error(
              cleanupResult.error ??
                `Failed to delete screenshot-created issue "${issueTitle}" after capture`,
            );
            if (deferredError) {
              throw new AggregateError(
                [deferredError, cleanupError],
                "Create-issue success toast capture failed and cleanup did not complete",
              );
            }
            throw cleanupError;
          }
        }

        if (deferredError) {
          throw deferredError;
        }
      });
    }

    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-duplicate-detection`)) {
      await runCaptureStep("create issue duplicate detection", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        const duplicateQuery = "login timeout";
        await waitForDuplicateDetectionSearchReady(orgSlug, projectKey, duplicateQuery);
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await dismissAllDialogs(page);
        await projectsPage.openCreateIssueModal();
        await waitForCreateIssueModalScreenshotReady(page, projectsPage);
        await projectsPage.issueTitleInput.fill(duplicateQuery);
        const duplicateBanner = page.getByText("Potential duplicates found", { exact: true });
        await duplicateBanner.waitFor({ state: "visible", timeout: 20000 });
        await page
          .getByRole("button", { name: /DEMO-2.*fix login timeout on mobile/i })
          .waitFor({ state: "visible", timeout: 8000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          p,
          `project-${normalizedProjectKey}-create-issue-duplicate-detection`,
        );
        await dismissIfOpen(page, projectsPage.createIssueModal);
      });
    }

    if (shouldCapture(p, `project-${normalizedProjectKey}-create-issue-draft-restoration`)) {
      await runCaptureStep("create issue draft restoration", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        const draftTitle = "Restore saved launch checklist";
        if (!projectId) {
          throw new Error("Screenshot seed did not return projectId");
        }

        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        await dismissAllDialogs(page);
        await clearIssueDrafts(page);
        await seedIssueDraft(page, projectId, draftTitle);

        try {
          const projectsPage = new ProjectsPage(page, orgSlug);
          await projectsPage.openCreateIssueModal();
          await waitForCreateIssueModalScreenshotReady(page, projectsPage);
          await page
            .getByText(/you have an unsaved draft/i)
            .waitFor({ state: "visible", timeout: 8000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(
            page,
            p,
            `project-${normalizedProjectKey}-create-issue-draft-restoration`,
          );
          await dismissIfOpen(page, projectsPage.createIssueModal);
        } finally {
          await clearIssueDrafts(page);
        }
      });
    }

    // Sprint selector dropdown (on board)
    if (shouldCapture(p, `project-${normalizedProjectKey}-board-sprint-selector`)) {
      await runCaptureStep("board sprint selector", async () => {
        const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
        await page.goto(`${BASE_URL}${boardUrl}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, boardUrl, "board");
        await waitForScreenshotReady(page);
        const sprintSelect = page
          .getByRole("combobox")
          .filter({ hasText: /sprint|active/i })
          .first();
        await sprintSelect.waitFor({ state: "visible", timeout: 25000 });
        await sprintSelect.click();
        // Wait for dropdown options
        await page.getByRole("option").first().waitFor({ state: "visible", timeout: 3000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(page, p, `project-${normalizedProjectKey}-board-sprint-selector`);
        await page.keyboard.press("Escape");
      });
    }

    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-inbox-closed`,
        `project-${normalizedProjectKey}-inbox-bulk-selection`,
        `project-${normalizedProjectKey}-inbox-snooze-menu`,
        `project-${normalizedProjectKey}-inbox-decline-dialog`,
        `project-${normalizedProjectKey}-inbox-duplicate-dialog`,
        `project-${normalizedProjectKey}-inbox-open-empty`,
        `project-${normalizedProjectKey}-inbox-closed-empty`,
      ])
    ) {
      await screenshotProjectInboxStates(page, orgSlug, projectKey, p);
    }

    // Board interactive states
    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-board-swimlane-priority`,
        `project-${normalizedProjectKey}-board-swimlane-assignee`,
        `project-${normalizedProjectKey}-board-swimlane-type`,
        `project-${normalizedProjectKey}-board-swimlane-label`,
        `project-${normalizedProjectKey}-board-column-collapsed`,
        `project-${normalizedProjectKey}-board-empty-column`,
        `project-${normalizedProjectKey}-board-wip-limit-warning`,
        `project-${normalizedProjectKey}-board-filter-active`,
        `project-${normalizedProjectKey}-board-display-properties`,
        `project-${normalizedProjectKey}-board-peek-mode`,
      ])
    ) {
      await screenshotBoardInteractiveStates(page, orgSlug, projectKey, p);
    }

    // Sprint interactive states
    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-sprints-burndown`,
        `project-${normalizedProjectKey}-sprints-burnup`,
        `project-${normalizedProjectKey}-sprints-completion-modal`,
        `project-${normalizedProjectKey}-sprints-date-overlap-warning`,
        `project-${normalizedProjectKey}-sprints-workload`,
      ])
    ) {
      await screenshotSprintInteractiveStates(page, orgSlug, projectKey, p);
    }

    if (shouldCaptureAny(p, ["issues-side-panel"])) {
      await screenshotIssueInteractiveStates(page, orgSlug, p);
    }

    if (
      shouldCaptureAny(p, [
        "issues-search-filtered",
        "issues-search-empty",
        "issues-filter-active",
        "issues-create-modal",
        "issues-loading",
      ])
    ) {
      await screenshotIssuesStates(page, orgSlug, p);
    }

    // Calendar view modes
    if (
      shouldCaptureAny(p, [
        "calendar-day",
        "calendar-week",
        "calendar-month",
        "calendar-event-modal",
        "calendar-drag-and-drop",
        "calendar-quick-add",
      ])
    ) {
      const calendarUrl = ROUTES.projects.calendar.build(orgSlug, projectKey);
      await page.goto(`${BASE_URL}${calendarUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForScreenshotReady(page);
      const isCalendarReady = await waitForCalendarReady(page);
      if (!isCalendarReady) {
        console.log("    ⚠️  [filled] calendar not ready, skipping mode-specific screenshots");
      } else {
        // Calendar view-mode screenshots: day, week, month
        const calendarModeTestIds = {
          day: TEST_IDS.CALENDAR.MODE_DAY,
          week: TEST_IDS.CALENDAR.MODE_WEEK,
          month: TEST_IDS.CALENDAR.MODE_MONTH,
        } as const;
        for (const mode of ["day", "week", "month"] as const) {
          if (!shouldCapture(p, `calendar-${mode}`)) {
            continue;
          }
          const toggleItem = page.getByTestId(calendarModeTestIds[mode]);
          await toggleItem.waitFor({ state: "visible", timeout: 5000 });
          if ((await toggleItem.count()) === 0) {
            throw new Error(`[${p}] calendar-${mode} toggle not found after retries`);
          }
          await selectCalendarMode(page, mode);
          await waitForScreenshotReady(page);
          const modeReady = await waitForCalendarReady(page);
          if (!modeReady) {
            throw new Error(`[${p}] calendar-${mode} not ready after mode switch`);
          }
          await focusCalendarTimedContentForCapture(page);
          await captureCurrentView(page, p, `calendar-${mode}`);
        }

        if (shouldCapture(p, "calendar-event-modal")) {
          await runCaptureStep("calendar event-detail modal", async () => {
            const openDayView = async (): Promise<void> => {
              const dayToggle = page.getByTestId(TEST_IDS.CALENDAR.MODE_DAY);
              if ((await dayToggle.count()) > 0) {
                await dayToggle.click();
                await waitForScreenshotReady(page);
                await waitForCalendarReady(page);
              }
            };

            const locateEvent = () => page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM).first();

            let eventItem = locateEvent();
            if (typeof seed.workspaceSlug === "string") {
              await page.goto(
                `${BASE_URL}${ROUTES.workspaces.calendar.build(orgSlug, seed.workspaceSlug)}`,
                {
                  waitUntil: "domcontentloaded",
                  timeout: 15000,
                },
              );
              await waitForScreenshotReady(page);
              const workspaceCalendarReady = await waitForCalendarReady(page);
              if (workspaceCalendarReady) {
                await openDayView();
                eventItem = locateEvent();
              }
            } else {
              await openDayView();
              eventItem = locateEvent();
            }

            if (!(await waitForCalendarEvents(page))) {
              throw new Error(`[${p}] No calendar events found for modal screenshot`);
            }

            eventItem = locateEvent();
            await eventItem.scrollIntoViewIfNeeded();
            await eventItem.click();
            const dialog = page.getByTestId(TEST_IDS.CALENDAR.EVENT_DETAILS_MODAL);
            await dialog.waitFor({ state: "visible", timeout: 5000 });
            await captureCurrentView(page, p, "calendar-event-modal");
            await dismissIfOpen(page, dialog);
          });
        }

        if (shouldCapture(p, "calendar-quick-add")) {
          await runCaptureStep("calendar quick-add", async () => {
            await waitForCalendarMonthReady(page);
            await waitForCalendarMonthGrid(page, { requireQuickAddButtons: true });

            const quickAddButton = page.getByTestId(TEST_IDS.CALENDAR.QUICK_ADD_DAY).first();
            if ((await quickAddButton.count()) > 0) {
              if (!(await quickAddButton.isVisible())) {
                const firstDayCell = page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL).first();
                if ((await firstDayCell.count()) > 0) {
                  await firstDayCell.hover();
                }
              }
            }

            if ((await quickAddButton.count()) > 0 && (await quickAddButton.isVisible())) {
              await quickAddButton.click();
            } else {
              const headerAddButton = page.getByRole("button", { name: /add event/i });
              await headerAddButton.waitFor({ state: "visible", timeout: 5000 });
              await headerAddButton.click();
            }
            const dialog = await waitForDialogOpen(page);
            await page.getByLabel(/date/i).waitFor({ state: "visible", timeout: 5000 });
            await waitForScreenshotReady(page);
            await captureCurrentView(page, p, "calendar-quick-add");
            await dismissIfOpen(page, dialog);
          });
        }

        if (
          shouldCapture(p, "calendar-drag-and-drop") &&
          supportsCalendarDragAndDropCapture(captureState.currentConfigPrefix)
        ) {
          await runCaptureStep("calendar drag-and-drop", async () => {
            const orgCalendarUrl = ROUTES.calendar.build(orgSlug);
            await page.goto(`${BASE_URL}${orgCalendarUrl}`, {
              waitUntil: "domcontentloaded",
              timeout: 15000,
            });
            await waitForExpectedContent(page, orgCalendarUrl, "org-calendar");
            await waitForScreenshotReady(page);
            await waitForCalendarMonthReady(page);
            await waitForCalendarEvents(page);

            const dragState = await getCalendarDragState(page);

            if (dragState?.sourceIndex == null || dragState.targetIndex == null) {
              throw new Error(
                `[${p}] Unable to establish calendar drag state (day cells=${dragState?.dayCellCount ?? 0}, events=${dragState?.eventItemCount ?? 0})`,
              );
            }

            const dayCells = page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL);
            const targetCell = dayCells.nth(dragState.targetIndex);
            const sourceCell = dayCells.nth(dragState.sourceIndex);
            const sourceEvent = sourceCell.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM).first();
            const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

            await sourceEvent.scrollIntoViewIfNeeded();
            await targetCell.waitFor({ state: "visible", timeout: 5000 });
            await targetCell.scrollIntoViewIfNeeded();
            await sourceEvent.dispatchEvent("dragstart", { dataTransfer });
            await targetCell.dispatchEvent("dragenter", { dataTransfer });
            await targetCell.dispatchEvent("dragover", { dataTransfer });
            await targetCell
              .getByTestId(TEST_IDS.CALENDAR.DAY_CELL_DROP_TARGET)
              .waitFor({ state: "attached", timeout: 5000 });
            await waitForScreenshotReady(page);
            await captureCurrentView(page, p, "calendar-drag-and-drop");

            await sourceEvent.dispatchEvent("dragend", { dataTransfer });
          });
        }
      }
    }
  }

  // Issue detail
  const seededIssueKey = seed.issueKeys?.[0];
  if (seededIssueKey && shouldCapture(p, `issue-${seededIssueKey.toLowerCase()}`)) {
    const firstIssue = (await discoverIssueKey(page, orgSlug, projectKey)) ?? seededIssueKey;
    if (firstIssue) {
      await takeScreenshot(
        page,
        p,
        `issue-${firstIssue.toLowerCase()}`,
        ROUTES.issues.detail.build(orgSlug, firstIssue),
      );
    }
  }

  // Workspace & team pages
  const wsSlug = seed.workspaceSlug;
  const teamSlug = seed.teamSlug;

  if (wsSlug) {
    const wsBase = ROUTES.workspaces.detail.build(orgSlug, wsSlug);
    const wsTabs = ["backlog", "calendar", "sprints", "dependencies", "wiki", "settings"] as const;
    const workspaceTargets = [
      `workspace-${wsSlug}`,
      ...wsTabs.map((tab) => `workspace-${wsSlug}-${tab}`),
    ];
    if (shouldCaptureAny(p, workspaceTargets)) {
      await takeScreenshot(page, p, `workspace-${wsSlug}`, wsBase);
      for (const tab of wsTabs) {
        await takeScreenshot(page, p, `workspace-${wsSlug}-${tab}`, `${wsBase}/${tab}`);
      }
    }

    const resolvedTeam = teamSlug ?? (await discoverFirstHref(page, /\/teams\/([^/]+)/));
    if (resolvedTeam) {
      const teamBase = `${wsBase}/teams/${resolvedTeam}`;
      const teamTabs = ["board", "calendar", "wiki", "settings"] as const;
      const teamTargets = [
        `team-${resolvedTeam}`,
        ...teamTabs.map((tab) => `team-${resolvedTeam}-${tab}`),
      ];
      if (shouldCaptureAny(p, teamTargets)) {
        await takeScreenshot(page, p, `team-${resolvedTeam}`, teamBase);
        for (const tab of teamTabs) {
          await takeScreenshot(page, p, `team-${resolvedTeam}-${tab}`, `${teamBase}/${tab}`);
        }
      }
    }
  }

  // Document editor
  const editorTargets = [
    "document-editor",
    "document-editor-move-dialog",
    "document-editor-markdown-preview-modal",
    "document-editor-favorite",
    "document-editor-sidebar-favorites",
    "document-editor-locked",
    "document-editor-rich-blocks",
    "document-editor-color-picker",
    "document-editor-slash-menu",
    "document-editor-floating-toolbar",
    "document-editor-mention-popover",
  ];
  if (shouldCaptureAny(p, editorTargets)) {
    const baseDocId =
      seed.documentIds?.sprintRetrospectiveNotes ??
      seed.documentIds?.projectRequirements ??
      (await discoverDocumentId(page, orgSlug));
    if (baseDocId) {
      const baseDocUrl = ROUTES.documents.detail.build(orgSlug, baseDocId);
      await takeScreenshot(page, p, "document-editor", baseDocUrl);

      // Document editor interactive states
      if (shouldCapture(p, "document-editor-move-dialog")) {
        await runCaptureStep("document move dialog", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          await openDocumentActionsMenu(page);
          await page.getByRole("menuitem", { name: /move to another project/i }).click();
          await page
            .getByRole("dialog", { name: /move document/i })
            .waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-move-dialog");
          await page.keyboard.press("Escape");
        });
      }

      if (shouldCapture(p, "document-editor-markdown-preview-modal")) {
        await runRequiredCaptureStep("document markdown preview modal", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          const dialog = await openMarkdownImportPreviewDialog(
            page,
            MARKDOWN_IMPORT_PREVIEW,
            "import.md",
          );
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-markdown-preview-modal");
          await dismissIfOpen(page, dialog);
        });
      }

      if (shouldCapture(p, "document-editor-favorite")) {
        await runCaptureStep("document favorite state", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          const toggle = page.getByRole("button", { name: /add to favorites/i });
          await toggle.waitFor({ state: "visible", timeout: 8000 });
          await toggle.click();
          const activeToggle = page.getByRole("button", { name: /remove from favorites/i });
          await activeToggle.waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-favorite");
          await activeToggle.click();
          await toggle.waitFor({ state: "visible", timeout: 5000 });
        });
      }

      if (shouldCapture(p, "document-editor-sidebar-favorites")) {
        await runCaptureStep("document sidebar favorites", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          const toggle = page.getByRole("button", { name: /add to favorites/i });
          await toggle.waitFor({ state: "visible", timeout: 8000 });
          await toggle.click();
          const activeToggle = page.getByRole("button", { name: /remove from favorites/i });
          await activeToggle.waitFor({ state: "visible", timeout: 5000 });
          await page
            .locator("aside")
            .getByText("Favorites")
            .waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-sidebar-favorites");
          await activeToggle.click();
          await toggle.waitFor({ state: "visible", timeout: 5000 });
        });
      }

      if (shouldCapture(p, "document-editor-rich-blocks")) {
        await runRequiredCaptureStep("document rich blocks", async () => {
          await primeDocumentEditorRichContent(page, baseDocUrl);
          await captureCurrentView(page, p, "document-editor-rich-blocks");
        });
      }

      if (shouldCapture(p, "document-editor-color-picker")) {
        await runRequiredCaptureStep("document color picker", async () => {
          await openDocumentEditorFloatingToolbarForCapture(page, baseDocUrl);
          const colorButton = page.getByRole("button", { name: /^text color$/i });
          await colorButton.waitFor({ state: "visible", timeout: 5000 });
          await colorButton.evaluate((button: HTMLElement) => {
            button.click();
          });
          await page.getByTitle("Red").waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-color-picker");
          await page.keyboard.press("Escape");
          await page.mouse.click(10, 10);
        });
      }

      // Slash menu — type "/" at end of content
      if (shouldCapture(p, "document-editor-slash-menu")) {
        await runRequiredCaptureStep("document slash menu", async () => {
          await openDocumentEditorSlashMenuForCapture(page, baseDocUrl);
          await captureCurrentView(page, p, "document-editor-slash-menu");
          // Dismiss and undo
          await page.keyboard.press("Escape");
        });
      }

      // Floating toolbar — select text in the editor
      if (shouldCapture(p, "document-editor-floating-toolbar")) {
        await runRequiredCaptureStep("document floating toolbar", async () => {
          await openDocumentEditorFloatingToolbarForCapture(page, baseDocUrl);
          await captureCurrentView(page, p, "document-editor-floating-toolbar");
          // Click away to deselect
          await page.mouse.click(10, 10);
        });
      }

      // @mention popover — type "@" in editor
      if (shouldCapture(p, "document-editor-mention-popover")) {
        await runRequiredCaptureStep("document mention popover", async () => {
          await openDocumentEditorMentionPopoverForCapture(page, baseDocUrl);
          await captureCurrentView(page, p, "document-editor-mention-popover");
          await page.keyboard.press("Escape");
        });
      }

      if (shouldCapture(p, "document-editor-locked")) {
        await runCaptureStep("document locked state", async () => {
          await openDocumentEditorForCapture(page, baseDocUrl);
          await openDocumentActionsMenu(page);
          await page.getByRole("menuitem", { name: /^lock document$/i }).click();
          await page
            .getByRole("alert")
            .filter({ hasText: /document locked/i })
            .first()
            .waitFor({ state: "visible", timeout: 5000 });
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-locked");
          await openDocumentActionsMenu(page);
          await page.getByRole("menuitem", { name: /^unlock document$/i }).click();
          await page
            .getByRole("alert")
            .filter({ hasText: /document locked/i })
            .first()
            .waitFor({ state: "hidden", timeout: 5000 });
        });
      }
    }
  }

  // ── Additional modal captures ──

  // Dashboard customize modal
  if (shouldCapture(p, "dashboard-customize-modal")) {
    await runCaptureStep("dashboard customize modal", async () => {
      await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.dashboard.build(orgSlug), "dashboard");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByRole("button", { name: /^customize$/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /dashboard customization/i }),
        page.getByText("Quick Stats", { exact: true }),
        "dashboard customize",
      );
      await waitForDashboardCustomizeDialogReady(page);
      await captureCurrentView(page, p, "dashboard-customize-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // Create event modal (from calendar)
  if (projectKey && shouldCapture(p, "calendar-create-event-modal")) {
    await runCaptureStep("calendar create-event modal", async () => {
      await page.goto(`${BASE_URL}${ROUTES.projects.calendar.build(orgSlug, projectKey)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForScreenshotReady(page);
      await waitForCalendarReady(page);
      const trigger = page.getByRole("button", { name: /add event/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^create event$/i }),
        page.getByLabel(/event title/i),
        "calendar create event",
      );
      await captureCurrentView(page, p, "calendar-create-event-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // Create workspace modal
  if (shouldCapture(p, "workspaces-create-workspace-modal")) {
    await runCaptureStep("create workspace modal", async () => {
      await page.goto(`${BASE_URL}${ROUTES.workspaces.list.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.workspaces.list.build(orgSlug), "workspaces", p);
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByText("Create Workspace");
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^create workspace$/i }),
        page.getByRole("dialog", { name: /^create workspace$/i }).getByLabel(/^workspace name$/i),
        "create workspace",
      );
      await captureCurrentView(page, p, "workspaces-create-workspace-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // Create team modal (from workspace detail)
  if (wsSlug && shouldCapture(p, "workspace-create-team-modal")) {
    await runCaptureStep("create team modal", async () => {
      const wsBase = ROUTES.workspaces.detail.build(orgSlug, wsSlug);
      await page.goto(`${BASE_URL}${wsBase}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await waitForExpectedContent(page, wsBase, `workspace-${wsSlug}`);
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByText("Create Team");
      await trigger.waitFor({ state: "visible", timeout: 10000 });
      await trigger.click();
      const dialog = await waitForDialogOpen(page);
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "workspace-create-team-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // Import/export modal (from board)
  if (projectKey && shouldCapture(p, `project-${normalizedProjectKey}-import-export-modal`)) {
    await runCaptureStep("import/export modal", async () => {
      const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
      await page.goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await waitForExpectedContent(page, boardUrl, "board");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByRole("button", { name: /import \/ export/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^import \/ export issues$/i }),
        page.getByText("Select Export Format", { exact: true }),
        "import/export",
      );
      await captureCurrentView(page, p, `project-${normalizedProjectKey}-import-export-modal`);
      await dismissIfOpen(page, dialog);
    });
  }

  if (
    projectKey &&
    shouldCapture(p, `project-${normalizedProjectKey}-import-export-modal-import`)
  ) {
    await runCaptureStep("import/export modal import state", async () => {
      const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
      await page.goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await waitForExpectedContent(page, boardUrl, "board");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByRole("button", { name: /import \/ export/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^import \/ export issues$/i }),
        page.getByText("Select Export Format", { exact: true }),
        "import/export",
      );
      await dialog.getByRole("radio", { name: /import issues/i }).click();
      await dialog.getByText("JSON", { exact: true }).click();
      await dialog
        .getByText("JSON files must contain an issues array at the top level.", { exact: true })
        .waitFor({
          state: "visible",
          timeout: 5000,
        });
      await waitForAnimation(page);
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        p,
        `project-${normalizedProjectKey}-import-export-modal-import`,
      );
      await dismissIfOpen(page, dialog);
    });
  }

  // Manual time entry modal
  if (shouldCapture(p, "time-tracking-manual-entry-modal")) {
    await runCaptureStep("manual time entry modal", async () => {
      await page.goto(`${BASE_URL}${ROUTES.timeTracking.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.timeTracking.build(orgSlug), "time-tracking");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      const trigger = page.getByRole("button", { name: /add time entry/i });
      const dialog = await openStableDialog(
        page,
        trigger,
        page.getByRole("dialog", { name: /^log time$/i }),
        page.getByTestId(TEST_IDS.TIME_TRACKING.ENTRY_FORM),
        "manual time entry",
      );
      await captureCurrentView(page, p, "time-tracking-manual-entry-modal");
      await dismissIfOpen(page, dialog);
    });
  }

  // ── Navigation / Shell states ──

  // Sidebar collapsed
  if (
    shouldCapture(p, "sidebar-collapsed") &&
    (captureState.currentConfigPrefix === "desktop-dark" ||
      captureState.currentConfigPrefix === "desktop-light")
  ) {
    await runCaptureStep("sidebar collapsed", async () => {
      await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.dashboard.build(orgSlug), "dashboard");
      await waitForScreenshotReady(page);
      const collapseBtn = page.getByLabel("Collapse sidebar");
      await collapseBtn.waitFor({ state: "visible", timeout: 5000 });
      await collapseBtn.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "sidebar-collapsed");
      // Expand back
      const expandBtn = page.getByLabel("Expand sidebar");
      if (await isLocatorVisible(expandBtn)) {
        await expandBtn.click();
        await waitForScreenshotReady(page);
      }
    });
  }

  if (
    shouldCapture(p, "mobile-hamburger") &&
    (captureState.currentConfigPrefix === "tablet-light" ||
      captureState.currentConfigPrefix === "mobile-light")
  ) {
    await runCaptureStep("mobile hamburger", async () => {
      const dashboardUrl = ROUTES.dashboard.build(orgSlug);
      await page.goto(`${BASE_URL}${dashboardUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, dashboardUrl, "dashboard");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      await openMobileSidebarMenu(page);
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "mobile-hamburger");
    });
  }

  if (shouldCapture(p, "project-tree")) {
    await runCaptureStep("project tree", async () => {
      const teamBoardUrl = ROUTES.workspaces.teams.board.build(
        orgSlug,
        seed.workspaceSlug ?? "product",
        seed.teamSlug ?? "engineering",
      );
      await page.goto(`${BASE_URL}${teamBoardUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, teamBoardUrl, "team");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);

      if (
        captureState.currentConfigPrefix === "tablet-light" ||
        captureState.currentConfigPrefix === "mobile-light"
      ) {
        await openMobileSidebarMenu(page);
      }

      await page
        .getByRole("link", { name: /DEMO - Demo Project/i })
        .waitFor({ state: "visible", timeout: 8000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "project-tree");
    });
  }

  // 404 page (navigate to bogus URL while authenticated)
  if (shouldCapture(p, "404-page")) {
    await runCaptureStep("404 page", async () => {
      await page.goto(`${BASE_URL}/${orgSlug}/nonexistent-page-screenshot-test`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForScreenshotReady(page);
      // Wait for the 404 content to render
      await page
        .getByText(/not found|page.*not.*found|404/i)
        .first()
        .waitFor({ state: "visible", timeout: 8000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "404-page");
    });
  }

  // ── Outreach state captures ──

  async function screenshotOutreachStates(
    currentPage: Page,
    currentOrgSlug: string,
    prefix: string,
  ): Promise<void> {
    const outreachPage = new OutreachPage(currentPage, currentOrgSlug);
    await outreachPage.goto();

    if (shouldCapture(prefix, "outreach-sequences")) {
      await runCaptureStep("outreach sequences tab", async () => {
        await outreachPage.openSection("sequences");
        await captureCurrentView(currentPage, prefix, "outreach-sequences");
      });
    }

    if (shouldCapture(prefix, "outreach-contacts")) {
      await runCaptureStep("outreach contacts tab", async () => {
        await outreachPage.openSection("contacts");
        await outreachPage.waitForSeededContacts();
        await captureCurrentView(currentPage, prefix, "outreach-contacts");
      });
    }

    if (shouldCapture(prefix, "outreach-mailboxes")) {
      await runCaptureStep("outreach mailboxes tab", async () => {
        await outreachPage.openSection("mailboxes");
        await outreachPage.waitForSeededMailbox();
        await captureCurrentView(currentPage, prefix, "outreach-mailboxes");
      });
    }

    if (shouldCapture(prefix, "outreach-analytics")) {
      await runCaptureStep("outreach analytics tab", async () => {
        await outreachPage.openSection("analytics");
        await outreachPage.waitForAnalyticsContent();
        await waitForScreenshotReady(currentPage);
        await captureCurrentView(currentPage, prefix, "outreach-analytics");
      });
    }

    if (shouldCapture(prefix, "outreach-contact-dialog")) {
      await runCaptureStep("outreach contact dialog", async () => {
        await outreachPage.openContactDialog();
        await captureCurrentView(currentPage, prefix, "outreach-contact-dialog");
        await dismissIfOpen(currentPage, outreachPage.contactDialog);
      });
    }

    if (shouldCapture(prefix, "outreach-import-dialog")) {
      await runCaptureStep("outreach import dialog", async () => {
        await outreachPage.openImportDialog();
        await captureCurrentView(currentPage, prefix, "outreach-import-dialog");
        await dismissIfOpen(currentPage, outreachPage.importDialog);
      });
    }

    if (shouldCapture(prefix, "outreach-sequence-dialog")) {
      await runCaptureStep("outreach sequence dialog", async () => {
        await outreachPage.openSequenceDialog();
        await captureCurrentView(currentPage, prefix, "outreach-sequence-dialog");
        await dismissIfOpen(currentPage, outreachPage.sequenceDialog);
      });
    }

    if (shouldCapture(prefix, "outreach-enroll-dialog")) {
      await runCaptureStep("outreach enroll dialog", async () => {
        await outreachPage.openEnrollDialog();
        await captureCurrentView(currentPage, prefix, "outreach-enroll-dialog");
        await dismissIfOpen(currentPage, outreachPage.enrollDialog);
      });
    }

    if (shouldCapture(prefix, "outreach-mailbox-disconnect-confirm")) {
      await runCaptureStep("outreach mailbox disconnect confirm", async () => {
        await outreachPage.openMailboxDisconnectConfirm();
        await captureCurrentView(currentPage, prefix, "outreach-mailbox-disconnect-confirm");
        await dismissIfOpen(currentPage, outreachPage.mailboxDisconnectConfirm);
      });
    }
  }

  // ── Roadmap interactive states ──

  if (projectKey && shouldCapture(p, `project-${normalizedProjectKey}-roadmap-timeline-selector`)) {
    await runCaptureStep("roadmap timeline selector", async () => {
      const roadmapUrl = ROUTES.projects.roadmap.build(orgSlug, projectKey);
      await page.goto(`${BASE_URL}${roadmapUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, roadmapUrl, "roadmap");
      await waitForScreenshotReady(page);
      // Click the timeline span select trigger (shows "3 Months" by default)
      const selectTrigger = page
        .getByRole("combobox")
        .filter({ hasText: /month|year/i })
        .first();
      await selectTrigger.waitFor({ state: "visible", timeout: 5000 });
      await selectTrigger.click();
      // Wait for dropdown options
      await page
        .getByRole("option", { name: /1 month/i })
        .first()
        .waitFor({ state: "visible", timeout: 3000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        p,
        `project-${normalizedProjectKey}-roadmap-timeline-selector`,
      );
      // Close dropdown
      await page.keyboard.press("Escape");
    });
  }

  // ── Notification interactive states ──

  async function openNotificationPanel(): Promise<Locator> {
    const bellButton = page.getByTestId(TEST_IDS.HEADER.NOTIFICATION_BUTTON);
    const panel = page.getByTestId(TEST_IDS.HEADER.NOTIFICATION_PANEL);
    let lastError: Error | null = null;

    await bellButton.waitFor({ state: "visible", timeout: 5000 });

    if (await panel.isVisible()) {
      return panel;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await bellButton.click();
        await panel.waitFor({ state: "visible", timeout: 5000 });
        await panel.getByRole("heading", { name: /^notifications$/i }).waitFor({
          state: "visible",
          timeout: 5000,
        });
        await waitForAnimation(page);
        return panel;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        await page.keyboard.press("Escape");
        await panel.waitFor({ state: "hidden", timeout: 2000 });
      }
    }

    throw new Error(`Notification panel did not open: ${lastError?.message ?? "unknown error"}`);
  }

  async function waitForNotificationsContentReady(): Promise<void> {
    const notificationItems = page.getByTestId(TEST_IDS.NOTIFICATION.ITEM);
    const emptyState = page.getByText(/no notifications/i);
    const mentionsFilter = page.getByRole("button", { name: /^mentions$/i });

    await expect
      .poll(
        async () => {
          const mentionsVisible = await isLocatorVisible(mentionsFilter);
          const itemCount = await getLocatorCount(notificationItems);
          const emptyVisible = await isLocatorVisible(emptyState);

          return mentionsVisible && (itemCount > 0 || emptyVisible) ? "ready" : "pending";
        },
        {
          timeout: 10000,
          message: "Expected notifications content or empty state to become visible",
        },
      )
      .toBe("ready");
  }

  async function waitForMentionsFilterState(): Promise<void> {
    const mentionsFilter = page.getByRole("button", { name: /^mentions$/i });
    const mentionNotification = page.getByText(/you were mentioned/i);
    const emptyState = page.getByText(/no notifications/i);

    await expect
      .poll(
        async () => {
          const classes = (await getLocatorAttribute(mentionsFilter, "class", "")) ?? "";
          const filterActive = classes.includes("bg-ui-bg-secondary");
          const mentionVisible = await isLocatorVisible(mentionNotification);
          const emptyVisible = await isLocatorVisible(emptyState);

          return filterActive && (mentionVisible || emptyVisible) ? "ready" : "pending";
        },
        {
          timeout: 10000,
          message: "Expected Mentions filter results to finish rendering",
        },
      )
      .toBe("ready");

    await waitForAnimation(page);
  }

  // Notification popover (bell icon in header)
  if (shouldCapture(p, "notification-popover")) {
    await runCaptureStep("notification popover", async () => {
      // Navigate to dashboard to have a clean header
      await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.dashboard.build(orgSlug), "dashboard");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);
      await openNotificationPanel();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "notification-popover");
      // Close popover
      await page.keyboard.press("Escape");
    });
  }

  if (shouldCapture(p, "notification-snooze-popover")) {
    await runCaptureStep("notification snooze popover", async () => {
      await page.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.notifications.build(orgSlug), "notifications");
      await waitForScreenshotReady(page);
      await dismissAllDialogs(page);

      const firstNotification = page.getByTestId(TEST_IDS.NOTIFICATION.ITEM).first();
      await firstNotification.waitFor({ state: "visible", timeout: 5000 });
      await firstNotification.hover();
      await waitForAnimation(page);

      const snoozeButton = firstNotification.getByRole("button", { name: /snooze notification/i });
      await snoozeButton.waitFor({ state: "visible", timeout: 5000 });
      await snoozeButton.click();

      await page.getByText(/snooze until/i).waitFor({ state: "visible", timeout: 5000 });
      await waitForAnimation(page);
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "notification-snooze-popover");
      await page.keyboard.press("Escape");
    });
  }

  // Notifications page — archived tab
  if (shouldCapture(p, "notifications-archived")) {
    await runCaptureStep("notifications archived tab", async () => {
      await page.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.notifications.build(orgSlug), "notifications");
      await waitForScreenshotReady(page);
      const archivedTab = page.getByRole("tab", { name: /archived/i });
      await archivedTab.waitFor({ state: "visible", timeout: 5000 });
      await archivedTab.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "notifications-archived");
    });
  }

  // Notifications page — filter active (Mentions filter)
  if (shouldCapture(p, "notifications-filter-active")) {
    await runCaptureStep("notifications filter active", async () => {
      await page.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, ROUTES.notifications.build(orgSlug), "notifications");
      await waitForNotificationsContentReady();
      // Click the Mentions filter button
      const mentionsFilter = page.getByRole("button", { name: /^mentions$/i });
      await mentionsFilter.waitFor({ state: "visible", timeout: 5000 });
      await mentionsFilter.click();
      await waitForMentionsFilterState();
      await captureCurrentView(page, p, "notifications-filter-active");
    });
  }
}
