import { DAY, HOUR } from "@convex/lib/timeUtils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { RecentActivity } from "./RecentActivity";

const fixedNow = new Date(2026, 2, 14, 10, 0, 0);

const activities = [
  {
    _id: "activity_1",
    userName: "Taylor Rivera",
    action: "closed onboarding gaps",
    issueKey: "APP-42",
    projectName: "App Shell",
    _creationTime: fixedNow.getTime() - HOUR,
  },
  {
    _id: "activity_2",
    userName: "Avery Stone",
    action: "updated dashboard visuals",
    issueKey: "WEB-12",
    projectName: "Marketing Site",
    _creationTime: fixedNow.getTime() - 2 * DAY,
  },
];

describe("RecentActivity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders loading skeletons while activity is unresolved", () => {
    const { container } = render(<RecentActivity activities={undefined} />);

    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    expect(screen.getByText("Latest updates across projects and teammates")).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-shimmer")).toHaveLength(6);
  });

  it("renders the empty state when there is no recent activity", () => {
    render(<RecentActivity activities={[]} />);

    expect(screen.getByText("No activity")).toBeInTheDocument();
    expect(screen.getByText("Fresh updates from your team will appear here.")).toBeInTheDocument();
  });

  it("renders the activity timeline with metadata and timeline rail", () => {
    const { container } = render(<RecentActivity activities={activities} />);

    expect(screen.getByText("Taylor Rivera")).toBeInTheDocument();
    expect(screen.getByText(/closed onboarding gaps/)).toBeInTheDocument();
    expect(screen.getByText("APP-42")).toBeInTheDocument();
    expect(screen.getByText("App Shell")).toBeInTheDocument();
    expect(screen.getByText("Avery Stone")).toBeInTheDocument();
    expect(screen.getByText(/updated dashboard visuals/)).toBeInTheDocument();
    expect(screen.getByText("WEB-12")).toBeInTheDocument();
    expect(screen.getByText("Marketing Site")).toBeInTheDocument();
    expect(screen.getAllByText("|")).toHaveLength(2);
    expect(screen.getAllByText("Mar 14")).toHaveLength(1);
    expect(screen.getAllByText("Mar 12")).toHaveLength(1);

    const timelineRail = container.querySelector(".absolute.bottom-4.left-4.top-4.w-px");
    expect(timelineRail).toBeInTheDocument();
  });

  it("omits the timeline rail when there is only one activity", () => {
    const { container } = render(<RecentActivity activities={[activities[0]]} />);

    const timelineRail = container.querySelector(".absolute.bottom-4.left-4.top-4.w-px");
    expect(timelineRail).not.toBeInTheDocument();
  });
});
