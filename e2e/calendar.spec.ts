import { authenticatedTest as test } from "./fixtures";
import { isLocatorVisible } from "./utils/locator-state";

/**
 * Calendar E2E Tests
 *
 * Tests the calendar functionality:
 * - Calendar navigation
 * - Calendar view display
 * - View switching (month/week/day)
 *
 * Uses serial mode to prevent auth token rotation issues between tests.
 * Convex uses single-use refresh tokens - when Test 1 refreshes tokens,
 * Test 2 loading stale tokens from file will fail.
 */

test.describe("Calendar", () => {
  // Run tests serially to prevent auth token rotation issues
  test.describe.configure({ mode: "serial" });

  // Re-authenticate if tokens were invalidated
  test.beforeEach(async ({ ensureAuthenticated }) => {
    await ensureAuthenticated();
  });

  test.describe("Calendar Navigation", () => {
    test("can navigate to calendar page", async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("calendar");
      await dashboardPage.expectActiveTab("calendar");
    });

    test("displays calendar view", async ({ dashboardPage, calendarPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("calendar");

      // Calendar should be visible
      await calendarPage.expectCalendarView();
    });
  });

  test.describe("Calendar Controls", () => {
    test("can navigate between months", async ({ dashboardPage, calendarPage }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("calendar");
      await calendarPage.expectCalendarView();

      // Navigate to previous
      await calendarPage.goToPrevious();

      // Navigate to next
      await calendarPage.goToNext();

      // Navigate to today
      await calendarPage.goToToday();
    });

    test("can switch calendar views", async ({ dashboardPage, calendarPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLoaded();
      await dashboardPage.navigateTo("calendar");
      await calendarPage.expectCalendarView();

      // Check which view buttons are available
      const monthViewVisible = await isLocatorVisible(calendarPage.monthViewButton);
      const weekViewVisible = await isLocatorVisible(calendarPage.weekViewButton);
      const dayViewVisible = await isLocatorVisible(calendarPage.dayViewButton);

      // Track if at least one view switch succeeded
      let switchedViews = 0;

      if (monthViewVisible) {
        await calendarPage.switchToMonthView();
        switchedViews++;
      }

      if (weekViewVisible) {
        await calendarPage.switchToWeekView();
        switchedViews++;
      }

      if (dayViewVisible) {
        await calendarPage.switchToDayView();
        switchedViews++;
      }

      // Switch back to month view if available
      if (monthViewVisible) {
        await calendarPage.switchToMonthView();
      }

      // Ensure at least one view button exists - if none exist, test should fail
      // as the calendar UI is incomplete
      if (switchedViews === 0) {
        // Take screenshot for debugging
        await page.screenshot({ path: "e2e/artifacts/calendar-no-view-buttons.png" });
        throw new Error(
          "No calendar view buttons found (month/week/day). Calendar UI may be incomplete or loading failed.",
        );
      }
    });
  });
});
