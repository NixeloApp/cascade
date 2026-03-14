import type { Id } from "@convex/_generated/dataModel";
import { ROUTES } from "@convex/shared/routes";
import { useNavigate } from "@tanstack/react-router";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { CreateTeamModal } from "./CreateTeamModal";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(),
}));

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
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <div>{title}</div>
        {children}
        {footer}
      </div>
    ) : null,
}));

const mockUseNavigate = vi.mocked(useNavigate);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseOrganization = vi.mocked(useOrganization);
const mockNavigate = vi.fn();

const createTeam = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const organizationId = "org_1" as Id<"organizations">;
const workspaceId = "workspace_1" as Id<"workspaces">;

describe("CreateTeamModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseOrganization.mockReturnValue({
      organizationId,
      orgSlug: "acme",
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createTeam,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("does not render when closed", () => {
    render(<CreateTeamModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog", { name: "Create Team" })).not.toBeInTheDocument();
  });

  it("creates a team, navigates to the team detail route, and resets the form", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    createTeam.mockResolvedValue({ slug: "frontend-platform" });

    render(
      <CreateTeamModal
        isOpen
        onClose={onClose}
        workspaceId={workspaceId}
        workspaceSlug="engineering"
      />,
    );

    await user.type(screen.getByLabelText("Team Name"), "Frontend Platform");
    await user.type(
      screen.getByLabelText("Description (Optional)"),
      "  UI systems and app shell  ",
    );
    await user.click(screen.getByLabelText("Make this team private"));
    await user.click(screen.getByRole("button", { name: "Create Team" }));

    await waitFor(() =>
      expect(createTeam).toHaveBeenCalledWith({
        name: "Frontend Platform",
        description: "UI systems and app shell",
        isPrivate: true,
        organizationId,
        workspaceId,
      }),
    );
    expect(showSuccess).toHaveBeenCalledWith("Team created successfully");
    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTES.workspaces.teams.detail.path,
      params: {
        orgSlug: "acme",
        workspaceSlug: "engineering",
        teamSlug: "frontend-platform",
      },
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Team Name")).toHaveValue("");
    expect(screen.getByLabelText("Description (Optional)")).toHaveValue("");
  });

  it("blocks missing name or workspace context and surfaces creation errors", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const error = new Error("team already exists");
    createTeam.mockRejectedValue(error);

    const { rerender } = render(
      <CreateTeamModal isOpen onClose={onClose} workspaceSlug="engineering" />,
    );

    await user.type(screen.getByLabelText("Team Name"), "Platform");
    await user.click(screen.getByRole("button", { name: "Create Team" }));

    expect(createTeam).not.toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();

    rerender(
      <CreateTeamModal
        isOpen
        onClose={onClose}
        workspaceId={workspaceId}
        workspaceSlug="engineering"
      />,
    );

    await user.clear(screen.getByLabelText("Team Name"));
    await user.type(screen.getByLabelText("Team Name"), "Platform");
    await user.click(screen.getByRole("button", { name: "Create Team" }));

    await waitFor(() => expect(createTeam).toHaveBeenCalledTimes(1));
    expect(showError).toHaveBeenCalledWith(error, "Failed to create team");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Team Name")).toHaveValue("Platform");
  });
});
