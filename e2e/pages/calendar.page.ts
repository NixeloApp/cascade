import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Calendar Page Object
 * Handles the calendar view with events and meetings
 */
export class CalendarPage extends BasePage {
  private orgSlug: string;

  // ===================
  // Locators - Calendar View
  // ===================
  readonly calendar: Locator;
  readonly calendarGrid: Locator;
  readonly todayButton: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly monthYearLabel: Locator;

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
  readonly eventEndDate: Locator;
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

  constructor(page: Page, orgSlug = "nixelo-e2e") {
    super(page);
    this.orgSlug = orgSlug;

    // Calendar view
    this.calendar = page
      .locator("[data-calendar]")
      .or(page.locator(".calendar, [role='grid']").first());
    this.calendarGrid = page
      .locator("[data-calendar-grid]")
      .or(page.locator(".calendar-grid, .fc-view"));
    this.todayButton = page.getByRole("button", { name: /today/i });
    this.prevButton = page.getByRole("button", { name: /prev|previous|back|←|</i });
    this.nextButton = page.getByRole("button", { name: /next|forward|→|>/i });
    this.monthYearLabel = page
      .locator("[data-month-year]")
      .or(page.locator(".calendar-header h2, .fc-toolbar-title"));

    // View toggles
    this.monthViewButton = page.getByRole("button", { name: /month/i });
    this.weekViewButton = page.getByRole("button", { name: /week/i });
    this.dayViewButton = page.getByRole("button", { name: /day/i });

    // Events
    this.eventItems = page
      .locator("[data-event-item]")
      .or(page.locator(".calendar-event, .fc-event"));
    this.createEventButton = page.getByRole("button", {
      name: /create.*event|new.*event|add.*event|\+/i,
    });

    // Create event modal
    this.createEventModal = page
      .getByRole("dialog")
      .filter({ hasText: /create.*event|new.*event/i });
    this.eventTitleInput = page
      .getByPlaceholder(/title|event.*title/i)
      .or(page.getByLabel(/title/i));
    this.eventDescriptionInput = page
      .getByPlaceholder(/description/i)
      .or(page.getByLabel(/description/i));
    this.eventStartDate = page.getByLabel(/start.*date/i).or(page.locator("[data-start-date]"));
    this.eventStartTime = page.getByLabel(/start.*time/i).or(page.locator("[data-start-time]"));
    this.eventEndDate = page.getByLabel(/end.*date/i).or(page.locator("[data-end-date]"));
    this.eventEndTime = page.getByLabel(/end.*time/i).or(page.locator("[data-end-time]"));
    this.eventTypeSelect = page.getByRole("combobox", { name: /type/i });
    this.isRequiredCheckbox = page.getByRole("checkbox", { name: /required/i });
    this.saveEventButton = this.createEventModal.getByRole("button", {
      name: /save|create|submit/i,
    });
    this.cancelEventButton = this.createEventModal.getByRole("button", { name: /cancel/i });

    // Event detail modal
    this.eventDetailModal = page.getByRole("dialog").filter({ hasText: /event.*detail|meeting/i });
    this.editEventButton = page.getByRole("button", { name: /edit/i });
    this.deleteEventButton = page.getByRole("button", { name: /delete/i });
    this.attendeesList = page.locator("[data-attendees]");
    this.markAttendanceButton = page.getByRole("button", { name: /mark.*attendance|attendance/i });
  }

  // ===================
  // Navigation
  // ===================

  async goto() {
    await this.page.goto(`/${this.orgSlug}/calendar`);
    await this.waitForLoad();
  }

  // ===================
  // Actions - Navigation
  // ===================

  async goToToday() {
    await this.todayButton.evaluate((el: HTMLElement) => el.click());
  }

  async goToPrevious() {
    await this.prevButton.evaluate((el: HTMLElement) => el.click());
  }

  async goToNext() {
    await this.nextButton.evaluate((el: HTMLElement) => el.click());
  }

  async switchToMonthView() {
    await this.monthViewButton.evaluate((el: HTMLElement) => el.click());
  }

  async switchToWeekView() {
    await this.weekViewButton.evaluate((el: HTMLElement) => el.click());
  }

  async switchToDayView() {
    await this.dayViewButton.evaluate((el: HTMLElement) => el.click());
  }

  // ===================
  // Actions - Events
  // ===================

  async openCreateEventModal() {
    await this.createEventButton.evaluate((el: HTMLElement) => el.click());
    await expect(this.createEventModal).toBeVisible({ timeout: 5000 });
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
    await this.saveEventButton.evaluate((el: HTMLElement) => el.click());
  }

  async cancelCreateEvent() {
    await this.cancelEventButton.evaluate((el: HTMLElement) => el.click());
    await expect(this.createEventModal).not.toBeVisible();
  }

  async selectEvent(index: number) {
    const event = this.eventItems.nth(index);
    await event.evaluate((el: HTMLElement) => el.click());
  }

  // ===================
  // Assertions
  // ===================

  async expectCalendarView() {
    await expect(this.calendar).toBeVisible();
    await expect(this.todayButton).toBeVisible();
  }

  async expectEventCount(count: number) {
    await expect(this.eventItems).toHaveCount(count);
  }
}
