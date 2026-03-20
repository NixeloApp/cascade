import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { ProjectWizard } from "./ProjectWizard";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);

const createProject = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const updateOnboarding = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;

function buildMutationReturnValue(
  mutate: ReactMutation<FunctionReference<"mutation">>,
): ReturnType<typeof useAuthenticatedMutation> {
  return {
    mutate,
    canAct: true,
    isAuthLoading: false,
  };
}

describe("ProjectWizard", () => {
  const organizationId = "org_1" as Id<"organizations">;
  const workspaceId = "workspace_1" as Id<"workspaces">;

  beforeEach(() => {
    let mutationCall = 0;

    vi.clearAllMocks();

    mockUseAuthenticatedMutation.mockImplementation(() => {
      const mutationSlot = mutationCall % 2;
      mutationCall += 1;

      if (mutationSlot === 0) {
        return buildMutationReturnValue(createProject);
      }

      return buildMutationReturnValue(updateOnboarding);
    });
  });

  it("does not render when closed and cancels through onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const { rerender } = render(
      <ProjectWizard
        open={false}
        onOpenChange={onOpenChange}
        onComplete={vi.fn()}
        organizationId={organizationId}
        workspaceId={workspaceId}
      />,
    );

    expect(screen.queryByRole("dialog", { name: "Create New Project" })).not.toBeInTheDocument();

    rerender(
      <ProjectWizard
        open
        onOpenChange={onOpenChange}
        onComplete={vi.fn()}
        organizationId={organizationId}
        workspaceId={workspaceId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("validates required project fields and key format on the first step", async () => {
    const user = userEvent.setup();

    render(
      <ProjectWizard
        open
        onOpenChange={vi.fn()}
        onComplete={vi.fn()}
        organizationId={organizationId}
        workspaceId={workspaceId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(showError).toHaveBeenCalledWith("Project name is required");

    await user.type(
      screen.getByPlaceholderText("e.g., Website Redesign, Mobile App, Q1 Planning"),
      "New Marketing Site",
    );
    expect(screen.getByPlaceholderText("e.g., WEB, MOBILE, Q1")).toHaveValue("N");

    await user.clear(screen.getByPlaceholderText("e.g., WEB, MOBILE, Q1"));
    await user.type(screen.getByPlaceholderText("e.g., WEB, MOBILE, Q1"), "a1");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(showError).toHaveBeenCalledWith("Project key must be uppercase letters only");

    expect(screen.getByRole("heading", { name: "Create Your First Project" })).toBeInTheDocument();
  });

  it("creates a project, updates onboarding, and completes the wizard", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const projectId = "project_123";

    createProject.mockResolvedValue({ projectId });
    updateOnboarding.mockResolvedValue(undefined);

    render(
      <ProjectWizard
        open
        onOpenChange={vi.fn()}
        onComplete={onComplete}
        organizationId={organizationId}
        workspaceId={workspaceId}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("e.g., Website Redesign, Mobile App, Q1 Planning"),
      "Platform Redesign",
    );
    expect(screen.getByPlaceholderText("e.g., WEB, MOBILE, Q1")).toHaveValue("P");
    await user.clear(screen.getByPlaceholderText("e.g., WEB, MOBILE, Q1"));
    await user.type(screen.getByPlaceholderText("e.g., WEB, MOBILE, Q1"), "PLAT");
    await user.type(
      screen.getByLabelText("Description (optional)"),
      "  Internal redesign project  ",
    );
    await user.click(screen.getByRole("button", { name: "Next" }));

    await user.click(screen.getByText("Scrum"));
    await user.click(screen.getByRole("button", { name: "Next" }));

    const workflowInputs = screen.getAllByRole("textbox");
    await user.clear(workflowInputs[1]);
    await user.type(workflowInputs[1], "Building");
    await user.click(screen.getByRole("button", { name: "+ Add another status" }));
    const updatedWorkflowInputs = screen.getAllByRole("textbox");
    const newStatusInput = updatedWorkflowInputs[updatedWorkflowInputs.length - 1];
    expect(newStatusInput).toHaveValue("New Status");
    await user.clear(newStatusInput);
    await user.type(newStatusInput, "Review");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Ready to Create!")).toBeInTheDocument();
    expect(screen.getByText("Platform Redesign")).toBeInTheDocument();
    expect(screen.getByText("PLAT")).toBeInTheDocument();
    expect(screen.getByText("scrum")).toBeInTheDocument();
    expect(screen.getByText("Building")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();

    expect(screen.getByTestId(TEST_IDS.ONBOARDING.CREATE_PROJECT_BUTTON)).toHaveTextContent(
      "Create Project",
    );
    await user.click(screen.getByTestId(TEST_IDS.ONBOARDING.CREATE_PROJECT_BUTTON));

    await waitFor(() =>
      expect(createProject).toHaveBeenCalledWith({
        name: "Platform Redesign",
        key: "PLAT",
        description: "  Internal redesign project  ",
        isPublic: false,
        boardType: "scrum",
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "inprogress", name: "Building", category: "inprogress", order: 1 },
          { id: "done", name: "Done", category: "done", order: 2 },
          { id: "custom-3", name: "Review", category: "inprogress", order: 3 },
        ],
        organizationId,
        workspaceId,
      }),
    );
    expect(updateOnboarding).toHaveBeenCalledWith({
      wizardCompleted: true,
      onboardingStep: 3,
    });
    expect(showSuccess).toHaveBeenCalledWith("Project created successfully!");
    expect(onComplete).toHaveBeenCalledWith(projectId);
  });
});
