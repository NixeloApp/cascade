import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { ActivityFeed } from "./ActivityFeed";

// Mock Convex
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

// Mock dates
vi.mock("@/lib/dates", () => ({
  formatRelativeTime: vi.fn((_timestamp: number) => "2 hours ago"),
}));

import { useQuery } from "convex/react";

const mockActivities = [
  {
    _id: "activity-1",
    action: "created",
    issueKey: "PROJ-1",
    userName: "John Doe",
    _creationTime: Date.now() - 1000 * 60 * 60,
  },
  {
    _id: "activity-2",
    action: "updated",
    field: "status",
    oldValue: "todo",
    newValue: "inprogress",
    issueKey: "PROJ-2",
    userName: "Jane Smith",
    _creationTime: Date.now() - 1000 * 60 * 120,
  },
  {
    _id: "activity-3",
    action: "commented",
    issueKey: "PROJ-1",
    userName: "Bob Johnson",
    _creationTime: Date.now() - 1000 * 60 * 180,
  },
];

describe("ActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("should show skeleton while loading", () => {
      (useQuery as Mock).mockReturnValue(undefined);
      render(<ActivityFeed projectId={"project-123" as any} />);

      // SkeletonList renders skeleton items
      expect(screen.queryByTestId(TEST_IDS.ACTIVITY.FEED)).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show empty state when no activities", () => {
      (useQuery as Mock).mockReturnValue([]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByTestId(TEST_IDS.ACTIVITY.EMPTY_STATE)).toBeInTheDocument();
      expect(screen.getByText("No activity yet")).toBeInTheDocument();
      expect(screen.getByText("Activity will appear here as work progresses")).toBeInTheDocument();
    });
  });

  describe("with activities", () => {
    it("should render activity feed container", () => {
      (useQuery as Mock).mockReturnValue(mockActivities);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByTestId(TEST_IDS.ACTIVITY.FEED)).toBeInTheDocument();
    });

    it("should render all activity entries", () => {
      (useQuery as Mock).mockReturnValue(mockActivities);
      render(<ActivityFeed projectId={"project-123" as any} />);

      const entries = screen.getAllByTestId(TEST_IDS.ACTIVITY.ENTRY);
      expect(entries).toHaveLength(3);
    });

    it("should display user names", () => {
      (useQuery as Mock).mockReturnValue(mockActivities);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    });

    it("should display issue keys", () => {
      (useQuery as Mock).mockReturnValue(mockActivities);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getAllByText("PROJ-1")).toHaveLength(2);
      expect(screen.getByText("PROJ-2")).toBeInTheDocument();
    });

    it("should display relative timestamps", () => {
      (useQuery as Mock).mockReturnValue(mockActivities);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getAllByText("2 hours ago")).toHaveLength(3);
    });
  });

  describe("action formatting", () => {
    it("should format created action", () => {
      (useQuery as Mock).mockReturnValue([
        {
          _id: "1",
          action: "created",
          issueKey: "TEST-1",
          userName: "User",
          _creationTime: Date.now(),
        },
      ]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("created")).toBeInTheDocument();
    });

    it("should format commented action", () => {
      (useQuery as Mock).mockReturnValue([
        {
          _id: "1",
          action: "commented",
          issueKey: "TEST-1",
          userName: "User",
          _creationTime: Date.now(),
        },
      ]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("commented on")).toBeInTheDocument();
    });

    it("should format status update action", () => {
      (useQuery as Mock).mockReturnValue([
        {
          _id: "1",
          action: "updated",
          field: "status",
          oldValue: "todo",
          newValue: "done",
          issueKey: "TEST-1",
          userName: "User",
          _creationTime: Date.now(),
        },
      ]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("changed status from todo to done")).toBeInTheDocument();
    });

    it("should format priority update action", () => {
      (useQuery as Mock).mockReturnValue([
        {
          _id: "1",
          action: "updated",
          field: "priority",
          oldValue: "low",
          newValue: "high",
          issueKey: "TEST-1",
          userName: "User",
          _creationTime: Date.now(),
        },
      ]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("changed priority from low to high")).toBeInTheDocument();
    });

    it("should format assignee update action", () => {
      (useQuery as Mock).mockReturnValue([
        {
          _id: "1",
          action: "updated",
          field: "assignee",
          oldValue: "Alice",
          newValue: "Bob",
          issueKey: "TEST-1",
          userName: "User",
          _creationTime: Date.now(),
        },
      ]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("reassigned from Alice to Bob")).toBeInTheDocument();
    });

    it("should format new assignment action", () => {
      (useQuery as Mock).mockReturnValue([
        {
          _id: "1",
          action: "updated",
          field: "assignee",
          newValue: "Bob",
          issueKey: "TEST-1",
          userName: "User",
          _creationTime: Date.now(),
        },
      ]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("assigned to Bob")).toBeInTheDocument();
    });

    it("should format unassignment action", () => {
      (useQuery as Mock).mockReturnValue([
        {
          _id: "1",
          action: "updated",
          field: "assignee",
          oldValue: "Alice",
          issueKey: "TEST-1",
          userName: "User",
          _creationTime: Date.now(),
        },
      ]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("unassigned")).toBeInTheDocument();
    });

    it("should format linked action", () => {
      (useQuery as Mock).mockReturnValue([
        {
          _id: "1",
          action: "linked",
          field: "PROJ-99",
          issueKey: "TEST-1",
          userName: "User",
          _creationTime: Date.now(),
        },
      ]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("linked PROJ-99")).toBeInTheDocument();
    });

    it("should format started_watching action", () => {
      (useQuery as Mock).mockReturnValue([
        {
          _id: "1",
          action: "started_watching",
          issueKey: "TEST-1",
          userName: "User",
          _creationTime: Date.now(),
        },
      ]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(screen.getByText("started watching")).toBeInTheDocument();
    });
  });

  describe("compact mode", () => {
    it("should render in compact mode when prop is true", () => {
      (useQuery as Mock).mockReturnValue(mockActivities);
      render(<ActivityFeed projectId={"project-123" as any} compact />);

      expect(screen.getByTestId(TEST_IDS.ACTIVITY.FEED)).toBeInTheDocument();
      // In compact mode, entry should have different padding classes
      const entries = screen.getAllByTestId(TEST_IDS.ACTIVITY.ENTRY);
      expect(entries[0]).toHaveClass("py-2");
    });

    it("should not show timeline line with single activity in compact mode", () => {
      (useQuery as Mock).mockReturnValue([mockActivities[0]]);
      const { container } = render(<ActivityFeed projectId={"project-123" as any} compact />);

      // Timeline line should not be present for single item in compact
      const timeline = container.querySelector(".absolute.left-3");
      expect(timeline).not.toBeInTheDocument();
    });
  });

  describe("limit prop", () => {
    it("should pass limit to query", () => {
      (useQuery as Mock).mockReturnValue([]);
      render(<ActivityFeed projectId={"project-123" as any} limit={10} />);

      expect(useQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ limit: 10 }),
      );
    });

    it("should default limit to 50", () => {
      (useQuery as Mock).mockReturnValue([]);
      render(<ActivityFeed projectId={"project-123" as any} />);

      expect(useQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ limit: 50 }),
      );
    });
  });
});
