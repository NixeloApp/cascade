import type { Id } from "@convex/_generated/dataModel";
import type { LabelInfo } from "@convex/lib/issueHelpers";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useOfflineIssueUpdateStatus } from "@/hooks/useOfflineIssueUpdateStatus";
import { useQueuedOfflineIssueStatus } from "@/hooks/useOfflineOptimisticState";
import { showError } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { IssueDetailSidebar } from "./IssueDetailSidebar";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOfflineIssueUpdateStatus", () => ({
  useOfflineIssueUpdateStatus: vi.fn(),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/useOfflineOptimisticState", () => ({
  useQueuedOfflineIssueStatus: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

vi.mock("./IssueMetadataSection", () => ({
  IssueMetadataSection: ({
    editable,
    members,
    workflowStates,
    labels,
    status,
    onStatusChange,
    onTypeChange,
    onPriorityChange,
    onAssigneeChange,
    onStoryPointsChange,
  }: {
    editable?: boolean;
    members?: Array<{ _id: Id<"users">; name: string }>;
    workflowStates?: Array<{ id: string; name: string; category: string }>;
    labels: LabelInfo[];
    onStatusChange?: (status: string) => Promise<void> | void;
    onTypeChange?: (type: IssueTypeWithSubtask) => Promise<void> | void;
    onPriorityChange?: (priority: IssuePriority) => Promise<void> | void;
    onAssigneeChange?: (assigneeId: Id<"users"> | null) => Promise<void> | void;
    onStoryPointsChange?: (storyPoints: number | null) => Promise<void> | void;
    status?: string;
  }) => (
    <div>
      <div>{`metadata:${editable ? "editable" : "read-only"}:${members?.length ?? 0}:${workflowStates?.length ?? 0}:${labels.length}:${status ?? "unknown"}`}</div>
      <button type="button" onClick={() => void onStatusChange?.("in_progress")}>
        Change Status
      </button>
      <button type="button" onClick={() => void onTypeChange?.("task")}>
        Change Type
      </button>
      <button type="button" onClick={() => void onPriorityChange?.("low")}>
        Change Priority
      </button>
      <button type="button" onClick={() => void onAssigneeChange?.("user_2" as Id<"users">)}>
        Change Assignee
      </button>
      <button type="button" onClick={() => void onStoryPointsChange?.(8)}>
        Change Story Points
      </button>
    </div>
  ),
}));

vi.mock("@/components/TimeTracker", () => ({
  TimeTracker: ({
    issueId,
    projectId,
    estimatedHours,
    billingEnabled,
  }: {
    issueId: Id<"issues">;
    projectId: Id<"projects">;
    estimatedHours?: number;
    billingEnabled?: boolean;
  }) => (
    <div>{`time:${issueId}:${projectId}:${estimatedHours ?? 0}:${billingEnabled ? "billing" : "no-billing"}`}</div>
  ),
}));

vi.mock("@/components/FileAttachments", () => ({
  FileAttachments: ({ issueId }: { issueId: Id<"issues"> }) => (
    <div>{`attachments:${issueId}`}</div>
  ),
}));

vi.mock("@/components/IssueWatchers", () => ({
  IssueWatchers: ({ issueId }: { issueId: Id<"issues"> }) => <div>{`watchers:${issueId}`}</div>,
}));

vi.mock("@/components/IssueDependencies", () => ({
  IssueDependencies: ({ issueId }: { issueId: Id<"issues"> }) => (
    <div>{`dependencies:${issueId}`}</div>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseCurrentUser = vi.mocked(useCurrentUser);
const mockUseQueuedOfflineIssueStatus = vi.mocked(useQueuedOfflineIssueStatus);
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

const updateIssue = vi.fn<MutationProcedure>();
const updateStatus = vi.fn<ReturnType<typeof useOfflineIssueUpdateStatus>["updateStatus"]>();

const defaultProps = {
  issueId: "issue_1" as Id<"issues">,
  projectId: "project_1" as Id<"projects">,
  status: "todo",
  type: "bug" as IssueTypeWithSubtask,
  priority: "high" as IssuePriority,
  assignee: { _id: "user_1" as Id<"users">, name: "Alex" },
  reporter: { _id: "user_3" as Id<"users">, name: "Taylor" },
  storyPoints: 5,
  labels: [{ name: "backend", color: "#123456" }],
  estimatedHours: 13,
  billingEnabled: true,
};

const project = {
  members: [
    { _id: "user_1" as Id<"users">, name: "Alex" },
    { _id: "user_2" as Id<"users">, name: "Morgan" },
  ],
  workflowStates: [
    { id: "todo", name: "To Do", category: "backlog" },
    { id: "in_progress", name: "In Progress", category: "active" },
  ],
};

describe("IssueDetailSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateIssue.mockResolvedValue(undefined);
    updateStatus.mockResolvedValue({ queued: false });
    mockUseAuthenticatedQuery.mockReturnValue(project);
    mockUseCurrentUser.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: true,
    });
    mockUseQueuedOfflineIssueStatus.mockReturnValue(null);
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(updateIssue),
      canAct: true,
      isAuthLoading: false,
    });
    vi.mocked(useOfflineIssueUpdateStatus).mockReturnValue({
      updateStatus,
      isOnline: true,
      isLoading: false,
    });
  });

  it("renders each sidebar section and forwards editable project data to child surfaces", () => {
    render(<IssueDetailSidebar {...defaultProps} />);

    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getByText("Time Tracking")).toBeInTheDocument();
    expect(screen.getByText("Attachments")).toBeInTheDocument();
    expect(screen.getByText("Watchers")).toBeInTheDocument();
    expect(screen.getByText("Dependencies")).toBeInTheDocument();

    expect(screen.getByText("metadata:editable:2:2:1:todo")).toBeInTheDocument();
    expect(screen.getByText("time:issue_1:project_1:13:billing")).toBeInTheDocument();
    expect(screen.getByText("attachments:issue_1")).toBeInTheDocument();
    expect(screen.getByText("watchers:issue_1")).toBeInTheDocument();
    expect(screen.getByText("dependencies:issue_1")).toBeInTheDocument();
  });

  it("passes a read-only metadata state when editing is disabled", () => {
    render(<IssueDetailSidebar {...defaultProps} canEdit={false} />);

    expect(screen.getByText("metadata:read-only:2:2:1:todo")).toBeInTheDocument();
  });

  it("prefers the queued offline status while replay is pending", () => {
    mockUseQueuedOfflineIssueStatus.mockReturnValue("in_progress");

    render(<IssueDetailSidebar {...defaultProps} />);

    expect(screen.getByText("metadata:editable:2:2:1:in_progress")).toBeInTheDocument();
  });

  it("wires metadata edits to the correct mutations", async () => {
    const user = userEvent.setup();

    render(<IssueDetailSidebar {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Change Status" }));
    await user.click(screen.getByRole("button", { name: "Change Type" }));
    await user.click(screen.getByRole("button", { name: "Change Priority" }));
    await user.click(screen.getByRole("button", { name: "Change Assignee" }));
    await user.click(screen.getByRole("button", { name: "Change Story Points" }));

    await waitFor(() => expect(updateStatus).toHaveBeenCalledWith("issue_1", "in_progress", 0));
    expect(updateIssue).toHaveBeenNthCalledWith(1, {
      issueId: "issue_1",
      type: "task",
    });
    expect(updateIssue).toHaveBeenNthCalledWith(2, {
      issueId: "issue_1",
      priority: "low",
    });
    expect(updateIssue).toHaveBeenNthCalledWith(3, {
      issueId: "issue_1",
      assigneeId: "user_2",
    });
    expect(updateIssue).toHaveBeenNthCalledWith(4, {
      issueId: "issue_1",
      storyPoints: 8,
    });
  });

  it("surfaces status and issue update errors through the shared toast handler", async () => {
    const user = userEvent.setup();
    const statusError = new Error("status failed");
    const typeError = new Error("type failed");

    updateStatus.mockRejectedValueOnce(statusError);
    updateIssue.mockRejectedValueOnce(typeError);

    render(<IssueDetailSidebar {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Change Status" }));
    await user.click(screen.getByRole("button", { name: "Change Type" }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(statusError, "Failed to update status"),
    );
    expect(mockShowError).toHaveBeenCalledWith(typeError, "Failed to update type");
  });
});
