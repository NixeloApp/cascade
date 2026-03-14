import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import type { EnrichedIssue } from "../../../convex/lib/issueHelpers";
import { IssueDetailLayout } from "./IssueDetailLayout";
import type { useIssueDetail } from "./useIssueDetail";

vi.mock("./IssueDetailContent", () => ({
  IssueDetailContent: ({
    issueId,
    projectId,
    issueTitle,
    issueDescription,
    issueType,
    isEditing,
    editTitle,
    editDescription,
    subtasks,
  }: {
    issueId: Id<"issues">;
    projectId: Id<"projects">;
    issueTitle: string;
    issueDescription?: string;
    issueType: string;
    isEditing: boolean;
    editTitle: string;
    editDescription: string;
    subtasks: unknown[] | undefined;
  }) => (
    <div>
      {`content:${issueId}:${projectId}:${issueTitle}:${issueDescription ?? ""}:${issueType}:${isEditing ? "editing" : "view"}:${editTitle}:${editDescription}:${subtasks?.length ?? 0}`}
    </div>
  ),
}));

vi.mock("./IssueDetailSidebar", () => ({
  IssueDetailSidebar: ({
    issueId,
    projectId,
    status,
    type,
    priority,
    billingEnabled,
    canEdit,
  }: {
    issueId: Id<"issues">;
    projectId: Id<"projects">;
    status: string;
    type: string;
    priority: string;
    billingEnabled: boolean;
    canEdit: boolean;
  }) => (
    <div>{`sidebar:${issueId}:${projectId}:${status}:${type}:${priority}:${billingEnabled ? "billing" : "no-billing"}:${canEdit ? "editable" : "read-only"}`}</div>
  ),
}));

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
    workflowStates: unknown[];
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
  key: "PROJ-1",
  title: "Broken export flow",
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
  storyPoints: 5,
  estimatedHours: 8,
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

const subtask = {
  _id: "subtask_1" as Id<"issues">,
  _creationTime: 1,
  organizationId: "org_1" as Id<"organizations">,
  workspaceId: "workspace_1" as Id<"workspaces">,
  teamId: undefined,
  projectId: "project_1" as Id<"projects">,
  reporterId: "user_1" as Id<"users">,
  assigneeId: undefined,
  epicId: undefined,
  parentId: "issue_1" as Id<"issues">,
  key: "PROJ-2",
  title: "Child task",
  description: "Child description",
  type: "subtask",
  priority: "high",
  status: "todo",
  updatedAt: 1,
  startDate: undefined,
  dueDate: undefined,
  estimatedHours: 2,
  loggedHours: 0,
  storyPoints: 1,
  labels: [],
  sprintId: undefined,
  linkedDocuments: [],
  attachments: [],
  order: 1,
  version: undefined,
  embedding: undefined,
  searchContent: undefined,
  archivedAt: undefined,
  archivedBy: undefined,
  isDeleted: false,
  deletedAt: undefined,
  deletedBy: undefined,
  assignee: null,
  reporter: null,
  epic: null,
};

const detailWithIssue = {
  issue,
  subtasks: [subtask],
  isEditing: true,
  title: "Draft title",
  setTitle: () => {},
  description: "Draft description",
  setDescription: () => {},
  hasCopied: false,
  handleSave: () => Promise.resolve(),
  handleEdit: () => {},
  handleCancelEdit: () => {},
  handleCopyKey: () => {},
} as ReturnType<typeof useIssueDetail>;

describe("IssueDetailLayout", () => {
  it("returns null when the issue is unavailable", () => {
    const detailWithoutIssue = {
      ...detailWithIssue,
      issue: undefined,
    } as ReturnType<typeof useIssueDetail>;

    const { container } = render(
      <IssueDetailLayout detail={detailWithoutIssue} billingEnabled={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the header and forwards content/sidebar props with default editable state", () => {
    render(
      <IssueDetailLayout
        detail={detailWithIssue}
        billingEnabled={true}
        header={<div>Header content</div>}
      />,
    );

    expect(screen.getByText("Header content")).toBeInTheDocument();
    expect(
      screen.getByText(
        "content:issue_1:project_1:Broken export flow:Stored description:bug:editing:Draft title:Draft description:1",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("sidebar:issue_1:project_1:todo:bug:high:billing:editable"),
    ).toBeInTheDocument();
  });

  it("passes an explicit read-only canEdit override to the sidebar", () => {
    render(<IssueDetailLayout detail={detailWithIssue} billingEnabled={false} canEdit={false} />);

    expect(
      screen.getByText("sidebar:issue_1:project_1:todo:bug:high:no-billing:read-only"),
    ).toBeInTheDocument();
  });
});
