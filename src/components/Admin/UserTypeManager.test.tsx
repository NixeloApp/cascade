import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { act, fireEvent, render, screen } from "@/test/custom-render";
import { UserTypeManager } from "./UserTypeManager";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
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
    form,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit";
    form?: string;
    variant?: string;
    size?: string;
    isLoading?: boolean;
    className?: string;
  }) => (
    <button disabled={disabled} form={form} onClick={onClick} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({
    title,
    description,
    action,
  }: {
    title: string;
    description?: string;
    action?: ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action}
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
      <div>
        <div>{title}</div>
        <button onClick={onConfirm} type="button">
          {confirmLabel}
        </button>
        <button onClick={onClose} type="button">
          Cancel
        </button>
      </div>
    ) : null,
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({
    open,
    children,
    footer,
    title,
  }: {
    open: boolean;
    children: ReactNode;
    footer?: ReactNode;
    title: string;
    onOpenChange: (open: boolean) => void;
    size?: string;
  }) =>
    open ? (
      <div role="dialog">
        <div>{title}</div>
        {children}
        {footer}
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
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/form", () => ({
  Checkbox: ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (event: { target: { checked: boolean } }) => void;
  }) => (
    <label>
      <input
        checked={checked}
        onChange={(e) => onChange({ target: { checked: e.target.checked } })}
        type="checkbox"
      />
      {label}
    </label>
  ),
  Input: ({
    label,
    value,
    onChange,
    type,
  }: {
    label?: string;
    value: string | number;
    onChange: (event: { target: { value: string } }) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    min?: number;
    max?: number;
    step?: string;
  }) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        onChange={(e) => onChange({ target: { value: e.target.value } })}
        type={type}
        value={value}
      />
    </label>
  ),
  Select: ({
    label,
    value,
    onChange,
    children,
  }: {
    label?: string;
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    children: ReactNode;
    required?: boolean;
  }) => (
    <label>
      <span>{label}</span>
      <select
        aria-label={label}
        onChange={(e) => onChange({ target: { value: e.target.value } })}
        value={value}
      >
        {children}
      </select>
    </label>
  ),
  Textarea: ({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    placeholder?: string;
    rows?: number;
  }) => (
    <label>
      <span>{label}</span>
      <textarea
        aria-label={label}
        onChange={(e) => onChange({ target: { value: e.target.value } })}
        value={value}
      />
    </label>
  ),
}));

vi.mock("../ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Icon", () => ({
  Icon: ({ icon }: { icon: LucideIcon }) => <span>{icon.displayName ?? "icon"}</span>,
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

const updateConfig = vi.fn();
const initConfigs = vi.fn();
const upsertProfile = vi.fn();
const deleteProfile = vi.fn();

type Procedure = (...args: unknown[]) => Promise<void>;

function createMutationMock(procedure: Procedure): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign((...args: Parameters<Procedure>) => procedure(...args), {
    withOptimisticUpdate: () => mutation,
  }) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

const mockConfigs = [
  {
    type: "employee" as const,
    name: "Full-Time Employee",
    description: "Standard employee configuration",
    defaultMaxHoursPerWeek: 40,
    defaultMaxHoursPerDay: 8,
    defaultRequiresApproval: false,
    defaultCanWorkOvertime: true,
    canAccessBilling: true,
    canManageProjects: true,
  },
  {
    type: "contractor" as const,
    name: "Contractor",
    description: "External contractor configuration",
    defaultMaxHoursPerWeek: 40,
    defaultMaxHoursPerDay: 8,
    defaultRequiresApproval: true,
    defaultCanWorkOvertime: false,
    canAccessBilling: false,
    canManageProjects: false,
  },
  {
    type: "intern" as const,
    name: "Intern",
    description: "Intern configuration",
    defaultMaxHoursPerWeek: 20,
    defaultMaxHoursPerDay: 6,
    defaultRequiresApproval: true,
    defaultCanWorkOvertime: false,
    canAccessBilling: false,
    canManageProjects: false,
  },
];

const mockProfiles = [
  {
    _id: "profile_1" as Id<"userProfiles">,
    userId: "user_1" as Id<"users">,
    employmentType: "employee" as const,
    maxHoursPerWeek: 45,
    maxHoursPerDay: 9,
    isActive: true,
    jobTitle: "Senior Developer",
    department: "Engineering",
    user: { name: "John Doe", email: "john@example.com" },
  },
];

const mockUsersWithoutProfiles = [
  {
    _id: "user_2" as Id<"users">,
    name: "New User",
    email: "new@example.com",
  },
];

describe("UserTypeManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    let queryCallCount = 0;
    mockUseAuthenticatedQuery.mockImplementation(() => {
      queryCallCount++;
      // Order: configs, profiles, usersWithoutProfiles
      if (queryCallCount % 3 === 1) return mockConfigs;
      if (queryCallCount % 3 === 2) return mockProfiles;
      return mockUsersWithoutProfiles;
    });

    let mutationCallCount = 0;
    mockUseAuthenticatedMutation.mockImplementation(() => {
      mutationCallCount++;
      const procedures = [updateConfig, initConfigs, upsertProfile, deleteProfile];
      return {
        mutate: createMutationMock(procedures[(mutationCallCount - 1) % 4]),
        canAct: true,
        isAuthLoading: false,
      };
    });

    updateConfig.mockResolvedValue(undefined);
    initConfigs.mockResolvedValue(undefined);
    upsertProfile.mockResolvedValue(undefined);
    deleteProfile.mockResolvedValue(undefined);
  });

  it("renders employment type configurations", () => {
    render(<UserTypeManager />);

    expect(screen.getByText("Employment Type Configurations")).toBeInTheDocument();
    expect(screen.getByText("Full-Time Employee")).toBeInTheDocument();
    expect(screen.getByText("Contractor")).toBeInTheDocument();
    expect(screen.getByText("Intern")).toBeInTheDocument();
  });

  it("shows empty state and initialize button when no configs exist", () => {
    mockUseAuthenticatedQuery.mockReturnValue([]);

    render(<UserTypeManager />);

    expect(screen.getByText("No configurations")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Initialize Now" })).toBeInTheDocument();
  });

  it("initializes configs when initialize button is clicked", async () => {
    mockUseAuthenticatedQuery.mockReturnValue([]);

    render(<UserTypeManager />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Initialize Now" }));
    });

    expect(initConfigs).toHaveBeenCalledWith({});
    expect(mockShowSuccess).toHaveBeenCalledWith("Employment type configurations initialized");
  });

  it("opens config edit dialog when Edit Configuration is clicked", () => {
    render(<UserTypeManager />);

    fireEvent.click(screen.getAllByRole("button", { name: "Edit Configuration" })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Edit employee Configuration")).toBeInTheDocument();
  });

  it("saves config when form is submitted", async () => {
    render(<UserTypeManager />);

    fireEvent.click(screen.getAllByRole("button", { name: "Edit Configuration" })[0]);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Updated Employee" },
    });

    await act(async () => {
      fireEvent.submit(document.getElementById("config-form") as HTMLFormElement);
    });

    expect(updateConfig).toHaveBeenCalledWith({
      type: "employee",
      name: "Updated Employee",
      description: "Standard employee configuration",
      defaultMaxHoursPerWeek: 40,
      defaultMaxHoursPerDay: 8,
      defaultRequiresApproval: false,
      defaultCanWorkOvertime: true,
      canAccessBilling: true,
      canManageProjects: true,
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Configuration updated");
  });

  it("renders user profiles", () => {
    render(<UserTypeManager />);

    expect(screen.getByText("User Employment Assignments")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Senior Developer")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  it("shows unassigned users section", () => {
    render(<UserTypeManager />);

    expect(screen.getByText(/Unassigned Users/)).toBeInTheDocument();
    expect(screen.getByText("New User")).toBeInTheDocument();
  });

  it("opens assign modal when Assign Type is clicked", () => {
    render(<UserTypeManager />);

    fireEvent.click(screen.getByRole("button", { name: "Assign Type" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // The title shows either "Assign Employment Type" or "Edit User Employment" depending on state
    expect(screen.getByText(/Employment/)).toBeInTheDocument();
  });

  it("saves profile when assign form is submitted", async () => {
    render(<UserTypeManager />);

    fireEvent.click(screen.getByRole("button", { name: "Assign Type" }));

    fireEvent.change(screen.getByLabelText("Job Title"), {
      target: { value: "Developer" },
    });

    await act(async () => {
      fireEvent.submit(document.getElementById("profile-form") as HTMLFormElement);
    });

    expect(upsertProfile).toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalledWith("User profile saved");
  });

  it("opens delete confirmation when Remove is clicked", () => {
    render(<UserTypeManager />);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByText("Remove Employment Assignment")).toBeInTheDocument();
  });

  it("deletes profile when confirmed", async () => {
    render(<UserTypeManager />);

    // Click Remove on profile card
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    // Click Remove in confirm dialog (now there are 2 Remove buttons)
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await act(async () => {
      fireEvent.click(removeButtons[1]); // The second one is in the confirm dialog
    });

    expect(deleteProfile).toHaveBeenCalledWith({ userId: "user_1" });
    expect(mockShowSuccess).toHaveBeenCalledWith("User profile removed");
  });

  it("shows error toast when config update fails", async () => {
    const error = new Error("Failed to update");
    updateConfig.mockRejectedValue(error);

    render(<UserTypeManager />);

    fireEvent.click(screen.getAllByRole("button", { name: "Edit Configuration" })[0]);

    await act(async () => {
      fireEvent.submit(document.getElementById("config-form") as HTMLFormElement);
    });

    expect(mockShowError).toHaveBeenCalledWith(error, "Failed to update configuration");
  });
});
