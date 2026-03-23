import { DAY } from "@convex/lib/timeUtils";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { RoadmapIssueIdentity, RoadmapSummaryBar } from "./RoadmapRows";

const MOCK_ISSUE = {
  _id: "issue1" as never,
  _creationTime: Date.now(),
  key: "PROJ-42",
  title: "Implement auth flow",
  type: "task" as const,
  status: "in_progress",
  priority: "high",
  assignee: { name: "Alice Johnson" },
  dueDate: Date.now() + DAY,
  startDate: Date.now(),
  projectId: "proj1" as never,
  organizationId: "org1" as never,
};

describe("RoadmapRows", () => {
  it("exports all row components", async () => {
    const mod = await import("./RoadmapRows");
    expect(typeof mod.RoadmapTimelineBar).toBe("function");
    expect(typeof mod.RoadmapGroupRow).toBe("function");
    expect(typeof mod.RoadmapIssueIdentity).toBe("function");
    expect(typeof mod.RoadmapSummaryBar).toBe("function");
    expect(typeof mod.RoadmapIssueRow).toBe("function");
  });
});

describe("RoadmapIssueIdentity", () => {
  const noop = vi.fn();

  it("renders issue key, title, and status badges", () => {
    render(
      <RoadmapIssueIdentity
        childCount={0}
        childrenCollapsed={false}
        hasChildren={false}
        isNestedSubtask={false}
        issue={MOCK_ISSUE as never}
        onOpenIssue={noop}
        onToggleChildren={noop}
        parentIssue={null}
        selected={false}
      />,
    );

    expect(screen.getByText("PROJ-42")).toBeInTheDocument();
    expect(screen.getByText("Implement auth flow")).toBeInTheDocument();
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
  });

  it("shows Unassigned when no assignee", () => {
    const unassigned = { ...MOCK_ISSUE, assignee: null };
    render(
      <RoadmapIssueIdentity
        childCount={0}
        childrenCollapsed={false}
        hasChildren={false}
        isNestedSubtask={false}
        issue={unassigned as never}
        onOpenIssue={noop}
        onToggleChildren={noop}
        parentIssue={null}
        selected={false}
      />,
    );

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("renders expand button when issue has children", () => {
    render(
      <RoadmapIssueIdentity
        childCount={3}
        childrenCollapsed={true}
        hasChildren={true}
        isNestedSubtask={false}
        issue={MOCK_ISSUE as never}
        onOpenIssue={noop}
        onToggleChildren={noop}
        parentIssue={null}
        selected={false}
      />,
    );

    expect(screen.getByRole("button", { name: /expand subtasks/i })).toBeInTheDocument();
  });
});

describe("RoadmapSummaryBar", () => {
  it("renders completion percentage", () => {
    const getPos = (date: number) => ((date - Date.now()) / DAY) * 10;
    const { container } = render(
      <RoadmapSummaryBar
        completedCount={3}
        dueDate={Date.now() + DAY * 7}
        getPositionOnTimeline={getPos}
        issueKey="PROJ-1"
        totalCount={5}
        startDate={Date.now()}
      />,
    );

    expect(container.firstChild).toBeInTheDocument();
    expect(container.textContent).toContain("60%");
  });
});
