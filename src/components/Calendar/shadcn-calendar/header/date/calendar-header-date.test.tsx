import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { CalendarProvider } from "../../calendar-provider";
import type { CalendarEvent } from "../../calendar-types";
import { CalendarHeaderDate } from "./calendar-header-date";

describe("CalendarHeaderDate", () => {
  it("exposes the shared header date test id with formatted month content", () => {
    const event: CalendarEvent = {
      id: "evt-1",
      title: "Planning",
      color: "blue",
      start: new Date("2026-03-13T15:00:00.000Z"),
      end: new Date("2026-03-13T16:00:00.000Z"),
    };

    render(
      <CalendarProvider
        events={[event]}
        mode="week"
        setMode={vi.fn()}
        date={new Date("2026-03-20T12:00:00.000Z")}
        setDate={vi.fn()}
        onAddEvent={vi.fn()}
        onEventMove={vi.fn()}
        onEventClick={vi.fn()}
      >
        <CalendarHeaderDate />
      </CalendarProvider>,
    );

    expect(screen.getByTestId(TEST_IDS.CALENDAR.HEADER_DATE)).toHaveTextContent("March 2026");
  });
});
