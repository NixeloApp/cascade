import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { IssueWatchers } from "./IssueWatchers";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => <div>{`avatar:${name}`}</div>,
}));

vi.mock("./ui/Button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("./ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

type MutationProcedure = (
  ...args: Parameters<ReturnType<typeof useAuthenticatedMutation>["mutate"]>
) => ReturnType<ReturnType<typeof useAuthenticatedMutation>["mutate"]>;

function createMutationMock(
  mockProcedure: Mock<MutationProcedure>,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = ((...args: Parameters<typeof mockProcedure>) =>
    mockProcedure(...args)) as ReactMutation<FunctionReference<"mutation">>;
  mutation.withOptimisticUpdate = () => mutation;
  return mutation;
}

const watch = vi.fn<MutationProcedure>();
const unwatch = vi.fn<MutationProcedure>();

const watchers = [
  {
    _id: "watcher_1",
    userName: "Alex",
    userEmail: "alex@example.com",
  },
  {
    _id: "watcher_2",
    userName: "Morgan",
  },
];

describe("IssueWatchers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    watch.mockResolvedValue(undefined);
    unwatch.mockResolvedValue(undefined);
    mockUseAuthenticatedQuery.mockReturnValueOnce(watchers).mockReturnValueOnce(false);
    mockUseAuthenticatedMutation
      .mockReturnValueOnce({
        mutate: createMutationMock(watch),
        canAct: true,
        isAuthLoading: false,
      })
      .mockReturnValueOnce({
        mutate: createMutationMock(unwatch),
        canAct: true,
        isAuthLoading: false,
      });
  });

  it("renders the populated watcher list and starts watching when the user is not watching yet", async () => {
    const user = userEvent.setup();

    render(<IssueWatchers issueId={"issue_1" as Id<"issues">} />);

    expect(screen.getByRole("button", { name: /watch/i })).toBeInTheDocument();
    expect(screen.getByText("2 watchers")).toBeInTheDocument();
    expect(screen.getByText("avatar:Alex")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("avatar:Morgan")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /watch/i }));

    await waitFor(() => expect(watch).toHaveBeenCalledWith({ issueId: "issue_1" }));
    expect(mockShowSuccess).toHaveBeenCalledWith("Now watching this issue");
  });

  it("renders the empty state and stops watching when the user is already watching", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReset();
    mockUseAuthenticatedQuery.mockReturnValueOnce([]).mockReturnValueOnce(true);

    render(<IssueWatchers issueId={"issue_2" as Id<"issues">} />);

    expect(screen.getByRole("button", { name: /watching/i })).toBeInTheDocument();
    expect(screen.getByText("No watchers yet")).toBeInTheDocument();
    expect(
      screen.getByText("Followers will appear here when people subscribe to this issue."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /watching/i }));

    await waitFor(() => expect(unwatch).toHaveBeenCalledWith({ issueId: "issue_2" }));
    expect(mockShowSuccess).toHaveBeenCalledWith("Stopped watching this issue");
  });

  it("surfaces watch-toggle failures through the shared error toast", async () => {
    const user = userEvent.setup();
    const error = new Error("watch failed");
    watch.mockRejectedValueOnce(error);

    render(<IssueWatchers issueId={"issue_3" as Id<"issues">} />);

    await user.click(screen.getByRole("button", { name: /watch/i }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to update watch status"),
    );
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });
});
