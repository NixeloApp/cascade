import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { DangerZone } from "./DangerZone";

const { mockNavigate, mockMutate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockMutate: vi.fn(),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    projects: {
      softDeleteProject: "projects.softDeleteProject",
    },
  },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
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
  projectName: "Alpha",
  projectKey: "ALPHA",
  isOwner: true,
  orgSlug: "demo-org",
};

describe("DangerZone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(mockMutate),
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("renders nothing for non-owners", () => {
    const { container } = render(<DangerZone {...defaultProps} isOwner={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("deletes the project after typed confirmation and navigates back to the project list", async () => {
    const user = userEvent.setup();
    mockMutate.mockResolvedValue(undefined);

    render(<DangerZone {...defaultProps} />);

    await user.click(screen.getByTestId(TEST_IDS.PROJECT_SETTINGS.DELETE_TRIGGER));

    const confirmButton = screen.getByRole("button", {
      name: "I understand, delete this project",
    });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByTestId(TEST_IDS.PROJECT_SETTINGS.DELETE_CONFIRM_INPUT), "ALPHA");

    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ projectId: defaultProps.projectId });
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Project deleted successfully");
    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTES.projects.list.path,
      params: { orgSlug: "demo-org" },
    });
    expect(
      screen.queryByRole("button", {
        name: "I understand, delete this project",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows an error and stays on the page when deletion fails", async () => {
    const user = userEvent.setup();
    const deleteError = new Error("Backend unavailable");
    mockMutate.mockRejectedValue(deleteError);

    render(<DangerZone {...defaultProps} />);

    await user.click(screen.getByTestId(TEST_IDS.PROJECT_SETTINGS.DELETE_TRIGGER));
    await user.type(screen.getByTestId(TEST_IDS.PROJECT_SETTINGS.DELETE_CONFIRM_INPUT), "ALPHA");
    await user.click(
      screen.getByRole("button", {
        name: "I understand, delete this project",
      }),
    );

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(deleteError, "Failed to delete project");
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockShowSuccess).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", {
        name: "I understand, delete this project",
      }),
    ).toBeEnabled();
  });

  it("closes and resets the dialog when cancelled", async () => {
    const user = userEvent.setup();

    render(<DangerZone {...defaultProps} />);

    await user.click(screen.getByTestId(TEST_IDS.PROJECT_SETTINGS.DELETE_TRIGGER));
    await user.type(screen.getByTestId(TEST_IDS.PROJECT_SETTINGS.DELETE_CONFIRM_INPUT), "ALPHA");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByTestId(TEST_IDS.PROJECT_SETTINGS.DELETE_CONFIRM_INPUT),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId(TEST_IDS.PROJECT_SETTINGS.DELETE_TRIGGER));
    expect(screen.getByTestId(TEST_IDS.PROJECT_SETTINGS.DELETE_CONFIRM_INPUT)).toHaveValue("");
  });
});
