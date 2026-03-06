import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
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

  // ===================
  // Locators - Delete Confirmation
  // ===================
  readonly deleteConfirmDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Sidebar
    this.sidebar = page.locator("[data-tour='sidebar']").or(page.getByRole("complementary"));
    this.searchInput = page.getByPlaceholder(/search.*document/i);
    this.newDocumentButton = page
      .getByRole("button", { name: /new.*document|\+ new|add/i })
      .first();
    this.templateButton = page.getByRole("button", { name: /template|📄/i });
    this.documentList = page
      .locator("[data-document-list]")
      .or(this.sidebar.locator("ul, [role='list']").first());
    this.documentItems = page
      .locator("[data-document-item]")
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

    // Delete confirmation
    this.deleteConfirmDialog = page.getByRole("dialog").filter({ hasText: /delete|confirm/i });
    this.confirmDeleteButton = page.getByRole("button", { name: /delete|confirm|yes/i });
    this.cancelDeleteButton = page.getByRole("button", { name: /cancel|no/i });
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    await this.page.goto(`/${this.orgSlug}/documents`);
    await this.waitForLoad();
  }

  // ===================
  // Actions
  // ===================

  async createNewDocument() {
    await expect(async () => {
      await this.newDocumentButton.click();
      await expect(this.page).toHaveURL(/\/documents\/[^/]+$/);
    }).toPass();

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

    await expect(async () => {
      await this.documentTitle.click();
      await expect(this.documentTitleInput).toBeVisible();
      await this.documentTitleInput.fill(title);
      await this.documentTitleInput.press("Enter");
      await expect(this.documentTitle).toHaveText(title);
    }).toPass();
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
    // Wait for full document readiness before checking editor hydration state.
    await this.page.waitForFunction(() => document.readyState === "complete");

    // Check for React error boundary
    const errorBoundary = this.page.locator("text=/Something went wrong/i");
    const hasError = await errorBoundary.isVisible().catch(() => false);
    if (hasError) {
      const errorMsg = await this.page
        .locator("code")
        .textContent()
        .catch(() => "Unknown error");
      throw new Error(`React error boundary displayed: ${errorMsg}`);
    }

    // Handle "Initialize Document" empty state if present (for new documents)
    const initButton = this.page.getByRole("button", { name: /initialize.*document/i });
    try {
      await initButton.waitFor({ state: "visible" });
      await initButton.click();
    } catch {
      // Button didn't appear, proceed to check for editor
    }
    await expect(this.editor).toBeVisible();
  }

  async expectDocumentCount(count: number) {
    await expect(this.documentItems).toHaveCount(count);
  }
}
