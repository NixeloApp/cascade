import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { TEST_IDS } from "../../src/lib/test-ids";
import { withBlockedConvexPage } from "../utils/convex-loading";
import { isLocatorVisible, waitForLocatorVisible } from "../utils/locator-state";
import { ROUTES } from "../utils/routes";
import { waitForLoadingSkeletonsToClear, waitForScreenshotReady } from "../utils/wait-helpers";
import { BasePage } from "./base.page";

type CalendarViewMode = "day" | "week" | "month";

/**
 * Calendar Page Object
 * Handles the calendar view with events and meetings
 */
export class CalendarPage extends BasePage {
  static async withLoadingPage<T>(
    sourcePage: Page,
    orgSlug: string,
    run: (calendarPage: CalendarPage) => Promise<T>,
  ): Promise<T> {
    return withBlockedConvexPage(
      sourcePage,
      { installTransportBlocker: true, isolated: false },
      async (loadingPage) => run(new CalendarPage(loadingPage, orgSlug)),
    );
  }

  // ===================
  // Locators - Calendar View
  // ===================
  readonly calendar: Locator;
  readonly calendarGrid: Locator;
  readonly content: Locator;
  readonly loadingState: Locator;
  readonly todayButton: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly monthYearLabel: Locator;
  readonly dayCells: Locator;
  readonly quickAddDayButtons: Locator;
  readonly workspaceFilter: Locator;
  readonly teamFilter: Locator;

  // ===================
  // Locators - View Toggles
  // ===================
  readonly monthViewButton: Locator;
  readonly weekViewButton: Locator;
  readonly dayViewButton: Locator;

  // ===================
  // Locators - Events
  // ===================
  readonly eventItems: Locator;
  readonly createEventButton: Locator;

  // ===================
  // Locators - Create Event Modal
  // ===================
  readonly createEventModal: Locator;
  readonly eventTitleInput: Locator;
  readonly eventDescriptionInput: Locator;
  readonly eventStartDate: Locator;
  readonly eventStartTime: Locator;
  readonly eventEndTime: Locator;
  readonly eventTypeSelect: Locator;
  readonly isRequiredCheckbox: Locator;
  readonly saveEventButton: Locator;
  readonly cancelEventButton: Locator;

  // ===================
  // Locators - Event Detail
  // ===================
  readonly eventDetailModal: Locator;
  readonly editEventButton: Locator;
  readonly deleteEventButton: Locator;
  readonly attendeesList: Locator;
  readonly markAttendanceButton: Locator;

  constructor(page: Page, orgSlug: string) {
    super(page, orgSlug);

    // Calendar view
    this.calendar = page.getByTestId(TEST_IDS.CALENDAR.ROOT);
    this.calendarGrid = page.getByTestId(TEST_IDS.CALENDAR.GRID);
    this.content = page.getByTestId(TEST_IDS.ORG_CALENDAR.CONTENT);
    this.loadingState = page.getByTestId(TEST_IDS.ORG_CALENDAR.LOADING_STATE);
    this.todayButton = page.getByTestId(TEST_IDS.CALENDAR.TODAY_BUTTON);
    this.prevButton = page.getByTestId(TEST_IDS.CALENDAR.PREV_BUTTON);
    this.nextButton = page.getByTestId(TEST_IDS.CALENDAR.NEXT_BUTTON);
    this.monthYearLabel = page.getByTestId(TEST_IDS.CALENDAR.HEADER_DATE);
    this.dayCells = page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL);
    this.quickAddDayButtons = page.getByTestId(TEST_IDS.CALENDAR.QUICK_ADD_DAY);
    this.workspaceFilter = page.getByTestId(TEST_IDS.ORG_CALENDAR.WORKSPACE_FILTER);
    this.teamFilter = page.getByTestId(TEST_IDS.ORG_CALENDAR.TEAM_FILTER);

    // View toggles
    this.monthViewButton = page.getByTestId(TEST_IDS.CALENDAR.MODE_MONTH);
    this.weekViewButton = page.getByTestId(TEST_IDS.CALENDAR.MODE_WEEK);
    this.dayViewButton = page.getByTestId(TEST_IDS.CALENDAR.MODE_DAY);

    // Events
    this.eventItems = page.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM);
    this.createEventButton = page.getByTestId(TEST_IDS.CALENDAR.CREATE_EVENT_BUTTON);

    // Create event modal
    this.createEventModal = page.getByTestId(TEST_IDS.CALENDAR.CREATE_EVENT_MODAL);
    this.eventTitleInput = page
      .getByPlaceholder(/title|event.*title/i)
      .or(page.getByLabel(/title/i));
    this.eventDescriptionInput = page
      .getByPlaceholder(/description/i)
      .or(page.getByLabel(/description/i));
    this.eventStartDate = this.createEventModal.getByLabel(/^date$/i);
    this.eventStartTime = this.createEventModal.getByLabel(/start time/i);
    this.eventEndTime = this.createEventModal.getByLabel(/end time/i);
    this.eventTypeSelect = page.getByRole("combobox", { name: /type/i });
    this.isRequiredCheckbox = page.getByRole("checkbox", { name: /required/i });
    this.saveEventButton = this.createEventModal.getByRole("button", {
      name: /save|create|submit/i,
    });
    this.cancelEventButton = this.createEventModal.getByRole("button", { name: /cancel/i });

    // Event detail modal
    this.eventDetailModal = page.getByTestId(TEST_IDS.CALENDAR.EVENT_DETAILS_MODAL);
    this.editEventButton = page.getByRole("button", { name: /edit/i });
    this.deleteEventButton = page.getByRole("button", { name: /delete/i });
    this.attendeesList = this.eventDetailModal.getByTestId(TEST_IDS.CALENDAR.ATTENDEES_LIST);
    this.markAttendanceButton = page.getByRole("button", { name: /mark.*attendance|attendance/i });
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    await this.page.goto(ROUTES.calendar.build(this.orgSlug));
    await this.waitForLoad();
  }

  async waitUntilReady(): Promise<void> {
    if ((await this.content.count()) > 0) {
      await this.content.waitFor({ state: "visible", timeout: 12000 });
    }
    await this.weekViewButton.waitFor({ state: "visible", timeout: 12000 });
    await this.todayButton.waitFor({ state: "visible", timeout: 12000 });
  }

  async ensureReady(): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await this.waitUntilReady();
        await waitForLoadingSkeletonsToClear(this.page, 4000);
        return true;
      } catch {
        if (attempt === 0) {
          await this.page.goto(this.page.url(), {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          await waitForScreenshotReady(this.page);
        }
      }
    }

    return false;
  }

  async gotoAndExpectLoadingState(timeout = 12000): Promise<void> {
    await this.goto();
    await this.expectLoadingStateVisible(timeout);
  }

  async expectLoadingStateVisible(timeout = 12000): Promise<void> {
    await this.loadingState.waitFor({ state: "visible", timeout });
    await expect
      .poll(() => this.page.getByTestId(TEST_IDS.LOADING.SKELETON).count(), {
        timeout,
      })
      .toBeGreaterThanOrEqual(10);
  }

  // ===================
  // Actions - Navigation
  // ===================

  async goToToday() {
    await this.todayButton.click();
  }

  async goToPrevious() {
    await this.prevButton.click();
  }

  async goToNext() {
    await this.nextButton.click();
  }

  async switchToMonthView() {
    await this.monthViewButton.click();
  }

  async switchToWeekView() {
    await this.weekViewButton.click();
  }

  async switchToDayView() {
    await this.dayViewButton.click();
  }

  private getModeToggle(mode: CalendarViewMode): Locator {
    switch (mode) {
      case "day":
        return this.dayViewButton;
      case "week":
        return this.weekViewButton;
      case "month":
        return this.monthViewButton;
    }
  }

  async expectModeSelected(mode: CalendarViewMode): Promise<void> {
    const toggle = this.getModeToggle(mode);
    await expect(toggle).toHaveAttribute("aria-checked", "true", { timeout: 5000 });
    await expect(this.calendarGrid).toHaveAttribute("data-calendar-view", mode, {
      timeout: 5000,
    });
  }

  async switchToMode(mode: CalendarViewMode): Promise<void> {
    const toggle = this.getModeToggle(mode);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await toggle.scrollIntoViewIfNeeded();
        await toggle.click();
        await this.expectModeSelected(mode);
        await waitForScreenshotReady(this.page);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      try {
        await toggle.evaluate((element) => {
          if (element instanceof HTMLButtonElement) {
            element.click();
          }
        });
        await this.expectModeSelected(mode);
        await waitForScreenshotReady(this.page);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw new Error(
      `calendar-${mode} mode did not become active: ${lastError?.message ?? "unknown error"}`,
    );
  }

  async ensureMonthView(): Promise<void> {
    await this.monthViewButton.waitFor({ state: "visible", timeout: 5000 });
    if ((await this.monthViewButton.getAttribute("aria-checked")) !== "true") {
      await this.switchToMode("month");
    }
    await this.waitForMonthGrid();
  }

  async waitForMonthGrid(options?: { requireQuickAddButtons?: boolean }): Promise<void> {
    await expect
      .poll(() => this.dayCells.count(), {
        timeout: 5000,
        intervals: [100, 200, 500],
      })
      .toBeGreaterThanOrEqual(28);

    if (options?.requireQuickAddButtons) {
      await expect
        .poll(() => this.quickAddDayButtons.count(), {
          timeout: 5000,
          intervals: [100, 200, 500],
        })
        .toBeGreaterThanOrEqual(28);
    }
  }

  async waitForEvents(timeoutMs = 8000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    const isExpired = () => Date.now() > deadline;
    const hasEvents = async () => (await this.eventItems.count()) > 0;

    const waitForCalendarState = async () => {
      await waitForScreenshotReady(this.page);
      const ready = await this.ensureReady();
      if (!ready) {
        throw new Error("Calendar did not become ready while waiting for events");
      }
    };

    const navigateUntilVisible = async (button: Locator, steps: number) => {
      for (let step = 0; step < steps; step += 1) {
        if (isExpired()) {
          return false;
        }
        await button.click();
        await waitForCalendarState();
        if (await hasEvents()) {
          return true;
        }
      }

      return false;
    };

    if (await hasEvents()) {
      return true;
    }

    await this.goToToday();
    await waitForCalendarState();
    if (await hasEvents()) {
      return true;
    }

    if (isExpired()) {
      return false;
    }

    if (await navigateUntilVisible(this.prevButton, 2)) {
      return true;
    }
    if (isExpired()) {
      return false;
    }
    if (await navigateUntilVisible(this.nextButton, 4)) {
      return true;
    }

    return false;
  }

  async focusFirstEvent(): Promise<void> {
    const monthModeSelected = (await this.monthViewButton.getAttribute("aria-checked")) === "true";
    if (monthModeSelected || (await this.eventItems.count()) === 0) {
      return;
    }

    const firstEvent = this.eventItems.first();
    await firstEvent.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ block: "center", inline: "nearest" });
      }
    });
    await waitForScreenshotReady(this.page);
  }

  async getDragState(): Promise<{
    sourceIndex: number | null;
    targetIndex: number | null;
    dayCellCount: number;
    eventItemCount: number;
  }> {
    const dayCellCount = await getLocatorCount(this.dayCells);
    const eventItemCount = await getLocatorCount(this.eventItems);

    let sourceIndex: number | null = null;
    for (let index = 0; index < dayCellCount; index += 1) {
      const cellEventCount = await getLocatorCount(
        this.dayCells.nth(index).getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM),
      );
      if (cellEventCount > 0) {
        sourceIndex = index;
        break;
      }
    }

    if (sourceIndex == null) {
      return {
        sourceIndex: null,
        targetIndex: null,
        dayCellCount,
        eventItemCount,
      };
    }

    const targetIndex = sourceIndex + 1 < dayCellCount ? sourceIndex + 1 : null;
    return {
      sourceIndex,
      targetIndex,
      dayCellCount,
      eventItemCount,
    };
  }

  async selectWorkspace(name: string) {
    await this.selectFilterOption(this.workspaceFilter, name);
    await expect(this.pageHeaderTitle).toHaveText("Workspace scope");
    await expect(this.workspaceFilter).toContainText(name);
    await expect(this.calendar).toBeVisible();
  }

  async selectTeam(name: string) {
    await this.selectFilterOption(this.teamFilter, name);
    await expect(this.pageHeaderTitle).toHaveText("Team scope");
    await expect(this.teamFilter).toContainText(name);
    await expect(this.calendar).toBeVisible();
  }

  async expectWorkspaceScope(name: string) {
    await expect(this.pageHeaderTitle).toHaveText("Workspace scope");
    await expect(this.workspaceFilter).toContainText(name);
    await expect(this.teamFilter).toBeEnabled();
  }

  async expectTeamScope(name: string) {
    await expect(this.pageHeaderTitle).toHaveText("Team scope");
    await expect(this.teamFilter).toContainText(name);
  }

  private async selectFilterOption(trigger: Locator, optionName: string): Promise<void> {
    const option = this.page.getByRole("option", { name: optionName, exact: true });

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();

        if (!(await waitForLocatorVisible(option, 3000))) {
          await this.page.keyboard.press("Escape").catch(() => undefined);
          continue;
        }

        await option.scrollIntoViewIfNeeded();
        await option.click();
        return;
      } catch (error) {
        await this.page.keyboard.press("Escape").catch(() => undefined);
        if (attempt === 3) {
          throw error;
        }
      }
    }

    throw new Error(`Failed to select calendar filter option "${optionName}"`);
  }

  // ===================
  // Actions - Events
  // ===================

  async openCreateEventModal() {
    await this.createEventButton.click();
    await expect(this.createEventModal).toBeVisible();
  }

  async openQuickAddComposer(): Promise<void> {
    await this.ensureMonthView();
    await this.waitForMonthGrid({ requireQuickAddButtons: true });

    const quickAddButton = this.page.getByTestId(TEST_IDS.CALENDAR.QUICK_ADD_DAY).first();
    if ((await quickAddButton.count()) > 0 && !(await quickAddButton.isVisible())) {
      const firstDayCell = this.page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL).first();
      if ((await firstDayCell.count()) > 0) {
        await firstDayCell.hover();
      }
    }

    if ((await quickAddButton.count()) > 0 && (await quickAddButton.isVisible())) {
      await quickAddButton.click();
    } else {
      await this.createEventButton.waitFor({ state: "visible", timeout: 5000 });
      await this.createEventButton.click();
    }

    await expect(this.createEventModal).toBeVisible();
    await this.eventStartDate.waitFor({ state: "visible", timeout: 5000 });
  }

  async createEvent(
    title: string,
    options?: {
      description?: string;
      type?: string;
      isRequired?: boolean;
    },
  ) {
    await this.openCreateEventModal();
    await this.eventTitleInput.fill(title);
    if (options?.description) {
      await this.eventDescriptionInput.fill(options.description);
    }
    if (options?.type) {
      await this.eventTypeSelect.selectOption(options.type);
    }
    if (options?.isRequired) {
      await this.isRequiredCheckbox.check();
    }
    await this.clickSaveEventButton();
    await expect(this.createEventModal).not.toBeVisible();
    await expect(this.eventItems.filter({ hasText: title }).first()).toBeVisible();
  }

  async cancelCreateEvent() {
    await this.cancelEventButton.click();
    await expect(this.createEventModal).not.toBeVisible();
  }

  private async clickSaveEventButton() {
    await this.saveEventButton.scrollIntoViewIfNeeded();

    try {
      await this.saveEventButton.click({ timeout: 2000 });
      return;
    } catch {
      await expect(this.saveEventButton).toBeVisible();
      await expect(this.saveEventButton).toBeEnabled();
      await this.saveEventButton.scrollIntoViewIfNeeded();
      await this.saveEventButton.click({ timeout: 2000 });
    }
  }

  async selectEvent(index: number) {
    const event = this.eventItems.nth(index);
    await event.click();
  }

  async openEventDetails(index = 0) {
    const event = this.eventItems.nth(index);
    await expect(event).toBeVisible();
    await event.click();
    await expect(this.eventDetailModal).toBeVisible();
  }

  async openEventDetailsByTitle(title: string) {
    await this.alignCalendarToToday();

    if ((await this.dayViewButton.count()) > 0) {
      await this.switchToMode("day");
    }

    await this.scrollCalendarToHour(8);

    const event = this.eventItems.filter({ hasText: title }).first();
    if (!(await isLocatorVisible(event))) {
      const fallbackEvent = this.calendar.getByText(title).first();
      await expect(fallbackEvent).toBeVisible();
      await fallbackEvent.click();
      await expect(this.eventDetailModal).toBeVisible();
      return;
    }

    await this.prepareEventForInteraction(event, `calendar event "${title}"`);
    await event.click();
    await expect(this.eventDetailModal).toBeVisible();
  }

  async openFirstVisibleEventDetails(): Promise<void> {
    await this.alignCalendarToToday();
    if ((await this.dayViewButton.count()) > 0) {
      await this.switchToMode("day");
    }

    const hasEvents = await this.waitForEvents();
    if (!hasEvents) {
      throw new Error("No calendar events found to open event details");
    }

    const firstEvent = this.eventItems.first();
    await this.prepareEventForInteraction(firstEvent, "first calendar event");
    await firstEvent.click();
    await expect(this.eventDetailModal).toBeVisible();
  }

  async startMonthDragPreview(): Promise<() => Promise<void>> {
    await this.ensureMonthView();

    const hasEvents = await this.waitForEvents();
    if (!hasEvents) {
      throw new Error("Unable to start calendar drag preview without visible events");
    }

    const dayCells = this.page.getByTestId(TEST_IDS.CALENDAR.DAY_CELL);
    const dayCellCount = await dayCells.count();

    let sourceIndex: number | null = null;
    for (let index = 0; index < dayCellCount; index += 1) {
      const cellEventCount = await dayCells
        .nth(index)
        .getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM)
        .count();
      if (cellEventCount > 0) {
        sourceIndex = index;
        break;
      }
    }

    const targetIndex =
      sourceIndex != null && sourceIndex + 1 < dayCellCount ? sourceIndex + 1 : null;
    if (sourceIndex == null || targetIndex == null) {
      const eventItemCount = await this.eventItems.count();
      throw new Error(
        `Unable to establish calendar drag state (day cells=${dayCellCount}, events=${eventItemCount})`,
      );
    }

    const sourceCell = dayCells.nth(sourceIndex);
    const targetCell = dayCells.nth(targetIndex);
    const sourceEvent = sourceCell.getByTestId(TEST_IDS.CALENDAR.EVENT_ITEM).first();
    const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());

    await sourceEvent.scrollIntoViewIfNeeded();
    await targetCell.waitFor({ state: "visible", timeout: 5000 });
    await targetCell.scrollIntoViewIfNeeded();
    await sourceEvent.dispatchEvent("dragstart", { dataTransfer });
    await targetCell.dispatchEvent("dragenter", { dataTransfer });
    await targetCell.dispatchEvent("dragover", { dataTransfer });
    await targetCell
      .getByTestId(TEST_IDS.CALENDAR.DAY_CELL_DROP_TARGET)
      .waitFor({ state: "attached", timeout: 5000 });

    return async () => {
      await sourceEvent.dispatchEvent("dragend", { dataTransfer });
      await dataTransfer.dispose();
    };
  }

  private async scrollCalendarToHour(hour: number) {
    const scrollContainer = this.calendar.locator(".overflow-y-auto").first();

    if (!(await isLocatorVisible(scrollContainer))) {
      return;
    }

    await scrollContainer.evaluate((element, targetHour) => {
      element.scrollTop = Math.max(0, targetHour * 128 - 96);
    }, hour);
  }

  private async alignCalendarToToday(): Promise<void> {
    const todayButtonVisible = await isLocatorVisible(this.todayButton);
    if (!todayButtonVisible) {
      return;
    }

    try {
      await this.goToToday();
    } catch (error) {
      const buttonStillVisible = await isLocatorVisible(this.todayButton);
      if (!buttonStillVisible) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Calendar today navigation failed before opening event details: ${message}`);
    }
  }

  private async prepareEventForInteraction(event: Locator, label: string): Promise<void> {
    await expect(event, `${label} should be visible before interaction`).toBeVisible();

    try {
      await event.scrollIntoViewIfNeeded();
    } catch (error) {
      const stillVisible = await isLocatorVisible(event);
      if (stillVisible) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${label} was not visible after scroll attempt: ${message}`);
    }
  }

  // ===================
  // Assertions
  // ===================

  async expectCalendarView() {
    // Wait for calendar to be visible (uses Playwright's default timeout)
    await expect(this.calendar).toBeVisible();
    // Ensure navigation controls are present
    await expect(this.todayButton).toBeVisible();
  }

  async expectEventCount(count: number) {
    await expect(this.eventItems).toHaveCount(count);
  }

  async expectEventDetailsVisible() {
    await expect(this.eventDetailModal).toBeVisible();
  }
}
