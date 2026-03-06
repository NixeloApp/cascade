import { CONVEX_SITE_URL, E2E_API_KEY, TEST_USERS } from "./config";
import { expect, authenticatedTest as test } from "./fixtures";

/** Time Tracking E2E Tests - start/stop timers on issues */
test.describe("Time Tracking", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ skipAuthSave: true });

  test.beforeEach(async () => {
    // Clean up running timers to ensure clean state
    try {
      await fetch(`${CONVEX_SITE_URL}/e2e/nuke-timers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-e2e-api-key": E2E_API_KEY,
        },
        body: JSON.stringify({ email: TEST_USERS.teamLead.email }),
      });
      console.log("Helper: Nuked timers for test user");
    } catch (e) {
      console.error("Helper: Failed to nuke timers", e);
      // Fail the test if cleanup fails - we need a clean slate
      throw new Error(`Failed to nuke timers: ${e}`);
    }
  });

  test("user can track time on an issue", async ({ projectsPage }) => {
    const now = Date.now();
    const projectKey = `TT${now.toString().slice(-4)}`;
    const issueTitle = `Time Track Issue ${now}`;

    await projectsPage.goto();
    await projectsPage.createWorkspace(`TT WS ${now}`);
    await projectsPage.goto();

    // Create a project (waits for board to be interactive)
    await projectsPage.createProject(`Time Tracking ${now}`, projectKey);

    // Create Issue
    await projectsPage.createIssue(issueTitle);

    // Close modal
    await expect(projectsPage.createIssueModal).not.toBeVisible();

    // New issues land in backlog for the default Scrum template.
    await projectsPage.switchToTab("backlog");

    // Open detail
    await projectsPage.openIssueDetail(issueTitle);

    // Start timer
    await projectsPage.startTimer();

    // Wait for timer to register (check stop button appears)
    await expect(projectsPage.stopTimerButton).toBeVisible();

    // Stop timer
    await projectsPage.stopTimer();

    // Verify timer stopped (start button should reappear)
    await expect(projectsPage.startTimerButton).toBeVisible();
  });
});
