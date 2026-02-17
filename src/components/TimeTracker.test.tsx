import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen } from "@/test/custom-render";
import { TimeTracker } from "./TimeTracker";

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Mock the TimeEntryModal
vi.mock("./TimeTracking/TimeEntryModal", () => ({
  TimeEntryModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="time-entry-modal">Time Entry Modal</div> : null,
}));

const mockStartTimer = vi.fn();
const mockStopTimer = vi.fn();

const createMockTimeEntry = (
  overrides: Partial<Doc<"timeEntries">> = {},
): Doc<"timeEntries"> & { totalCost?: number } => ({
  _id: `entry-${Math.random().toString(36).slice(2)}` as Id<"timeEntries">,
  _creationTime: Date.now(),
  userId: "user-1" as Id<"users">,
  projectId: "project-1" as Id<"projects">,
  issueId: "issue-1" as Id<"issues">,
  startTime: Date.now() - 3600000, // 1 hour ago
  duration: 3600, // 1 hour in seconds
  date: Date.now(),
  tags: [],
  currency: "USD",
  billable: false,
  billed: false,
  isEquityHour: false,
  isLocked: false,
  isApproved: false,
  updatedAt: Date.now(),
  ...overrides,
});

describe("TimeTracker", () => {
  const defaultProps = {
    issueId: "issue-1" as Id<"issues">,
    projectId: "project-1" as Id<"projects">,
    estimatedHours: 8,
    billingEnabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as Mock).mockReturnValueOnce(mockStartTimer).mockReturnValueOnce(mockStopTimer);
    mockStartTimer.mockResolvedValue(undefined);
    mockStopTimer.mockResolvedValue({ duration: 3600 });
  });

  describe("rendering", () => {
    it("should render time tracking header", () => {
      (useQuery as Mock).mockReturnValue([]);

      render(<TimeTracker {...defaultProps} />);

      expect(screen.getByText("Time Tracking")).toBeInTheDocument();
    });

    it("should render start timer button when no timer running", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // timeEntries
        .mockReturnValueOnce(null); // runningTimer

      render(<TimeTracker {...defaultProps} />);

      expect(screen.getByRole("button", { name: /start timer/i })).toBeInTheDocument();
    });

    it("should render stop timer button when timer running for this issue", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // timeEntries
        .mockReturnValueOnce({ _id: "timer-1", issueId: "issue-1" }); // runningTimer

      render(<TimeTracker {...defaultProps} />);

      expect(screen.getByRole("button", { name: /stop timer/i })).toBeInTheDocument();
    });

    it("should render log time button", () => {
      (useQuery as Mock).mockReturnValue([]);

      render(<TimeTracker {...defaultProps} />);

      expect(screen.getByRole("button", { name: /log time/i })).toBeInTheDocument();
    });
  });

  describe("time progress", () => {
    it("should show progress when estimated hours set", () => {
      const entries = [createMockTimeEntry({ duration: 7200 })]; // 2 hours
      (useQuery as Mock)
        .mockReturnValueOnce(entries) // timeEntries
        .mockReturnValueOnce(null); // runningTimer

      render(<TimeTracker {...defaultProps} estimatedHours={8} />);

      expect(screen.getByText(/2.0h \/ 8h estimated/i)).toBeInTheDocument();
      expect(screen.getByText(/6.0h remaining/i)).toBeInTheDocument();
    });

    it("should show over estimate warning", () => {
      const entries = [createMockTimeEntry({ duration: 36000 })]; // 10 hours
      (useQuery as Mock)
        .mockReturnValueOnce(entries) // timeEntries
        .mockReturnValueOnce(null); // runningTimer

      render(<TimeTracker {...defaultProps} estimatedHours={8} />);

      expect(screen.getByText(/10.0h \/ 8h estimated/i)).toBeInTheDocument();
      expect(screen.getByText(/2.0h over/i)).toBeInTheDocument();
    });

    it("should show logged time without estimate", () => {
      const entries = [createMockTimeEntry({ duration: 3600 })]; // 1 hour
      (useQuery as Mock)
        .mockReturnValueOnce(entries) // timeEntries
        .mockReturnValueOnce(null); // runningTimer

      render(<TimeTracker {...defaultProps} estimatedHours={0} />);

      expect(screen.getByText(/1.0h/)).toBeInTheDocument();
      expect(screen.getByText(/no estimate set/i)).toBeInTheDocument();
    });

    it("should show no time logged message", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // timeEntries
        .mockReturnValueOnce(null); // runningTimer

      render(<TimeTracker {...defaultProps} estimatedHours={0} />);

      expect(screen.getByText(/no time logged yet/i)).toBeInTheDocument();
    });
  });

  describe("timer actions", () => {
    it("should start timer on click", async () => {
      const user = userEvent.setup();
      (useQuery as Mock)
        .mockReturnValueOnce([]) // timeEntries
        .mockReturnValueOnce(null); // runningTimer

      render(<TimeTracker {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /start timer/i }));

      expect(mockStartTimer).toHaveBeenCalledWith({
        projectId: "project-1",
        issueId: "issue-1",
        billable: false,
      });
      expect(showSuccess).toHaveBeenCalledWith("Timer started");
    });

    it("should stop timer on click", async () => {
      const user = userEvent.setup();
      (useQuery as Mock)
        .mockReturnValueOnce([]) // timeEntries
        .mockReturnValueOnce({ _id: "timer-1", issueId: "issue-1" }); // runningTimer

      render(<TimeTracker {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /stop timer/i }));

      expect(mockStopTimer).toHaveBeenCalledWith({ entryId: "timer-1" });
      expect(showSuccess).toHaveBeenCalledWith("Timer stopped: 1.00h logged");
    });

    it("should disable start button when another timer is running", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // timeEntries
        .mockReturnValueOnce({ _id: "timer-1", issueId: "issue-other" }); // runningTimer for different issue

      render(<TimeTracker {...defaultProps} />);

      const startButton = screen.getByRole("button", { name: /start timer/i });
      expect(startButton).toBeDisabled();
    });

    it("should show error on start timer failure", async () => {
      const user = userEvent.setup();
      const error = new Error("Failed to start");
      mockStartTimer.mockRejectedValue(error);

      (useQuery as Mock)
        .mockReturnValueOnce([]) // timeEntries
        .mockReturnValueOnce(null); // runningTimer

      render(<TimeTracker {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /start timer/i }));

      expect(showError).toHaveBeenCalledWith(error, "Failed to start timer");
    });

    it("should show error on stop timer failure", async () => {
      const user = userEvent.setup();
      const error = new Error("Failed to stop");
      mockStopTimer.mockRejectedValue(error);

      (useQuery as Mock)
        .mockReturnValueOnce([]) // timeEntries
        .mockReturnValueOnce({ _id: "timer-1", issueId: "issue-1" }); // runningTimer

      render(<TimeTracker {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /stop timer/i }));

      expect(showError).toHaveBeenCalledWith(error, "Failed to stop timer");
    });
  });

  describe("time entries list", () => {
    it("should show view entries toggle when time logged", async () => {
      const entries = [createMockTimeEntry()];
      (useQuery as Mock)
        .mockReturnValueOnce(entries) // timeEntries
        .mockReturnValueOnce(null); // runningTimer

      render(<TimeTracker {...defaultProps} />);

      expect(screen.getByRole("button", { name: /view time entries/i })).toBeInTheDocument();
    });

    it("should not show view entries toggle when no time logged", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // timeEntries
        .mockReturnValueOnce(null); // runningTimer

      render(<TimeTracker {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /view time entries/i })).not.toBeInTheDocument();
    });

    it("should toggle time entries visibility", async () => {
      const user = userEvent.setup();
      const entries = [createMockTimeEntry({ duration: 3600, description: "Working on feature" })];
      // Return entries for first call (listTimeEntries) and null for second (runningTimer)
      // Use mockReturnValue to persist across re-renders triggered by state change
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        // Odd calls are listTimeEntries, even calls are runningTimer
        return callCount % 2 === 1 ? entries : null;
      });

      render(<TimeTracker {...defaultProps} />);

      // Initially entries not shown
      expect(screen.queryByText("Working on feature")).not.toBeInTheDocument();

      // Toggle to show
      await user.click(screen.getByRole("button", { name: /view time entries/i }));

      expect(screen.getByText("Working on feature")).toBeInTheDocument();
    });

    it("should render entry with billable badge", async () => {
      const user = userEvent.setup();
      const entries = [createMockTimeEntry({ billable: true })];
      // Return entries for first call (listTimeEntries) and null for second (runningTimer)
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        return callCount % 2 === 1 ? entries : null;
      });

      render(<TimeTracker {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /view time entries/i }));

      expect(screen.getByText("Billable")).toBeInTheDocument();
    });

    it("should render entry with activity badge", async () => {
      const user = userEvent.setup();
      const entries = [createMockTimeEntry({ activity: "Development" })];
      // Return entries for first call (listTimeEntries) and null for second (runningTimer)
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        return callCount % 2 === 1 ? entries : null;
      });

      render(<TimeTracker {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /view time entries/i }));

      expect(screen.getByText("Development")).toBeInTheDocument();
    });
  });

  describe("log time modal", () => {
    it("should open modal when log time clicked", async () => {
      const user = userEvent.setup();
      // Use mockImplementation to persist across re-renders triggered by modal open
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        return callCount % 2 === 1 ? [] : null;
      });

      render(<TimeTracker {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /log time/i }));

      expect(screen.getByTestId("time-entry-modal")).toBeInTheDocument();
    });
  });
});
