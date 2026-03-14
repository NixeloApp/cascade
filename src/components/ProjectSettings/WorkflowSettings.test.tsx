import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { WorkflowSettings } from "./WorkflowSettings";

vi.mock("@convex/_generated/api", () => ({
  api: {
    projects: {
      updateWorkflow: "projects.updateWorkflow",
    },
  },
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);
const mockUpdateWorkflow = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const projectId = "project-1" as Id<"projects">;
const workflowStates: WorkflowState[] = [
  { id: "todo", name: "Backlog", category: "todo", order: 0 },
  { id: "doing", name: "In Progress", category: "inprogress", order: 1 },
  { id: "done", name: "Done", category: "done", order: 2 },
];

describe("WorkflowSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockUpdateWorkflow,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("renders grouped workflow badges before editing", () => {
    render(<WorkflowSettings projectId={projectId} workflowStates={workflowStates} />);

    expect(screen.getByText("Workflow")).toBeInTheDocument();
    expect(screen.getByText("Configure issue status workflow")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getAllByText("In Progress")).toHaveLength(2);
    expect(screen.getAllByText("Done")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("prevents removing a state when the workflow would drop below three states", async () => {
    const user = userEvent.setup();

    render(<WorkflowSettings projectId={projectId} workflowStates={workflowStates} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(mockShowError).toHaveBeenCalledWith(
      new Error("Workflow must have at least 3 states"),
      "Cannot remove",
    );
    expect(mockUpdateWorkflow).not.toHaveBeenCalled();
  });

  it("shows a validation error when a workflow category is missing", async () => {
    const user = userEvent.setup();

    render(<WorkflowSettings projectId={projectId} workflowStates={workflowStates} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.selectOptions(screen.getAllByRole("combobox")[2], "todo");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockShowError).toHaveBeenCalledWith(
      new Error(
        "Workflow must have at least one state in each category (To Do, In Progress, Done)",
      ),
      "Validation error",
    );
    expect(mockUpdateWorkflow).not.toHaveBeenCalled();
  });

  it("saves renamed workflow states and exits edit mode on success", async () => {
    const user = userEvent.setup();
    mockUpdateWorkflow.mockResolvedValue(undefined);

    render(<WorkflowSettings projectId={projectId} workflowStates={workflowStates} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getAllByPlaceholderText("State name")[0]);
    await user.type(screen.getAllByPlaceholderText("State name")[0], "Ideas");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateWorkflow).toHaveBeenCalledWith({
        projectId,
        workflowStates: [
          { id: "todo", name: "Ideas", category: "todo", order: 0 },
          { id: "doing", name: "In Progress", category: "inprogress", order: 1 },
          { id: "done", name: "Done", category: "done", order: 2 },
        ],
      });
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Workflow updated");
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });
});
