import { expect, authenticatedTest as test } from "./fixtures";
import { createTestNamespace } from "./utils/test-helpers";

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
    test("can edit document title", async ({ dashboardPage, documentsPage }, testInfo) => {
      const namespace = createTestNamespace(testInfo);

      await dashboardPage.goto();
      await dashboardPage.navigateTo("documents");
      await documentsPage.expectDocumentsView();

      // Create a new document first
      await documentsPage.createNewDocument();

      const updatedTitle = namespace.name("E2E Title");
      await documentsPage.editDocumentTitle(updatedTitle);
      await expect(documentsPage.documentTitle).toHaveText(updatedTitle);
    });
  });
});
