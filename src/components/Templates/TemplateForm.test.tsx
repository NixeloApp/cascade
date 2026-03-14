import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { TemplateForm } from "./TemplateForm";

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

const mockCreateTemplate = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockUpdateTemplate = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const projectId = "project_1" as Id<"projects">;
const onOpenChange = vi.fn();

const project = {
  members: [
    { _id: "member_1" as Id<"projectMembers">, name: "Alice" },
    { _id: "member_2" as Id<"projectMembers">, name: "Bob" },
  ],
  workflowStates: [
    { id: "todo", name: "To Do" },
    { id: "in_progress", name: "In Progress" },
  ],
};

const existingTemplate = {
  _id: "template_1" as Id<"issueTemplates">,
  name: "Bug Report",
  type: "bug" as const,
  titleTemplate: "[BUG] {summary}",
  descriptionTemplate: "## Steps\n1. Reproduce",
  defaultPriority: "high" as const,
  defaultLabels: ["bug", "frontend"],
  defaultAssigneeId: "user_2" as Id<"users">,
  defaultStatus: "in_progress",
  defaultStoryPoints: 5,
  isDefault: true,
};

describe("TemplateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationCallCount = 0;
    const mutationResults = [
      { mutate: mockCreateTemplate, canAct: true, isAuthLoading: false },
      { mutate: mockUpdateTemplate, canAct: true, isAuthLoading: false },
    ];
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const result = mutationResults[mutationCallCount % mutationResults.length];
      mutationCallCount += 1;
      return result;
    });
    mockUseAuthenticatedQuery.mockReturnValue(project);
  });

  it("renders the create form with project-driven assignee and status options", () => {
    render(<TemplateForm projectId={projectId} template={null} open onOpenChange={onOpenChange} />);

    expect(screen.getByRole("dialog", { name: "Create Template" })).toBeInTheDocument();
    expect(screen.getByLabelText("Template Name")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Template" })).toBeInTheDocument();
  });

  it("creates a template with normalized defaults and closes the dialog", async () => {
    const user = userEvent.setup();
    mockCreateTemplate.mockResolvedValue(undefined);

    render(<TemplateForm projectId={projectId} template={null} open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Template Name"), "  Feature Request  ");
    await user.selectOptions(screen.getByLabelText("Issue Type"), "story");
    fireEvent.change(screen.getByLabelText("Title Template"), {
      target: { value: "  [STORY] {summary}  " },
    });
    await user.type(screen.getByLabelText("Description Template"), "  Build the thing  ");
    await user.selectOptions(screen.getByLabelText("Default Priority"), "highest");
    await user.type(
      screen.getByLabelText("Default Labels (comma separated)"),
      "feature, frontend , urgent",
    );
    await user.selectOptions(screen.getByLabelText("Default Assignee"), "member_1");
    await user.selectOptions(screen.getByLabelText("Default Status"), "todo");
    await user.type(screen.getByLabelText("Default Story Points"), "3.5");
    await user.click(screen.getByLabelText("Set as default template"));
    await user.click(screen.getByRole("button", { name: "Create Template" }));

    await waitFor(() =>
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        projectId,
        name: "Feature Request",
        type: "story",
        titleTemplate: "[STORY] {summary}",
        descriptionTemplate: "Build the thing",
        defaultPriority: "highest",
        defaultLabels: ["feature", "frontend", "urgent"],
        defaultAssigneeId: "member_1",
        defaultStatus: "todo",
        defaultStoryPoints: 3.5,
        isDefault: true,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Template created");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("prefills the edit form and updates the template", async () => {
    const user = userEvent.setup();
    mockUpdateTemplate.mockResolvedValue(undefined);

    render(
      <TemplateForm
        projectId={projectId}
        template={existingTemplate}
        open
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Edit Template" })).toBeInTheDocument();
    expect(screen.getByLabelText("Template Name")).toHaveValue("Bug Report");
    expect(screen.getByLabelText("Default Labels (comma separated)")).toHaveValue("bug, frontend");
    expect(screen.getByLabelText("Default Story Points")).toHaveValue(5);
    expect(screen.getByLabelText("Set as default template")).toBeChecked();

    await user.clear(screen.getByLabelText("Template Name"));
    await user.type(screen.getByLabelText("Template Name"), " Bug Triage ");
    await user.clear(screen.getByLabelText("Default Labels (comma separated)"));
    await user.type(screen.getByLabelText("Default Labels (comma separated)"), "bugs, triage");
    await user.clear(screen.getByLabelText("Default Story Points"));
    await user.click(screen.getByLabelText("Set as default template"));
    await user.click(screen.getByRole("button", { name: "Update Template" }));

    await waitFor(() =>
      expect(mockUpdateTemplate).toHaveBeenCalledWith({
        id: existingTemplate._id,
        name: "Bug Triage",
        type: "bug",
        titleTemplate: "[BUG] {summary}",
        descriptionTemplate: "## Steps\n1. Reproduce",
        defaultPriority: "high",
        defaultLabels: ["bugs", "triage"],
        defaultAssigneeId: "user_2",
        defaultStatus: "in_progress",
        defaultStoryPoints: undefined,
        isDefault: false,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Template updated");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows a save error when the mutation rejects", async () => {
    const user = userEvent.setup();
    const error = new Error("network");
    mockCreateTemplate.mockRejectedValue(error);

    render(<TemplateForm projectId={projectId} template={null} open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Template Name"), "Incident");
    fireEvent.change(screen.getByLabelText("Title Template"), {
      target: { value: "[INCIDENT] {summary}" },
    });
    await user.click(screen.getByRole("button", { name: "Create Template" }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to save template"),
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
