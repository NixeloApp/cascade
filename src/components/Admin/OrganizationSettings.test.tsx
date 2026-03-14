import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import { act, fireEvent, render, screen } from "@/test/custom-render";
import { OrganizationSettings } from "./OrganizationSettings";

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

vi.mock("../ui/Button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    isLoading,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    variant?: string;
    "data-testid"?: string;
  }) => (
    <button disabled={disabled || isLoading} onClick={onClick} type="button">
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

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode; className?: string }) => <div>{children}</div>,
}));

vi.mock("../ui/form", () => ({
  Input: ({
    id,
    label,
    value,
    onChange,
    type,
  }: {
    id?: string;
    label?: string;
    value: string | number;
    onChange: (event: { target: { value: string } }) => void;
    type?: string;
    className?: string;
    placeholder?: string;
    min?: number;
    max?: number;
  }) => (
    <input
      aria-label={label ?? id}
      id={id}
      onChange={(e) => onChange({ target: { value: e.target.value } })}
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

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
    "aria-label": ariaLabel,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    "aria-label"?: string;
    "data-testid"?: string;
  }) => (
    <button
      aria-label={ariaLabel}
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      type="button"
    >
      {checked ? "On" : "Off"}
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

const updateOrganization = vi.fn();

type Procedure = (...args: unknown[]) => Promise<void>;

function createMutationMock(
  procedure: typeof updateOrganization,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign((...args: Parameters<Procedure>) => procedure(...args), {
    withOptimisticUpdate: () => mutation,
  }) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

const mockOrganization = {
  _id: "org_123",
  name: "Test Organization",
  slug: "test-org",
  settings: {
    defaultMaxHoursPerWeek: 40,
    defaultMaxHoursPerDay: 8,
    requiresTimeApproval: false,
    billingEnabled: true,
  },
};

describe("OrganizationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      organizationId: "org_123" as never,
      organizationName: "Test Organization",
      organizationSlug: "test-org",
      role: "admin",
    });

    mockUseAuthenticatedQuery.mockReturnValue(mockOrganization);

    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(updateOrganization),
      canAct: true,
      isAuthLoading: false,
    });

    updateOrganization.mockResolvedValue(undefined);
  });

  it("shows loading spinner while organization data loads", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<OrganizationSettings />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders the settings form with organization data", () => {
    render(<OrganizationSettings />);

    expect(screen.getByText("Organization Settings")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Time Tracking")).toBeInTheDocument();
    expect(screen.getByText("Billing & Invoicing")).toBeInTheDocument();

    // Check input values - uses the id as aria-label
    const nameInput = screen.getByRole("textbox", { name: "orgName" });
    expect(nameInput).toHaveValue("Test Organization");
  });

  it("disables save button when no changes made", () => {
    render(<OrganizationSettings />);

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).toBeDisabled();
  });

  it("enables save button when changes are made", () => {
    render(<OrganizationSettings />);

    fireEvent.change(screen.getByRole("textbox", { name: "orgName" }), {
      target: { value: "New Name" },
    });

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).not.toBeDisabled();
  });

  it("saves settings when save button is clicked", async () => {
    render(<OrganizationSettings />);

    fireEvent.change(screen.getByRole("textbox", { name: "orgName" }), {
      target: { value: "New Name" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    });

    expect(updateOrganization).toHaveBeenCalledWith({
      organizationId: "org_123",
      name: "New Name",
      settings: {
        defaultMaxHoursPerWeek: 40,
        defaultMaxHoursPerDay: 8,
        requiresTimeApproval: false,
        billingEnabled: true,
      },
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Organization settings updated");
  });

  it("shows error toast when save fails", async () => {
    const error = new Error("Failed to save");
    updateOrganization.mockRejectedValue(error);

    render(<OrganizationSettings />);

    fireEvent.change(screen.getByRole("textbox", { name: "orgName" }), {
      target: { value: "New Name" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    });

    expect(mockShowError).toHaveBeenCalledWith(error, "Failed to update settings");
  });

  it("resets form when reset button is clicked", () => {
    render(<OrganizationSettings />);

    fireEvent.change(screen.getByRole("textbox", { name: "orgName" }), {
      target: { value: "New Name" },
    });

    // Reset button should appear
    const resetButton = screen.getByRole("button", { name: "Reset" });
    fireEvent.click(resetButton);

    // Check that name is back to original
    expect(screen.getByRole("textbox", { name: "orgName" })).toHaveValue("Test Organization");
  });

  it("toggles time approval switch", () => {
    render(<OrganizationSettings />);

    const timeApprovalSwitch = screen.getByRole("button", { name: "Require time approval" });
    expect(timeApprovalSwitch).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(timeApprovalSwitch);

    expect(timeApprovalSwitch).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles billing switch", () => {
    render(<OrganizationSettings />);

    const billingSwitch = screen.getByRole("button", { name: "Enable billing features" });
    expect(billingSwitch).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(billingSwitch);

    expect(billingSwitch).toHaveAttribute("aria-pressed", "false");
  });
});
