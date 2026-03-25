import { expect, type Locator, type Page } from "@playwright/test";
import { ROUTES } from "../../convex/shared/routes";
import { TEST_IDS } from "../../src/lib/test-ids";
import { getLocatorCount, isLocatorVisible } from "../utils/locator-state";
import { waitForScreenshotReady } from "../utils/wait-helpers";
import { BasePage } from "./base.page";

export type OutreachSection = "overview" | "sequences" | "contacts" | "mailboxes" | "analytics";

export class OutreachPage extends BasePage {
  readonly root: Locator;
  readonly launchChecklist: Locator;
  readonly importContactsButton: Locator;
  readonly newContactButton: Locator;
  readonly newSequenceButton: Locator;
  readonly enrollContactsButton: Locator;
  readonly overviewTab: Locator;
  readonly sequencesTab: Locator;
  readonly contactsTab: Locator;
  readonly mailboxesTab: Locator;
  readonly analyticsTab: Locator;
  readonly overviewSection: Locator;
  readonly sequencesSection: Locator;
  readonly contactsSection: Locator;
  readonly mailboxesSection: Locator;
  readonly analyticsSection: Locator;
  readonly contactDialog: Locator;
  readonly importDialog: Locator;
  readonly sequenceDialog: Locator;
  readonly enrollDialog: Locator;
  readonly mailboxDisconnectConfirm: Locator;
  readonly mailboxCards: Locator;
  readonly seededContactName: Locator;
  readonly seededMailboxEmail: Locator;
  readonly recipientTimelineHeading: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);
    this.root = page.getByTestId(TEST_IDS.OUTREACH.ROOT);
    this.launchChecklist = page.getByTestId(TEST_IDS.OUTREACH.LAUNCH_CHECKLIST);
    this.importContactsButton = page.getByTestId(TEST_IDS.OUTREACH.ACTION_IMPORT_CONTACTS).first();
    this.newContactButton = page.getByTestId(TEST_IDS.OUTREACH.ACTION_NEW_CONTACT).first();
    this.newSequenceButton = page.getByTestId(TEST_IDS.OUTREACH.ACTION_NEW_SEQUENCE).first();
    this.enrollContactsButton = page.getByTestId(TEST_IDS.OUTREACH.ACTION_ENROLL_CONTACTS).first();
    this.overviewTab = page.getByTestId(TEST_IDS.OUTREACH.TAB_OVERVIEW);
    this.sequencesTab = page.getByTestId(TEST_IDS.OUTREACH.TAB_SEQUENCES);
    this.contactsTab = page.getByTestId(TEST_IDS.OUTREACH.TAB_CONTACTS);
    this.mailboxesTab = page.getByTestId(TEST_IDS.OUTREACH.TAB_MAILBOXES);
    this.analyticsTab = page.getByTestId(TEST_IDS.OUTREACH.TAB_ANALYTICS);
    this.overviewSection = page.getByTestId(TEST_IDS.OUTREACH.OVERVIEW_SECTION);
    this.sequencesSection = page.getByTestId(TEST_IDS.OUTREACH.SEQUENCES_LIST);
    this.contactsSection = page.getByTestId(TEST_IDS.OUTREACH.CONTACTS_SECTION);
    this.mailboxesSection = page.getByTestId(TEST_IDS.OUTREACH.MAILBOXES_SECTION);
    this.analyticsSection = page.getByTestId(TEST_IDS.OUTREACH.ANALYTICS_SECTION);
    this.contactDialog = page.getByTestId(TEST_IDS.OUTREACH.CONTACT_DIALOG);
    this.importDialog = page.getByTestId(TEST_IDS.OUTREACH.IMPORT_DIALOG);
    this.sequenceDialog = page.getByTestId(TEST_IDS.OUTREACH.SEQUENCE_DIALOG);
    this.enrollDialog = page.getByTestId(TEST_IDS.OUTREACH.ENROLL_DIALOG);
    this.mailboxDisconnectConfirm = page.getByTestId(TEST_IDS.OUTREACH.MAILBOX_DISCONNECT_CONFIRM);
    this.mailboxCards = page.getByTestId(TEST_IDS.OUTREACH.MAILBOX_CARD);
    this.seededContactName = page.getByText(/jamie rivera/i);
    this.seededMailboxEmail = page.getByText(/alex\.sender\.screenshots@nixelo\.test/i);
    this.recipientTimelineHeading = page.getByText(/recipient timeline/i);
  }

  async goto(): Promise<void> {
    await this.gotoPath(ROUTES.outreach.build(this.orgSlug), {
      waitUntil: "domcontentloaded",
    });
    await this.waitUntilReady();
  }

  async waitUntilReady(): Promise<void> {
    await this.page.getByTestId(TEST_IDS.HEADER.SEARCH_BUTTON).waitFor({
      state: "visible",
      timeout: 30000,
    });
    await this.pageHeaderTitle.waitFor({ state: "visible", timeout: 20000 });
    await this.root.waitFor({ state: "visible", timeout: 20000 });
    await expect
      .poll(
        async () => {
          if (await isLocatorVisible(this.overviewSection)) {
            return "ready";
          }
          return (await isLocatorVisible(this.launchChecklist)) ? "ready" : "pending";
        },
        { timeout: 20000 },
      )
      .toBe("ready");
  }

  async openSection(section: OutreachSection): Promise<void> {
    const tab = this.getTab(section);
    const targetSection = this.getSection(section);

    await tab.waitFor({ state: "visible", timeout: 5000 });
    await tab.scrollIntoViewIfNeeded();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await tab.click();
      } catch {
        await tab.press("Enter");
      }

      if ((await tab.getAttribute("data-state")) === "active") {
        break;
      }

      await tab.evaluate((element) => {
        if (element instanceof HTMLButtonElement) {
          element.click();
        }
      });

      if ((await tab.getAttribute("data-state")) === "active") {
        break;
      }
    }

    await targetSection.waitFor({ state: "visible", timeout: 8000 });
    await waitForScreenshotReady(this.page);
  }

  async waitForSeededContacts(): Promise<void> {
    await this.seededContactName.waitFor({ state: "visible", timeout: 5000 });
  }

  async waitForSeededMailbox(): Promise<void> {
    await this.seededMailboxEmail.waitFor({ state: "visible", timeout: 5000 });
  }

  async waitForAnalyticsContent(): Promise<void> {
    await this.recipientTimelineHeading.waitFor({ state: "visible", timeout: 5000 });
  }

  async openContactDialog(): Promise<void> {
    await this.openSection("contacts");
    await this.openDialog(this.newContactButton, this.contactDialog, this.contactDialog);
  }

  async openImportDialog(): Promise<void> {
    await this.openSection("contacts");
    await this.openDialog(
      this.importContactsButton,
      this.importDialog,
      this.importDialog.getByRole("button", { name: /import contacts/i }),
    );
  }

  async openSequenceDialog(): Promise<void> {
    await this.openSection("sequences");
    await this.openDialog(
      this.newSequenceButton,
      this.sequenceDialog,
      this.sequenceDialog.getByRole("button", { name: /create sequence/i }),
    );
  }

  async openEnrollDialog(): Promise<void> {
    await this.openSection("sequences");
    await this.openDialog(
      this.enrollContactsButton,
      this.enrollDialog,
      this.enrollDialog.getByRole("button", { name: /enroll/i }),
    );
  }

  async openMailboxDisconnectConfirm(): Promise<void> {
    await this.openSection("mailboxes");
    const seededMailboxCard = this.mailboxCards
      .filter({ hasText: "alex.sender.screenshots@nixelo.test" })
      .first();
    await seededMailboxCard.waitFor({ state: "visible", timeout: 5000 });
    await this.openDialog(
      seededMailboxCard.getByTestId(TEST_IDS.OUTREACH.MAILBOX_DISCONNECT_BUTTON),
      this.mailboxDisconnectConfirm,
      this.mailboxDisconnectConfirm.getByRole("button", { name: /^disconnect$/i }),
    );
  }

  async hasSequenceContent(): Promise<boolean> {
    return (await getLocatorCount(this.sequencesSection)) > 0;
  }

  private getTab(section: OutreachSection): Locator {
    switch (section) {
      case "overview":
        return this.overviewTab;
      case "sequences":
        return this.sequencesTab;
      case "contacts":
        return this.contactsTab;
      case "mailboxes":
        return this.mailboxesTab;
      case "analytics":
        return this.analyticsTab;
    }
  }

  private getSection(section: OutreachSection): Locator {
    switch (section) {
      case "overview":
        return this.overviewSection;
      case "sequences":
        return this.sequencesSection;
      case "contacts":
        return this.contactsSection;
      case "mailboxes":
        return this.mailboxesSection;
      case "analytics":
        return this.analyticsSection;
    }
  }

  private async openDialog(
    trigger: Locator,
    dialog: Locator,
    readyLocator: Locator,
  ): Promise<void> {
    await trigger.waitFor({ state: "visible", timeout: 5000 });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await dialog.waitFor({ state: "visible", timeout: 5000 });
    await readyLocator.waitFor({ state: "visible", timeout: 5000 });
    await waitForScreenshotReady(this.page);
  }
}
