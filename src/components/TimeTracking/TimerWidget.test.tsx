import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock toast
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Mock organization context
vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: () => ({
    billingEnabled: false,
  }),
}));

// Mock data storage
let mockRunningTimer: {
  _id: string;
  startTime: number;
  description?: string;
  issue?: { key: string };
} | null = null;

const mockStopTimer = vi.fn();

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockRunningTimer),
  useMutation: vi.fn(() => mockStopTimer),
}));

// Import after mocks
import { TimerWidget } from "./TimerWidget";

describe("TimerWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunningTimer = null;
    mockStopTimer.mockResolvedValue({ duration: 3600 });
  });

  describe("No Running Timer", () => {
    it("should render Start Timer button when no timer is running", () => {
      render(<TimerWidget />);

      expect(screen.getByRole("button", { name: /Start timer/i })).toBeInTheDocument();
    });

    it("should show play icon in Start Timer button", () => {
      const { container } = render(<TimerWidget />);

      const button = screen.getByRole("button", { name: /Start timer/i });
      expect(button.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Running Timer", () => {
    beforeEach(() => {
      mockRunningTimer = {
        _id: "timer-1",
        startTime: Date.now() - 3661000, // 1 hour, 1 minute, 1 second ago
        description: "Working on feature",
      };
    });

    it("should render timer display when timer is running", () => {
      render(<TimerWidget />);

      // Should show timer role
      expect(screen.getByRole("timer")).toBeInTheDocument();
    });

    it("should render pulsing indicator when timer is running", () => {
      render(<TimerWidget />);

      expect(screen.getByLabelText("Timer is running")).toBeInTheDocument();
    });

    it("should render Stop button when timer is running", () => {
      render(<TimerWidget />);

      expect(screen.getByRole("button", { name: /Stop timer/i })).toBeInTheDocument();
    });

    it("should display description when available", () => {
      render(<TimerWidget />);

      expect(screen.getByText("Working on feature")).toBeInTheDocument();
    });

    it("should display issue key when available", () => {
      mockRunningTimer = {
        _id: "timer-1",
        startTime: Date.now() - 60000,
        issue: { key: "PROJ-123" },
      };

      render(<TimerWidget />);

      expect(screen.getByText("PROJ-123")).toBeInTheDocument();
    });

    it("should call stopTimer when Stop button is clicked", async () => {
      const user = userEvent.setup();
      render(<TimerWidget />);

      await user.click(screen.getByRole("button", { name: /Stop timer/i }));

      expect(mockStopTimer).toHaveBeenCalledWith({ entryId: "timer-1" });
    });
  });

  describe("Structure", () => {
    it("should render within a card when timer is running", () => {
      mockRunningTimer = {
        _id: "timer-1",
        startTime: Date.now(),
      };

      const { container } = render(<TimerWidget />);

      // Card component renders with role="article" or a div
      const card = container.querySelector(".bg-brand-indigo-track");
      expect(card).toBeInTheDocument();
    });
  });
});
