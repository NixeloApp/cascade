import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";

const mockCalendarMutation = vi.fn();

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => mockCalendarMutation),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Mock heavy child components
vi.mock("./shadcn-calendar/calendar", () => ({
  ShadcnCalendar: (props: {
    mode: string;
    onAddEvent?: (date?: Date) => void;
    onEventMove?: (
      event: {
        id: string;
        title: string;
        color: string;
        start: Date;
        end: Date;
        convexId: string;
        eventType: string;
      },
      date: Date,
    ) => Promise<void> | void;
    setMode?: (mode: "day" | "week" | "month") => void;
  }) => (
    <div data-testid="mock-shadcn-calendar">
      <span>{`ShadcnCalendar:${props.mode}`}</span>
      <button type="button" onClick={() => props.onAddEvent?.()}>
        Add Event
      </button>
      <button type="button" onClick={() => props.setMode?.("day")}>
        Switch To Day
      </button>
      <button
        type="button"
        onClick={() => props.onAddEvent?.(new Date("2026-03-20T00:00:00.000Z"))}
      >
        Quick Add
      </button>
      <button
        type="button"
        onClick={() =>
          props.onEventMove?.(
            {
              id: "evt-1",
              convexId: "evt-1",
              title: "Planning",
              color: "blue",
              eventType: "meeting",
              start: new Date("2026-03-20T15:30:00.000Z"),
              end: new Date("2026-03-20T16:30:00.000Z"),
            },
            new Date("2026-03-22T00:00:00.000Z"),
          )
        }
      >
        Move Event
      </button>
    </div>
  ),
}));

vi.mock("./CreateEventModal", () => ({
  CreateEventModal: (props: { defaultDate?: Date; open: boolean }) => (
    <div
      data-testid="mock-create-event-modal"
      data-default-date={props.defaultDate?.toISOString()}
      data-open={props.open}
    >
      {props.open && <span>CreateEventModal</span>}
    </div>
  ),
}));

vi.mock("./EventDetailsModal", () => ({
  EventDetailsModal: () => <div data-testid="mock-event-details-modal">EventDetailsModal</div>,
}));

import { CalendarView, getMovedEventTimes } from "./CalendarView";

describe("CalendarView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalendarMutation.mockReset();
  });

  it("renders the calendar component", () => {
    render(<CalendarView />);

    expect(screen.getByTestId(TEST_IDS.CALENDAR.ROOT)).toBeInTheDocument();
    expect(screen.getByTestId("mock-shadcn-calendar")).toBeInTheDocument();
    expect(screen.getByText("ShadcnCalendar:week")).toBeInTheDocument();
  });

  it("renders the CreateEventModal in closed state initially", () => {
    render(<CalendarView />);

    const modal = screen.getByTestId("mock-create-event-modal");
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute("data-open", "false");
  });

  it("renders the Add Event button from the calendar", () => {
    render(<CalendarView />);

    expect(screen.getByRole("button", { name: /add event/i })).toBeInTheDocument();
  });

  it("opens quick add with the requested date", async () => {
    const user = userEvent.setup();
    render(<CalendarView />);

    await user.click(screen.getByRole("button", { name: /quick add/i }));

    const modal = screen.getByTestId("mock-create-event-modal");
    expect(modal).toHaveAttribute("data-open", "true");
    expect(modal).toHaveAttribute("data-default-date", "2026-03-20T00:00:00.000Z");
  });

  it("moves an event while preserving its time and duration", async () => {
    const user = userEvent.setup();
    render(<CalendarView />);

    await user.click(screen.getByRole("button", { name: /move event/i }));

    const expectedMove = getMovedEventTimes(
      {
        id: "evt-1",
        title: "Planning",
        color: "blue",
        start: new Date("2026-03-20T15:30:00.000Z"),
        end: new Date("2026-03-20T16:30:00.000Z"),
      },
      new Date("2026-03-22T00:00:00.000Z"),
    );

    expect(mockCalendarMutation).toHaveBeenCalledWith({
      id: "evt-1",
      startTime: expectedMove?.startTime,
      endTime: expectedMove?.endTime,
    });
  });

  it("uses a provided default mode", () => {
    render(<CalendarView defaultMode="month" />);

    expect(screen.getByText("ShadcnCalendar:month")).toBeInTheDocument();
  });

  it("adopts a new default mode only while still on the previous default", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CalendarView defaultMode="week" />);

    rerender(<CalendarView defaultMode="month" />);
    expect(screen.getByText("ShadcnCalendar:month")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /switch to day/i }));
    expect(screen.getByText("ShadcnCalendar:day")).toBeInTheDocument();

    rerender(<CalendarView defaultMode="week" />);
    expect(screen.getByText("ShadcnCalendar:day")).toBeInTheDocument();
  });
});
