import type { Id } from "@convex/_generated/dataModel";
import { HOUR } from "@convex/lib/timeUtils";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen } from "@/test/custom-render";
import { EventDetailsModal } from "./EventDetailsModal";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
  useAuthenticatedMutation: vi.fn(() => ({
    mutate: vi.fn(),
    canAct: true,
    isAuthLoading: false,
  })),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({
    children,
    open,
    title,
    "data-testid": testId,
  }: {
    children: ReactNode;
    open: boolean;
    title: string;
    "data-testid"?: string;
  }) =>
    open ? (
      <div data-testid={testId} role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  getCardRecipeClassName: (recipe: string) => `recipe-${recipe}`,
}));

vi.mock("../ui/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("../MeetingRecordingSection", () => ({
  MeetingRecordingSection: () => null,
}));

vi.mock("./calendar-colors", () => ({
  getEventBadgeClass: () => "bg-brand",
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const eventId = "event_1" as Id<"calendarEvents">;

describe("EventDetailsModal", () => {
  it("renders loading state when event data is not loaded", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<EventDetailsModal eventId={eventId} open onOpenChange={() => {}} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument(); // LoadingSpinner
  });

  it("does not render when closed", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<EventDetailsModal eventId={eventId} open={false} onOpenChange={() => {}} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders event title when data is loaded", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      _id: eventId,
      title: "Sprint Planning",
      startTime: Date.now(),
      endTime: Date.now() + HOUR,
      isRequired: false,
      createdBy: "user_1",
      organizerName: "John Doe",
      attendeeIds: [],
      participants: [],
      summary: { present: 0, absent: 0, tardy: 0 },
    });

    render(<EventDetailsModal eventId={eventId} open onOpenChange={() => {}} />);

    expect(screen.getByRole("dialog", { name: "Sprint Planning" })).toBeInTheDocument();
  });
});
