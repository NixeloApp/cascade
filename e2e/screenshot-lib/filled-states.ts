/**
 * Filled States Screenshot Pass
 *
 * The main screenshot capture function that navigates through all authenticated
 * pages with seeded data. Captures dashboard, projects, boards, issues, documents,
 * calendar, workspaces, settings, and all their sub-states.
 */

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import {
  AnalyticsPage,
  CalendarPage,
  DashboardPage,
  DocumentsPage,
  NotificationsPage,
  ProjectsPage,
  SettingsPage,
  TimeTrackingPage,
  WorkspacesPage,
} from "../pages";
import { OutreachPage } from "../pages/outreach.page";
import { injectAuthTokens } from "../utils/auth-helpers";
import { type SeedScreenshotResult, testUserService } from "../utils/test-user-service";
import {
  dismissAllDialogs,
  dismissIfOpen,
  waitForAnimation,
  waitForDialogOpen,
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
import {
  BASE_URL,
  MARKDOWN_IMPORT_PREVIEW,
  MARKDOWN_RICH_CONTENT,
  SCREENSHOT_USER,
} from "./config";
import {
  clearIssueDrafts,
  getSeededTeamSlug,
  requirePrimarySeededDocumentId,
  requireSeededIssueKey,
  seedIssueDraft,
} from "./helpers";
import {
  screenshotAssistantStates,
  screenshotBoardInteractiveStates,
  screenshotBoardLoadingState,
  screenshotBoardModals,
  screenshotDashboardLoadingState,
  screenshotDashboardModals,
  screenshotDocumentsStates,
  screenshotInvoicesStates,
  screenshotIssueInteractiveStates,
  screenshotIssuesStates,
  screenshotMeetingsStates,
  screenshotMyIssuesStates,
  screenshotOrgCalendarStates,
  screenshotProjectInboxStates,
  screenshotProjectsModal,
  screenshotProjectsStates,
  screenshotRoadmapStates,
  screenshotSprintInteractiveStates,
} from "./interactive-captures";
import {
  scrollSectionNearViewportTop,
  supportsCalendarDragAndDropCapture,
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
  await screenshotProjectsStates(page, orgSlug, p);
  await takeScreenshot(page, p, "issues", ROUTES.issues.list.build(orgSlug));
  await takeScreenshot(page, p, "documents", ROUTES.documents.list.build(orgSlug));
  await takeScreenshot(page, p, "documents-templates", ROUTES.documents.templates.build(orgSlug));
  await takeScreenshot(page, p, "workspaces", ROUTES.workspaces.list.build(orgSlug));
  await takeScreenshot(page, p, "time-tracking", ROUTES.timeTracking.build(orgSlug));
  await takeScreenshot(page, p, "notifications", ROUTES.notifications.build(orgSlug));
  await takeScreenshot(page, p, "my-issues", ROUTES.myIssues.build(orgSlug));
  await takeScreenshot(page, p, "org-calendar", ROUTES.calendar.build(orgSlug));
  await screenshotInvoicesStates(page, orgSlug, p);
  await takeScreenshot(page, p, "clients", ROUTES.clients.list.build(orgSlug));
  await takeScreenshot(page, p, "meetings", ROUTES.meetings.build(orgSlug));
  await takeScreenshot(page, p, "outreach", ROUTES.outreach.build(orgSlug));
  await takeScreenshot(page, p, "settings", ROUTES.settings.profile.build(orgSlug));
  await takeScreenshot(page, p, "settings-profile", ROUTES.settings.profile.build(orgSlug));
  await takeScreenshot(
    page,
    p,
    "settings-integrations",
    ROUTES.settings.profile.build(orgSlug, "integrations"),
  );
  await takeScreenshot(page, p, "settings-admin", ROUTES.settings.profile.build(orgSlug, "admin"));
  await takeScreenshot(
    page,
    p,
    "settings-notifications",
    ROUTES.settings.profile.build(orgSlug, "notifications"),
  );

  if (projectKey) {
    const orgAnalyticsCaptureNames = [
      "org-analytics",
      "org-analytics-sparse-data",
      "org-analytics-no-activity",
    ] as const;

    if (shouldCaptureAny(p, [...orgAnalyticsCaptureNames])) {
      await runCaptureStep("org analytics states", async () => {
        const analyticsUrl = ROUTES.analytics.build(orgSlug);
        const applyOrgAnalyticsState = async (
          mode: "default" | "sparseData" | "noActivity",
        ): Promise<void> => {
          const result = await testUserService.configureOrgAnalyticsState(
            orgSlug,
            projectKey,
            mode,
          );
          if (!result.success) {
            throw new Error(
              result.error ?? `Failed to configure org analytics screenshot state: ${mode}`,
            );
          }
        };

        const captureOrgAnalyticsState = async ({
          capturePage,
          expectedState,
          name,
        }: {
          capturePage: Page;
          expectedState: "canonical" | "noActivity";
          name: (typeof orgAnalyticsCaptureNames)[number];
        }): Promise<void> => {
          await capturePage.goto(`${BASE_URL}${analyticsUrl}`, { waitUntil: "domcontentloaded" });
          const analyticsPage = new AnalyticsPage(capturePage, orgSlug);
          if (expectedState === "canonical") {
            await analyticsPage.expectCanonicalState();
          } else {
            await analyticsPage.expectNoActivityState();
          }
          await waitForScreenshotReady(capturePage);
          await captureCurrentView(capturePage, p, name);
        };

        await applyOrgAnalyticsState("default");

        if (shouldCapture(p, "org-analytics")) {
          await captureOrgAnalyticsState({
            capturePage: page,
            expectedState: "canonical",
            name: "org-analytics",
          });
        }

        if (shouldCapture(p, "org-analytics-sparse-data")) {
          await applyOrgAnalyticsState("sparseData");
          const sparsePage = await page.context().newPage();
          try {
            try {
              await captureOrgAnalyticsState({
                capturePage: sparsePage,
                expectedState: "canonical",
                name: "org-analytics-sparse-data",
              });
            } finally {
              await applyOrgAnalyticsState("default");
            }
          } finally {
            await sparsePage.close();
          }
        }

        if (shouldCapture(p, "org-analytics-no-activity")) {
          await applyOrgAnalyticsState("noActivity");
          const noActivityPage = await page.context().newPage();
          try {
            try {
              await captureOrgAnalyticsState({
                capturePage: noActivityPage,
                expectedState: "noActivity",
                name: "org-analytics-no-activity",
              });
            } finally {
              await applyOrgAnalyticsState("default");
            }
          } finally {
            await noActivityPage.close();
          }
        }

        await applyOrgAnalyticsState("default");
      });
    }
  } else if (shouldCapture(p, "org-analytics")) {
    await takeScreenshot(page, p, "org-analytics", ROUTES.analytics.build(orgSlug));
  }
  await takeScreenshot(
    page,
    p,
    "settings-security",
    ROUTES.settings.profile.build(orgSlug, "security"),
  );
  await takeScreenshot(
    page,
    p,
    "settings-apikeys",
    ROUTES.settings.profile.build(orgSlug, "apikeys"),
  );
  await takeScreenshot(
    page,
    p,
    "settings-preferences",
    ROUTES.settings.profile.build(orgSlug, "preferences"),
  );
  await takeScreenshot(
    page,
    p,
    "settings-offline",
    ROUTES.settings.profile.build(orgSlug, "offline"),
  );
  await takeScreenshot(page, p, "authentication", ROUTES.authentication.build(orgSlug));
  await takeScreenshot(page, p, "add-ons", ROUTES.addOns.build(orgSlug));
  await takeScreenshot(page, p, "mcp-server", ROUTES.mcp.build(orgSlug));

  if (
    shouldCaptureAny(p, [
      "assistant",
      "assistant-conversations",
      "assistant-overview-empty",
      "assistant-conversations-empty",
      "assistant-loading",
    ])
  ) {
    await screenshotAssistantStates(page, orgSlug, p);
  }

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
      "org-calendar-workspace-scope",
      "org-calendar-team-scope",
      "org-calendar-loading",
      "my-issues-filter-active",
      "my-issues-filtered-empty",
      "my-issues-loading",
    ])
  ) {
    await screenshotOrgCalendarStates(page, orgSlug, p);
  }

  if (
    shouldCaptureAny(p, [
      "my-issues-filter-active",
      "my-issues-filtered-empty",
      "my-issues-loading",
    ])
  ) {
    await screenshotMyIssuesStates(page, orgSlug, p);
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
    const settingsPage = new SettingsPage(page, orgSlug);

    if (shouldCapture(p, "settings-profile-avatar-upload-modal")) {
      await runCaptureStep("settings profile avatar upload modal", async () => {
        await dismissAllDialogs(page);
        const dialog = await settingsPage.openProfileAvatarUploadModal();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, p, "settings-profile-avatar-upload-modal");
        await dismissIfOpen(page, dialog);
      });
    }

    if (shouldCapture(p, "settings-profile-cover-upload-modal")) {
      await runCaptureStep("settings profile cover upload modal", async () => {
        await dismissAllDialogs(page);
        const dialog = await settingsPage.openProfileCoverUploadModal();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, p, "settings-profile-cover-upload-modal");
        await dismissIfOpen(page, dialog);
      });
    }

    if (shouldCapture(p, "settings-notifications-permission-denied")) {
      await runCaptureStep("settings notifications permission denied", async () => {
        const permissionPage = await page.context().newPage();
        try {
          const permissionSettingsPage = new SettingsPage(permissionPage, orgSlug);
          await permissionSettingsPage.gotoNotificationsWithBlockedPermission();
          await permissionSettingsPage.expectNotificationsPermissionDeniedState();
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
      "calendar",
      "activity",
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
        `project-${normalizedProjectKey}-analytics`,
        `project-${normalizedProjectKey}-analytics-sparse-data`,
        `project-${normalizedProjectKey}-analytics-no-activity`,
      ])
    ) {
      await runCaptureStep("project analytics states", async () => {
        const analyticsUrl = ROUTES.projects.analytics.build(orgSlug, projectKey);
        const captureProjectAnalyticsState = async (
          capturePage: Parameters<typeof captureCurrentView>[0],
          screenshotName: string,
        ) => {
          await capturePage.evaluate(() => {
            window.scrollTo(0, 0);
          });
          await waitForScreenshotReady(capturePage);
          await captureCurrentView(capturePage, p, screenshotName);
        };

        try {
          const defaultStateResult = await testUserService.configureProjectAnalyticsState(
            orgSlug,
            projectKey,
            "default",
          );
          if (!defaultStateResult.success) {
            throw new Error(
              defaultStateResult.error ?? "Failed to configure default analytics screenshot state",
            );
          }

          if (shouldCapture(p, `project-${normalizedProjectKey}-analytics`)) {
            await page.goto(`${BASE_URL}${analyticsUrl}`, {
              waitUntil: "domcontentloaded",
              timeout: 15000,
            });
            await waitForExpectedContent(
              page,
              analyticsUrl,
              `project-${normalizedProjectKey}-analytics`,
            );
            const projectsPage = new ProjectsPage(page, orgSlug);
            await projectsPage.expectAnalyticsChartsVisible();
            await expect(projectsPage.analyticsRecentActivity).not.toContainText(
              "No recent activity yet",
            );
            await captureProjectAnalyticsState(page, `project-${normalizedProjectKey}-analytics`);
          }

          if (shouldCapture(p, `project-${normalizedProjectKey}-analytics-sparse-data`)) {
            const sparseStateResult = await testUserService.configureProjectAnalyticsState(
              orgSlug,
              projectKey,
              "sparseData",
            );
            if (!sparseStateResult.success) {
              throw new Error(
                sparseStateResult.error ?? "Failed to configure sparse analytics screenshot state",
              );
            }

            const sparsePage = await page.context().newPage();
            try {
              await sparsePage.goto(`${BASE_URL}${analyticsUrl}`, {
                waitUntil: "domcontentloaded",
                timeout: 15000,
              });
              await waitForExpectedContent(
                sparsePage,
                analyticsUrl,
                `project-${normalizedProjectKey}-analytics`,
              );
              const projectsPage = new ProjectsPage(sparsePage, orgSlug);
              await projectsPage.expectAnalyticsSparseDataState();
              await captureProjectAnalyticsState(
                sparsePage,
                `project-${normalizedProjectKey}-analytics-sparse-data`,
              );
            } finally {
              if (!sparsePage.isClosed()) {
                await sparsePage.close();
              }
            }
          }

          if (shouldCapture(p, `project-${normalizedProjectKey}-analytics-no-activity`)) {
            const noActivityStateResult = await testUserService.configureProjectAnalyticsState(
              orgSlug,
              projectKey,
              "noActivity",
            );
            if (!noActivityStateResult.success) {
              throw new Error(
                noActivityStateResult.error ??
                  "Failed to configure no-activity analytics screenshot state",
              );
            }

            const noActivityPage = await page.context().newPage();
            try {
              await noActivityPage.goto(`${BASE_URL}${analyticsUrl}`, {
                waitUntil: "domcontentloaded",
                timeout: 15000,
              });
              await waitForExpectedContent(
                noActivityPage,
                analyticsUrl,
                `project-${normalizedProjectKey}-analytics`,
              );
              const projectsPage = new ProjectsPage(noActivityPage, orgSlug);
              await projectsPage.expectAnalyticsNoActivityState();
              await captureProjectAnalyticsState(
                noActivityPage,
                `project-${normalizedProjectKey}-analytics-no-activity`,
              );
            } finally {
              if (!noActivityPage.isClosed()) {
                await noActivityPage.close();
              }
            }
          }
        } finally {
          await testUserService.configureProjectAnalyticsState(orgSlug, projectKey, "default");
        }
      });
    }

    if (
      shouldCaptureAny(p, [
        `project-${normalizedProjectKey}-members`,
        `project-${normalizedProjectKey}-members-confirm-dialog`,
      ])
    ) {
      await runCaptureStep("project members", async () => {
        const settingsUrl = ROUTES.projects.settings.build(orgSlug, projectKey);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await projectsPage.gotoProjectSettings(projectKey);
        await waitForExpectedContent(page, settingsUrl, `project-${normalizedProjectKey}-members`);
        await scrollSectionNearViewportTop(projectsPage.projectMembersSection, page);
        await waitForScreenshotReady(page);
        await captureCurrentView(page, p, `project-${normalizedProjectKey}-members`);

        if (shouldCapture(p, `project-${normalizedProjectKey}-members-confirm-dialog`)) {
          const dialog = await projectsPage.openFirstMemberRemoveDialog();
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
        const settingsUrl = ROUTES.projects.settings.build(orgSlug, projectKey);
        const projectsPage = new ProjectsPage(page, orgSlug);
        await projectsPage.gotoProjectSettings(projectKey);
        await waitForExpectedContent(page, settingsUrl, `project-${normalizedProjectKey}-settings`);
        await waitForScreenshotReady(page);
        await dismissAllDialogs(page);
        const dialog = await projectsPage.openDeleteProjectDialog();
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
        await projectsPage.expectCreateIssueModalCaptureReady();
        await projectsPage.enableCreateAnother();
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
        await projectsPage.expectCreateIssueModalCaptureReady();
        await projectsPage.submitCreateIssueExpectTitleValidationError();
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
        await projectsPage.expectCreateIssueModalCaptureReady();
        try {
          await projectsPage.issueTitleInput.fill(issueTitle);
          await projectsPage.submitIssueButton.click();
          await projectsPage.createIssueModal.waitFor({ state: "hidden", timeout: 8000 });
          createdIssue = true;
          await projectsPage.expectCreateIssueSuccessToastVisible(8000);
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
        await projectsPage.expectCreateIssueModalCaptureReady();
        await projectsPage.issueTitleInput.fill(duplicateQuery);
        await projectsPage.expectCreateIssueDuplicateDetectionVisible();
        await projectsPage.waitForCreateIssueDuplicateItem("DEMO-2");
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
          await projectsPage.expectCreateIssueModalCaptureReady();
          await projectsPage.expectCreateIssueDraftBannerVisible();
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
        const projectsPage = new ProjectsPage(page, orgSlug);
        await projectsPage.openBoardSprintSelector();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, p, `project-${normalizedProjectKey}-board-sprint-selector`);
        await page.keyboard.press("Escape");
      });
    }

    if (shouldCapture(p, `project-${normalizedProjectKey}-board-loading`)) {
      await screenshotBoardLoadingState(page, orgSlug, projectKey, p);
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
      const calendarPage = new CalendarPage(page, orgSlug);
      await page.goto(`${BASE_URL}${calendarUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForScreenshotReady(page);
      const isCalendarReady = await calendarPage.ensureReady();
      if (!isCalendarReady) {
        console.log("    ⚠️  [filled] calendar not ready, skipping mode-specific screenshots");
      } else {
        for (const mode of ["day", "week", "month"] as const) {
          if (!shouldCapture(p, `calendar-${mode}`)) {
            continue;
          }
          await calendarPage.switchToMode(mode);
          await calendarPage.focusFirstEvent();
          await captureCurrentView(page, p, `calendar-${mode}`);
        }

        if (shouldCapture(p, "calendar-event-modal")) {
          await runCaptureStep("calendar event-detail modal", async () => {
            if (typeof seed.workspaceSlug === "string") {
              await page.goto(
                `${BASE_URL}${ROUTES.workspaces.calendar.build(orgSlug, seed.workspaceSlug)}`,
                {
                  waitUntil: "domcontentloaded",
                  timeout: 15000,
                },
              );
              await waitForScreenshotReady(page);
              const workspaceCalendarReady = await calendarPage.ensureReady();
              if (!workspaceCalendarReady) {
                throw new Error(`[${p}] workspace calendar not ready for event modal screenshot`);
              }
            }

            await calendarPage.openFirstVisibleEventDetails();
            await captureCurrentView(page, p, "calendar-event-modal");
            await dismissIfOpen(page, calendarPage.eventDetailModal);
          });
        }

        if (shouldCapture(p, "calendar-quick-add")) {
          await runCaptureStep("calendar quick-add", async () => {
            await calendarPage.openQuickAddComposer();
            const dialog = await waitForDialogOpen(page);
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
            const clearDragPreview = await calendarPage.startMonthDragPreview();
            await waitForScreenshotReady(page);
            await captureCurrentView(page, p, "calendar-drag-and-drop");
            await clearDragPreview();
          });
        }
      }
    }
  }

  // Issue detail
  const seededIssueKey = seed.issueKeys?.[0];
  if (seededIssueKey && shouldCapture(p, `issue-${seededIssueKey.toLowerCase()}`)) {
    const firstIssue = requireSeededIssueKey(seed, "issue detail screenshot capture");
    await takeScreenshot(
      page,
      p,
      `issue-${firstIssue.toLowerCase()}`,
      ROUTES.issues.detail.build(orgSlug, firstIssue),
    );
  }

  // Workspace & team pages
  const wsSlug = seed.workspaceSlug;
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

    const resolvedTeam = getSeededTeamSlug(seed);
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
    const baseDocId = requirePrimarySeededDocumentId(seed, "document editor screenshot capture");
    if (baseDocId) {
      const baseDocUrl = ROUTES.documents.detail.build(orgSlug, baseDocId);
      const documentsPage = new DocumentsPage(page, orgSlug);
      await takeScreenshot(page, p, "document-editor", baseDocUrl);

      // Document editor interactive states
      if (shouldCapture(p, "document-editor-move-dialog")) {
        await runCaptureStep("document move dialog", async () => {
          await documentsPage.gotoDocument(baseDocId);
          const dialog = await documentsPage.openMoveDialog();
          await captureCurrentView(page, p, "document-editor-move-dialog");
          await dismissIfOpen(page, dialog);
        });
      }

      if (shouldCapture(p, "document-editor-markdown-preview-modal")) {
        await runRequiredCaptureStep("document markdown preview modal", async () => {
          await documentsPage.gotoDocument(baseDocId);
          const dialog = await documentsPage.openMarkdownImportPreview(
            MARKDOWN_IMPORT_PREVIEW,
            "import.md",
          );
          await captureCurrentView(page, p, "document-editor-markdown-preview-modal");
          await dismissIfOpen(page, dialog);
        });
      }

      if (shouldCapture(p, "document-editor-favorite")) {
        await runCaptureStep("document favorite state", async () => {
          await documentsPage.gotoDocument(baseDocId);
          await documentsPage.toggleFavoriteOn();
          await captureCurrentView(page, p, "document-editor-favorite");
          await documentsPage.toggleFavoriteOff();
        });
      }

      if (shouldCapture(p, "document-editor-sidebar-favorites")) {
        await runCaptureStep("document sidebar favorites", async () => {
          await documentsPage.gotoDocument(baseDocId);
          await documentsPage.toggleFavoriteOn();
          await documentsPage.expectSidebarFavoritesVisible();
          await captureCurrentView(page, p, "document-editor-sidebar-favorites");
          await documentsPage.toggleFavoriteOff();
        });
      }

      if (shouldCapture(p, "document-editor-rich-blocks")) {
        await runRequiredCaptureStep("document rich blocks", async () => {
          await documentsPage.gotoDocument(baseDocId);
          await documentsPage.replaceEditorContentFromMarkdown(
            MARKDOWN_RICH_CONTENT,
            "release-readiness.md",
            /Release Readiness/i,
          );
          await captureCurrentView(page, p, "document-editor-rich-blocks");
        });
      }

      if (shouldCapture(p, "document-editor-color-picker")) {
        await runRequiredCaptureStep("document color picker", async () => {
          await documentsPage.gotoDocument(baseDocId);
          await documentsPage.replaceEditorContentFromMarkdown(
            MARKDOWN_RICH_CONTENT,
            "release-readiness.md",
            /Release Readiness/i,
          );
          await documentsPage.openFloatingToolbarForText("Release");
          await documentsPage.openFontColorPicker();
          await documentsPage.expectFontColorSwatchVisible("Red");
          await waitForScreenshotReady(page);
          await captureCurrentView(page, p, "document-editor-color-picker");
          await page.keyboard.press("Escape");
          await page.mouse.click(10, 10);
        });
      }

      // Slash menu — type "/" at end of content
      if (shouldCapture(p, "document-editor-slash-menu")) {
        await runRequiredCaptureStep("document slash menu", async () => {
          await documentsPage.gotoDocument(baseDocId);
          await documentsPage.replaceEditorContentFromMarkdown(
            MARKDOWN_RICH_CONTENT,
            "release-readiness.md",
            /Release Readiness/i,
          );
          await documentsPage.openSlashMenuAtEditorEnd();
          await captureCurrentView(page, p, "document-editor-slash-menu");
          // Dismiss and undo
          await page.keyboard.press("Escape");
        });
      }

      // Floating toolbar — select text in the editor
      if (shouldCapture(p, "document-editor-floating-toolbar")) {
        await runRequiredCaptureStep("document floating toolbar", async () => {
          await documentsPage.gotoDocument(baseDocId);
          await documentsPage.replaceEditorContentFromMarkdown(
            MARKDOWN_RICH_CONTENT,
            "release-readiness.md",
            /Release Readiness/i,
          );
          await documentsPage.openFloatingToolbarForText("Release");
          await captureCurrentView(page, p, "document-editor-floating-toolbar");
          // Click away to deselect
          await page.mouse.click(10, 10);
        });
      }

      // @mention popover — type "@" in editor
      if (shouldCapture(p, "document-editor-mention-popover")) {
        await runRequiredCaptureStep("document mention popover", async () => {
          await documentsPage.gotoDocument(baseDocId);
          await documentsPage.replaceEditorContentFromMarkdown(
            MARKDOWN_RICH_CONTENT,
            "release-readiness.md",
            /Release Readiness/i,
          );
          await documentsPage.openMentionPopoverAtEditorEnd();
          await captureCurrentView(page, p, "document-editor-mention-popover");
          await page.keyboard.press("Escape");
        });
      }

      if (shouldCapture(p, "document-editor-locked")) {
        await runCaptureStep("document locked state", async () => {
          await documentsPage.gotoDocument(baseDocId);
          await documentsPage.lockDocument();
          await captureCurrentView(page, p, "document-editor-locked");
          await documentsPage.unlockDocument();
        });
      }
    }
  }

  // ── Additional modal captures ──

  // Dashboard customize modal
  if (shouldCapture(p, "dashboard-customize-modal")) {
    await runCaptureStep("dashboard customize modal", async () => {
      const dashboardPage = new DashboardPage(page, orgSlug);
      await dashboardPage.goto();
      await dashboardPage.openCustomizeModal();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "dashboard-customize-modal");
      await dismissIfOpen(page, dashboardPage.customizeModal);
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
      const calendarPage = new CalendarPage(page, orgSlug);
      const calendarReady = await calendarPage.ensureReady();
      if (!calendarReady) {
        throw new Error(`[${p}] calendar create-event modal route did not become ready`);
      }
      await calendarPage.openCreateEventModal();
      await captureCurrentView(page, p, "calendar-create-event-modal");
      await dismissIfOpen(page, calendarPage.createEventModal);
    });
  }

  // Create workspace modal
  if (shouldCapture(p, "workspaces-create-workspace-modal")) {
    await runCaptureStep("create workspace modal", async () => {
      const workspacesPage = new WorkspacesPage(page, orgSlug);
      await workspacesPage.goto();
      await workspacesPage.openCreateWorkspaceDialog();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "workspaces-create-workspace-modal");
      await dismissIfOpen(page, workspacesPage.createWorkspaceDialog);
    });
  }

  if (shouldCapture(p, "workspaces-search-empty")) {
    await runCaptureStep("workspaces search empty", async () => {
      const workspacesUrl = ROUTES.workspaces.list.build(orgSlug);
      const workspacesPage = new WorkspacesPage(page, orgSlug);
      await page.goto(`${BASE_URL}${workspacesUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await waitForExpectedContent(page, workspacesUrl, "workspaces", p);
      await waitForScreenshotReady(page);
      await workspacesPage.search("zzzx-workspace-miss");
      await workspacesPage.expectSearchEmptyState();
      await captureCurrentView(page, p, "workspaces-search-empty");
    });
  }

  // Create team modal (from workspace detail)
  if (wsSlug && shouldCapture(p, "workspace-create-team-modal")) {
    await runCaptureStep("create team modal", async () => {
      const workspacesPage = new WorkspacesPage(page, orgSlug);
      const teamsUrl = ROUTES.workspaces.teams.list.build(orgSlug, wsSlug);
      await page.goto(`${BASE_URL}${teamsUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await waitForExpectedContent(page, teamsUrl, `workspace-${wsSlug}`);
      await workspacesPage.expectTeamsLoaded();
      await workspacesPage.openCreateTeamDialog();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "workspace-create-team-modal");
      await dismissIfOpen(page, workspacesPage.createTeamDialog);
    });
  }

  // Import/export modal (from board)
  if (projectKey && shouldCapture(p, `project-${normalizedProjectKey}-import-export-modal`)) {
    await runCaptureStep("import/export modal", async () => {
      const projectsPage = new ProjectsPage(page, orgSlug);
      await projectsPage.gotoProjectBoard(projectKey);
      await projectsPage.openImportExportModal();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, `project-${normalizedProjectKey}-import-export-modal`);
      await dismissIfOpen(page, projectsPage.importExportModal);
    });
  }

  if (
    projectKey &&
    shouldCapture(p, `project-${normalizedProjectKey}-import-export-modal-import`)
  ) {
    await runCaptureStep("import/export modal import state", async () => {
      const projectsPage = new ProjectsPage(page, orgSlug);
      await projectsPage.gotoProjectBoard(projectKey);
      await projectsPage.openImportExportJsonMode();
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        p,
        `project-${normalizedProjectKey}-import-export-modal-import`,
      );
      await dismissIfOpen(page, projectsPage.importExportModal);
    });
  }

  const timeTrackingCaptureNames = [
    "time-tracking-burn-rate",
    "time-tracking-rates",
    "time-tracking-empty",
    "time-tracking-all-time",
    "time-tracking-truncated",
  ] as const;

  if (projectKey && shouldCaptureAny(p, [...timeTrackingCaptureNames])) {
    await runCaptureStep("time tracking review states", async () => {
      const timeTrackingUrl = ROUTES.timeTracking.build(orgSlug);

      const applyTimeTrackingState = async (
        mode: "default" | "entriesEmpty" | "ratesPopulated" | "summaryTruncated",
      ): Promise<void> => {
        const result = await testUserService.configureTimeTrackingState(orgSlug, projectKey, mode);
        if (!result.success) {
          throw new Error(
            result.error ?? `Failed to configure time tracking screenshot state: ${mode}`,
          );
        }
      };

      const captureTimeTrackingState = async ({
        afterReady,
        expectedState,
        name,
      }: {
        afterReady?: (trackingPage: TimeTrackingPage) => Promise<void>;
        expectedState: "entries" | "burn-rate" | "rates";
        name: (typeof timeTrackingCaptureNames)[number];
      }): Promise<void> => {
        const capturePage = await page.context().newPage();
        try {
          await capturePage.goto(`${BASE_URL}${timeTrackingUrl}`, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          const trackingPage = new TimeTrackingPage(capturePage, orgSlug);
          if (expectedState === "burn-rate") {
            await trackingPage.expectBurnRateState();
          } else if (expectedState === "rates") {
            await trackingPage.expectRatesState();
          } else {
            await trackingPage.expectEntriesState();
          }
          if (afterReady) {
            await afterReady(trackingPage);
          }
          await waitForScreenshotReady(capturePage);
          await captureCurrentView(capturePage, p, name);
        } finally {
          await capturePage.close();
        }
      };

      await applyTimeTrackingState("default");

      try {
        if (shouldCapture(p, "time-tracking-burn-rate")) {
          await captureTimeTrackingState({
            afterReady: async (trackingPage) => {
              await trackingPage.openBurnRate();
            },
            expectedState: "entries",
            name: "time-tracking-burn-rate",
          });
        }

        if (shouldCapture(p, "time-tracking-rates")) {
          await applyTimeTrackingState("ratesPopulated");
          try {
            await captureTimeTrackingState({
              expectedState: "entries",
              afterReady: async (trackingPage) => {
                await trackingPage.ratesTab.click();
                await trackingPage.expectRatesState();
              },
              name: "time-tracking-rates",
            });
          } finally {
            await applyTimeTrackingState("default");
          }
        }

        if (shouldCapture(p, "time-tracking-empty")) {
          await applyTimeTrackingState("entriesEmpty");
          try {
            await captureTimeTrackingState({
              expectedState: "entries",
              name: "time-tracking-empty",
            });
          } finally {
            await applyTimeTrackingState("default");
          }
        }

        if (shouldCapture(p, "time-tracking-all-time")) {
          await captureTimeTrackingState({
            expectedState: "entries",
            name: "time-tracking-all-time",
            afterReady: async (trackingPage) => {
              await trackingPage.selectDateRange("All Time");
              await trackingPage.expectEntriesState();
            },
          });
        }

        if (shouldCapture(p, "time-tracking-truncated")) {
          await applyTimeTrackingState("summaryTruncated");
          try {
            await captureTimeTrackingState({
              expectedState: "entries",
              name: "time-tracking-truncated",
            });
          } finally {
            await applyTimeTrackingState("default");
          }
        }
      } finally {
        await applyTimeTrackingState("default");
      }
    });
  }

  // Manual time entry modal
  if (shouldCapture(p, "time-tracking-manual-entry-modal")) {
    await runCaptureStep("manual time entry modal", async () => {
      const trackingPage = new TimeTrackingPage(page, orgSlug);
      await trackingPage.goto();
      await trackingPage.openManualEntryModal();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "time-tracking-manual-entry-modal");
      await dismissIfOpen(page, trackingPage.entryModal);
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
      const dashboardPage = new DashboardPage(page, orgSlug);
      await dashboardPage.goto();
      await waitForScreenshotReady(page);
      await dashboardPage.collapseSidebar();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, p, "sidebar-collapsed");
      await dashboardPage.expandSidebarIfCollapsed();
      await waitForScreenshotReady(page);
    });
  }

  if (
    shouldCapture(p, "mobile-hamburger") &&
    (captureState.currentConfigPrefix === "tablet-light" ||
      captureState.currentConfigPrefix === "mobile-light")
  ) {
    await runCaptureStep("mobile hamburger", async () => {
      const dashboardPage = new DashboardPage(page, orgSlug);
      await dashboardPage.goto();
      await dismissAllDialogs(page);
      await dashboardPage.openMobileSidebarIfNeeded();
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
      const dashboardPage = new DashboardPage(page, orgSlug);

      if (
        captureState.currentConfigPrefix === "tablet-light" ||
        captureState.currentConfigPrefix === "mobile-light"
      ) {
        await dashboardPage.openMobileSidebarIfNeeded();
      }

      await dashboardPage.expectSidebarProjectItem(seed.projectKey ?? "DEMO");
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
      const dashboardPage = new DashboardPage(page, orgSlug);
      await dashboardPage.expectNotFoundPage();
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

  if (
    projectKey &&
    shouldCaptureAny(p, [
      `project-${normalizedProjectKey}-roadmap`,
      `project-${normalizedProjectKey}-roadmap-timeline-selector`,
      `project-${normalizedProjectKey}-roadmap-grouped`,
      `project-${normalizedProjectKey}-roadmap-detail`,
      `project-${normalizedProjectKey}-roadmap-empty`,
      `project-${normalizedProjectKey}-roadmap-milestone`,
    ])
  ) {
    await screenshotRoadmapStates(page, orgSlug, projectKey, p);
  }

  // ── Notification interactive states ──

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
      const dashboardPage = new DashboardPage(page, orgSlug);
      await dashboardPage.openNotifications();
      await dashboardPage.waitForNotificationsPanelContentReady();
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
      const dashboardPage = new DashboardPage(page, orgSlug);
      await dashboardPage.openNotifications();
      await dashboardPage.openNotificationSnoozePopover();
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
      const notificationsPage = new NotificationsPage(page, orgSlug);
      await notificationsPage.openArchivedTabAndWait();
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
      const notificationsPage = new NotificationsPage(page, orgSlug);
      await notificationsPage.activateMentionsFilter();
      await notificationsPage.waitForMentionsFilterResults();
      await captureCurrentView(page, p, "notifications-filter-active");
    });
  }

  if (shouldCapture(p, "notifications-inbox-empty") && projectKey) {
    await runCaptureStep("notifications inbox empty", async () => {
      const configureResult = await testUserService.configureNotificationsState(
        orgSlug,
        projectKey,
        "inboxEmpty",
        SCREENSHOT_USER.email,
      );
      if (!configureResult.success) {
        throw new Error(configureResult.error ?? "Failed to configure inbox-empty notifications");
      }

      try {
        await page.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await waitForExpectedContent(page, ROUTES.notifications.build(orgSlug), "notifications");
        const notificationsPage = new NotificationsPage(page, orgSlug);
        await notificationsPage.expectInboxEmptyState();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, p, "notifications-inbox-empty");
      } finally {
        await testUserService.configureNotificationsState(
          orgSlug,
          projectKey,
          "default",
          SCREENSHOT_USER.email,
        );
      }
    });
  }

  if (shouldCapture(p, "notifications-archived-empty") && projectKey) {
    await runCaptureStep("notifications archived empty", async () => {
      const configureResult = await testUserService.configureNotificationsState(
        orgSlug,
        projectKey,
        "archivedEmpty",
        SCREENSHOT_USER.email,
      );
      if (!configureResult.success) {
        throw new Error(
          configureResult.error ?? "Failed to configure archived-empty notifications",
        );
      }

      try {
        const archivedEmptyPage = await page.context().newPage();

        try {
          await archivedEmptyPage.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          await waitForExpectedContent(
            archivedEmptyPage,
            ROUTES.notifications.build(orgSlug),
            "notifications",
          );
          const notificationsPage = new NotificationsPage(archivedEmptyPage, orgSlug);
          await notificationsPage.openArchivedTabAndWait();
          await waitForScreenshotReady(archivedEmptyPage);
          await notificationsPage.expectArchivedEmptyState();
          await captureCurrentView(archivedEmptyPage, p, "notifications-archived-empty");
        } finally {
          if (!archivedEmptyPage.isClosed()) {
            await archivedEmptyPage.close();
          }
        }
      } finally {
        await testUserService.configureNotificationsState(
          orgSlug,
          projectKey,
          "default",
          SCREENSHOT_USER.email,
        );
      }
    });
  }

  if (shouldCapture(p, "notifications-unread-overflow") && projectKey) {
    await runCaptureStep("notifications unread overflow", async () => {
      const configureResult = await testUserService.configureNotificationsState(
        orgSlug,
        projectKey,
        "unreadOverflow",
        SCREENSHOT_USER.email,
      );
      if (!configureResult.success) {
        throw new Error(
          configureResult.error ?? "Failed to configure unread-overflow notifications",
        );
      }

      try {
        const loginResult = await testUserService.loginTestUserWithRepair(
          SCREENSHOT_USER.email,
          SCREENSHOT_USER.password,
          true,
        );
        if (!(loginResult.success && loginResult.token)) {
          throw new Error(loginResult.error ?? "Failed to authenticate screenshot notifications");
        }
        await injectAuthTokens(page, loginResult.token, loginResult.refreshToken ?? null);

        const overflowPage = await page.context().newPage();
        try {
          await overflowPage.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          const notificationsPage = new NotificationsPage(overflowPage, orgSlug);
          await notificationsPage.waitForUnreadOverflowReady();
          await waitForScreenshotReady(overflowPage);
          await captureCurrentView(overflowPage, p, "notifications-unread-overflow");
        } finally {
          if (!overflowPage.isClosed()) {
            await overflowPage.close();
          }
        }
      } finally {
        await testUserService.configureNotificationsState(
          orgSlug,
          projectKey,
          "default",
          SCREENSHOT_USER.email,
        );
      }
    });
  }

  if (shouldCapture(p, "notifications-mark-all-read-loading")) {
    await runCaptureStep("notifications mark-all-read loading", async () => {
      try {
        if (!projectKey) {
          throw new Error("Seeded screenshot data did not include a project key");
        }

        const configureResult = await testUserService.configureNotificationsState(
          orgSlug,
          projectKey,
          "unreadOverflow",
          SCREENSHOT_USER.email,
        );
        if (!configureResult.success) {
          throw new Error(
            configureResult.error ??
              "Failed to configure unread-overflow notifications for mark-all-read loading",
          );
        }

        const loginResult = await testUserService.loginTestUserWithRepair(
          SCREENSHOT_USER.email,
          SCREENSHOT_USER.password,
          true,
        );
        if (!(loginResult.success && loginResult.token)) {
          throw new Error(loginResult.error ?? "Failed to authenticate screenshot notifications");
        }
        await injectAuthTokens(page, loginResult.token, loginResult.refreshToken ?? null);

        const loadingPage = await page.context().newPage();
        try {
          await loadingPage.goto(`${BASE_URL}${ROUTES.notifications.build(orgSlug)}`, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          const notificationsPage = new NotificationsPage(loadingPage, orgSlug);
          await notificationsPage.waitForUnreadOverflowReady();
          const releaseMutationBlock = await notificationsPage.openMarkAllReadLoadingState();

          try {
            await waitForAnimation(loadingPage);
            await captureCurrentView(loadingPage, p, "notifications-mark-all-read-loading", {
              skipReadyCheck: true,
            });
          } finally {
            await releaseMutationBlock();
          }
        } finally {
          if (!loadingPage.isClosed()) {
            await loadingPage.close();
          }
        }
      } finally {
        if (projectKey) {
          await testUserService.configureNotificationsState(
            orgSlug,
            projectKey,
            "default",
            SCREENSHOT_USER.email,
          );
        }
      }
    });
  }
}
