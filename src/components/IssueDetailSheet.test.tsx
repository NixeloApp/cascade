import type { Id } from "@convex/_generated/dataModel";
import type { EnrichedIssue } from "@convex/lib/issueHelpers";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { IssueDetailLayout, useIssueDetail } from "./IssueDetail";
import { IssueDetailSheet } from "./IssueDetailSheet";

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("./IssueDetail", () => ({
  IssueDetailLayout: vi.fn(
    ({ billingEnabled, canEdit }: { billingEnabled: boolean; canEdit?: boolean }) => (
      <div>{`layout:${billingEnabled ? "billing" : "no-billing"}:${canEdit ? "editable" : "read-only"}`}</div>
    ),
  ),
  useIssueDetail: vi.fn(),
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children, "aria-busy": ariaBusy }: { children: ReactNode; "aria-busy"?: boolean }) => (
    <div aria-busy={ariaBusy}>{children}</div>
  ),
}));

vi.mock("./ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Button", () => ({
  Button: ({
    children,
    onClick,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
  }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock("./ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Icon", () => ({
  Icon: () => <div>type-icon</div>,
}));

vi.mock("./ui/Sheet", () => ({
  Sheet: ({
    children,
    title,
    description,
    header,
    "data-testid": testId,
  }: {
    children: ReactNode;
    title: string;
    description: string;
    header?: ReactNode;
    "data-testid"?: string;
  }) => (
    <div data-testid={testId}>
      <div>{title}</div>
      <div>{description}</div>
      {header}
      {children}
    </div>
  ),
}));

vi.mock("./ui/Skeleton", () => ({
  Skeleton: () => <div>loading-skeleton</div>,
  SkeletonText: () => <div>loading-skeleton-text</div>,
}));

vi.mock("./ui/Tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ children, content }: { children: ReactNode; content: string }) => (
    <div>
      <div>{content}</div>
      {children}
    </div>
  ),
}));

vi.mock("./ui/Typography", () => ({
  Typography: ({
    children,
    "data-testid": testId,
  }: {
    children: ReactNode;
    "data-testid"?: string;
  }) => <div data-testid={testId}>{children}</div>,
}));

const mockUseOrganization = vi.mocked(useOrganization);
const mockUseIssueDetail = vi.mocked(useIssueDetail);
const mockIssueDetailLayout = vi.mocked(IssueDetailLayout);

const handleCopyKey = vi.fn();
const handleEdit = vi.fn();
const handleSave = vi.fn(async () => {});
const handleCancelEdit = vi.fn();
const setTitle = vi.fn();
const setDescription = vi.fn();

const issue: EnrichedIssue & {
  project: {
    _id: Id<"projects">;
    _creationTime: number;
    organizationId: Id<"organizations">;
    workspaceId: Id<"workspaces">;
    teamId?: Id<"teams">;
    ownerId: Id<"users">;
    createdBy: Id<"users">;
    updatedAt: number;
    name: string;
    key: string;
    description: string;
    boardType: string;
    workflowStates: Array<{
      id: string;
      name: string;
      order: number;
      category: "todo" | "inprogress" | "done";
      wipLimit?: number;
    }>;
    nextIssueNumber: number;
    isPublic?: boolean;
    sharedWithTeamIds?: Id<"teams">[];
    defaultHourlyRate?: number;
    clientName?: string;
    budget?: number;
    isDeleted?: boolean;
    deletedAt?: number;
    deletedBy?: Id<"users">;
  };
} = {
  _id: "issue_1" as Id<"issues">,
  _creationTime: 1,
  organizationId: "org_1" as Id<"organizations">,
  workspaceId: "workspace_1" as Id<"workspaces">,
  projectId: "project_1" as Id<"projects">,
  reporterId: "user_1" as Id<"users">,
  assigneeId: undefined,
  epicId: undefined,
  key: "PROJ-12",
  title: "Broken issue detail sheet",
  description: "Stored description",
  type: "bug",
  priority: "high",
  status: "todo",
  labels: [],
  linkedDocuments: [],
  attachments: [],
  epic: null,
  assignee: null,
  reporter: null,
  order: 0,
  updatedAt: 1,
  storyPoints: 3,
  estimatedHours: 5,
  loggedHours: 0,
  project: {
    _id: "project_1" as Id<"projects">,
    _creationTime: 1,
    organizationId: "org_1" as Id<"organizations">,
    workspaceId: "workspace_1" as Id<"workspaces">,
    teamId: undefined,
    ownerId: "user_1" as Id<"users">,
    createdBy: "user_1" as Id<"users">,
    updatedAt: 1,
    name: "Project One",
    key: "PROJ",
    description: "Project description",
    boardType: "kanban",
    workflowStates: [],
    nextIssueNumber: 0,
    isPublic: false,
    sharedWithTeamIds: [],
    defaultHourlyRate: undefined,
    clientName: undefined,
    budget: undefined,
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
  },
};

const detailWithIssue = {
  issue,
  subtasks: [],
  isEditing: false,
  title: "Broken issue detail sheet",
  setTitle,
  description: "Stored description",
  setDescription,
  hasCopied: false,
  handleSave,
  handleCopyKey,
  handleEdit,
  handleCancelEdit,
} as ReturnType<typeof useIssueDetail>;

describe("IssueDetailSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrganization.mockReturnValue({
      organizationId: "org_1" as Id<"organizations">,
      orgSlug: "acme",
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });
    mockUseIssueDetail.mockReturnValue(detailWithIssue);
  });

  it("renders the loading sheet when the issue has not loaded yet", () => {
    mockUseIssueDetail.mockReturnValue({
      ...detailWithIssue,
      issue: undefined,
    } as ReturnType<typeof useIssueDetail>);

    render(
      <IssueDetailSheet issueId={"issue_1" as Id<"issues">} open={true} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByText("Loading issue details")).toBeInTheDocument();
    expect(screen.getByText("Loading content...")).toBeInTheDocument();
    expect(screen.getByText("loading-skeleton")).toBeInTheDocument();
    expect(screen.getByText("loading-skeleton-text")).toBeInTheDocument();
    expect(mockIssueDetailLayout).not.toHaveBeenCalled();
  });

  it("renders the populated sheet header, wires copy and edit, and forwards layout props", async () => {
    const user = userEvent.setup();

    render(
      <IssueDetailSheet issueId={"issue_1" as Id<"issues">} open={true} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByTestId(TEST_IDS.ISSUE.DETAIL_MODAL)).toBeInTheDocument();
    expect(screen.getByText("PROJ-12 - View and edit issue details")).toBeInTheDocument();
    expect(screen.getAllByText("Broken issue detail sheet")).toHaveLength(2);
    expect(screen.getByTestId(TEST_IDS.ISSUE.DETAIL_KEY)).toHaveTextContent("PROJ-12");
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("Copy issue key")).toBeInTheDocument();
    expect(screen.getByText("layout:billing:editable")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy issue key" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(handleCopyKey).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(mockIssueDetailLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: detailWithIssue,
        billingEnabled: true,
        canEdit: true,
      }),
      undefined,
    );
  });

  it("hides the edit button when editing is already active or editing is disabled", () => {
    mockUseIssueDetail.mockReturnValue({
      ...detailWithIssue,
      isEditing: true,
      hasCopied: true,
    } as ReturnType<typeof useIssueDetail>);

    const { rerender } = render(
      <IssueDetailSheet issueId={"issue_1" as Id<"issues">} open={true} onOpenChange={vi.fn()} />,
    );

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByText("Copied!")).toBeInTheDocument();

    rerender(
      <IssueDetailSheet
        issueId={"issue_1" as Id<"issues">}
        open={true}
        onOpenChange={vi.fn()}
        canEdit={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByText("layout:billing:read-only")).toBeInTheDocument();
  });
});
