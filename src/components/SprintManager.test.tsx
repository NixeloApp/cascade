import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, within } from "@/test/custom-render";
import { SprintManager } from "./SprintManager";

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const mockCreateSprint = vi.fn();
const mockStartSprint = vi.fn();
const mockCompleteSprint = vi.fn();

type SprintWithCounts = Doc<"sprints"> & { issueCount: number; completedCount: number };

const createMockSprint = (overrides: Partial<SprintWithCounts> = {}): SprintWithCounts =>
  ({
    _id: `sprint-${Math.random().toString(36).slice(2)}` as Id<"sprints">,
    _creationTime: Date.now(),
    projectId: "project-1" as Id<"projects">,
    name: "Sprint 1",
    status: "future",
    issueCount: 0,
    completedCount: 0,
    ...overrides,
  }) as SprintWithCounts;

describe("SprintManager", () => {
  const defaultProps = {
    projectId: "project-1" as Id<"projects">,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mutation mocks
    let mutationCallCount = 0;
    (useMutation as Mock).mockImplementation(() => {
      mutationCallCount++;
      if (mutationCallCount % 3 === 1) return mockCreateSprint;
      if (mutationCallCount % 3 === 2) return mockStartSprint;
      return mockCompleteSprint;
    });

    mockCreateSprint.mockResolvedValue({});
    mockStartSprint.mockResolvedValue({});
    mockCompleteSprint.mockResolvedValue({});
  });

  describe("loading state", () => {
    it("should render loading skeletons when data is undefined", () => {
      (useQuery as Mock).mockReturnValue(undefined);

      render(<SprintManager {...defaultProps} />);

      expect(screen.getByText("Sprint Management")).toBeInTheDocument();
      // Should render skeleton cards
      expect(screen.queryByText("No sprints yet")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show empty state when no sprints", () => {
      (useQuery as Mock).mockReturnValue([]);

      render(<SprintManager {...defaultProps} />);

      expect(screen.getByText("No sprints yet")).toBeInTheDocument();
      expect(screen.getByText("Create a sprint to start planning work")).toBeInTheDocument();
    });

    it("should show Create Sprint button in empty state when canEdit is true", () => {
      (useQuery as Mock).mockReturnValue([]);

      render(<SprintManager {...defaultProps} canEdit={true} />);

      // Both header and empty state should have Create Sprint buttons
      const buttons = screen.getAllByRole("button", { name: /create sprint/i });
      expect(buttons.length).toBeGreaterThanOrEqual(2); // header + empty state
    });

    it("should not show Create Sprint in empty state when canEdit is false", () => {
      (useQuery as Mock).mockReturnValue([]);

      render(<SprintManager {...defaultProps} canEdit={false} />);

      // The main "Create Sprint" button should be hidden
      expect(screen.queryByRole("button", { name: /create sprint/i })).not.toBeInTheDocument();
    });
  });

  describe("sprint list", () => {
    it("should render sprints", () => {
      const sprints = [
        createMockSprint({ name: "Sprint 1" }),
        createMockSprint({ name: "Sprint 2" }),
      ];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} />);

      expect(screen.getByText("Sprint 1")).toBeInTheDocument();
      expect(screen.getByText("Sprint 2")).toBeInTheDocument();
    });

    it("should display sprint status badge", () => {
      const sprints = [createMockSprint({ status: "future" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} />);

      expect(screen.getByText("future")).toBeInTheDocument();
    });

    it("should display issue count badge", () => {
      const sprints = [createMockSprint({ issueCount: 5 })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} />);

      expect(screen.getByText("5 issues")).toBeInTheDocument();
    });

    it("should display sprint goal when present", () => {
      const sprints = [createMockSprint({ goal: "Complete authentication feature" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} />);

      expect(screen.getByText("Complete authentication feature")).toBeInTheDocument();
    });
  });

  describe("active sprint", () => {
    it("should show progress bar for active sprints", () => {
      const sprints = [
        createMockSprint({
          status: "active",
          issueCount: 10,
          completedCount: 4,
        }),
      ];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} />);

      expect(screen.getByText("4 of 10 completed")).toBeInTheDocument();
      expect(screen.getByText("40%")).toBeInTheDocument();
    });

    it("should show Complete Sprint button for active sprints", () => {
      const sprints = [createMockSprint({ status: "active" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} canEdit={true} />);

      expect(screen.getByRole("button", { name: /complete sprint/i })).toBeInTheDocument();
    });

    it("should not show Start Sprint button for active sprints", () => {
      const sprints = [createMockSprint({ status: "active" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /start sprint/i })).not.toBeInTheDocument();
    });
  });

  describe("future sprint", () => {
    it("should show Start Sprint button for future sprints", () => {
      const sprints = [createMockSprint({ status: "future" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} canEdit={true} />);

      expect(screen.getByRole("button", { name: /start sprint/i })).toBeInTheDocument();
    });

    it("should not show action buttons when canEdit is false", () => {
      const sprints = [createMockSprint({ status: "future" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} canEdit={false} />);

      expect(screen.queryByRole("button", { name: /start sprint/i })).not.toBeInTheDocument();
    });
  });

  describe("create sprint form", () => {
    it("should show create form when Create Sprint button clicked", async () => {
      const user = userEvent.setup();
      (useQuery as Mock).mockReturnValue([]);

      render(<SprintManager {...defaultProps} />);

      // Click the first Create Sprint button (header)
      const buttons = screen.getAllByRole("button", { name: /create sprint/i });
      await user.click(buttons[0]);

      expect(screen.getByLabelText(/sprint name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sprint goal/i)).toBeInTheDocument();
    });

    it("should show duration presets in create form", async () => {
      const user = userEvent.setup();
      (useQuery as Mock).mockReturnValue([]);

      render(<SprintManager {...defaultProps} />);

      const buttons = screen.getAllByRole("button", { name: /create sprint/i });
      await user.click(buttons[0]);

      expect(screen.getByText("1 Week")).toBeInTheDocument();
      expect(screen.getByText("2 Weeks")).toBeInTheDocument();
      expect(screen.getByText("3 Weeks")).toBeInTheDocument();
      expect(screen.getByText("4 Weeks")).toBeInTheDocument();
      expect(screen.getByText("Custom")).toBeInTheDocument();
    });

    it("should call createSprint mutation when form submitted", async () => {
      const user = userEvent.setup();
      (useQuery as Mock).mockReturnValue([]);

      render(<SprintManager {...defaultProps} />);

      const createButtons = screen.getAllByRole("button", {
        name: /create sprint/i,
      });
      await user.click(createButtons[0]);

      const nameInput = screen.getByLabelText(/sprint name/i);
      await user.type(nameInput, "Sprint 3");

      const goalInput = screen.getByLabelText(/sprint goal/i);
      await user.type(goalInput, "Test goal");

      const buttons = screen.getAllByRole("button", { name: /create sprint/i });
      // Find the submit button (form button, not header button)
      const submitButton = buttons.find((btn) => btn.getAttribute("type") === "submit");
      if (submitButton) {
        await user.click(submitButton);
      }

      expect(mockCreateSprint).toHaveBeenCalledWith({
        projectId: "project-1",
        name: "Sprint 3",
        goal: "Test goal",
        startDate: undefined,
        endDate: undefined,
      });
      expect(showSuccess).toHaveBeenCalledWith("Sprint created successfully");
    });

    it("should hide form when Cancel clicked", async () => {
      const user = userEvent.setup();
      (useQuery as Mock).mockReturnValue([]);

      render(<SprintManager {...defaultProps} />);

      const createButtons = screen.getAllByRole("button", {
        name: /create sprint/i,
      });
      await user.click(createButtons[0]);

      expect(screen.getByLabelText(/sprint name/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.queryByLabelText(/sprint name/i)).not.toBeInTheDocument();
    });

    it("should show error toast when create fails", async () => {
      const user = userEvent.setup();
      const error = new Error("Network error");
      mockCreateSprint.mockRejectedValue(error);
      (useQuery as Mock).mockReturnValue([]);

      render(<SprintManager {...defaultProps} />);

      const createButtons = screen.getAllByRole("button", {
        name: /create sprint/i,
      });
      await user.click(createButtons[0]);

      const nameInput = screen.getByLabelText(/sprint name/i);
      await user.type(nameInput, "Sprint 3");

      const buttons = screen.getAllByRole("button", { name: /create sprint/i });
      const submitButton = buttons.find((btn) => btn.getAttribute("type") === "submit");
      if (submitButton) {
        await user.click(submitButton);
      }

      expect(showError).toHaveBeenCalledWith(error, "Failed to create sprint");
    });
  });

  describe("start sprint modal", () => {
    it("should open modal when Start Sprint clicked", async () => {
      const user = userEvent.setup();
      const sprints = [createMockSprint({ status: "future" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} canEdit={true} />);

      await user.click(screen.getByRole("button", { name: /start sprint/i }));

      expect(screen.getByText("Choose how long this sprint should run.")).toBeInTheDocument();
    });

    it("should show duration presets in start modal", async () => {
      const user = userEvent.setup();
      const sprints = [createMockSprint({ status: "future" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} canEdit={true} />);

      await user.click(screen.getByRole("button", { name: /start sprint/i }));

      // Modal should be visible with duration instructions
      expect(screen.getByText("Choose how long this sprint should run.")).toBeInTheDocument();
      // Duration options should be in the modal
      expect(screen.getAllByRole("button", { name: /1 week/i }).length).toBeGreaterThan(0);
    });

    it("should close modal when Cancel clicked", async () => {
      const user = userEvent.setup();
      const sprints = [createMockSprint({ status: "future" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} canEdit={true} />);

      await user.click(screen.getByRole("button", { name: /start sprint/i }));

      expect(screen.getByText("Choose how long this sprint should run.")).toBeInTheDocument();

      // Find cancel button in modal
      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[0]);

      expect(screen.queryByText("Choose how long this sprint should run.")).not.toBeInTheDocument();
    });

    it("should call startSprint when confirmed", async () => {
      const user = userEvent.setup();
      const sprintId = "sprint-123" as Id<"sprints">;
      const sprints = [createMockSprint({ _id: sprintId, status: "future" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} canEdit={true} />);

      await user.click(screen.getByRole("button", { name: /start sprint/i }));

      // Find the Start Sprint button in the modal (variant success)
      const startButtons = screen.getAllByRole("button", {
        name: /start sprint/i,
      });
      // The second one is in the modal
      await user.click(startButtons[startButtons.length - 1]);

      expect(mockStartSprint).toHaveBeenCalled();
      expect(showSuccess).toHaveBeenCalledWith("Sprint started successfully");
    });
  });

  describe("complete sprint", () => {
    it("should call completeSprint when Complete Sprint clicked", async () => {
      const user = userEvent.setup();
      const sprintId = "sprint-456" as Id<"sprints">;
      const sprints = [createMockSprint({ _id: sprintId, status: "active" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} canEdit={true} />);

      await user.click(screen.getByRole("button", { name: /complete sprint/i }));

      expect(mockCompleteSprint).toHaveBeenCalledWith({ sprintId });
      expect(showSuccess).toHaveBeenCalledWith("Sprint completed successfully");
    });

    it("should show error toast when complete fails", async () => {
      const user = userEvent.setup();
      const error = new Error("Server error");
      mockCompleteSprint.mockRejectedValue(error);
      const sprints = [createMockSprint({ status: "active" })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} canEdit={true} />);

      await user.click(screen.getByRole("button", { name: /complete sprint/i }));

      expect(showError).toHaveBeenCalledWith(error, "Failed to complete sprint");
    });
  });

  describe("date display", () => {
    it("should display sprint dates when present", () => {
      const startDate = new Date("2026-02-01").getTime();
      const endDate = new Date("2026-02-14").getTime();
      const sprints = [createMockSprint({ startDate, endDate })];
      (useQuery as Mock).mockReturnValue(sprints);

      render(<SprintManager {...defaultProps} />);

      // Should display formatted dates (locale-dependent format)
      // Look for any text containing both start and end date indicators
      // The format varies by locale, so we look for "2/1" or "1/2" or "Feb" patterns
      const dateText = screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|Feb|2026/);
      expect(dateText).toBeInTheDocument();
    });
  });
});
