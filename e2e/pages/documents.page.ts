import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getOptionalLocatorText, isLocatorVisible } from "../utils/locator-state";
import { ROUTES, routePattern } from "../utils/routes";
import { BasePage } from "./base.page";

/**
 * Documents Page Object
 * Handles the documents view with sidebar and editor
 */
export class DocumentsPage extends BasePage {
  // ===================
  // Locators - Sidebar
  // ===================
  readonly sidebar: Locator;
  readonly searchInput: Locator;
  readonly newDocumentButton: Locator;
  readonly templateButton: Locator;
  readonly documentList: Locator;
  readonly documentItems: Locator;

  // ===================
  // Locators - Template Modal
  // ===================
  readonly templateModal: Locator;
  readonly blankTemplateButton: Locator;
  readonly meetingNotesTemplate: Locator;
  readonly projectBriefTemplate: Locator;

  // ===================
  // Locators - Editor
  // ===================
  readonly editor: Locator;
  readonly editorContent: Locator;
  readonly documentTitle: Locator;
  readonly documentTitleInput: Locator;
  readonly appErrorHeading: Locator;
  readonly appErrorDetailsSummary: Locator;
  readonly appErrorDetailsMessage: Locator;

  // ===================
  // Locators - Delete Confirmation
  // ===================
  readonly deleteConfirmDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Sidebar
    this.sidebar = page.getByTestId(TEST_IDS.NAV.SIDEBAR).or(page.getByRole("complementary"));
    this.searchInput = page.getByPlaceholder(/search.*document/i);
    this.newDocumentButton = page
      .getByRole("button", { name: /new.*document|\+ new|add/i })
      .first();
    this.templateButton = page.getByRole("button", { name: /template|📄/i });
    this.documentList = page
      .getByTestId(TEST_IDS.NAV.DOCUMENT_LIST)
      .or(this.sidebar.locator("ul, [role='list']").first());
    this.documentItems = page
      .getByTestId(TEST_IDS.NAV.DOCUMENT_ITEM)
      .or(this.sidebar.getByRole("button").filter({ hasNotText: /new|template|search/i }));

    // Template modal
    this.templateModal = page.getByRole("dialog").filter({ hasText: /template|choose/i });
    this.blankTemplateButton = page.getByRole("button", { name: /blank|empty/i });
    this.meetingNotesTemplate = page.getByRole("button", { name: /meeting.*notes/i });
    this.projectBriefTemplate = page.getByRole("button", { name: /project.*brief/i });

    // Editor
    this.editor = page.getByTestId(TEST_IDS.EDITOR.PLATE);
    this.editorContent = this.editor;
    this.documentTitle = page.getByTestId(TEST_IDS.DOCUMENT.TITLE);
    this.documentTitleInput = page.getByTestId(TEST_IDS.DOCUMENT.TITLE_INPUT);
    this.appErrorHeading = page.getByRole("heading", { name: "500" });
    this.appErrorDetailsSummary = page.getByText(/view error details/i);
    this.appErrorDetailsMessage = page.locator("details pre");

    // Delete confirmation
    this.deleteConfirmDialog = page.getByRole("dialog").filter({ hasText: /delete|confirm/i });
    this.confirmDeleteButton = page.getByRole("button", { name: /delete|confirm|yes/i });
    this.cancelDeleteButton = page.getByRole("button", { name: /cancel|no/i });
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    await this.page.goto(ROUTES.documents.list.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 12000 });
    await expect
      .poll(
        async () => {
          const cardCount = await this.page.getByTestId(TEST_IDS.DOCUMENT.CARD).count();
          if (cardCount > 0) return "ready";
          const emptyVisible = await this.page.getByText(/no documents/i).isVisible();
          return emptyVisible ? "ready" : "pending";
        },
        { timeout: 12000 },
      )
      .not.toBe("pending");
  }

  async gotoDocument(documentId: string) {
    await this.page.goto(ROUTES.documents.detail.build(this.orgSlug, documentId));
    await this.waitForLoad();
  }

  // ===================
  // Actions
  // ===================

  async createNewDocument() {
    await expect(this.newDocumentButton).toBeVisible();
    await expect(this.newDocumentButton).toBeEnabled();
    await this.newDocumentButton.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.documents.detail.path, "$"));

    await this.expectEditorVisible();
  }

  async openTemplateModal() {
    await this.templateButton.click();
    await expect(this.templateModal).toBeVisible();
  }

  async createFromTemplate(template: "blank" | "meeting" | "project") {
    await this.openTemplateModal();
    const buttons = {
      blank: this.blankTemplateButton,
      meeting: this.meetingNotesTemplate,
      project: this.projectBriefTemplate,
    };
    await buttons[template].click();
    await this.expectEditorVisible();
  }

  async searchDocuments(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async editDocumentTitle(title: string) {
    await expect(this.documentTitle).toBeVisible();
    await this.documentTitle.click();
    await expect(this.documentTitleInput).toBeVisible();
    await this.documentTitleInput.fill(title);
    await this.documentTitleInput.press("Enter");
    await expect(this.documentTitleInput).not.toBeVisible();
    await expect(this.documentTitle).toHaveText(title);
  }

  async selectDocument(index: number) {
    const items = this.documentItems;
    const item = items.nth(index);
    await item.click();
  }

  async deleteDocument(index: number) {
    // Hover to show delete button
    const item = this.documentItems.nth(index);
    await item.hover();
    const deleteButton = item.getByRole("button", { name: /delete|remove|trash/i });
    await deleteButton.click();
  }

  async confirmDelete() {
    await expect(this.deleteConfirmDialog).toBeVisible();
    await this.confirmDeleteButton.click();
  }

  async cancelDelete() {
    await this.cancelDeleteButton.click();
    await expect(this.deleteConfirmDialog).not.toBeVisible();
  }

  // ===================
  // Assertions
  // ===================

  async expectDocumentsView() {
    await expect(this.sidebar).toBeVisible();
    await expect(this.newDocumentButton).toBeVisible();
  }

  async expectEditorVisible() {
    await expect
      .poll(() => this.getEditorReadyState(), {
        timeout: 10000,
        intervals: [200, 500, 1000],
      })
      .not.toBe("pending");

    await this.throwIfAppErrorVisible();

    if ((await this.getEditorReadyState()) === "initializer") {
      const initButton = this.page.getByRole("button", { name: /initialize.*document/i });
      await initButton.click();

      await expect
        .poll(() => this.getEditorReadyState(), {
          timeout: 10000,
          intervals: [200, 500, 1000],
        })
        .not.toBe("initializer");
    }

    await this.throwIfAppErrorVisible();
    await expect(this.editor).toBeVisible();
  }

  private async getEditorReadyState(): Promise<"editor" | "initializer" | "error" | "pending"> {
    if (await isLocatorVisible(this.appErrorHeading)) {
      return "error";
    }

    const initButton = this.page.getByRole("button", { name: /initialize.*document/i });
    if (await isLocatorVisible(initButton)) {
      return "initializer";
    }

    if (await isLocatorVisible(this.editor)) {
      return "editor";
    }

    return "pending";
  }

  private async throwIfAppErrorVisible() {
    if (!(await isLocatorVisible(this.appErrorHeading))) {
      return;
    }

    const detailsVisible = await isLocatorVisible(this.appErrorDetailsMessage);
    if (!detailsVisible) {
      await this.expandAppErrorDetailsIfAvailable();
    }

    const errorDetails = (await getOptionalLocatorText(this.appErrorDetailsMessage))?.trim();
    const suffix = errorDetails ? `: ${errorDetails}` : "";
    const diagnostics = await this.getAppErrorDiagnostics();
    throw new Error(`React error boundary displayed${suffix}${diagnostics}`);
  }

  private async expandAppErrorDetailsIfAvailable(): Promise<void> {
    const summaryVisible = await isLocatorVisible(this.appErrorDetailsSummary);
    if (!summaryVisible) {
      return;
    }

    try {
      await this.appErrorDetailsSummary.click();
      await expect(this.appErrorDetailsMessage).toBeVisible({ timeout: 2000 });
    } catch (error) {
      const detailsVisible = await isLocatorVisible(this.appErrorDetailsMessage);
      if (detailsVisible) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Document error boundary details did not open: ${message}`);
    }
  }

  private async getAppErrorDiagnostics(): Promise<string> {
    let diagnostics: {
      url: string;
      hydrated: boolean;
      authKeys: string[];
      connectionState: unknown;
    } | null = null;

    try {
      diagnostics = await this.page.evaluate(() => {
        const authKeys = Object.keys(localStorage)
          .filter((key) => key.includes("convexAuth"))
          .sort();
        const convexClient = (
          window as typeof window & {
            __convex_test_client?: { connectionState: () => unknown };
          }
        ).__convex_test_client;

        return {
          url: window.location.href,
          hydrated: document.body.classList.contains("app-hydrated"),
          authKeys,
          connectionState: convexClient?.connectionState() ?? null,
        };
      });
    } catch {
      diagnostics = null;
    }

    if (!diagnostics) {
      return "";
    }

    return ` [diagnostics ${JSON.stringify(diagnostics)}]`;
  }

  async expectDocumentCount(count: number) {
    await expect(this.documentItems).toHaveCount(count);
  }

  async expectDocumentNotFound() {
    await expect(
      this.page.getByText(/document not found/i).or(this.page.getByText(/something went wrong/i)),
    ).toBeVisible();
  }
}
