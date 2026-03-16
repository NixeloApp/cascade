import { authenticatedTest, test } from "./fixtures";
import { IssueDetailPage } from "./pages";
import { ROUTES } from "./utils/routes";

/**
 * Error Scenario E2E Tests
 *
 * Tests error handling for:
 * - Non-existent projects, documents, issues (authenticated)
 * - Unauthenticated access to protected routes
 *
 * The app shows contextual "not found" messages for invalid resources
 * when authenticated. Unauthenticated users are redirected to landing.
 */

test.describe("Unauthenticated Access", () => {
  test("redirects to signin when accessing protected route", async ({ page, landingPage }) => {
    // Try to access dashboard without auth
    await page.goto(ROUTES.dashboard.build("nonexistent-org"));
    await landingPage.expectLandingOrSignInPage();
  });
});

authenticatedTest.describe("Non-existent Resources", () => {
  authenticatedTest.describe.configure({ mode: "serial" });

  authenticatedTest.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  authenticatedTest(
    "shows not found message for non-existent project",
    async ({ projectsPage }) => {
      await projectsPage.goto();
      await projectsPage.gotoProjectBoard("NONEXISTENT99999");
      await projectsPage.expectProjectNotFound();
    },
  );

  authenticatedTest("shows error for non-existent document", async ({ documentsPage }) => {
    await documentsPage.goto();
    await documentsPage.gotoDocument("jf77777777777777777");
    await documentsPage.expectDocumentNotFound();
  });

  authenticatedTest("shows not found message for non-existent issue", async ({ page, orgSlug }) => {
    const issueDetailPage = new IssueDetailPage(page, orgSlug);
    await issueDetailPage.gotoIssue("FAKE-99999");
    await issueDetailPage.expectIssueNotFound();
  });
});
