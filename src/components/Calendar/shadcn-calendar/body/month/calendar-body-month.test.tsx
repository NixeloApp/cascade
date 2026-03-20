import { act, fireEvent, render, screen } from "@testing-library/react";
import { format } from "date-fns";
import { describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { CalendarProvider } from "../../calendar-provider";
import type { CalendarEvent } from "../../calendar-types";
import { CalendarBodyMonth } from "./calendar-body-month";

describe("CalendarBodyMonth", () => {
  it("calls onEventMove when an event is dropped on another day", async () => {
    const onEventMove = vi.fn();
    const event: CalendarEvent = {
      id: "evt-1",
      title: "Planning",
      color: "blue",
      start: new Date("2026-03-20T15:00:00.000Z"),
      end: new Date("2026-03-20T16:00:00.000Z"),
    };

    const { container } = render(
      <CalendarProvider
        events={[event]}
        mode="month"
        setMode={vi.fn()}
        date={new Date("2026-03-20T12:00:00.000Z")}
        setDate={vi.fn()}
        onAddEvent={vi.fn()}
        onEventMove={onEventMove}
        onEventClick={vi.fn()}
      >
        <CalendarBodyMonth />
      </CalendarProvider>,
    );

    const eventItem = screen.getByTestId("calendar-event-item");
    const targetDay = container.querySelector(
      '[data-testid="calendar-day-cell"][data-date="2026-03-21"]',
    );

    expect(targetDay).not.toBeNull();

    act(() => {
      fireEvent.dragStart(eventItem);
    });

    await act(async () => {
      fireEvent.dragOver(targetDay as HTMLElement);
      fireEvent.drop(targetDay as HTMLElement);
      await Promise.resolve();
    });

    expect(onEventMove).toHaveBeenCalledTimes(1);
    expect(onEventMove).toHaveBeenCalledWith(event, expect.any(Date));
    expect(format(onEventMove.mock.calls[0][1] as Date, "yyyy-MM-dd")).toBe("2026-03-21");
  });

  it("exposes owned TEST_IDS for the active month grid", () => {
    render(
      <CalendarProvider
        events={[]}
        mode="month"
        setMode={vi.fn()}
        date={new Date("2026-03-20T12:00:00.000Z")}
        setDate={vi.fn()}
        onAddEvent={vi.fn()}
        onEventMove={vi.fn()}
        onEventClick={vi.fn()}
      >
        <CalendarBodyMonth />
      </CalendarProvider>,
    );

    expect(screen.getByTestId(TEST_IDS.CALENDAR.GRID)).toBeInTheDocument();
  });
});
