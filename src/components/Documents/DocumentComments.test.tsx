import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { DocumentComments } from "./DocumentComments";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const mockAddComment = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;

const documentId = "document_1" as Id<"documents">;

const comments = [
  {
    _id: "comment_1" as Id<"documentComments">,
    _creationTime: 1_000,
    updatedAt: 1_000,
    authorName: "Avery Stone",
    authorImage: "https://example.com/avery.png",
    content: "Looks good to me.",
  },
  {
    _id: "comment_2" as Id<"documentComments">,
    _creationTime: 2_000,
    updatedAt: 3_000,
    authorName: "",
    authorImage: undefined,
    content: "Please clarify the API edge case.",
  },
];

describe("DocumentComments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedQuery.mockReturnValue(comments);
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockAddComment,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("renders a loading state while comments are unresolved", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<DocumentComments documentId={documentId} />);

    expect(screen.getByText("Loading comments...")).toBeInTheDocument();
  });

  it("renders the empty state when no comments exist", () => {
    mockUseAuthenticatedQuery.mockReturnValue([]);

    render(<DocumentComments documentId={documentId} />);

    expect(screen.getByText("No comments yet")).toBeInTheDocument();
    expect(screen.getByText("Be the first to comment on this document")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Comment" })).toBeDisabled();
  });

  it("renders existing comments including edited and unknown-author states", () => {
    render(<DocumentComments documentId={documentId} />);

    expect(screen.getByText("Avery Stone")).toBeInTheDocument();
    expect(screen.getByText("Looks good to me.")).toBeInTheDocument();
    expect(screen.getByText("Unknown User")).toBeInTheDocument();
    expect(screen.getByText("Please clarify the API edge case.")).toBeInTheDocument();
    expect(screen.getByText("(edited)")).toBeInTheDocument();
  });

  it("submits a trimmed comment and clears the composer on success", async () => {
    const user = userEvent.setup();
    mockAddComment.mockResolvedValue(undefined);

    render(<DocumentComments documentId={documentId} />);

    const composer = screen.getByPlaceholderText("Add a comment...");
    await user.type(composer, "  Ship it after QA signoff.  ");
    await user.click(screen.getByRole("button", { name: "Add Comment" }));

    await waitFor(() =>
      expect(mockAddComment).toHaveBeenCalledWith({
        documentId,
        content: "Ship it after QA signoff.",
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Comment added");
    expect(composer).toHaveValue("");
  });

  it("shows an error and preserves input when submission fails", async () => {
    const user = userEvent.setup();
    const error = new Error("network down");
    mockAddComment.mockRejectedValue(error);

    render(<DocumentComments documentId={documentId} />);

    const composer = screen.getByPlaceholderText("Add a comment...");
    await user.type(composer, "Need another review");
    await user.click(screen.getByRole("button", { name: "Add Comment" }));

    await waitFor(() => expect(mockShowError).toHaveBeenCalledWith(error, "Failed to add comment"));

    expect(mockShowSuccess).not.toHaveBeenCalled();
    expect(composer).toHaveValue("Need another review");
  });
});
