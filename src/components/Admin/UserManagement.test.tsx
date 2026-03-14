import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import { act, fireEvent, render, screen } from "@/test/custom-render";
import { UserManagement } from "./UserManagement";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("../ui/Avatar", () => ({
  Avatar: ({ name }: { name?: string; src?: string; email?: string; size?: string }) => (
    <div data-testid="avatar">{name}</div>
  ),
}));

vi.mock("../ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("../ui/Button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type = "button",
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit";
    variant?: string;
    size?: string;
    isLoading?: boolean;
    "aria-label"?: string;
    "data-testid"?: string;
  }) => (
    <button disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
  CardBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    confirmLabel,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel: string;
    variant?: string;
  }) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <div>{title}</div>
        <button data-testid="confirm-dialog-confirm" onClick={onConfirm} type="button">
          {confirmLabel}
        </button>
        <button data-testid="confirm-dialog-cancel" onClick={onClose} type="button">
          Cancel
        </button>
      </div>
    ) : null,
}));

vi.mock("../ui/EmptyState", () => ({
  EmptyState: ({
    title,
    description,
    action,
  }: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
    icon?: LucideIcon;
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action ? (
        <button onClick={action.onClick} type="button">
          {action.label}
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/form", () => ({
  Input: ({
    id,
    value,
    onChange,
    type,
    placeholder,
  }: {
    id?: string;
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    autoFocus?: boolean;
    "data-testid"?: string;
  }) => (
    <input
      id={id}
      onChange={(e) => onChange({ target: { value: e.target.value } })}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  ),
}));

vi.mock("../ui/Label", () => ({
  Label: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock("../ui/LoadingSpinner", () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock("../ui/Select", () => ({
  Select: ({
    value,
    onValueChange,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <select aria-label="role-select" onChange={(e) => onValueChange(e.target.value)} value={value}>
      <option value="user">User</option>
      <option value="superAdmin">Super Admin</option>
    </select>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Table", () => ({
  Table: ({ children }: { children: ReactNode; "aria-label"?: string; "data-testid"?: string }) => (
    <table>{children}</table>
  ),
  TableBody: ({ children }: { children: ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: ReactNode; className?: string }) => <td>{children}</td>,
  TableHead: ({ children }: { children: ReactNode; className?: string }) => <th>{children}</th>,
  TableHeader: ({ children }: { children: ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: ReactNode; "data-testid"?: string }) => <tr>{children}</tr>,
}));

vi.mock("../ui/Tabs", () => ({
  Tabs: ({ children }: { children: ReactNode; value: string; onValueChange: () => void }) => (
    <div>{children}</div>
  ),
  TabsList: ({ children }: { children: ReactNode; variant?: string }) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: { children: ReactNode; value: string; variant?: string }) => (
    <button data-value={value} type="button">
      {children}
    </button>
  ),
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseOrganization = vi.mocked(useOrganization);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

const sendInvite = vi.fn();
const revokeInvite = vi.fn();
const resendInvite = vi.fn();

type Procedure = (...args: unknown[]) => Promise<void>;

function createMutationMock(procedure: Procedure): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign((...args: Parameters<Procedure>) => procedure(...args), {
    withOptimisticUpdate: () => mutation,
  }) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

const mockInvites = [
  {
    _id: "invite_1" as Id<"invites">,
    _creationTime: Date.now() - 86400000,
    email: "john@example.com",
    role: "user",
    status: "pending",
    expiresAt: Date.now() + 86400000 * 7,
    inviterName: "Admin User",
  },
];

const mockUsers = [
  {
    _id: "user_1" as Id<"users">,
    name: "Jane Doe",
    email: "jane@example.com",
    isAnonymous: false,
    emailVerificationTime: Date.now(),
    projectsCreated: 5,
    projectMemberships: 3,
  },
];

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      organizationId: "org_123" as never,
      organizationName: "Test Org",
      organizationSlug: "test-org",
      role: "admin",
    });

    let queryCallCount = 0;
    mockUseAuthenticatedQuery.mockImplementation(() => {
      queryCallCount++;
      // Alternate between invites and users queries
      return queryCallCount % 2 === 1 ? mockInvites : mockUsers;
    });

    let mutationCallCount = 0;
    mockUseAuthenticatedMutation.mockImplementation(() => {
      mutationCallCount++;
      const procedures = [sendInvite, revokeInvite, resendInvite];
      return {
        mutate: createMutationMock(procedures[(mutationCallCount - 1) % 3]),
        canAct: true,
        isAuthLoading: false,
      };
    });

    sendInvite.mockResolvedValue(undefined);
    revokeInvite.mockResolvedValue(undefined);
    resendInvite.mockResolvedValue(undefined);
  });

  it("renders the user management header", () => {
    render(<UserManagement />);

    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Manage user invitations and platform access")).toBeInTheDocument();
  });

  it("shows loading spinner when invites are loading", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<UserManagement />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("shows empty state when no invites exist", () => {
    mockUseAuthenticatedQuery.mockReturnValue([]);

    render(<UserManagement />);

    expect(screen.getByText("No invitations")).toBeInTheDocument();
    expect(screen.getByText("Send your first invitation to get started")).toBeInTheDocument();
  });

  it("renders invites table with pending invite", () => {
    render(<UserManagement />);

    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("opens invite form when Invite User button is clicked", () => {
    render(<UserManagement />);

    // Click the first "Invite User" button (in header)
    const inviteButtons = screen.getAllByRole("button", { name: "Invite User" });
    fireEvent.click(inviteButtons[0]);

    expect(screen.getByText("Send Invitation")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("user@example.com")).toBeInTheDocument();
  });

  it("sends invite when form is submitted", async () => {
    render(<UserManagement />);

    fireEvent.click(screen.getByRole("button", { name: "Invite User" }));

    fireEvent.change(screen.getByPlaceholderText("user@example.com"), {
      target: { value: "new@example.com" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));
    });

    expect(sendInvite).toHaveBeenCalledWith({
      email: "new@example.com",
      role: "user",
      organizationId: "org_123",
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Invitation sent to new@example.com");
  });

  it("shows error toast when sending invite fails", async () => {
    const error = new Error("Failed to send");
    sendInvite.mockRejectedValue(error);

    render(<UserManagement />);

    fireEvent.click(screen.getByRole("button", { name: "Invite User" }));

    fireEvent.change(screen.getByPlaceholderText("user@example.com"), {
      target: { value: "new@example.com" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));
    });

    expect(mockShowError).toHaveBeenCalledWith(error, "Failed to send invitation");
  });

  it("resends invite when resend button is clicked", async () => {
    render(<UserManagement />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Resend" }));
    });

    expect(resendInvite).toHaveBeenCalledWith({ inviteId: "invite_1" });
    expect(mockShowSuccess).toHaveBeenCalledWith("Invitation resent successfully");
  });

  it("opens confirm dialog when revoke is clicked", () => {
    render(<UserManagement />);

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    expect(screen.getByText("Revoke Invitation")).toBeInTheDocument();
  });

  it("revokes invite when confirmed", async () => {
    render(<UserManagement />);

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await act(async () => {
      fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));
    });

    expect(revokeInvite).toHaveBeenCalledWith({ inviteId: "invite_1" });
    expect(mockShowSuccess).toHaveBeenCalledWith("Invitation revoked");
  });
});
