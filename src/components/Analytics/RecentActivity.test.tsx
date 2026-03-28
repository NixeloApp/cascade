import { HOUR } from "@convex/lib/timeUtils";
import { describe, expect, it } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { RecentActivity } from "./RecentActivity";

describe("RecentActivity", () => {
  const mockActivities = [
    {
      _id: "activity-1",
      userName: "John Doe",
      action: "created issue",
      issueKey: "TEST-1",
      _creationTime: Date.now() - HOUR,
    },
    {
      _id: "activity-2",
      userName: "Jane Smith",
      action: "updated",
      field: "status",
      issueKey: "TEST-2",
      _creationTime: Date.now() - 2 * HOUR,
    },
    {
      _id: "activity-3",
      userName: "Bob Wilson",
      action: "commented on",
      _creationTime: Date.now() - 3 * HOUR,
    },
  ];

  describe("Rendering", () => {
    it("should render title", () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    });

    it("should render user names", () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
    });

    it("should render issue keys as badges", () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText("TEST-1")).toBeInTheDocument();
      expect(screen.getByText("TEST-2")).toBeInTheDocument();
    });

    it("should render field name when provided", () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText("status")).toBeInTheDocument();
    });

    it("should render all activity items", () => {
      render(<RecentActivity activities={mockActivities} />);

      // Each activity has the user name displayed
      const johnDoeElements = screen.getAllByText("John Doe");
      const janeSmithElements = screen.getAllByText("Jane Smith");
      const bobWilsonElements = screen.getAllByText("Bob Wilson");

      expect(johnDoeElements.length).toBeGreaterThanOrEqual(1);
      expect(janeSmithElements.length).toBeGreaterThanOrEqual(1);
      expect(bobWilsonElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Empty State", () => {
    it("should render an explicit empty state when activities is undefined", () => {
      render(<RecentActivity activities={undefined} />);

      expect(screen.getByText("No recent activity yet")).toBeInTheDocument();
    });

    it("should render an explicit empty state when activities is empty array", () => {
      render(<RecentActivity activities={[]} />);

      expect(
        screen.getByText(
          "New issue movement, status changes, and collaboration updates will land here.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Timeline", () => {
    it("should show timeline line when multiple activities", () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(
        screen.getByTestId(TEST_IDS.ANALYTICS.RECENT_ACTIVITY_TIMELINE_RAIL),
      ).toBeInTheDocument();
    });

    it("should not show timeline line for single activity", () => {
      render(<RecentActivity activities={[mockActivities[0]]} />);

      expect(
        screen.queryByTestId(TEST_IDS.ANALYTICS.RECENT_ACTIVITY_TIMELINE_RAIL),
      ).not.toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should render action text", () => {
      render(<RecentActivity activities={mockActivities} />);

      expect(screen.getByText(/created issue/)).toBeInTheDocument();
      expect(screen.getByText(/commented on/)).toBeInTheDocument();
    });
  });
});
