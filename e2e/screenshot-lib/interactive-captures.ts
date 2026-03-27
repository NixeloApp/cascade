/**
 * Modal & Interactive State Screenshot Captures
 *
 * Functions that capture screenshots of modals, dialogs, interactive states,
 * and feature-specific UI flows (board interactions, sprint workflows, etc.).
 */

import { expect, type Page } from "@playwright/test";
import {
  AssistantPage,
  CalendarPage,
  DashboardPage,
  DocumentsPage,
  InboxPage,
  InvoicesPage,
  IssuesPage,
  MeetingsPage,
  MyIssuesPage,
  ProjectsPage,
  RoadmapPage,
  SprintsPage,
} from "../pages";
import { waitForLocatorVisible } from "../utils/locator-state";
import { testUserService } from "../utils/test-user-service";
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
} from "./capture";

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

  const dashboardPage = new DashboardPage(page, orgSlug);
  await dashboardPage.goto();
  await dashboardPage.waitUntilReady();
  await waitForScreenshotReady(page);

  if ((await dashboardPage.commandPaletteButton.count()) > 0) {
    await runCaptureStep("dashboard omnibox", async () => {
      await dashboardPage.openCommandPalette();
      await dashboardPage.expectGlobalSearchReady();
      await captureCurrentView(page, prefix, "dashboard-omnibox");
      await dashboardPage.closeCommandPalette();
    });

    await runCaptureStep("dashboard advanced-search modal", async () => {
      try {
        await dashboardPage.openAdvancedSearch();
        await waitForAnimation(page);
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, "dashboard-advanced-search-modal");
        await dashboardPage.closeAdvancedSearch();
      } finally {
        await dashboardPage.closeCommandPaletteIfOpen();
        await dashboardPage.closeAdvancedSearchIfOpen();
      }
    });
  }

  if (
    captureState.currentConfigPrefix !== "mobile-light" &&
    (await dashboardPage.shortcutsHelpButton.count()) > 0
  ) {
    await runCaptureStep("dashboard shortcuts modal", async () => {
      await dismissAllDialogs(page);
      await dashboardPage.openShortcutsHelp();
      await captureCurrentView(page, prefix, "dashboard-shortcuts-modal");
      await dashboardPage.closeShortcutsHelp();
    });
  }

  if ((await dashboardPage.headerStartTimerButton.count()) > 0) {
    await runCaptureStep("dashboard time-entry modal", async () => {
      await dismissAllDialogs(page);
      await dashboardPage.openTimeEntryModal();
      await dashboardPage.expectTimeEntryModalReady(5000);
      await captureCurrentView(page, prefix, "dashboard-time-entry-modal");
      await dashboardPage.closeTimeEntryModal();
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
    await DashboardPage.withLoadingPage(page, orgSlug, async (loadingDashboardPage) => {
      const { page: loadingPage } = loadingDashboardPage;
      await loadingDashboardPage.gotoAndExpectLoadingSkeletons(12000);
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
    });
  });
}

export async function screenshotOrgCalendarStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const workspaceScopeName = "org-calendar-workspace-scope";
  const teamScopeName = "org-calendar-team-scope";
  const loadingStateName = "org-calendar-loading";

  if (!shouldCaptureAny(prefix, [workspaceScopeName, teamScopeName, loadingStateName])) {
    return;
  }

  if (shouldCaptureAny(prefix, [workspaceScopeName, teamScopeName])) {
    await runRequiredCaptureStep("org calendar filtered scope states", async () => {
      const calendarPage = new CalendarPage(page, orgSlug);
      await calendarPage.goto();
      await calendarPage.waitUntilReady();
      await waitForScreenshotReady(page);

      if (shouldCapture(prefix, workspaceScopeName)) {
        await calendarPage.selectWorkspace("Product");
        await calendarPage.expectWorkspaceScope("Product");
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, workspaceScopeName);
      }

      if (shouldCapture(prefix, teamScopeName)) {
        await calendarPage.selectWorkspace("Product");
        await calendarPage.selectTeam("Engineering");
        await calendarPage.expectTeamScope("Engineering");
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, teamScopeName);
      }
    });
  }

  if (shouldCapture(prefix, loadingStateName)) {
    await runRequiredCaptureStep("org calendar loading state", async () => {
      await CalendarPage.withLoadingPage(page, orgSlug, async (loadingCalendarPage) => {
        const { page: loadingPage } = loadingCalendarPage;
        await loadingCalendarPage.gotoAndExpectLoadingState(12000);
        await waitForAnimation(loadingPage);
        await captureCurrentView(loadingPage, prefix, loadingStateName, {
          skipReadyCheck: true,
        });
      });
    });
  }
}

export async function screenshotProjectsModal(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  if (!shouldCapture(prefix, "projects-create-project-modal")) {
    return;
  }

  const projectsPage = new ProjectsPage(page, orgSlug);
  const projectsState = await testUserService.configureProjectsState(orgSlug, "default");
  if (!projectsState.success) {
    throw new Error(projectsState.error ?? "Failed to restore default projects state");
  }

  await projectsPage.goto();
  await waitForScreenshotReady(page);

  await runCaptureStep("projects create-project modal", async () => {
    await projectsPage.openCreateProjectForm();
    await waitForScreenshotReady(page);
    await captureCurrentView(page, prefix, "projects-create-project-modal");
    await projectsPage.closeCreateProjectFormIfOpen();
  });
}

export async function screenshotProjectsStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const captureNames = {
    canonical: "projects",
    empty: "projects-empty",
    loading: "projects-loading",
    singleProject: "projects-single-project",
  } as const;

  if (!shouldCaptureAny(prefix, Object.values(captureNames))) {
    return;
  }

  const configureProjectsState = async (mode: "default" | "single" | "empty") => {
    const result = await testUserService.configureProjectsState(orgSlug, mode);
    if (!result.success) {
      throw new Error(result.error ?? `Failed to configure projects state: ${mode}`);
    }
  };

  const openProjectsPage = async (mode: "default" | "single" | "empty") => {
    await configureProjectsState(mode);
    const projectsPage = new ProjectsPage(page, orgSlug);
    await projectsPage.goto();
    await projectsPage.expectProjectsView();
    return projectsPage;
  };

  try {
    if (shouldCapture(prefix, captureNames.canonical)) {
      await runCaptureStep("projects canonical", async () => {
        const projectsPage = await openProjectsPage("default");
        await projectsPage.expectProjectsGridVisible();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, captureNames.canonical);
      });
    }

    if (shouldCapture(prefix, captureNames.singleProject)) {
      await runCaptureStep("projects single-project overview", async () => {
        const projectsPage = await openProjectsPage("single");
        await projectsPage.expectSingleProjectOverviewVisible();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, captureNames.singleProject);
      });
    }

    if (shouldCapture(prefix, captureNames.empty)) {
      await runCaptureStep("projects empty", async () => {
        const projectsPage = await openProjectsPage("empty");
        await projectsPage.expectProjectsEmptyStateVisible();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, captureNames.empty);
      });
    }

    if (shouldCapture(prefix, captureNames.loading)) {
      await runCaptureStep("projects loading", async () => {
        await ProjectsPage.withProjectsLoadingPage(page, orgSlug, async (loadingProjectsPage) => {
          const { page: loadingPage } = loadingProjectsPage;
          await loadingProjectsPage.gotoAndExpectProjectsLoadingState(12000);
          await waitForAnimation(loadingPage);
          await captureCurrentView(loadingPage, prefix, captureNames.loading, {
            skipReadyCheck: true,
          });
        });
      });
    }
  } finally {
    await configureProjectsState("default");
  }
}

export async function screenshotInvoicesStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const captureNames = {
    canonical: "invoices",
    createDialog: "invoices-create-draft-dialog",
    filteredEmpty: "invoices-filtered-empty",
    loading: "invoices-loading",
  } as const;

  if (!shouldCaptureAny(prefix, Object.values(captureNames))) {
    return;
  }

  const openInvoicesPage = async (targetPage: Page = page) => {
    const invoicesPage = new InvoicesPage(targetPage, orgSlug);
    await invoicesPage.goto();
    await invoicesPage.waitUntilReady();
    return invoicesPage;
  };

  if (shouldCapture(prefix, captureNames.canonical)) {
    await runCaptureStep("invoices canonical", async () => {
      const invoicesPage = await openInvoicesPage();
      await invoicesPage.expectPopulatedStateVisible();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, captureNames.canonical);
    });
  }

  if (shouldCapture(prefix, captureNames.filteredEmpty)) {
    await runCaptureStep("invoices filtered empty", async () => {
      const invoicesPage = await openInvoicesPage();
      await invoicesPage.selectStatusFilter("overdue");
      await invoicesPage.expectFilteredEmptyStateVisible();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, captureNames.filteredEmpty);
    });
  }

  if (shouldCapture(prefix, captureNames.createDialog)) {
    await runCaptureStep("invoices create dialog", async () => {
      const invoicesPage = await openInvoicesPage();
      await invoicesPage.openCreateDialog();
      await waitForAnimation(page);
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, captureNames.createDialog);
    });
  }

  if (shouldCapture(prefix, captureNames.loading)) {
    await runCaptureStep("invoices loading", async () => {
      await InvoicesPage.withLoadingPage(page, orgSlug, async (loadingInvoicesPage) => {
        const { page: loadingPage } = loadingInvoicesPage;
        await loadingInvoicesPage.goto();
        await loadingInvoicesPage.waitUntilReady();
        await loadingInvoicesPage.expectLoadingStateVisible();
        await waitForAnimation(loadingPage);
        await captureCurrentView(loadingPage, prefix, captureNames.loading, {
          skipReadyCheck: true,
        });
      });
    });
  }
}

export async function screenshotAssistantStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const captureNames = {
    canonical: "assistant",
    conversations: "assistant-conversations",
    conversationsEmpty: "assistant-conversations-empty",
    loading: "assistant-loading",
    overviewEmpty: "assistant-overview-empty",
  } as const;

  if (!shouldCaptureAny(prefix, Object.values(captureNames))) {
    return;
  }

  const configureAssistantState = async (mode: "default" | "empty") => {
    const result = await testUserService.configureAssistantState(orgSlug, mode);
    if (!result.success) {
      throw new Error(result.error ?? `Failed to configure assistant state: ${mode}`);
    }
  };

  const withAssistantState = async <T>(mode: "default" | "empty", run: () => Promise<T>) => {
    await configureAssistantState(mode);
    try {
      return await run();
    } finally {
      await configureAssistantState("default");
    }
  };

  const openAssistantPage = async () => {
    const assistantPage = new AssistantPage(page, orgSlug);
    await assistantPage.goto();
    await assistantPage.waitUntilReady();
    return assistantPage;
  };

  if (shouldCapture(prefix, captureNames.canonical)) {
    await runCaptureStep("assistant canonical", async () => {
      await withAssistantState("default", async () => {
        const assistantPage = await openAssistantPage();
        await assistantPage.snapshotCard.waitFor({ timeout: 5000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, captureNames.canonical);
      });
    });
  }

  if (shouldCapture(prefix, captureNames.conversations)) {
    await runCaptureStep("assistant conversations", async () => {
      await withAssistantState("default", async () => {
        const assistantPage = await openAssistantPage();
        await assistantPage.openConversationsTab();
        await assistantPage.conversationsList.waitFor({ timeout: 5000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, captureNames.conversations);
      });
    });
  }

  if (shouldCapture(prefix, captureNames.overviewEmpty)) {
    await runCaptureStep("assistant overview empty", async () => {
      await withAssistantState("empty", async () => {
        const assistantPage = await openAssistantPage();
        await assistantPage.overviewEmptyState.waitFor({ timeout: 5000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, captureNames.overviewEmpty);
      });
    });
  }

  if (shouldCapture(prefix, captureNames.conversationsEmpty)) {
    await runCaptureStep("assistant conversations empty", async () => {
      await withAssistantState("empty", async () => {
        const assistantPage = await openAssistantPage();
        await assistantPage.openConversationsTab();
        await assistantPage.conversationsEmptyState.waitFor({ timeout: 5000 });
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, captureNames.conversationsEmpty);
      });
    });
  }

  if (shouldCapture(prefix, captureNames.loading)) {
    await runCaptureStep("assistant loading", async () => {
      await AssistantPage.withLoadingPage(page, orgSlug, async (loadingAssistantPage) => {
        const { page: loadingPage } = loadingAssistantPage;
        await loadingAssistantPage.gotoAndExpectLoadingState(12000);
        await waitForAnimation(loadingPage);
        await captureCurrentView(loadingPage, prefix, captureNames.loading, {
          skipReadyCheck: true,
        });
      });
    });
  }
}

export async function screenshotRoadmapStates(
  page: Page,
  orgSlug: string,
  projectKey: string,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const captureNames = {
    canonical: `project-${normalizedProjectKey}-roadmap`,
    detail: `project-${normalizedProjectKey}-roadmap-detail`,
    empty: `project-${normalizedProjectKey}-roadmap-empty`,
    grouped: `project-${normalizedProjectKey}-roadmap-grouped`,
    milestone: `project-${normalizedProjectKey}-roadmap-milestone`,
    timelineSelector: `project-${normalizedProjectKey}-roadmap-timeline-selector`,
  } as const;

  if (!shouldCaptureAny(prefix, Object.values(captureNames))) {
    return;
  }

  const configureRoadmapState = async (mode: "default" | "empty" | "milestone") => {
    const result = await testUserService.configureRoadmapState(orgSlug, projectKey, mode);
    if (!result.success) {
      throw new Error(result.error ?? `Failed to configure roadmap state: ${mode}`);
    }
  };

  const withRoadmapPage = async <T>({
    mode,
    run,
  }: {
    mode: "default" | "empty" | "milestone";
    run: (capturePage: Page, roadmapPage: RoadmapPage) => Promise<T>;
  }): Promise<T> => {
    await configureRoadmapState(mode);

    try {
      const roadmapPage = new RoadmapPage(page, orgSlug);
      await roadmapPage.gotoProject(projectKey);
      await roadmapPage.waitUntilReady();
      return await run(page, roadmapPage);
    } finally {
      await configureRoadmapState("default");
    }
  };

  if (shouldCapture(prefix, captureNames.canonical)) {
    await runRequiredCaptureStep("roadmap canonical", async () => {
      await withRoadmapPage({
        mode: "default",
        run: async (capturePage, roadmapPage) => {
          await roadmapPage.expectTimelineState();
          await roadmapPage.expectDependencyLinesVisible();
          await waitForScreenshotReady(capturePage);
          await captureCurrentView(capturePage, prefix, captureNames.canonical);
        },
      });
    });
  }

  if (shouldCapture(prefix, captureNames.timelineSelector)) {
    await runRequiredCaptureStep("roadmap timeline selector", async () => {
      await withRoadmapPage({
        mode: "default",
        run: async (capturePage, roadmapPage) => {
          await roadmapPage.expectTimelineState();
          await roadmapPage.expectDependencyLinesVisible();
          await roadmapPage.openTimelineSpanSelector();
          await waitForScreenshotReady(capturePage);
          await captureCurrentView(capturePage, prefix, captureNames.timelineSelector);
        },
      });
    });
  }

  if (shouldCapture(prefix, captureNames.grouped)) {
    await runRequiredCaptureStep("roadmap grouped", async () => {
      await withRoadmapPage({
        mode: "default",
        run: async (capturePage, roadmapPage) => {
          await roadmapPage.groupByStatus();
          await roadmapPage.expectGroupedState();
          await waitForScreenshotReady(capturePage);
          await captureCurrentView(capturePage, prefix, captureNames.grouped);
        },
      });
    });
  }

  if (shouldCapture(prefix, captureNames.detail)) {
    await runRequiredCaptureStep("roadmap detail", async () => {
      await withRoadmapPage({
        mode: "default",
        run: async (capturePage, roadmapPage) => {
          await roadmapPage.expectTimelineState();
          await roadmapPage.openPreferredIssueDetail();
          await roadmapPage.expectDetailState();
          await waitForScreenshotReady(capturePage);
          await captureCurrentView(capturePage, prefix, captureNames.detail);
        },
      });
    });
  }

  if (shouldCapture(prefix, captureNames.empty)) {
    await runRequiredCaptureStep("roadmap empty", async () => {
      await withRoadmapPage({
        mode: "empty",
        run: async (capturePage, roadmapPage) => {
          await roadmapPage.expectEmptyState();
          await waitForScreenshotReady(capturePage);
          await captureCurrentView(capturePage, prefix, captureNames.empty);
        },
      });
    });
  }

  if (shouldCapture(prefix, captureNames.milestone)) {
    await runRequiredCaptureStep("roadmap milestone", async () => {
      await withRoadmapPage({
        mode: "milestone",
        run: async (capturePage, roadmapPage) => {
          await roadmapPage.expectMilestoneState();
          await roadmapPage.expectDependencyLinesVisible();
          await waitForScreenshotReady(capturePage);
          await captureCurrentView(capturePage, prefix, captureNames.milestone);
        },
      });
    });
  }
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

  const projectsPage = new ProjectsPage(page, orgSlug);
  await projectsPage.gotoProjectBoardAndWait(projectKey);
  await waitForScreenshotReady(page);
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

  if (
    shouldCaptureAny(prefix, [issueDetailModalName, issueDetailInlineEditingName]) &&
    ((issueKey && (await projectsPage.getIssueCardTrigger(issueKey).count()) > 0) ||
      (await projectsPage.issueCards.count()) > 0)
  ) {
    await runCaptureStep("board issue-detail modal", async () => {
      if (issueKey && (await projectsPage.getIssueCardTrigger(issueKey).count()) > 0) {
        await projectsPage.getIssueCardTrigger(issueKey).scrollIntoViewIfNeeded();
        await projectsPage.openIssueDetailByKey(issueKey);
      } else {
        const issueCard = projectsPage.issueCards.first();
        await issueCard.scrollIntoViewIfNeeded();
        await issueCard.click();
        const dialogOpened = await waitForLocatorVisible(projectsPage.issueDetailDialog, 3000);
        if (!dialogOpened) {
          await waitForScreenshotReady(page);
          await issueCard.click();
          await projectsPage.issueDetailDialog.waitFor({ state: "visible", timeout: 5000 });
        }
        await expect(projectsPage.issueDetailKey).toBeVisible({ timeout: 5000 });
        await expect(projectsPage.issueDetailTitle).toBeVisible({ timeout: 5000 });
      }

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

      await dismissIfOpen(page, projectsPage.issueDetailDialog);
    });
  }
}

export async function screenshotBoardLoadingState(
  page: Page,
  orgSlug: string,
  projectKey: string,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const loadingStateName = `project-${normalizedProjectKey}-board-loading`;

  if (!shouldCapture(prefix, loadingStateName)) {
    return;
  }

  await runRequiredCaptureStep("board loading state", async () => {
    await ProjectsPage.withBoardLoadingPage(page, orgSlug, async (loadingProjectsPage) => {
      const { page: loadingPage } = loadingProjectsPage;
      await loadingProjectsPage.gotoProjectBoardAndExpectLoadingState(projectKey, 15000);
      await waitForAnimation(loadingPage);
      await captureCurrentView(loadingPage, prefix, loadingStateName, {
        skipReadyCheck: true,
      });
    });
  });
}

export async function screenshotMeetingsStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const meetingsDetailName = "meetings-detail";
  const transcriptSearchName = "meetings-transcript-search";
  const memoryLensName = "meetings-memory-lens";
  const processingName = "meetings-processing";
  const filterEmptyName = "meetings-filter-empty";
  const scheduleDialogName = "meetings-schedule-dialog";
  const isDesktopCapture = captureState.currentConfigPrefix.startsWith("desktop-");
  const isTabletCapture = captureState.currentConfigPrefix === "tablet-light";
  const shouldCaptureDetailState = isDesktopCapture;
  const shouldCaptureFilterEmptyState = isDesktopCapture;
  const shouldCaptureScheduleDialogState = isDesktopCapture || isTabletCapture;

  if (
    !shouldCaptureAny(prefix, [
      meetingsDetailName,
      transcriptSearchName,
      memoryLensName,
      processingName,
      filterEmptyName,
      scheduleDialogName,
    ])
  ) {
    return;
  }

  const meetingsPage = new MeetingsPage(page, orgSlug);

  const openMeetingsForCapture = async () => {
    await meetingsPage.goto();
    await meetingsPage.waitForCaptureReady();
    await waitForScreenshotReady(page);
  };

  if (shouldCaptureDetailState && shouldCapture(prefix, meetingsDetailName)) {
    await runCaptureStep("meetings detail", async () => {
      await openMeetingsForCapture();
      await meetingsPage.expectRecordingVisible("Client Launch Review");
      await meetingsPage.openRecording("Client Launch Review");
      await meetingsPage.expectRecordingDetail("Client Launch Review");
      await meetingsPage.expectRecordingSummary(
        "The client also asked whether they need weekend coverage and a final handoff packet before launch.",
      );
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, meetingsDetailName);
    });
  }

  if (shouldCapture(prefix, transcriptSearchName)) {
    await runCaptureStep("meetings transcript search", async () => {
      await openMeetingsForCapture();
      await meetingsPage.expectRecordingVisible("Weekly Product Sync");
      await meetingsPage.openRecording("Weekly Product Sync");
      await meetingsPage.expectRecordingDetail("Weekly Product Sync");
      await meetingsPage.filterTranscript("pricing");
      await meetingsPage.expectTranscriptMatch(
        "We cleared the dashboard bugs, but pricing approval still needs legal sign-off before launch.",
      );
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, transcriptSearchName);
    });
  }

  if (shouldCapture(prefix, memoryLensName)) {
    await runCaptureStep("meetings memory lens", async () => {
      await openMeetingsForCapture();
      await meetingsPage.filterMemoryByProject("OPS");
      await meetingsPage.expectMemoryDescription(
        "Cross-meeting decisions, open questions, and follow-ups for OPS - Client Operations Hub.",
      );
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, memoryLensName);
    });
  }

  if (shouldCapture(prefix, processingName)) {
    await runCaptureStep("meetings processing detail", async () => {
      await openMeetingsForCapture();
      await meetingsPage.filterByStatus("Processing");
      await meetingsPage.expectRecordingVisible("Go-live Support Runbook");
      await meetingsPage.openRecording("Go-live Support Runbook");
      await meetingsPage.expectRecordingDetail("Go-live Support Runbook");
      await meetingsPage.expectSummaryProcessingState();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, processingName);
    });
  }

  if (shouldCaptureFilterEmptyState && shouldCapture(prefix, filterEmptyName)) {
    await runCaptureStep("meetings filter empty state", async () => {
      await openMeetingsForCapture();
      await meetingsPage.searchMeetings("zzzz-no-results");
      await meetingsPage.expectFilteredEmptyState();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, filterEmptyName);
    });
  }

  if (shouldCaptureScheduleDialogState && shouldCapture(prefix, scheduleDialogName)) {
    await runCaptureStep("meetings schedule dialog", async () => {
      await openMeetingsForCapture();
      await dismissAllDialogs(page);
      await meetingsPage.openScheduleDialog();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, scheduleDialogName);
      await dismissIfOpen(page, meetingsPage.scheduleDialog);
    });
  }
}

export async function screenshotDocumentsStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const filteredSearchName = "documents-search-filtered";
  const emptySearchName = "documents-search-empty";

  if (!shouldCaptureAny(prefix, [filteredSearchName, emptySearchName])) {
    return;
  }

  const documentsPage = new DocumentsPage(page, orgSlug);

  const openDocumentsForCapture = async () => {
    await documentsPage.goto();
    await documentsPage.waitUntilReady();
    await documentsPage.expectDocumentsView();
    await waitForScreenshotReady(page);
  };

  if (shouldCapture(prefix, filteredSearchName)) {
    await runCaptureStep("documents filtered search", async () => {
      await openDocumentsForCapture();
      await documentsPage.searchDocuments("requirements");
      await documentsPage.expectSearchResultVisible("Project Requirements");
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, filteredSearchName);
    });
  }

  if (shouldCapture(prefix, emptySearchName)) {
    await runCaptureStep("documents empty search", async () => {
      await openDocumentsForCapture();
      await documentsPage.searchDocuments("zzzz-no-results");
      await documentsPage.expectSearchEmptyState();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, emptySearchName);
    });
  }
}

export async function screenshotIssuesStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const filteredSearchName = "issues-search-filtered";
  const emptySearchName = "issues-search-empty";
  const statusFilterName = "issues-filter-active";
  const createModalName = "issues-create-modal";
  const loadingStateName = "issues-loading";

  if (
    !shouldCaptureAny(prefix, [
      filteredSearchName,
      emptySearchName,
      statusFilterName,
      createModalName,
      loadingStateName,
    ])
  ) {
    return;
  }

  const issuesPage = new IssuesPage(page, orgSlug);

  const openIssuesForCapture = async () => {
    await issuesPage.goto();
    await issuesPage.waitUntilReady();
    await waitForScreenshotReady(page);
  };

  if (shouldCapture(prefix, filteredSearchName)) {
    await runCaptureStep("issues filtered search", async () => {
      await openIssuesForCapture();
      await issuesPage.searchIssues("login");
      await issuesPage.expectSearchResultVisible("Fix login timeout on mobile");
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, filteredSearchName);
    });
  }

  if (shouldCapture(prefix, emptySearchName)) {
    await runCaptureStep("issues empty search", async () => {
      await openIssuesForCapture();
      await issuesPage.searchIssues("zzzz-no-results");
      await issuesPage.expectSearchEmptyState();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, emptySearchName);
    });
  }

  if (shouldCapture(prefix, statusFilterName)) {
    await runCaptureStep("issues status filter", async () => {
      await openIssuesForCapture();
      await issuesPage.filterByStatus("To Do");
      await issuesPage.expectSearchResultVisible("Add dark mode support");
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, statusFilterName);
    });
  }

  if (shouldCapture(prefix, createModalName)) {
    await runCaptureStep("issues create modal", async () => {
      await openIssuesForCapture();
      await dismissAllDialogs(page);
      await issuesPage.openCreateIssueModal();
      await issuesPage.expectCreateIssueModalCaptureReady();
      await captureCurrentView(page, prefix, createModalName);
      await dismissIfOpen(page, issuesPage.createIssueModal);
    });
  }

  if (shouldCapture(prefix, loadingStateName)) {
    await runCaptureStep("issues loading state", async () => {
      await IssuesPage.withLoadingPage(page, orgSlug, async (loadingIssuesPage) => {
        const { page: loadingPage } = loadingIssuesPage;
        await loadingIssuesPage.gotoAndExpectLoadingState(12000);
        await waitForAnimation(loadingPage);
        await captureCurrentView(loadingPage, prefix, loadingStateName, {
          skipReadyCheck: true,
        });
      });
    });
  }
}

export async function screenshotMyIssuesStates(
  page: Page,
  orgSlug: string,
  prefix: string,
): Promise<void> {
  const filterActiveName = "my-issues-filter-active";
  const filteredEmptyName = "my-issues-filtered-empty";
  const loadingStateName = "my-issues-loading";

  if (!shouldCaptureAny(prefix, [filterActiveName, filteredEmptyName, loadingStateName])) {
    return;
  }

  if (shouldCapture(prefix, filterActiveName)) {
    await runCaptureStep("my issues filter active", async () => {
      const filterActivePage = await page.context().newPage();

      try {
        const filteredMyIssuesPage = new MyIssuesPage(filterActivePage, orgSlug);
        await filteredMyIssuesPage.goto();
        await filteredMyIssuesPage.waitUntilReady();
        await filteredMyIssuesPage.selectPriorityFilter("High");
        await filteredMyIssuesPage.expectFilterSummaryVisible();
        await waitForScreenshotReady(filterActivePage);
        await captureCurrentView(filterActivePage, prefix, filterActiveName);
      } finally {
        if (!filterActivePage.isClosed()) {
          await filterActivePage.close();
        }
      }
    });
  }

  if (shouldCapture(prefix, filteredEmptyName)) {
    await runCaptureStep("my issues filtered empty state", async () => {
      const filteredEmptyPage = await page.context().newPage();

      try {
        const filteredEmptyMyIssuesPage = new MyIssuesPage(filteredEmptyPage, orgSlug);
        await filteredEmptyMyIssuesPage.goto();
        await filteredEmptyMyIssuesPage.waitUntilReady();
        await filteredEmptyMyIssuesPage.selectPriorityFilter("Lowest");
        await filteredEmptyMyIssuesPage.expectFilteredEmptyState();
        await waitForScreenshotReady(filteredEmptyPage);
        await captureCurrentView(filteredEmptyPage, prefix, filteredEmptyName);
      } finally {
        if (!filteredEmptyPage.isClosed()) {
          await filteredEmptyPage.close();
        }
      }
    });
  }

  if (shouldCapture(prefix, loadingStateName)) {
    await runCaptureStep("my issues loading state", async () => {
      await MyIssuesPage.withLoadingPage(
        page,
        orgSlug,
        captureState.currentConfigPrefix.endsWith("dark") ? "dark" : "light",
        async (loadingMyIssuesPage) => {
          const { page: loadingPage } = loadingMyIssuesPage;
          await loadingMyIssuesPage.expectLoadingStateVisible();
          await waitForAnimation(loadingPage);
          await captureCurrentView(loadingPage, prefix, loadingStateName, {
            skipReadyCheck: true,
          });
        },
      );
    });
  }
}

export async function screenshotProjectInboxStates(
  page: Page,
  orgSlug: string,
  projectKey: string,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const closedTabName = `project-${normalizedProjectKey}-inbox-closed`;
  const bulkSelectionName = `project-${normalizedProjectKey}-inbox-bulk-selection`;
  const snoozeMenuName = `project-${normalizedProjectKey}-inbox-snooze-menu`;
  const declineDialogName = `project-${normalizedProjectKey}-inbox-decline-dialog`;
  const duplicateDialogName = `project-${normalizedProjectKey}-inbox-duplicate-dialog`;
  const openEmptyName = `project-${normalizedProjectKey}-inbox-open-empty`;
  const closedEmptyName = `project-${normalizedProjectKey}-inbox-closed-empty`;

  if (
    !shouldCaptureAny(prefix, [
      closedTabName,
      bulkSelectionName,
      snoozeMenuName,
      declineDialogName,
      duplicateDialogName,
      openEmptyName,
      closedEmptyName,
    ])
  ) {
    return;
  }

  const inboxPage = new InboxPage(page, orgSlug, projectKey);
  const ensureInboxState = async (mode: "default" | "openEmpty" | "closedEmpty") => {
    const result = await testUserService.configureProjectInboxState(orgSlug, projectKey, mode);
    if (!result.success) {
      throw new Error(result.error || `Failed to configure project inbox state: ${mode}`);
    }
  };
  const openInbox = async () => {
    await inboxPage.gotoAndWait();
    await waitForScreenshotReady(page);
  };
  await ensureInboxState("default");

  try {
    if (shouldCapture(prefix, closedTabName)) {
      await runCaptureStep("project inbox closed tab", async () => {
        await openInbox();
        await inboxPage.openClosedTab();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, closedTabName);
      });
    }

    if (shouldCapture(prefix, bulkSelectionName)) {
      await runCaptureStep("project inbox bulk selection", async () => {
        await openInbox();
        await inboxPage.selectFirstOpenIssue();
        await expect(inboxPage.bulkActions).toBeVisible();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, bulkSelectionName);
      });
    }

    if (shouldCapture(prefix, snoozeMenuName)) {
      await runCaptureStep("project inbox snooze menu", async () => {
        await openInbox();
        await inboxPage.openFirstIssueSnoozeMenu();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, snoozeMenuName);
        await page.keyboard.press("Escape");
      });
    }

    if (shouldCapture(prefix, declineDialogName)) {
      await runCaptureStep("project inbox decline dialog", async () => {
        await openInbox();
        await inboxPage.openFirstIssueDeclineDialog();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, declineDialogName);
        await inboxPage.closeDeclineDialogIfOpen();
      });
    }

    if (shouldCapture(prefix, duplicateDialogName)) {
      await runCaptureStep("project inbox duplicate dialog", async () => {
        await openInbox();
        await inboxPage.openFirstIssueDuplicateDialog();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, duplicateDialogName);
        await inboxPage.closeDuplicateDialogIfOpen();
      });
    }

    if (shouldCapture(prefix, openEmptyName)) {
      await runCaptureStep("project inbox open empty state", async () => {
        await ensureInboxState("openEmpty");
        await openInbox();
        await inboxPage.expectOpenEmptyState();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, openEmptyName);
      });
    }

    if (shouldCapture(prefix, closedEmptyName)) {
      await runCaptureStep("project inbox closed empty state", async () => {
        await ensureInboxState("closedEmpty");
        await openInbox();
        await inboxPage.openClosedTab();
        await inboxPage.expectClosedEmptyState();
        await waitForScreenshotReady(page);
        await captureCurrentView(page, prefix, closedEmptyName);
      });
    }
  } finally {
    await ensureInboxState("default");
  }
}

export async function screenshotBoardInteractiveStates(
  page: Page,
  orgSlug: string,
  projectKey: string,
  prefix: string,
): Promise<void> {
  const normalizedProjectKey = projectKey.toLowerCase();
  const projectsPage = new ProjectsPage(page, orgSlug);

  // Helper: navigate to board and wait for toolbar
  const loadBoard = async () => {
    await projectsPage.gotoProjectBoardAndWait(projectKey);
    await waitForScreenshotReady(page);
  };

  // Swimlane modes — reload board fresh for each to avoid stale button text
  const swimlaneModes = ["priority", "assignee", "type", "label"] as const;
  for (const mode of swimlaneModes) {
    const captureName = `project-${normalizedProjectKey}-board-swimlane-${mode}`;
    if (!shouldCapture(prefix, captureName)) continue;

    await runCaptureStep(`board swimlane ${mode}`, async () => {
      await loadBoard();
      await projectsPage.selectBoardSwimlaneMode(mode);
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, captureName);
    });
  }

  // Column collapsed — scope to board columns, not sidebar
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-column-collapsed`)) {
    await runCaptureStep("board column collapsed", async () => {
      await loadBoard();
      await projectsPage.collapseFirstBoardColumn();
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-board-column-collapsed`,
      );
      await projectsPage.expandFirstCollapsedBoardColumn();
      await waitForScreenshotReady(page);
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
        await projectsPage.expectBoardColumnEmpty("Triage");
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
        await projectsPage.expectBoardWipWarningVisible();
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
      await projectsPage.applyBoardPriorityFilter("high");
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-board-filter-active`);
    });
  }

  // Display properties dropdown open
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-board-display-properties`)) {
    await runCaptureStep("board display properties", async () => {
      await loadBoard();
      await projectsPage.openBoardDisplayPropertiesMenu();
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
      await projectsPage.enablePeekMode();
      await waitForScreenshotReady(page);
      await projectsPage.openFirstIssueDetailCard();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-board-peek-mode`);

      // Close panel and reset to modal view
      await page.keyboard.press("Escape");
      await projectsPage.enableModalMode();
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
  const sprintsPage = new SprintsPage(page, orgSlug);
  const loadSprints = async () => {
    await sprintsPage.gotoProjectAndWait(projectKey);
    await waitForScreenshotReady(page);
  };

  // Burndown chart (default view — click "Burndown" to ensure it's active)
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-burndown`)) {
    await runCaptureStep("sprint burndown chart", async () => {
      await loadSprints();
      await sprintsPage.switchChartMode("burndown");
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-sprints-burndown`);
    });
  }

  // Burnup chart (toggle)
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-burnup`)) {
    await runCaptureStep("sprint burnup chart", async () => {
      await loadSprints();
      await sprintsPage.switchChartMode("burnup");
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-sprints-burnup`);
    });
  }

  // Workload popover
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-workload`)) {
    await runCaptureStep("sprint workload popover", async () => {
      await loadSprints();
      await sprintsPage.openWorkloadPopover();
      await waitForScreenshotReady(page);
      await captureCurrentView(page, prefix, `project-${normalizedProjectKey}-sprints-workload`);
      await dismissIfOpen(page, sprintsPage.workloadPopover);
    });
  }

  // Create sprint overlap warning
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-date-overlap-warning`)) {
    await runCaptureStep("sprint date overlap warning", async () => {
      await loadSprints();
      await sprintsPage.ensureFutureSprintReady();
      await sprintsPage.openStartDialog();
      await sprintsPage.chooseStartPreset("custom");
      await sprintsPage.startDateInput.fill("2026-03-15");
      await sprintsPage.startEndDateInput.fill("2026-03-25");
      await sprintsPage.startOverlapWarning.waitFor({ state: "visible", timeout: 5000 });
      await waitForAnimation(page);
      await sprintsPage.startOverlapWarning.scrollIntoViewIfNeeded();
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-sprints-date-overlap-warning`,
      );
      await dismissIfOpen(page, sprintsPage.startDialog);
    });
  }

  // Complete sprint modal
  if (shouldCapture(prefix, `project-${normalizedProjectKey}-sprints-completion-modal`)) {
    await runCaptureStep("sprint completion modal", async () => {
      await loadSprints();
      await sprintsPage.openCompletionDialog();
      await waitForScreenshotReady(page);
      await captureCurrentView(
        page,
        prefix,
        `project-${normalizedProjectKey}-sprints-completion-modal`,
      );
      await dismissIfOpen(page, sprintsPage.completionDialog);
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

  await runCaptureStep("issues side panel", async () => {
    const issuesPage = new IssuesPage(page, orgSlug);
    await issuesPage.goto();
    await issuesPage.waitUntilReady();
    await waitForScreenshotReady(page);
    await issuesPage.switchToSidePanelMode();
    await waitForScreenshotReady(page);

    await issuesPage.issueCards.first().waitFor({ state: "visible", timeout: 5000 });
    await issuesPage.issueCards.first().click();

    await issuesPage.waitForDetailPanel();
    await waitForScreenshotReady(page);
    await captureCurrentView(page, prefix, "issues-side-panel");

    await dismissIfOpen(page, issuesPage.detailModal);
    await issuesPage.switchToModalModeIfVisible();
  });
}

// ---------------------------------------------------------------------------
// Main capture function for a single viewport/theme combination
// ---------------------------------------------------------------------------

/**
 * Authenticate, navigate to the app gateway, and return the page ready
 * for authenticated captures. Returns null if auth fails.
 */
