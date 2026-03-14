import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCalendarContext } from "./calendar-context";
import { CalendarProvider } from "./calendar-provider";
import type { CalendarEvent, Mode } from "./calendar-types";

function CalendarContextProbe() {
  const context = useCalendarContext();

  return (
    <div>
      <span data-testid="mode">{context.mode}</span>
      <span data-testid="events">{context.events.length}</span>
      <span data-testid="date">{context.date.toISOString()}</span>
      <span data-testid="icon-today">{String(context.calendarIconIsToday)}</span>
      <button type="button" onClick={() => context.setMode("month")}>
        set mode
      </button>
      <button type="button" onClick={() => context.setDate(new Date("2026-03-15T00:00:00.000Z"))}>
        set date
      </button>
      <button type="button" onClick={() => context.onAddEvent(context.date)}>
        add event
      </button>
      <button type="button" onClick={() => context.onEventClick(context.events[0])}>
        click event
      </button>
    </div>
  );
}

describe("CalendarProvider", () => {
  const date = new Date("2026-03-13T12:00:00.000Z");
  const event: CalendarEvent = {
    id: "evt-1",
    title: "Planning",
    color: "blue",
    start: new Date("2026-03-13T15:00:00.000Z"),
    end: new Date("2026-03-13T16:00:00.000Z"),
  };

  function renderProvider(overrides?: { calendarIconIsToday?: boolean; mode?: Mode }) {
    const setMode = vi.fn();
    const setDate = vi.fn();
    const onAddEvent = vi.fn();
    const onEventClick = vi.fn();

    render(
      <CalendarProvider
        events={[event]}
        mode={overrides?.mode ?? "week"}
        setMode={setMode}
        date={date}
        setDate={setDate}
        calendarIconIsToday={overrides?.calendarIconIsToday}
        onAddEvent={onAddEvent}
        onEventClick={onEventClick}
      >
        <CalendarContextProbe />
      </CalendarProvider>,
    );

    return { setMode, setDate, onAddEvent, onEventClick };
  }

  it("provides calendar context values and callbacks to children", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    const { setMode, setDate, onAddEvent, onEventClick } = renderProvider({ mode: "day" });

    expect(screen.getByTestId("mode")).toHaveTextContent("day");
    expect(screen.getByTestId("events")).toHaveTextContent("1");
    expect(screen.getByTestId("date")).toHaveTextContent(date.toISOString());
    expect(screen.getByTestId("icon-today")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "set mode" }));
    await user.click(screen.getByRole("button", { name: "set date" }));
    await user.click(screen.getByRole("button", { name: "add event" }));
    await user.click(screen.getByRole("button", { name: "click event" }));

    expect(setMode).toHaveBeenCalledWith("month");
    expect(setDate).toHaveBeenCalledWith(new Date("2026-03-15T00:00:00.000Z"));
    expect(onAddEvent).toHaveBeenCalledWith(date);
    expect(onEventClick).toHaveBeenCalledWith(event);
  });

  it("defaults calendarIconIsToday to true", () => {
    renderProvider();
    expect(screen.getByTestId("icon-today")).toHaveTextContent("true");
  });

  it("respects an explicit calendarIconIsToday override", () => {
    renderProvider({ calendarIconIsToday: false });
    expect(screen.getByTestId("icon-today")).toHaveTextContent("false");
  });
});
