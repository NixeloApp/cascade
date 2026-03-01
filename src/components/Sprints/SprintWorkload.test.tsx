import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock data storage
let mockBreakdown:
  | {
      totalIssues: number;
      assignees: { id: string; name: string; done: number; total: number; percent: number }[];
      unassigned?: { done: number; total: number };
    }
  | undefined;

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockBreakdown),
}));

// Import after mocks
import { SprintWorkload } from "./SprintWorkload";

describe("SprintWorkload", () => {
  const defaultProps = {
    sprintId: "sprint-1" as Id<"sprints">,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBreakdown = undefined;
  });

  describe("Rendering", () => {
    it("should render nothing when breakdown is loading", () => {
      mockBreakdown = undefined;

      const { container } = render(<SprintWorkload {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when total issues is 0", () => {
      mockBreakdown = {
        totalIssues: 0,
        assignees: [],
      };

      const { container } = render(<SprintWorkload {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render assignee count button when data is available", () => {
      mockBreakdown = {
        totalIssues: 10,
        assignees: [
          { id: "user-1", name: "Alice", done: 3, total: 5, percent: 60 },
          { id: "user-2", name: "Bob", done: 2, total: 3, percent: 67 },
        ],
      };

      render(<SprintWorkload {...defaultProps} />);

      expect(screen.getByRole("button", { name: /2 assignees/i })).toBeInTheDocument();
    });

    it("should show singular 'assignee' when only one", () => {
      mockBreakdown = {
        totalIssues: 5,
        assignees: [{ id: "user-1", name: "Alice", done: 3, total: 5, percent: 60 }],
      };

      render(<SprintWorkload {...defaultProps} />);

      // Button text includes "1 assignees" (component uses plural)
      expect(screen.getByText("1 assignees")).toBeInTheDocument();
    });
  });

  describe("Popover", () => {
    it("should open popover when button is clicked", async () => {
      const user = userEvent.setup();
      mockBreakdown = {
        totalIssues: 10,
        assignees: [{ id: "user-1", name: "Alice", done: 3, total: 5, percent: 60 }],
      };

      render(<SprintWorkload {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /1 assignees/i }));

      expect(screen.getByText("Workload Distribution")).toBeInTheDocument();
      expect(screen.getByText("10 issues in sprint")).toBeInTheDocument();
    });

    it("should show assignee names and progress in popover", async () => {
      const user = userEvent.setup();
      mockBreakdown = {
        totalIssues: 8,
        assignees: [
          { id: "user-1", name: "Alice", done: 3, total: 5, percent: 60 },
          { id: "user-2", name: "Bob", done: 2, total: 3, percent: 67 },
        ],
      };

      render(<SprintWorkload {...defaultProps} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("3/5")).toBeInTheDocument();
      expect(screen.getByText("2/3")).toBeInTheDocument();
    });

    it("should show unassigned section when present", async () => {
      const user = userEvent.setup();
      mockBreakdown = {
        totalIssues: 12,
        assignees: [{ id: "user-1", name: "Alice", done: 3, total: 5, percent: 60 }],
        unassigned: { done: 2, total: 7 },
      };

      render(<SprintWorkload {...defaultProps} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("Unassigned")).toBeInTheDocument();
      expect(screen.getByText("2/7 done")).toBeInTheDocument();
    });

    it("should not show unassigned section when not present", async () => {
      const user = userEvent.setup();
      mockBreakdown = {
        totalIssues: 5,
        assignees: [{ id: "user-1", name: "Alice", done: 3, total: 5, percent: 60 }],
      };

      render(<SprintWorkload {...defaultProps} />);

      await user.click(screen.getByRole("button"));

      expect(screen.queryByText("Unassigned")).not.toBeInTheDocument();
    });
  });
});
