import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/ui/Dialog", () => ({
  Dialog: ({
    open,
    title,
    children,
    footer,
    "data-testid": testId,
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    "data-testid"?: string;
  }) =>
    open ? (
      <div role="dialog" aria-label={title} data-testid={testId}>
        <div>{title}</div>
        {children}
        {footer}
      </div>
    ) : null,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseOrganization = vi.mocked(useOrganization);

const createWorkspace = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const organizationId = "org_1" as Id<"organizations">;

describe("CreateWorkspaceModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrganization.mockReturnValue({
      organizationId,
      orgSlug: "acme",
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createWorkspace,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("does not render when the modal is closed", () => {
    render(<CreateWorkspaceModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog", { name: "Create Workspace" })).not.toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.WORKSPACE.CREATE_MODAL)).not.toBeInTheDocument();
  });

  it("creates a workspace with a normalized slug and trimmed description", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    createWorkspace.mockResolvedValue(undefined);

    render(<CreateWorkspaceModal isOpen onClose={onClose} onCreated={onCreated} />);

    expect(screen.getByTestId(TEST_IDS.WORKSPACE.CREATE_MODAL)).toBeInTheDocument();
    await user.type(
      screen.getByTestId(TEST_IDS.WORKSPACE.CREATE_NAME_INPUT),
      "  Platform Operations  ",
    );
    await user.type(screen.getByLabelText("Description (Optional)"), "  Core product team  ");
    await user.click(screen.getByRole("button", { name: "Create Workspace" }));

    await waitFor(() =>
      expect(createWorkspace).toHaveBeenCalledWith({
        name: "Platform Operations",
        slug: "platform-operations",
        description: "Core product team",
        organizationId,
      }),
    );
    expect(showSuccess).toHaveBeenCalledWith("Workspace created successfully");
    expect(onCreated).toHaveBeenCalledWith("platform-operations");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Workspace Name")).toHaveValue("");
    expect(screen.getByLabelText("Description (Optional)")).toHaveValue("");
  });

  it("blocks blank submissions and surfaces creation errors", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const error = new Error("slug already exists");
    createWorkspace.mockRejectedValue(error);

    render(<CreateWorkspaceModal isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText("Workspace Name"), "   ");
    await user.click(screen.getByRole("button", { name: "Create Workspace" }));

    expect(createWorkspace).not.toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Workspace Name"));
    await user.type(screen.getByLabelText("Workspace Name"), "Operations Hub");
    await user.click(screen.getByRole("button", { name: "Create Workspace" }));

    await waitFor(() => expect(createWorkspace).toHaveBeenCalledTimes(1));
    expect(showError).toHaveBeenCalledWith(error, "Failed to create workspace");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Workspace Name")).toHaveValue("Operations Hub");
  });

  it("resets the form when the modal is cancelled", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<CreateWorkspaceModal isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText("Workspace Name"), "Platform");
    await user.type(screen.getByLabelText("Description (Optional)"), "Operations");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Workspace Name")).toHaveValue("");
    expect(screen.getByLabelText("Description (Optional)")).toHaveValue("");
  });
});
