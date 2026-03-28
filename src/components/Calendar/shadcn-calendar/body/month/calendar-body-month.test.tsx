import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { format } from "date-fns";
import { describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { CalendarProvider } from "../../calendar-provider";
import type { CalendarEvent } from "../../calendar-types";
import { CalendarBodyMonth } from "./calendar-body-month";

describe("CalendarBodyMonth", () => {
  it("calls onEventMove when an event is dropped on another day", async () => {
    const onEventMove = vi.fn();
    const dataTransfer = {
      setData: vi.fn(),
      setDragImage: vi.fn(),
    };
    const event: CalendarEvent = {
      id: "evt-1",
      title: "Planning",
      color: "blue",
      start: new Date("2026-03-20T15:00:00.000Z"),
      end: new Date("2026-03-20T16:00:00.000Z"),
    };

    render(
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
    const targetDay = screen
      .getAllByTestId(TEST_IDS.CALENDAR.DAY_CELL)
      .find((cell) => within(cell).queryByText("21"));

    if (!targetDay) {
      throw new Error("Expected a month cell for March 21, 2026");
    }

    const resolvedTargetDay = targetDay;
    expect(resolvedTargetDay).not.toHaveAttribute("data-date");
    expect(resolvedTargetDay).not.toHaveAttribute("data-drop-target");

    act(() => {
      fireEvent.dragStart(eventItem, { dataTransfer });
      fireEvent.dragOver(resolvedTargetDay);
    });

    await act(async () => {
      fireEvent.drop(resolvedTargetDay);
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

  it("shows the overflow action when a day has more than three events", () => {
    const events: CalendarEvent[] = [
      {
        id: "evt-1",
        title: "Planning",
        color: "blue",
        start: new Date("2026-03-20T09:00:00.000Z"),
        end: new Date("2026-03-20T10:00:00.000Z"),
      },
      {
        id: "evt-2",
        title: "Design review",
        color: "green",
        start: new Date("2026-03-20T11:00:00.000Z"),
        end: new Date("2026-03-20T12:00:00.000Z"),
      },
      {
        id: "evt-3",
        title: "Customer sync",
        color: "purple",
        start: new Date("2026-03-20T13:00:00.000Z"),
        end: new Date("2026-03-20T14:00:00.000Z"),
      },
      {
        id: "evt-4",
        title: "Retro",
        color: "orange",
        start: new Date("2026-03-20T15:00:00.000Z"),
        end: new Date("2026-03-20T16:00:00.000Z"),
      },
    ];

    render(
      <CalendarProvider
        events={events}
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

    expect(screen.getByRole("button", { name: "+1 more" })).toBeInTheDocument();
  });
});
