import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { fireEvent, render, screen } from "@/test/custom-render";
import { IssueDetailContent } from "./IssueDetailContent";

vi.mock("@/components/IssueComments", () => ({
  IssueComments: ({ issueId, projectId }: { issueId: Id<"issues">; projectId: Id<"projects"> }) => (
    <div>{`comments:${issueId}:${projectId}`}</div>
  ),
}));

vi.mock("@/components/IssueDescriptionEditor", () => ({
  IssueDescriptionEditor: ({
    value,
    onChange,
    placeholder,
    testId,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    testId?: string;
  }) => (
    <textarea
      data-testid={testId}
      aria-label="Issue Description Editor"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
  IssueDescriptionReadOnly: ({ value, testId }: { value?: string; testId?: string }) => (
    <div data-testid={testId}>{value}</div>
  ),
}));

vi.mock("@/components/IssueDetail/SubtasksList", () => ({
  SubtasksList: ({
    issueId,
    projectId,
    subtasks,
  }: {
    issueId: Id<"issues">;
    projectId: Id<"projects">;
    subtasks: Array<{ _id: string; title: string }>;
  }) => <div>{`subtasks:${issueId}:${projectId}:${subtasks.length}`}</div>,
}));

const defaultProps = {
  issueId: "issue_1" as Id<"issues">,
  projectId: "project_1" as Id<"projects">,
  issueTitle: "Broken export flow",
  issueDescription: "Serialized description",
  issueType: "bug",
  subtasks: [
    { _id: "subtask_1" as Id<"issues">, key: "PROJ-2", title: "Child task", status: "todo" },
  ],
  isEditing: false,
  editTitle: "Broken export flow",
  editDescription: "Editable description",
  onTitleChange: vi.fn(),
  onDescriptionChange: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe("IssueDetailContent", () => {
  it("renders the read-only issue content with description, subtasks, and comments", () => {
    render(<IssueDetailContent {...defaultProps} />);

    expect(screen.getByText("Broken export flow")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_CONTENT)).toHaveTextContent(
      "Serialized description",
    );
    expect(screen.getByText("subtasks:issue_1:project_1:1")).toBeInTheDocument();
    expect(screen.getByText("comments:issue_1:project_1")).toBeInTheDocument();
  });

  it("shows the empty description state and hides subtasks for subtask issues", () => {
    render(
      <IssueDetailContent
        {...defaultProps}
        issueType="subtask"
        issueDescription={undefined}
        subtasks={[]}
      />,
    );

    expect(screen.getByText("No description yet")).toBeInTheDocument();
    expect(screen.queryByText(/^subtasks:/)).not.toBeInTheDocument();
    expect(screen.getByText("comments:issue_1:project_1")).toBeInTheDocument();
  });

  it("renders the editing controls and wires title, description, save, and cancel actions", async () => {
    const user = userEvent.setup();
    const onTitleChange = vi.fn();
    const onDescriptionChange = vi.fn();
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <IssueDetailContent
        {...defaultProps}
        isEditing
        editTitle="Draft title"
        editDescription="Draft description"
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
        onSave={onSave}
        onCancel={onCancel}
      />,
    );

    const titleInput = screen.getByPlaceholderText("Issue title");
    fireEvent.change(titleInput, { target: { value: "Updated title" } });
    expect(onTitleChange).toHaveBeenCalledWith("Updated title");

    const descriptionEditor = screen.getByTestId(TEST_IDS.ISSUE.DESCRIPTION_EDITOR);
    fireEvent.change(descriptionEditor, { target: { value: "Updated description" } });
    expect(onDescriptionChange).toHaveBeenCalledWith("Updated description");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(onSave).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
