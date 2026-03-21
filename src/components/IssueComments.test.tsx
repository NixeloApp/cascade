import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen } from "@/test/custom-render";
import { IssueComments } from "./IssueComments";

vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/formatting", () => ({
  formatRelativeTime: vi.fn((timestamp: number) => `relative-${timestamp}`),
}));

vi.mock("./CommentRenderer", () => ({
  CommentRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock("./CommentReactions", () => ({
  CommentReactions: ({ reactions }: { reactions: { emoji: string }[] }) => (
    <div>reactions:{reactions.length}</div>
  ),
}));

vi.mock("./MentionInput", () => ({
  MentionInput: ({
    value,
    onMentionsChange,
    placeholder,
  }: {
    value: string;
    onMentionsChange: (mentions: Id<"users">[]) => void;
    placeholder?: string;
  }) => (
    <div>
      <textarea aria-label="Comment Input" placeholder={placeholder} value={value} readOnly />
      <button type="button" onClick={() => onMentionsChange([])}>
        Populate Comment
      </button>
    </div>
  ),
}));

const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const addComment = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const generateUploadUrl = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const attachToIssue = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const removeAttachment = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const loadMore = vi.fn();

const issueId = "issue_1" as Id<"issues">;
const projectId = "project_1" as Id<"projects">;

describe("IssueComments", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuthenticatedQuery.mockReturnValue({ _id: "user_current" as Id<"users"> });

    let mutationIndex = 0;
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const mutations = [
        { mutate: addComment, canAct: true, isAuthLoading: false },
        { mutate: generateUploadUrl, canAct: true, isAuthLoading: false },
        { mutate: attachToIssue, canAct: true, isAuthLoading: false },
        { mutate: removeAttachment, canAct: true, isAuthLoading: false },
      ];

      return mutations[mutationIndex++] ?? { mutate: vi.fn(), canAct: true, isAuthLoading: false };
    });
  });

  it("shows the loading state while the first page is loading", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      isLoading: true,
      loadMore,
    });

    render(<IssueComments issueId={issueId} projectId={projectId} />);

    expect(screen.getByText("Loading comments...")).toBeInTheDocument();
  });

  it("shows the empty state when there are no comments", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });

    render(<IssueComments issueId={issueId} projectId={projectId} />);

    expect(screen.getByText("No conversation yet")).toBeInTheDocument();
    expect(
      screen.getByText("Use comments to capture decisions, blockers, and handoff notes."),
    ).toBeInTheDocument();
  });

  it("renders comments and supports loading more results", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        {
          _id: "comment_1" as Id<"issueComments">,
          _creationTime: 1000,
          updatedAt: 2000,
          content: "Existing comment",
          author: { name: "Alex Writer", image: null },
          attachments: [],
          reactions: [{ emoji: "👍", userIds: ["user_current" as Id<"users">] }],
        },
      ],
      status: "CanLoadMore",
      isLoading: false,
      loadMore,
    });

    render(<IssueComments issueId={issueId} projectId={projectId} />);

    expect(screen.getByText("Alex Writer")).toBeInTheDocument();
    expect(screen.getByText("Existing comment")).toBeInTheDocument();
    expect(screen.getByText("relative-1000")).toBeInTheDocument();
    expect(screen.getByText("(edited)")).toBeInTheDocument();
    expect(screen.getByText("reactions:1")).toBeInTheDocument();
    screen.getByRole("button", { name: "Add Comment" });
    screen.getByLabelText("Comment Input");
    screen.getByRole("button", { name: "Populate Comment" });

    screen.getByRole("button", { name: "Load More Comments" }).click();
    expect(loadMore).toHaveBeenCalledWith(50);
  });
});
