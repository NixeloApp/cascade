import { TEST_USERS } from "./config";
import { authenticatedTest as test } from "./fixtures";
import { IssueDetailPage } from "./pages";
import { SEEDED_MEETING_RECORDINGS } from "./utils/seeded-meetings";
import { testUserService } from "./utils/test-user-service";

function getWorkerFixtureEmail(parallelIndex: number): string {
  return TEST_USERS.teamLead.email.replace("@", `-w${parallelIndex}@`);
}

test.describe("Meetings", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test("shows the empty state when the current user has no recordings", async ({
    meetingsPage,
  }, testInfo) => {
    const workerEmail = getWorkerFixtureEmail(testInfo.parallelIndex);
    const resetResult = await testUserService.resetMeetingsData(workerEmail);
    if (!resetResult.success) {
      throw new Error(resetResult.error || "Failed to reset meetings data");
    }

    await meetingsPage.goto();
    await meetingsPage.expectEmptyState();
  });

  test("shows seeded meeting detail, transcript filtering, and project memory lenses", async ({
    meetingsPage,
    orgSlug,
  }, testInfo) => {
    const workerEmail = getWorkerFixtureEmail(testInfo.parallelIndex);

    const resetResult = await testUserService.resetMeetingsData(workerEmail);
    if (!resetResult.success) {
      throw new Error(resetResult.error || "Failed to reset meetings data");
    }

    const seedResult = await testUserService.seedScreenshotData(workerEmail, { orgSlug });
    if (!seedResult.success) {
      throw new Error(seedResult.error || "Failed to seed meetings workspace data");
    }

    await meetingsPage.goto();
    await meetingsPage.expectRecordingVisibleAt(
      SEEDED_MEETING_RECORDINGS.weeklyProductSync.index,
      SEEDED_MEETING_RECORDINGS.weeklyProductSync.title,
    );
    await meetingsPage.expectRecordingVisibleAt(
      SEEDED_MEETING_RECORDINGS.clientLaunchReview.index,
      SEEDED_MEETING_RECORDINGS.clientLaunchReview.title,
    );

    await meetingsPage.openRecordingAt(
      SEEDED_MEETING_RECORDINGS.weeklyProductSync.index,
      SEEDED_MEETING_RECORDINGS.weeklyProductSync.title,
    );
    await meetingsPage.expectRecordingDetail(SEEDED_MEETING_RECORDINGS.weeklyProductSync.title);

    await meetingsPage.filterTranscript("pricing");
    await meetingsPage.expectTranscriptMatch(
      "We cleared the dashboard bugs, but pricing approval still needs legal sign-off before launch.",
    );

    await meetingsPage.filterMemoryByProject("OPS");
    await meetingsPage.expectMemoryDescription(
      "Cross-meeting decisions, open questions, and follow-ups for OPS - Client Operations Hub.",
    );
    await meetingsPage.expectMemoryItemVisible("Confirm support rotation for go-live week");
  });

  test("creates a project issue from a seeded meeting action item", async ({
    meetingsPage,
    orgSlug,
    page,
  }, testInfo) => {
    const workerEmail = getWorkerFixtureEmail(testInfo.parallelIndex);
    const actionItemDescription = "Turn the release checklist into tracked follow-up work";

    const resetResult = await testUserService.resetMeetingsData(workerEmail);
    if (!resetResult.success) {
      throw new Error(resetResult.error || "Failed to reset meetings data");
    }

    const seedResult = await testUserService.seedScreenshotData(workerEmail, { orgSlug });
    if (!seedResult.success) {
      throw new Error(seedResult.error || "Failed to seed meetings workspace data");
    }

    await meetingsPage.goto();
    await meetingsPage.expectRecordingDetail(SEEDED_MEETING_RECORDINGS.weeklyProductSync.title);
    await meetingsPage.expectActionItemCreateIssueEnabled(actionItemDescription);

    await meetingsPage.createIssueFromActionItem(actionItemDescription);
    const createdIssueKey = await meetingsPage.getLinkedIssueKey(actionItemDescription);
    await meetingsPage.expectLinkedIssue(
      actionItemDescription,
      createdIssueKey,
      actionItemDescription,
    );

    const issueDetailPage = new IssueDetailPage(page, orgSlug);
    await meetingsPage.openLinkedIssue(actionItemDescription);
    await issueDetailPage.expectIssueLoaded(createdIssueKey);
    await issueDetailPage.expectProjectBreadcrumbVisible("DEMO");
  });
});
