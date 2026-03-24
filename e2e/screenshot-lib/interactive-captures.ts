/**
 * Modal & Interactive State Screenshot Captures
 *
 * Functions that capture screenshots of modals, dialogs, interactive states,
 * and feature-specific UI flows (board interactions, sprint workflows, etc.).
 */

import type { Locator, Page } from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import { TEST_IDS } from "../../src/lib/test-ids";
import { ProjectsPage } from "../pages";
import { isLocatorVisible, waitForLocatorVisible } from "../utils/locator-state";
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
  shouldCapture,
  shouldCaptureAny,
} from "./capture";
import { BASE_URL } from "./config";
import {
  getUploadDialogReadyLocator,
  openMobileSidebarMenu,
  openOmnibox,
  openStableAlertDialog,
  openStableDialog,
  waitForCreateIssueModalScreenshotReady,
  waitForDashboardCustomizeDialogReady,
} from "./dialog-helpers";
import { waitForBoardReady, waitForExpectedContent } from "./readiness";

export async function screenshotDashboardModals(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  if (
    !shouldCaptureAny(prefix, [
      "dashboard-omnibox",
      "dashboard-advanced-search-modal",
      "dashboard-shortcuts-modal",
      "dashboard-time-entry-modal",
    ])
  ) {
    return;
  }

  await page.goto(`${BASE_URL}${ROUTES.dashboard.build(orgSlug)}`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await waitForExpectedContent(page, ROUTES.dashboard.build(orgSlug), "dashboard");
  await waitForScreenshotReady(page);

  const omniboxTrigger = page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON);
  const omniboxDialog = page.getByTestId(TEST_IDS.SEARCH.MODAL);
  if ((await omniboxTrigger.count()) > 0) {
    await runCaptureStep("dashboard omnibox", async () => {
      await openOmnibox(page, omniboxTrigger, omniboxDialog);
      await captureCurrentView(page, prefix, "dashboard-omnibox");
      await dismissIfOpen(page, omniboxDialog);
    });

    await runCaptureStep("dashboard advanced-search modal", async () => {
      try {
        await openOmnibox(page, omniboxTrigger, omniboxDialog);
        const advancedSearchButton = omniboxDialog.getByRole("button", {
          name: /^advanced search$/i,
        });
        await advancedSearchButton.waitFor({ state: "visible", timeout: 5000 });
        await advancedSearchButton.click();
        await omniboxDialog.waitFor({ state: "hidden", timeout: 5000 });
        const advancedSearchDialog = page.getByTestId(TEST_IDS.SEARCH.ADVANCED_MODAL);
        await advancedSearchDialog.waitFor({ state: "visible", timeout: 5000 });
        await waitForAnimation(page);
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, "dashboard-advanced-search-modal");
        await dismissIfOpen(page, advancedSearchDialog);
      } finally {
        await dismissIfOpen(page, omniboxDialog);
      }
    });
  }

  const shortcutsTrigger = page.getByTestId(TEST_IDS.HEADER.SHORTCUTS_BUTTON);
  if (captureState.currentConfigPrefix !== "mobile-light" && (await shortcutsTrigger.count()) > 0) {
    await runCaptureStep("dashboard shortcuts modal", async () => {
      await dismissAllDialogs(page);
      const shortcutsDialog = await openStableDialog(
        page,
        shortcutsTrigger,
        page.getByRole("dialog", { name: /keyboard shortcuts/i }),
        page.getByPlaceholder("Search shortcuts..."),
        "shortcuts help",
      );
      await captureCurrentView(page, prefix, "dashboard-shortcuts-modal");
      await dismissIfOpen(page, shortcutsDialog);
    });
  }

  const timeEntryTrigger = page.getByRole("button", { name: /^start timer$/i });
  if ((await timeEntryTrigger.count()) > 0) {
    await runCaptureStep("dashboard time-entry modal", async () => {
      await dismissAllDialogs(page);
      const timeEntryDialog = await openStableDialog(
        page,
        timeEntryTrigger,
        page.getByRole("dialog", { name: /^start timer$/i }),
        page.getByTestId(TEST_IDS.TIME_TRACKING.ENTRY_FORM),
        "dashboard time entry",
      );
      await captureCurrentView(page, prefix, "dashboard-time-entry-modal");
      await dismissIfOpen(page, timeEntryDialog);
    });
  }
}

export async function screenshotDashboardLoadingState(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  if (!shouldCapture(prefix, "dashboard-loading-skeletons")) {
    return;
  }

  await runCaptureStep("dashboard loading skeletons", async () => {
    const loadingPage = await page.context().newPage();

    try {
      await loadingPage.addInitScript(() => {
        window.__NIXELO_E2E_DASHBOARD_LOADING__ = true;
      });

      const dashboardUrl = ROUTES.dashboard.build(orgSlug);
      await loadingPage.goto(`${BASE_URL}${dashboardUrl}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await loadingPage.waitForURL(
        (currentUrl) => /\/[^/]+\/dashboard$/.test(new URL(currentUrl).pathname),
        {
          timeout: 15000,
        },
      );
      await loadingPage
        .getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON)
        .waitFor({ state: "visible", timeout: 15000 });
      await loadingPage
        .getByRole("heading", { name: /^dashboard$/i })
        .waitFor({ state: "visible", timeout: 12000 });
      await expect
        .poll(() => loadingPage.getByTestId(TEST_IDS.LOADING.SKELETON).count(), {
          timeout: 12000,
        })
        .toBeGreaterThanOrEqual(6);
      await waitForAnimation(loadingPage);
      await loadingPage.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve());
            });
          }),
      );
      await captureCurrentView(loadingPage, prefix, "dashboard-loading-skeletons", {
        skipReadyCheck: true,
      });
    } finally {
      if (!loadingPage.isClosed()) {
        await loadingPage.close();
      }
    }
  });
}

export async function screenshotProjectsModal(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  if (!shouldCapture(prefix, "projects-create-project-modal")) {
    return;
  }

  await page.goto(`${BASE_URL}${ROUTES.projects.list.build(orgSlug)}`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await waitForScreenshotReady(page);

  const projectsPage = new ProjectsPage(page, orgSlug);

  await runCaptureStep("projects create-project modal", async () => {
    await projectsPage.openCreateProjectForm();
    await waitForScreenshotReady(page);
    await captureCurrentView(page, prefix, "projects-create-project-modal");
    await projectsPage.closeCreateProjectFormIfOpen();
  });
}

export async function screenshotBoardModals(
  page: Page,
  orgSlug: string,
  projectKey: string,
  issueKey: string | undefined,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const createIssueModalName = `project-${normalizedProjectKey}-create-issue-modal`;
  const issueDetailModalName = `project-${normalizedProjectKey}-issue-detail-modal`;
  const issueDetailInlineEditingName = `project-${normalizedProjectKey}-issue-detail-modal-inline-editing`;
  if (
    !shouldCaptureAny(prefix, [
      createIssueModalName,
      issueDetailModalName,
      issueDetailInlineEditingName,
    ])
  ) {
    return;
  }

  const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);
  await page.goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await waitForExpectedContent(page, boardUrl, "board");
  await waitForScreenshotReady(page);

  const projectsPage = new ProjectsPage(page, orgSlug);
  if (
    shouldCapture(prefix, createIssueModalName) &&
    (await projectsPage.createIssueButton.count()) > 0
  ) {
    await runCaptureStep("board create-issue modal", async () => {
      await dismissAllDialogs(page);
      await projectsPage.openCreateIssueModal();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, createIssueModalName);
      await dismissIfOpen(page, projectsPage.createIssueModal);
    });
  }

  let issueCard = page.getByTestId(TEST_IDS.ISSUE.CARD).first();
  if (issueKey) {
    const matchingIssueCard = page
      .getByTestId(TEST_IDS.ISSUE.CARD)
      .filter({ hasText: issueKey })
      .first();
    if ((await matchingIssueCard.count()) > 0) {
      issueCard = matchingIssueCard;
    }
  }

  if (
    shouldCaptureAny(prefix, [issueDetailModalName, issueDetailInlineEditingName]) &&
    (await issueCard.count()) > 0
  ) {
    await runCaptureStep("board issue-detail modal", async () => {
      await issueCard.scrollIntoViewIfNeeded();
      const issueDetailDialog = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
      await issueCard.click();
      const dialogOpened = await waitForLocatorVisible(issueDetailDialog, 3000);
      if (!dialogOpened) {
        await waitForScreenshotReady(page);
        await issueCard.click();
        await issueDetailDialog.waitFor({ state: "visible", timeout: 5000 });
      }
      // Wait for issue content to hydrate - issue key pattern indicates content is loaded
      await issueDetailDialog
        .getByText(/[A-Z][A-Z0-9]+-\d+/)
        .first()
        .waitFor({ timeout: 5000 });

      if (shouldCapture(prefix, issueDetailModalName)) {
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, issueDetailModalName);
      }

      if (shouldCapture(prefix, issueDetailInlineEditingName)) {
        await projectsPage.issueDetailEditButton.waitFor({ state: "visible", timeout: 5000 });
        await projectsPage.issueDetailEditButton.click();
        await projectsPage.issueDetailTitleInput.waitFor({ state: "visible", timeout: 5000 });
        await projectsPage.issueDetailDescriptionEditor.waitFor({
          state: "visible",
          timeout: 5000,
        });
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, issueDetailInlineEditingName);
      }

      await dismissIfOpen(page, issueDetailDialog);
    });
  }
}

export async function screenshotMeetingsStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const meetingsDetailName = "meetings-detail";
  const transcriptSearchName = "meetings-transcript-search";
  const memoryLensName = "meetings-memory-lens";
  const detailTimeoutMs = 15000;

  if (!shouldCaptureAny(prefix, [meetingsDetailName, transcriptSearchName, memoryLensName])) {
    return;
  }

  const meetingsUrl = ROUTES.meetings.build(orgSlug);
  const recentMeetingsSection = page.getByTestId(TEST_IDS.MEETINGS.RECENT_SECTION);
  const meetingDetailSection = page.getByTestId(TEST_IDS.MEETINGS.DETAIL_SECTION);
  const meetingMemorySection = page.getByTestId(TEST_IDS.MEETINGS.MEMORY_SECTION);

  const openMeetingsForCapture = async () => {
    await page.goto(`${BASE_URL}${meetingsUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await waitForExpectedContent(page, meetingsUrl, "meetings");
    await waitForScreenshotReady(page);
  };

  if (shouldCapture(prefix, meetingsDetailName)) {
    await runCaptureStep("meetings detail", async () => {
      await openMeetingsForCapture();
      const clientLaunchReviewCard = recentMeetingsSection
        .getByTestId(TEST_IDS.MEETINGS.RECORDING_CARD)
        .filter({ hasText: /Client Launch Review/i })
        .first();
      await clientLaunchReviewCard.waitFor({ state: "visible", timeout: detailTimeoutMs });
      await clientLaunchReviewCard.evaluate((element) => {
        if (element instanceof HTMLElement) {
          element.click();
        }
      });
      await meetingDetailSection
        .getByText("Client Launch Review", { exact: true })
        .waitFor({ state: "visible", timeout: detailTimeoutMs });
      await meetingDetailSection
        .getByText(
          "The client also asked whether they need weekend coverage and a final handoff packet before launch.",
        )
        .waitFor({ state: "visible", timeout: detailTimeoutMs });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, meetingsDetailName);
    });
  }

  if (shouldCapture(prefix, transcriptSearchName)) {
    await runCaptureStep("meetings transcript search", async () => {
      await openMeetingsForCapture();
      const weeklyProductSyncCard = recentMeetingsSection
        .getByTestId(TEST_IDS.MEETINGS.RECORDING_CARD)
        .filter({ hasText: /Weekly Product Sync/i })
        .first();
      await weeklyProductSyncCard.waitFor({ state: "visible", timeout: detailTimeoutMs });
      await weeklyProductSyncCard.evaluate((element) => {
        if (element instanceof HTMLElement) {
          element.click();
        }
      });
      await meetingDetailSection
        .getByText("Weekly Product Sync", { exact: true })
        .waitFor({ state: "visible", timeout: detailTimeoutMs });

      const transcriptSearch = meetingDetailSection.getByRole("searchbox", {
        name: "Search transcript",
      });
      await transcriptSearch.fill("pricing");
      await meetingDetailSection
        .getByText(
          "We cleared the dashboard bugs, but pricing approval still needs legal sign-off before launch.",
        )
        .waitFor({ state: "visible", timeout: detailTimeoutMs });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, transcriptSearchName);
    });
  }

  if (shouldCapture(prefix, memoryLensName)) {
    await runCaptureStep("meetings memory lens", async () => {
      await openMeetingsForCapture();
      const opsLensButton = meetingMemorySection
        .locator("button")
        .filter({ hasText: /OPS/i })
        .first();
      await opsLensButton.waitFor({ state: "visible", timeout: detailTimeoutMs });
      await opsLensButton.evaluate((element) => {
        if (element instanceof HTMLElement) {
          element.click();
        }
      });
      await meetingMemorySection
        .getByText(
          "Cross-meeting decisions, open questions, and follow-ups for OPS - Client Operations Hub.",
        )
        .waitFor({ state: "visible", timeout: detailTimeoutMs });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, memoryLensName);
    });
  }
}

export async function screenshotBoardInteractiveStates(
  page: Page,
  orgSlug: string,
  projectKey: string,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const boardUrl = ROUTES.projects.board.build(orgSlug, projectKey);

  // Helper: navigate to board and wait for toolbar
  const loadBoard = async () => {
    await page.goto(`${BASE_URL}${boardUrl}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForBoardReady(page);
    await waitForScreenshotReady(page);
  };

  // Swimlane modes — reload board fresh for each to avoid stale button text
  const swimlaneModes = ["priority", "assignee", "type", "label"] as const;
  for (const mode of swimlaneModes) {
    const captureName = `project-${normalizedProjectKey}-board-swimlane-${mode}`;
    if (!shouldCapture(prefix, captureName)) continue;

    await runCaptureStep(`board swimlane ${mode}`, async () => {
      await loadBoard();
      // Open swimlane dropdown — button says "Swimlanes" on fresh load
      const swimlaneButton = page.getByText("Swimlanes", { exact: true });
      await swimlaneButton.waitFor({ state: "visible", timeout: 8000 });
      await swimlaneButton.click();
      // Select the mode via menuitemcheckbox to avoid matching hidden mobile
      // text or other page elements with the same label.
      const modeLabel = mode[0].toUpperCase() + mode.slice(1);
      const option = page.getByRole("menuitemcheckbox", { name: modeLabel, exact: true });
      await option.waitFor({ state: "visible", timeout: 3000 });
      // Radix DropdownMenuCheckboxItem may detach on check. Use scrollIntoView
      // + click in quick succession to minimize the race window.
      await option.scrollIntoViewIfNeeded();
      await option.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, captureName);
    });
  }

  // Column collapsed — scope to board columns, not sidebar
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-column-collapsed`)) {
    await runCaptureStep("board column collapsed", async () => {
      await loadBoard();
      // Find collapse button INSIDE a board column header (not sidebar)
      const columnHeader = page.getByTestId(TEST_IDS.BOARD.COLUMN).first();
      const collapseButton = columnHeader.getByLabel(/collapse/i);
      await collapseButton.waitFor({ state: "visible", timeout: 8000 });
      await collapseButton.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-board-column-collapsed`,
      );
      // Expand it back
      const expandButton = page.getByLabel(/expand/i).first();
      if (await isLocatorVisible(expandButton)) {
        await expandButton.click();
        await waitForScreenshotReady(page);
      }
    });
  }

  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-empty-column`)) {
    await runCaptureStep("board empty column", async () => {
      const emptyColumnWorkflowStates: E2EWorkflowState[] = [
        { id: "triage", name: "Triage", category: "todo", order: 0 },
        ...DEFAULT_SCREENSHOT_PROJECT_WORKFLOW_STATES.map((state, index) => ({
          ...state,
          order: index + 1,
        })),
      ];

      const updateResult = await testUserService.replaceProjectWorkflowStates(
        orgSlug,
        projectKey,
        emptyColumnWorkflowStates,
      );
      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to configure empty board column");
      }

      try {
        await loadBoard();
        const triageColumn = page.getByLabel(/triage column/i);
        await triageColumn.waitFor({ state: "visible", timeout: 8000 });
        await triageColumn.getByText("No issues yet", { exact: true }).waitFor({ timeout: 8000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          prefix,
          `project-${normalizedProjectKey}-board-empty-column`,
        );
      } finally {
        await testUserService.replaceProjectWorkflowStates(
          orgSlug,
          projectKey,
          DEFAULT_SCREENSHOT_PROJECT_WORKFLOW_STATES,
        );
      }
    });
  }

  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-wip-limit-warning`)) {
    await runCaptureStep("board WIP limit warning", async () => {
      const stateId = "todo";
      const warningLimit = 1;
      const updateResult = await testUserService.updateProjectWorkflowState(
        orgSlug,
        projectKey,
        stateId,
        warningLimit,
      );
      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to configure board WIP limit");
      }

      try {
        await loadBoard();
        await page.getByText("Over limit", { exact: true }).first().waitFor({ timeout: 8000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(
          page,
          prefix,
          `project-${normalizedProjectKey}-board-wip-limit-warning`,
        );
      } finally {
        await testUserService.updateProjectWorkflowState(orgSlug, projectKey, stateId, null);
      }
    });
  }

  // Filter bar active (apply a Priority filter)
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-filter-active`)) {
    await runCaptureStep("board filter active", async () => {
      await loadBoard();
      // The filter bar "Priority" button has icon text "Pri" + label "Priority"
      const priorityFilter = page.getByRole("button", { name: /priority/i }).nth(0);
      await priorityFilter.waitFor({ state: "visible", timeout: 8000 });
      await priorityFilter.click();
      const highOption = page
        .locator("[role='menuitemcheckbox']")
        .filter({ hasText: "High" })
        .first();
      await highOption.waitFor({ state: "visible", timeout: 5000 });
      await highOption.click();
      // Close dropdown
      await page.keyboard.press("Escape");
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-board-filter-active`);
    });
  }

  // Display properties dropdown open
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-display-properties`)) {
    await runCaptureStep("board display properties", async () => {
      await loadBoard();
      const propsButton = page.getByText("Properties", { exact: true });
      await propsButton.waitFor({ state: "visible", timeout: 8000 });
      await propsButton.click();
      // Wait for dropdown to be visible
      await page.getByRole("menuitemcheckbox").first().waitFor({ state: "visible", timeout: 3000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-board-display-properties`,
      );
      // Close dropdown
      await page.keyboard.press("Escape");
    });
  }

  // Peek / side panel mode — toggle view mode, click issue card
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-peek-mode`)) {
    await runCaptureStep("board peek mode", async () => {
      await loadBoard();
      // Toggle to side panel mode
      const toggleBtn = page.getByLabel(/switch to side panel view/i);
      await toggleBtn.waitFor({ state: "visible", timeout: 8000 });
      await toggleBtn.click();
      await waitForScreenshotReady(page);

      // Click an issue card to open side panel
      const board = page.getByTestId(TEST_IDS.BOARD.ROOT);
      const issueCard = board.getByTestId(TEST_IDS.ISSUE.CARD).first();
      await issueCard.waitFor({ state: "visible", timeout: 5000 });
      await issueCard.click();

      // Wait for the side panel to appear (Sheet component with data-testid)
      await page
        .getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL)
        .waitFor({ state: "visible", timeout: 8000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-board-peek-mode`);

      // Close panel and reset to modal view
      await page.keyboard.press("Escape");
      const resetBtn = page.getByLabel(/switch to modal view/i);
      if (await isLocatorVisible(resetBtn)) {
        await resetBtn.click();
      }
    });
  }
}

export async function screenshotSprintInteractiveStates(
  page: Page,
  orgSlug: string,
  projectKey: string,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const sprintsUrl = ROUTES.projects.sprints.build(orgSlug, projectKey);

  // Navigate to sprints page
  await page.goto(`${BASE_URL}${sprintsUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await waitForExpectedContent(page, sprintsUrl, "sprints");
  await waitForScreenshotReady(page);

  // Burndown chart (default view — click "Burndown" to ensure it's active)
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-burndown`)) {
    await runCaptureStep("sprint burndown chart", async () => {
      const burndownBtn = page.getByRole("button", { name: /^burndown$/i });
      if (await isLocatorVisible(burndownBtn)) {
        await burndownBtn.click();
        await waitForScreenshotReady(page);
      }
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-sprints-burndown`);
    });
  }

  // Burnup chart (toggle)
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-burnup`)) {
    await runCaptureStep("sprint burnup chart", async () => {
      const burnupBtn = page.getByRole("button", { name: /^burnup$/i });
      await burnupBtn.waitFor({ state: "visible", timeout: 5000 });
      await burnupBtn.click();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-sprints-burnup`);
      // Switch back to burndown
      const burndownBtn = page.getByRole("button", { name: /^burndown$/i });
      if (await isLocatorVisible(burndownBtn)) {
        await burndownBtn.click();
      }
    });
  }

  // Workload popover
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-workload`)) {
    await runCaptureStep("sprint workload popover", async () => {
      const workloadBtn = page.getByRole("button", { name: /assignees/i });
      await workloadBtn.waitFor({ state: "visible", timeout: 5000 });
      await workloadBtn.click();
      // Wait for popover content
      await page
        .getByText(/workload distribution/i)
        .first()
        .waitFor({ state: "visible", timeout: 5000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-sprints-workload`);
      // Close popover
      await page.keyboard.press("Escape");
    });
  }

  // Create sprint overlap warning
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-date-overlap-warning`)) {
    await runCaptureStep("sprint date overlap warning", async () => {
      let startSprintButton = page.getByRole("button", { name: /^start sprint$/i });

      if (!(await isLocatorVisible(startSprintButton))) {
        const createSprintButton = page
          .getByRole("button", { name: /create sprint|\+\s*sprint/i })
          .first();
        await createSprintButton.waitFor({ state: "visible", timeout: 5000 });
        await createSprintButton.click();

        const sprintNameInput = page.getByLabel("Sprint Name");
        await sprintNameInput.waitFor({ state: "visible", timeout: 5000 });

        const createForm = page.getByTestId(TEST_IDS.SPRINT.CREATE_FORM);
        await createForm.waitFor({ state: "visible", timeout: 5000 });
        await sprintNameInput.fill("Overlap Warning Sprint");
        await createForm.evaluate((form) => {
          (form as HTMLFormElement).requestSubmit();
        });

        startSprintButton = page.getByRole("button", { name: /^start sprint$/i });
        await startSprintButton.waitFor({ state: "visible", timeout: 5000 });
      }

      await startSprintButton.waitFor({ state: "visible", timeout: 5000 });
      await startSprintButton.click();

      const dialog = page.getByRole("dialog", { name: /^start sprint$/i });
      await dialog.waitFor({ state: "visible", timeout: 5000 });
      await waitForScreenshotReady(page);
      const overlapWarning = dialog.getByText(/these dates overlap with:/i).first();
      await overlapWarning.waitFor({ state: "visible", timeout: 5000 });
      await waitForAnimation(page);
      await overlapWarning.scrollIntoViewIfNeeded();
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-sprints-date-overlap-warning`,
      );
      await dismissIfOpen(page, dialog);
    });
  }

  // Complete sprint modal
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-completion-modal`)) {
    await runCaptureStep("sprint completion modal", async () => {
      const completeSprintButton = page
        .getByTestId(TEST_IDS.NAV.MAIN_CONTENT)
        .getByRole("button", { name: /^complete sprint$/i })
        .first();
      await completeSprintButton.waitFor({ state: "visible", timeout: 5000 });
      await completeSprintButton.click();

      const dialog = page.getByRole("dialog", { name: /^complete sprint$/i });
      await dialog.waitFor({ state: "visible", timeout: 5000 });
      await dialog
        .getByText(/issues? not completed\. choose what to do with them\./i)
        .waitFor({ state: "visible", timeout: 5000 });
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-sprints-completion-modal`,
      );
      await dismissIfOpen(page, dialog);
    });
  }
}

export async function screenshotIssueInteractiveStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  if (!shouldCapture(prefix, "issues-side-panel")) {
    return;
  }

  const issuesUrl = ROUTES.issues.list.build(orgSlug);

  await runCaptureStep("issues side panel", async () => {
    await page.goto(`${BASE_URL}${issuesUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await waitForExpectedContent(page, issuesUrl, "issues", prefix);
    await waitForScreenshotReady(page);

    const toggleBtn = page
      .getByTestId(TEST_IDS.NAV.MAIN_CONTENT)
      .getByRole("button", { name: /switch to side panel view/i })
      .first();
    await toggleBtn.waitFor({ state: "visible", timeout: 8000 });
    await toggleBtn.click();
    await waitForScreenshotReady(page);

    const issueCard = page
      .getByTestId(TEST_IDS.NAV.MAIN_CONTENT)
      .getByTestId(TEST_IDS.ISSUE.CARD)
      .first();
    await issueCard.waitFor({ state: "visible", timeout: 5000 });
    await issueCard.click();

    const issueDetailPanel = page.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL);
    await issueDetailPanel.waitFor({ state: "visible", timeout: 5000 });
    await issueDetailPanel
      .getByText(/[A-Z][A-Z0-9]+-\d+/)
      .first()
      .waitFor({ timeout: 5000 });
    await waitForScreenshotReady(page);
    await captureCurrentView(page, prefix, "issues-side-panel");

    await dismissIfOpen(page, issueDetailPanel);
    const resetBtn = page.getByRole("button", { name: /switch to modal view/i });
    if (await isLocatorVisible(resetBtn)) {
      await resetBtn.click();
    }
  });
}

// ---------------------------------------------------------------------------
// Main capture function for a single viewport/theme combination
// ---------------------------------------------------------------------------

/**
 * Authenticate, navigate to the app gateway, and return the page ready
 * for authenticated captures. Returns null if auth fails.
 */
