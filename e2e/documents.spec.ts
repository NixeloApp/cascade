import { expect, authenticatedTest as test } from "./fixtures";

/**
 * Documents E2E Tests
 *
 * Tests document creation, editing, and management using the Plate editor.
 */
test.describe("Documents", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Documents Navigation", () => {
    test("can navigate to documents page", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      const _uniqueId = Date.now();
      const _projectKey = `DOC${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("documents");
      await dashboardPage.expectActiveTab("documents");
    });

    test("displays documents sidebar with new document button", async ({
      dashboardPage,
      documentsPage,
    }) => {
      await dashboardPage.goto();
      await dashboardPage.navigateTo("documents");
      await documentsPage.expectDocumentsView();
    });
  });

  test.describe("Document Creation", () => {
    test("can create a new blank document", async ({ dashboardPage, documentsPage }) => {
      await dashboardPage.goto();
      await dashboardPage.navigateTo("documents");

      // Wait for documents view to load
      await documentsPage.expectDocumentsView();

      // Create new document
      await documentsPage.createNewDocument();
    });
  });

  test.describe("Document Editor", () => {
    test("can edit document title", async ({ dashboardPage, documentsPage }) => {
      await dashboardPage.goto();
      await dashboardPage.navigateTo("documents");
      await documentsPage.expectDocumentsView();

      // Create a new document first
      await documentsPage.createNewDocument();

      const updatedTitle = `E2E Title ${Date.now()}`;
      await documentsPage.editDocumentTitle(updatedTitle);
      await expect(documentsPage.documentTitle).toHaveText(updatedTitle);
    });
  });
});
