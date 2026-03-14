import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { GeneralSettings } from "./GeneralSettings";

const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    projects: {
      updateProject: "projects.updateProject",
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

const defaultProps = {
  projectId: "project-1" as Id<"projects">,
  name: "Alpha",
  projectKey: "ALPHA",
  description: "Core platform work",
};

describe("GeneralSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(mockMutate),
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("renders the readonly project values before editing", () => {
    render(<GeneralSettings {...defaultProps} />);

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Basic project information")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("ALPHA")).toBeInTheDocument();
    expect(screen.getByText("Core platform work")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("resets unsaved edits when canceling edit mode", async () => {
    const user = userEvent.setup();

    render(<GeneralSettings {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Project Name"));
    await user.type(screen.getByLabelText("Project Name"), "Renamed");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "Temporary draft");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByLabelText("Project Name")).toHaveValue("Alpha");
    expect(screen.getByLabelText("Description")).toHaveValue("Core platform work");
  });

  it("trims values before saving and exits edit mode on success", async () => {
    const user = userEvent.setup();
    mockMutate.mockResolvedValue(undefined);

    render(<GeneralSettings {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Project Name"));
    await user.type(screen.getByLabelText("Project Name"), "  Renamed project  ");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "  Updated scope  ");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        projectId: defaultProps.projectId,
        name: "Renamed project",
        description: "Updated scope",
      });
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Project settings updated");
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("shows a validation error when the project name is blank", async () => {
    const user = userEvent.setup();

    render(<GeneralSettings {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Project Name"));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockShowError).toHaveBeenCalledWith(
      new Error("Project name is required"),
      "Validation error",
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
