import { HOUR } from "@convex/lib/timeUtils";
import { describe, expect, it } from "vitest";
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
    it("should return null when activities is undefined", () => {
      const { container } = render(<RecentActivity activities={undefined} />);

      expect(container.firstChild).toBeNull();
    });

    it("should return null when activities is empty array", () => {
      const { container } = render(<RecentActivity activities={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Timeline", () => {
    it("should show timeline line when multiple activities", () => {
      const { container } = render(<RecentActivity activities={mockActivities} />);

      const timelineLine = container.querySelector(".absolute.left-4.top-4.bottom-4");
      expect(timelineLine).toBeInTheDocument();
    });

    it("should not show timeline line for single activity", () => {
      const { container } = render(<RecentActivity activities={[mockActivities[0]]} />);

      const timelineLine = container.querySelector(".absolute.left-4.top-4.bottom-4");
      expect(timelineLine).not.toBeInTheDocument();
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
