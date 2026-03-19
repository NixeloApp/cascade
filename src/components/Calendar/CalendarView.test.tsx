import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock heavy child components
vi.mock("./shadcn-calendar/calendar", () => ({
  ShadcnCalendar: (props: { onAddEvent?: (date?: Date) => void }) => (
    <div data-testid="mock-shadcn-calendar">
      <span>ShadcnCalendar</span>
      <button type="button" onClick={() => props.onAddEvent?.()}>
        Add Event
      </button>
      <button
        type="button"
        onClick={() => props.onAddEvent?.(new Date("2026-03-20T00:00:00.000Z"))}
      >
        Quick Add
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

import { CalendarView } from "./CalendarView";

describe("CalendarView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the calendar component", () => {
    render(<CalendarView />);

    expect(screen.getByTestId("mock-shadcn-calendar")).toBeInTheDocument();
    expect(screen.getByText("ShadcnCalendar")).toBeInTheDocument();
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
});
