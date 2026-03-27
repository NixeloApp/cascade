import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getOptionalLocatorText, isLocatorVisible } from "../utils/locator-state";
import { ROUTES, routePattern } from "../utils/routes";
import { waitForAnimation, waitForScreenshotReady } from "../utils/wait-helpers";
import { BasePage } from "./base.page";

const DOCUMENT_EDITOR_PLACEHOLDER = "Start with a summary or press / for blocks";

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
  readonly workspaceSummary: Locator;
  readonly templatesPanel: Locator;
  readonly recentSection: Locator;
  readonly librarySection: Locator;
  readonly searchEmptyState: Locator;
  readonly pageEmptyState: Locator;
  readonly createBlankDocumentButton: Locator;
  readonly templatesContent: Locator;
  readonly templatesEmptyState: Locator;

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
  readonly editorStarterPanel: Locator;
  readonly editorHydratedState: Locator;
  readonly documentTitle: Locator;
  readonly documentTitleInput: Locator;
  readonly importMarkdownButton: Locator;
  readonly moreActionsButton: Locator;
  readonly markdownPreviewDialog: Locator;
  readonly markdownPreviewConfirmButton: Locator;
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
    this.searchInput = page.getByTestId(TEST_IDS.DOCUMENT.SEARCH_INPUT);
    this.newDocumentButton = page.getByTestId(TEST_IDS.DOCUMENT.NEW_BUTTON);
    this.templateButton = page.getByRole("button", { name: /template|📄/i });
    this.documentList = page
      .getByTestId(TEST_IDS.NAV.DOCUMENT_LIST)
      .or(this.sidebar.locator("ul, [role='list']").first());
    this.documentItems = page
      .getByTestId(TEST_IDS.NAV.DOCUMENT_ITEM)
      .or(this.sidebar.getByRole("button").filter({ hasNotText: /new|template|search/i }));
    this.workspaceSummary = page.getByTestId(TEST_IDS.DOCUMENT.WORKSPACE_SUMMARY);
    this.templatesPanel = page.getByTestId(TEST_IDS.DOCUMENT.WORKSPACE_TEMPLATES_PANEL);
    this.recentSection = page.getByTestId(TEST_IDS.DOCUMENT.WORKSPACE_RECENT_SECTION);
    this.librarySection = page.getByTestId(TEST_IDS.DOCUMENT.WORKSPACE_LIBRARY_SECTION);
    this.searchEmptyState = page.getByTestId(TEST_IDS.DOCUMENT.SEARCH_EMPTY_STATE);
    this.pageEmptyState = page.getByTestId(TEST_IDS.PAGE.EMPTY_STATE);
    this.createBlankDocumentButton = page.getByRole("button", { name: /create blank document/i });
    this.templatesContent = page.getByTestId(TEST_IDS.DOCUMENT.TEMPLATES_CONTENT);
    this.templatesEmptyState = page.getByText(/no templates yet/i);

    // Template modal
    this.templateModal = page.getByRole("dialog").filter({ hasText: /template|choose/i });
    this.blankTemplateButton = page.getByRole("button", { name: /blank|empty/i });
    this.meetingNotesTemplate = page.getByRole("button", { name: /meeting.*notes/i });
    this.projectBriefTemplate = page.getByRole("button", { name: /project.*brief/i });

    // Editor
    this.editor = page.getByTestId(TEST_IDS.EDITOR.PLATE);
    this.editorContent = this.editor;
    this.editorStarterPanel = page.getByTestId(TEST_IDS.EDITOR.STARTER_PANEL);
    this.editorHydratedState = page.getByTestId(TEST_IDS.EDITOR.HYDRATED_STATE);
    this.documentTitle = page.getByTestId(TEST_IDS.DOCUMENT.TITLE);
    this.documentTitleInput = page.getByTestId(TEST_IDS.DOCUMENT.TITLE_INPUT);
    this.importMarkdownButton = page.getByRole("button", { name: /import from markdown/i });
    this.moreActionsButton = page.getByRole("button", { name: /more document actions/i });
    this.markdownPreviewDialog = page.getByRole("dialog", {
      name: /preview markdown import/i,
    });
    this.markdownPreviewConfirmButton = this.markdownPreviewDialog.getByRole("button", {
      name: /import & replace content/i,
    });
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
    try {
      await this.waitForWorkspaceOrEmptyState(20000);
    } catch {
      await this.page.reload({ waitUntil: "domcontentloaded" });
      await this.waitForWorkspaceOrEmptyState(20000);
    }
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

  async openMoveDialog(): Promise<Locator> {
    await expect(this.moreActionsButton).toBeVisible();
    await this.moreActionsButton.click();
    await this.page.getByRole("menu").waitFor({ state: "visible", timeout: 5000 });
    await this.page.getByRole("menuitem", { name: /move to another project/i }).click();
    const dialog = this.page.getByRole("dialog", { name: /move document/i });
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.getByLabel(/target project/i).waitFor({ state: "visible", timeout: 8000 });
    await waitForAnimation(this.page);
    await waitForScreenshotReady(this.page);
    return dialog;
  }

  async openMarkdownImportPreview(markdown: string, filename: string): Promise<Locator> {
    await expect(this.importMarkdownButton).toBeVisible();
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      this.importMarkdownButton.click(),
    ]);

    await fileChooser.setFiles({
      name: filename,
      mimeType: "text/markdown",
      buffer: Buffer.from(markdown, "utf8"),
    });

    await expect(this.markdownPreviewDialog).toBeVisible({ timeout: 8000 });
    await this.markdownPreviewDialog.getByText(filename, { exact: true }).waitFor({
      state: "visible",
      timeout: 8000,
    });
    await expect(this.markdownPreviewConfirmButton).toBeVisible({ timeout: 8000 });
    await waitForAnimation(this.page);
    await waitForScreenshotReady(this.page);
    return this.markdownPreviewDialog;
  }

  async replaceEditorContentFromMarkdown(
    markdown: string,
    filename: string,
    expectedText: string | RegExp,
  ): Promise<void> {
    await this.openMarkdownImportPreview(markdown, filename);
    await this.markdownPreviewConfirmButton.click();
    await expect(this.markdownPreviewDialog).toBeHidden({ timeout: 8000 });
    await this.expectEditorVisible();
    await this.expectEditorText(expectedText);
    await waitForScreenshotReady(this.page);
  }

  async openSlashMenuAtEditorEnd(command = "/"): Promise<void> {
    await this.typeAtEditorEnd(command);
    await this.page.locator("[role='option']").first().waitFor({ state: "visible", timeout: 5000 });
    await waitForScreenshotReady(this.page);
  }

  async openMentionPopoverAtEditorEnd(query = "@em"): Promise<void> {
    await this.typeAtEditorEnd(query);
    await this.page.getByRole("combobox").waitFor({ state: "visible", timeout: 5000 });
    await waitForScreenshotReady(this.page);
  }

  async openFloatingToolbarForText(text: string): Promise<void> {
    const target = this.editor.getByText(text, { exact: false }).first();
    await expect(target).toBeVisible({ timeout: 8000 });
    await target.dblclick();
    await this.page
      .getByRole("button", { name: /bold/i })
      .waitFor({ state: "visible", timeout: 5000 });
    await waitForScreenshotReady(this.page);
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
    await expect(this.pageHeaderTitle).toHaveText("Documents");
    await this.waitForWorkspaceOrEmptyState(10000);

    if (await isLocatorVisible(this.workspaceSummary)) {
      await expect(this.workspaceSummary).toBeVisible();
      await expect(this.recentSection).toBeVisible();
      await expect(this.librarySection).toBeVisible();
      return;
    }

    await expect(this.pageEmptyState).toBeVisible();
    await expect(this.createBlankDocumentButton).toBeVisible();
  }

  async expectSearchResultVisible(text: string) {
    await expect(this.recentSection.getByText(text, { exact: true }).first()).toBeVisible();
  }

  async expectSearchEmptyState() {
    await expect(this.searchEmptyState).toBeVisible();
  }

  async waitForTemplatesReady(): Promise<void> {
    await expect(this.pageHeaderTitle).toBeVisible({ timeout: 12000 });
    await expect(this.templatesContent.or(this.templatesEmptyState).first()).toBeVisible({
      timeout: 12000,
    });
  }

  async expectEditorVisible() {
    await expect
      .poll(() => this.getEditorReadyState(), {
        timeout: 10000,
        intervals: [200, 500, 1000],
      })
      .not.toBe("pending");

    await this.throwIfAppErrorVisible();

    const initialState = await this.getEditorReadyState();
    if (initialState === "initializer") {
      const initButton = this.page.getByRole("button", { name: /initialize.*document/i });
      await initButton.click();
    }

    await this.throwIfAppErrorVisible();
    await expect
      .poll(() => this.getEditorReadyState(), {
        timeout: 10000,
        intervals: [200, 500, 1000],
      })
      .toBe("editor");
    await this.throwIfAppErrorVisible();
  }

  async expectEditorText(text: string | RegExp): Promise<void> {
    await expect(this.editor.getByText(text, { exact: typeof text === "string" })).toBeVisible({
      timeout: 8000,
    });
  }

  private async getEditorReadyState(): Promise<"editor" | "initializer" | "error" | "pending"> {
    if (await isLocatorVisible(this.appErrorHeading)) {
      return "error";
    }

    const initButton = this.page.getByRole("button", { name: /initialize.*document/i });
    if (await isLocatorVisible(initButton)) {
      return "initializer";
    }

    if ((await this.editorHydratedState.count()) === 0) {
      return "pending";
    }

    if (await isLocatorVisible(this.editorStarterPanel)) {
      return "editor";
    }

    if (await this.editorHasHydratedContent()) {
      return "editor";
    }

    if (await isLocatorVisible(this.editor)) {
      return "pending";
    }

    return "pending";
  }

  private async editorHasHydratedContent(): Promise<boolean> {
    if (!(await isLocatorVisible(this.editor))) {
      return false;
    }

    try {
      return await this.editor.evaluate((element, placeholder) => {
        const normalizedText = (element.textContent ?? "")
          .replace(/\u200B/g, "")
          .replace(/\s+/g, " ")
          .trim();

        return normalizedText.length > 0 && normalizedText !== placeholder;
      }, DOCUMENT_EDITOR_PLACEHOLDER);
    } catch {
      return false;
    }
  }

  private async getEditableSurface(): Promise<Locator> {
    const editable = this.editor.locator("[contenteditable='true']").first();
    if ((await editable.count()) > 0) {
      return editable;
    }
    return this.editor;
  }

  private async focusEditorAtEnd(): Promise<void> {
    const editable = await this.getEditableSurface();
    await editable.scrollIntoViewIfNeeded();
    await expect(editable).toBeVisible({ timeout: 8000 });
    await editable.click();
    await editable.evaluate((element) => {
      const root =
        element instanceof HTMLElement
          ? element
          : element.parentElement instanceof HTMLElement
            ? element.parentElement
            : null;
      if (!root) {
        return;
      }

      root.focus();
      const selection = window.getSelection();
      if (!selection) {
        return;
      }

      const range = document.createRange();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let lastTextNode: Node | null = null;
      while (walker.nextNode()) {
        lastTextNode = walker.currentNode;
      }

      if (lastTextNode?.textContent) {
        range.setStart(lastTextNode, lastTextNode.textContent.length);
      } else {
        range.selectNodeContents(root);
        range.collapse(false);
      }

      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    });
  }

  private async typeAtEditorEnd(text: string): Promise<void> {
    await this.focusEditorAtEnd();
    await this.page.keyboard.type(text);
    await waitForAnimation(this.page);
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

  private async waitForWorkspaceOrEmptyState(timeout: number): Promise<void> {
    await expect
      .poll(
        async () => {
          const workspaceReady =
            (await isLocatorVisible(this.workspaceSummary)) &&
            (await isLocatorVisible(this.recentSection)) &&
            (await isLocatorVisible(this.librarySection));
          if (workspaceReady) return "ready";
          const emptyVisible =
            (await isLocatorVisible(this.page.getByText(/no documents/i))) ||
            (await isLocatorVisible(this.page.getByText(/nothing here yet/i))) ||
            (await isLocatorVisible(this.page.getByText(/create.*document/i)));
          return emptyVisible ? "ready" : "pending";
        },
        { timeout, intervals: [250, 500, 1000] },
      )
      .not.toBe("pending");
  }
}
