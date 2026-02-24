import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import { RoadmapView } from "./RoadmapView";

// Mock API to ensure stable references
vi.mock("@convex/_generated/api", () => ({
  api: {
    issues: {
      listRoadmapIssues: "listRoadmapIssues",
    },
    sprints: {
      listByProject: "listByProject",
    },
  },
}));

// Mock data
const mockProjectId = "project123" as Id<"projects">;
const mockSprints = [
  {
    _id: "sprint1" as Id<"sprints">,
    name: "Sprint 1",
    startDate: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    endDate: Date.now() + 1000 * 60 * 60 * 24 * 5, // 5 days future
    status: "active",
  },
];
const mockIssues = [
  {
    _id: "issue1" as Id<"issues">,
    key: "PROJ-1",
    title: "Test Issue",
    dueDate: Date.now() + 1000 * 60 * 60 * 24 * 2, // 2 days future
    _creationTime: Date.now() - 1000 * 60 * 60 * 24 * 1, // 1 day ago
    type: "task",
    priority: "medium",
    status: "todo",
  },
];

// Mock useQuery
const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useQuery: mockUseQuery,
}));

// Helper to match queries robustly
function isQuery(queryArg: unknown, name: string): boolean {
  // Check internal function name property if available
  if (typeof queryArg === "object" && queryArg !== null) {
    const obj = queryArg as Record<string, unknown>;
    if (
      "_functionName" in obj &&
      typeof obj._functionName === "string" &&
      obj._functionName.includes(name)
    ) {
      return true;
    }
  }
  // Check if it's strictly equal to the imported function (if stable)
  if (name === "listRoadmapIssues" && queryArg === api.issues.listRoadmapIssues) return true;
  if (name === "listByProject" && queryArg === api.sprints.listByProject) return true;
  return false;
}

describe("RoadmapView Accessibility", () => {
  it("renders correctly with accessibility attributes", () => {
    mockUseQuery.mockImplementation((query) => {
      if (isQuery(query, "listRoadmapIssues")) return mockIssues;
      if (isQuery(query, "listByProject")) return mockSprints;
      return undefined;
    });

    render(<RoadmapView projectId={mockProjectId} />);

    // check time scale group
    const timeScaleGroup = screen.getByRole("group", { name: "Time scale" });
    expect(timeScaleGroup).toBeInTheDocument();

    // check default pressed button (Month)
    // We query by aria-pressed="true" to verify state
    const pressedButton = screen.getByRole("button", { pressed: true });
    expect(pressedButton).toHaveTextContent(/Month/);

    // check navigation buttons labels
    const prevButton = screen.getByLabelText("Previous month");
    const nextButton = screen.getByLabelText("Next month");
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    // check list semantics
    const list = screen.getByRole("list"); // ul should have implicit list role
    expect(list).toBeInTheDocument();

    // check list items
    const listItems = screen.getAllByRole("listitem");
    // Should be at least 2 items (1 sprint + 1 issue)
    expect(listItems.length).toBeGreaterThanOrEqual(2);
  });

  it("updates labels when time scale changes", () => {
    mockUseQuery.mockReturnValue([]);

    render(<RoadmapView projectId={mockProjectId} />);

    // Click Week button
    // Finding button by text might be tricky due to ResponsiveText.
    // Query by text content within button
    const weekButton = screen.getByText("Week").closest("button");
    if (!weekButton) throw new Error("Week button not found");
    fireEvent.click(weekButton);

    expect(weekButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Previous week")).toBeInTheDocument();
    expect(screen.getByLabelText("Next week")).toBeInTheDocument();
  });
});
