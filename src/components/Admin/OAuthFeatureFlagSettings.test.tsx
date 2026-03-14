import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import { act, fireEvent, render, screen } from "@/test/custom-render";
import { OAuthFeatureFlagSettings } from "./OAuthFeatureFlagSettings";

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

vi.mock("../ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode; variant?: string }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

vi.mock("../ui/Button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button onClick={onClick} type="button">
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
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/form/Input", () => ({
  Input: ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    placeholder?: string;
  }) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        onChange={(e) => onChange({ target: { value: e.target.value } })}
        placeholder={placeholder}
        value={value}
      />
    </label>
  ),
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode; gap?: string }) => <div>{children}</div>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode; variant?: string }) => <div>{children}</div>,
}));

const mockUseOrganization = vi.mocked(useOrganization);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

const setGoogleAuthEnabled = vi.fn();

type Procedure = (...args: unknown[]) => Promise<void>;

function createMutationMock(
  procedure: typeof setGoogleAuthEnabled,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign((...args: Parameters<Procedure>) => procedure(...args), {
    withOptimisticUpdate: () => mutation,
  }) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

describe("OAuthFeatureFlagSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      organizationId: "org_123" as never,
      organizationName: "Test Org",
      organizationSlug: "test-org",
      role: "admin",
    });

    mockUseAuthenticatedQuery.mockReturnValue(true);

    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createMutationMock(setGoogleAuthEnabled),
      canAct: true,
      isAuthLoading: false,
    });

    setGoogleAuthEnabled.mockResolvedValue(undefined);
  });

  it("returns null when no organizationId", () => {
    mockUseOrganization.mockReturnValue({
      organizationId: null as never,
      organizationName: null,
      organizationSlug: null,
      role: null,
    });

    const { container } = render(<OAuthFeatureFlagSettings />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the card with enabled status when Google auth is enabled", () => {
    mockUseAuthenticatedQuery.mockReturnValue(true);

    render(<OAuthFeatureFlagSettings />);

    expect(screen.getByText("Google Auth Emergency Toggle")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disable Google Auth" })).toBeInTheDocument();
  });

  it("renders disabled status when Google auth is disabled", () => {
    mockUseAuthenticatedQuery.mockReturnValue(false);

    render(<OAuthFeatureFlagSettings />);

    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Re-enable Google Auth" })).toBeInTheDocument();
  });

  it("toggles Google auth when button is clicked", async () => {
    render(<OAuthFeatureFlagSettings />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Disable Google Auth" }));
    });

    expect(setGoogleAuthEnabled).toHaveBeenCalledWith({
      organizationId: "org_123",
      enabled: false,
      reason: undefined,
    });
    expect(mockShowSuccess).toHaveBeenCalledWith("Google auth disabled");
  });

  it("sends reason when provided", async () => {
    render(<OAuthFeatureFlagSettings />);

    fireEvent.change(screen.getByLabelText("Change Reason (optional)"), {
      target: { value: "provider outage" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Disable Google Auth" }));
    });

    expect(setGoogleAuthEnabled).toHaveBeenCalledWith({
      organizationId: "org_123",
      enabled: false,
      reason: "provider outage",
    });
  });

  it("shows error toast when toggle fails", async () => {
    const error = new Error("Failed to toggle");
    setGoogleAuthEnabled.mockRejectedValue(error);

    render(<OAuthFeatureFlagSettings />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Disable Google Auth" }));
    });

    expect(mockShowError).toHaveBeenCalledWith(error, "Failed to update Google auth flag");
  });
});
