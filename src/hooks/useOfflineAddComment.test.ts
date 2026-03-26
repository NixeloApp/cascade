import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queueAddComment } from "@/lib/offlineComments";
import { showInfo } from "@/lib/toast";
import { renderHook } from "@/test/custom-render";
import { useAuthenticatedMutation } from "./useConvexHelpers";
import { useCurrentUser } from "./useCurrentUser";
import { useOnlineStatus } from "./useOffline";
import { useOfflineAddComment } from "./useOfflineAddComment";

vi.mock("./useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("./useOffline", () => ({
  useOnlineStatus: vi.fn(),
}));

vi.mock("./useCurrentUser", () => ({
  useCurrentUser: vi.fn(() => ({
    user: { _id: "test-user-id" },
    isLoading: false,
    isAuthenticated: true,
  })),
}));

vi.mock("@/lib/offlineComments", () => ({
  createCommentClientRequestId: vi.fn(() => "comment-request-123"),
  queueAddComment: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showInfo: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseOnlineStatus = vi.mocked(useOnlineStatus);
const mockQueueAddComment = vi.mocked(queueAddComment);

function createMutationMock(): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign(
    vi.fn((..._args: unknown[]) => Promise.resolve({ commentId: "comment-new" })),
    { withOptimisticUpdate: () => mutation },
  ) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

describe("useOfflineAddComment", () => {
  let mockMutation: ReactMutation<FunctionReference<"mutation">>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutation = createMutationMock();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockMutation,
      canAct: true,
      isAuthLoading: false,
    });
    mockUseOnlineStatus.mockReturnValue(true);
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  it("calls the live mutation when online", async () => {
    const { result } = renderHook(() => useOfflineAddComment());
    let response: Awaited<ReturnType<typeof result.current.addComment>> | undefined;

    await act(async () => {
      response = await result.current.addComment("issue-123" as Id<"issues">, "Great work!");
    });

    expect(response).toEqual({ queued: false, commentId: "comment-new" });
    expect(mockMutation).toHaveBeenCalledWith({
      issueId: "issue-123",
      content: "Great work!",
      mentions: undefined,
      attachments: undefined,
      clientRequestId: "comment-request-123",
    });
    expect(mockQueueAddComment).not.toHaveBeenCalled();
  });

  it("queues the comment when offline and shows toast", async () => {
    mockUseOnlineStatus.mockReturnValue(false);
    mockQueueAddComment.mockResolvedValue(1);

    const { result } = renderHook(() => useOfflineAddComment());
    let response: Awaited<ReturnType<typeof result.current.addComment>> | undefined;

    await act(async () => {
      response = await result.current.addComment("issue-456" as Id<"issues">, "Will fix this");
    });

    expect(response).toEqual({ queued: true });
    expect(mockQueueAddComment).toHaveBeenCalledWith(
      {
        issueId: "issue-456",
        content: "Will fix this",
        mentions: undefined,
        attachments: undefined,
        clientRequestId: "comment-request-123",
      },
      "test-user-id",
    );
    expect(vi.mocked(showInfo)).toHaveBeenCalledWith(
      "Comment queued — will post when you reconnect",
    );
  });

  it("queues the same client request ID when a live submit drops offline mid-request", async () => {
    const attachmentIds = ["storage-123" as Id<"_storage">];
    mockMutation = Object.assign(
      vi.fn(() => Promise.reject(new Error("Network dropped during submit"))),
      { withOptimisticUpdate: () => mockMutation },
    ) as ReactMutation<FunctionReference<"mutation">>;
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockMutation,
      canAct: true,
      isAuthLoading: false,
    });
    mockQueueAddComment.mockResolvedValue(2);
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineAddComment());
    let response: Awaited<ReturnType<typeof result.current.addComment>> | undefined;

    await act(async () => {
      response = await result.current.addComment(
        "issue-987" as Id<"issues">,
        "Retry me",
        undefined,
        attachmentIds,
      );
    });

    expect(response).toEqual({ queued: true });
    expect(mockMutation).toHaveBeenCalledWith({
      issueId: "issue-987",
      content: "Retry me",
      mentions: undefined,
      attachments: attachmentIds,
      clientRequestId: "comment-request-123",
    });
    expect(mockQueueAddComment).toHaveBeenCalledWith(
      {
        issueId: "issue-987",
        content: "Retry me",
        mentions: undefined,
        attachments: attachmentIds,
        clientRequestId: "comment-request-123",
      },
      "test-user-id",
    );
  });

  it("throws when offline without authenticated user", async () => {
    mockUseOnlineStatus.mockReturnValue(false);
    vi.mocked(useCurrentUser).mockReturnValue({
      user: undefined,
      isLoading: false,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => useOfflineAddComment());
    await expect(result.current.addComment("issue-789" as Id<"issues">, "Hello")).rejects.toThrow(
      "Cannot queue offline mutation without an authenticated user",
    );
  });
});
