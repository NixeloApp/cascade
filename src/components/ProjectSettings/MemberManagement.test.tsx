import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, within } from "@/test/custom-render";
import { MemberManagement } from "./MemberManagement";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

vi.mock("@convex/_generated/api", () => ({
  api: {
    projects: {
      addProjectMember: "projects.addProjectMember",
      updateProjectMemberRole: "projects.updateProjectMemberRole",
      removeProjectMember: "projects.removeProjectMember",
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

vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
  }: ConfirmDialogProps) =>
    isOpen ? (
      <div role="dialog">
        <div>{title}</div>
        <div>{message}</div>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    ) : null,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const mockAddMember = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockUpdateMemberRole = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockRemoveMember = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const projectId = "project-1" as Id<"projects">;
const ownerId = "user-1" as Id<"users">;
const memberId = "user-2" as Id<"users">;

const members = [
  {
    _id: ownerId,
    name: "Owner User",
    email: "owner@example.com",
    image: undefined,
    role: "admin" as const,
    addedAt: 1,
  },
  {
    _id: memberId,
    name: "Editor User",
    email: "editor@example.com",
    image: undefined,
    role: "editor" as const,
    addedAt: 2,
  },
];

describe("MemberManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let hookCall = 0;
    const mutationResults = [
      { mutate: mockAddMember, canAct: true, isAuthLoading: false },
      { mutate: mockUpdateMemberRole, canAct: true, isAuthLoading: false },
      { mutate: mockRemoveMember, canAct: true, isAuthLoading: false },
    ];
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const result = mutationResults[hookCall % mutationResults.length];
      hookCall += 1;
      return result;
    });
  });

  it("renders the member summary and marks owners as read-only", () => {
    render(
      <MemberManagement
        projectId={projectId}
        members={members}
        createdBy={ownerId}
        ownerId={ownerId}
      />,
    );

    expect(screen.getByText("2 members with access")).toBeInTheDocument();
    expect(screen.getByText("Owner User")).toBeInTheDocument();
    expect(screen.getByText("Editor User")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("adds a member and resets the add form on success", async () => {
    const user = userEvent.setup();
    mockAddMember.mockResolvedValue(undefined);

    render(
      <MemberManagement
        projectId={projectId}
        members={members}
        createdBy={ownerId}
        ownerId={ownerId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add Member" }));
    const addForm = screen.getByText("Add new member").closest("[class*='border-ui-border']");
    if (!(addForm instanceof HTMLElement)) {
      throw new Error("Add member form not found");
    }
    await user.type(within(addForm).getByLabelText("Email Address"), "  new@example.com  ");
    await user.selectOptions(within(addForm).getByLabelText("Role"), "viewer");
    await user.click(within(addForm).getByRole("button", { name: "Add Member" }));

    expect(mockAddMember).toHaveBeenCalledWith({
      projectId,
      userEmail: "new@example.com",
      role: "viewer",
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Member added successfully");
    expect(screen.queryByText("Add New Member")).not.toBeInTheDocument();
  });

  it("updates a member role from the inline selector", async () => {
    const user = userEvent.setup();
    mockUpdateMemberRole.mockResolvedValue(undefined);

    render(
      <MemberManagement
        projectId={projectId}
        members={members}
        createdBy={ownerId}
        ownerId={ownerId}
      />,
    );

    const memberCard = screen.getByText("Editor User").closest("[class*='bg-ui-bg']");
    if (!(memberCard instanceof HTMLElement)) {
      throw new Error("Member card not found");
    }
    const roleSelect = within(memberCard).getByRole("combobox");
    await user.selectOptions(roleSelect, "viewer");

    expect(mockUpdateMemberRole).toHaveBeenCalledWith({
      projectId,
      memberId,
      newRole: "viewer",
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Role updated");
  });

  it("removes a member after confirmation", async () => {
    const user = userEvent.setup();
    mockRemoveMember.mockResolvedValue(undefined);

    render(
      <MemberManagement
        projectId={projectId}
        members={members}
        createdBy={ownerId}
        ownerId={ownerId}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/remove Editor User from this project/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    expect(mockRemoveMember).toHaveBeenCalledWith({
      projectId,
      memberId,
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Member removed");
    expect(mockShowError).not.toHaveBeenCalled();
  });
});
