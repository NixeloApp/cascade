import type { Id } from "@convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock data storage
let mockCounts: Record<string, { total: number }> | undefined;
let mockProject: { workflowStates: { id: string; category: string }[] } | undefined;
let callCount = 0;

// Mock Convex - useQuery is called twice, first for counts, then for project
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => {
    callCount++;
    // First call is for counts, second for project
    if (callCount % 2 === 1) {
      return mockCounts;
    }
    return mockProject;
  }),
}));

// Import after mocks
import { SprintProgressBar } from "./SprintProgressBar";

describe("SprintProgressBar", () => {
  const defaultProps = {
    projectId: "project-1" as Id<"projects">,
    sprintId: "sprint-1" as Id<"sprints">,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCounts = undefined;
    mockProject = undefined;
    callCount = 0;
  });

  describe("Rendering", () => {
    it("should render nothing when counts are loading", () => {
      mockCounts = undefined;
      mockProject = {
        workflowStates: [
          { id: "todo", category: "todo" },
          { id: "done", category: "done" },
        ],
      };

      const { container } = render(<SprintProgressBar {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when project is loading", () => {
      mockCounts = { todo: { total: 5 } };
      mockProject = undefined;

      const { container } = render(<SprintProgressBar {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when total is 0", () => {
      mockCounts = {};
      mockProject = {
        workflowStates: [{ id: "done", category: "done" }],
      };

      const { container } = render(<SprintProgressBar {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render progress stats when data is available", () => {
      mockCounts = {
        todo: { total: 5 },
        done: { total: 3 },
      };
      mockProject = {
        workflowStates: [
          { id: "todo", category: "todo" },
          { id: "done", category: "done" },
        ],
      };

      render(<SprintProgressBar {...defaultProps} />);

      // Should show done/total (percent)
      expect(screen.getByText("3/8 (38%)")).toBeInTheDocument();
    });

    it("should render 100% complete correctly", () => {
      mockCounts = {
        done: { total: 10 },
      };
      mockProject = {
        workflowStates: [{ id: "done", category: "done" }],
      };

      render(<SprintProgressBar {...defaultProps} />);

      expect(screen.getByText("10/10 (100%)")).toBeInTheDocument();
    });

    it("should render 0% when no issues are done", () => {
      mockCounts = {
        todo: { total: 5 },
      };
      mockProject = {
        workflowStates: [
          { id: "todo", category: "todo" },
          { id: "done", category: "done" },
        ],
      };

      render(<SprintProgressBar {...defaultProps} />);

      expect(screen.getByText("0/5 (0%)")).toBeInTheDocument();
    });
  });

  describe("Progress Bar", () => {
    it("should render progress bar element", () => {
      mockCounts = {
        todo: { total: 5 },
        done: { total: 5 },
      };
      mockProject = {
        workflowStates: [
          { id: "todo", category: "todo" },
          { id: "done", category: "done" },
        ],
      };

      const { container } = render(<SprintProgressBar {...defaultProps} />);

      // Progress bar container
      const progressBar = container.querySelector(".h-2.bg-ui-bg-secondary");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      mockCounts = {
        done: { total: 5 },
      };
      mockProject = {
        workflowStates: [{ id: "done", category: "done" }],
      };

      const { container } = render(
        <SprintProgressBar {...defaultProps} className="custom-class" />,
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-class");
    });
  });
});
