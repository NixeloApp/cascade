import { CONVEX_SITE_URL, E2E_API_KEY, TEST_USERS } from "./config";
import { expect, authenticatedTest as test } from "./fixtures";
import { createTestNamespace } from "./utils/test-helpers";

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

  test("user can track time on an issue", async ({ projectsPage }, testInfo) => {
    const namespace = createTestNamespace(testInfo);
    const projectKey = namespace.projectKey("TT");
    const issueTitle = namespace.name("Time Track Issue");

    await projectsPage.goto();
    await projectsPage.createWorkspace(namespace.name("TT WS"));
    await projectsPage.goto();

    // Create a project (waits for board to be interactive)
    await projectsPage.createProject(namespace.name("Time Tracking"), projectKey);

    // Create Issue
    await projectsPage.createIssue(issueTitle);

    // New issues land in backlog for the default Scrum template.
    await projectsPage.switchToTab("backlog");

    // Open detail
    await projectsPage.openIssueDetail(issueTitle);

    // Start timer and wait for the running state contract.
    await projectsPage.startTimer();

    // Stop timer and wait for the idle state contract.
    await projectsPage.stopTimer();
  });
});
