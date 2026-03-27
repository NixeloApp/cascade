import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useDebounce } from "@/hooks/useDebounce";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { DuplicateDetection } from "./DuplicateDetection";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: vi.fn(),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseDebounce = vi.mocked(useDebounce);

const projectId = "project_1" as Id<"projects">;

const similarIssues = [
  {
    _id: "issue_1" as Id<"issues">,
    key: "ABC-12",
    title: "Fix broken login redirect",
    type: "bug",
  },
  {
    _id: "issue_2" as Id<"issues">,
    key: "ABC-19",
    title: "Fix login redirect for mobile webview",
    type: "bug",
  },
];

describe("DuplicateDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDebounce.mockImplementation((value) => value);
    mockUseAuthenticatedQuery.mockReturnValue(undefined);
  });

  it("skips the similarity query when the debounced title is too short", () => {
    render(<DuplicateDetection title="ab" projectId={projectId} />);

    expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(api.issues.findSimilarIssues, "skip");
    expect(screen.queryByText("Potential duplicates found")).not.toBeInTheDocument();
  });

  it("renders nothing when there are no similar issues", () => {
    mockUseAuthenticatedQuery.mockReturnValue([]);

    render(<DuplicateDetection title="login redirect" projectId={projectId} />);

    expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(api.issues.findSimilarIssues, {
      query: "login redirect",
      projectId,
      limit: 5,
    });
    expect(screen.queryByText("Potential duplicates found")).not.toBeInTheDocument();
  });

  it("renders similar issues and notifies when one is clicked", async () => {
    const user = userEvent.setup();
    const onIssueClick = vi.fn();
    mockUseAuthenticatedQuery.mockReturnValue(similarIssues);

    render(
      <DuplicateDetection
        title="login redirect"
        projectId={projectId}
        onIssueClick={onIssueClick}
      />,
    );

    expect(screen.getByText("Potential duplicates found")).toBeInTheDocument();
    expect(screen.getByText("ABC-12")).toBeInTheDocument();
    expect(screen.getByText("Fix broken login redirect")).toBeInTheDocument();
    expect(screen.getByText("ABC-19")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ISSUE.CREATE_DUPLICATE_ITEM("ABC-12"))).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ISSUE.CREATE_DUPLICATE_ITEM("ABC-19"))).toBeInTheDocument();
    expect(
      screen.getByText("Click an issue to view it, or continue creating a new one"),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId(TEST_IDS.ISSUE.CREATE_DUPLICATE_ITEM("ABC-19")));

    expect(onIssueClick).toHaveBeenCalledWith("issue_2");
  });
});
