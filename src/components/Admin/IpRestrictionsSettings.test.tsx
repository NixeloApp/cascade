import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { IpRestrictionsSettings } from "./IpRestrictionsSettings";

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
  Badge: ({ children }: { children: ReactNode; variant?: string; size?: string }) => (
    <div>{children}</div>
  ),
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
  }) => (
    <button disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode; padding?: string; className?: string }) => (
    <div>{children}</div>
  ),
  CardBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({
    title,
    description,
    action,
  }: {
    title: ReactNode;
    description?: string;
    action?: ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action}
    </div>
  ),
}));

vi.mock("../ui/Dialog", () => ({
  Dialog: ({
    open,
    children,
    footer,
    title,
    description,
  }: {
    open: boolean;
    children: ReactNode;
    footer?: ReactNode;
    title: string;
    description?: string;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div>
        <div>{title}</div>
        <div>{description}</div>
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("../ui/EmptyState", () => ({
  EmptyState: ({ title, description }: { title: string; description: string; icon?: unknown }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
    align?: string;
    justify?: string;
    direction?: string;
    gap?: string;
  }) => <div className={className}>{children}</div>,
}));

vi.mock("../ui/form", () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    id,
  }: {
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    placeholder?: string;
    id?: string;
  }) => (
    <input
      aria-label={id}
      onChange={(event) => onChange({ target: { value: event.target.value } })}
      placeholder={placeholder}
      value={value}
    />
  ),
  Textarea: ({
    value,
    onChange,
    placeholder,
    id,
  }: {
    value: string;
    onChange: (event: { target: { value: string } }) => void;
    placeholder?: string;
    id?: string;
    rows?: number;
  }) => (
    <textarea
      aria-label={id}
      onChange={(event) => onChange({ target: { value: event.target.value } })}
      placeholder={placeholder}
      value={value}
    />
  ),
}));

vi.mock("../ui/IconButton", () => ({
  IconButton: ({
    children,
    onClick,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    onClick?: () => void;
    "aria-label": string;
    variant?: string;
    size?: string;
  }) => (
    <button aria-label={ariaLabel} onClick={onClick} type="button">
      {children}
    </button>
  ),
}));

vi.mock("../ui/Label", () => ({
  Label: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock("../ui/LoadingSpinner", () => ({
  LoadingSpinner: () => <div>loading-spinner</div>,
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode; gap?: string }) => <div>{children}</div>,
}));

vi.mock("../ui/Switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
    disabled,
    "aria-label": ariaLabel,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    "aria-label": string;
  }) => (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      type="button"
    >
      {checked ? "on" : "off"}
    </button>
  ),
}));

vi.mock("../ui/Tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode; delayDuration?: number }) => (
    <>{children}</>
  ),
  Tooltip: ({ children }: { children: ReactNode; content: string }) => <>{children}</>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode; variant?: string; color?: string }) => (
    <div>{children}</div>
  ),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseOrganization = vi.mocked(useOrganization);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

const setEnabledProcedure = vi.fn();
const addIpProcedure = vi.fn();
const removeIpProcedure = vi.fn();

type Procedure = (...args: unknown[]) => Promise<void>;

function createMutationMock(
  procedure: typeof setEnabledProcedure | typeof addIpProcedure | typeof removeIpProcedure,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign((...args: Parameters<Procedure>) => procedure(...args), {
    withOptimisticUpdate: () => mutation,
  }) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

let statusData:
  | {
      enabled: boolean;
      allowlistCount: number;
    }
  | undefined;

let allowlistData:
  | Array<{
      _id: Id<"organizationIpAllowlist">;
      ipRange: string;
      description?: string;
      createdBy: Id<"users">;
      createdByName: string;
      createdAt: number;
    }>
  | undefined;

describe("IpRestrictionsSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      organizationId: "org_1" as Id<"organizations">,
      orgSlug: "acme",
      organizationName: "Acme",
      userRole: "admin",
      billingEnabled: true,
    });

    statusData = undefined;
    allowlistData = undefined;

    mockUseAuthenticatedQuery.mockImplementation(() => {
      const callPosition = mockUseAuthenticatedQuery.mock.calls.length % 2;
      return callPosition === 1 ? statusData : allowlistData;
    });

    mockUseAuthenticatedMutation.mockImplementation(() => {
      const callPosition = mockUseAuthenticatedMutation.mock.calls.length % 3;
      if (callPosition === 1) {
        return {
          mutate: createMutationMock(setEnabledProcedure),
          canAct: true,
          isAuthLoading: false,
        };
      }
      if (callPosition === 2) {
        return { mutate: createMutationMock(addIpProcedure), canAct: true, isAuthLoading: false };
      }
      return { mutate: createMutationMock(removeIpProcedure), canAct: true, isAuthLoading: false };
    });

    setEnabledProcedure.mockResolvedValue(undefined);
    addIpProcedure.mockResolvedValue(undefined);
    removeIpProcedure.mockResolvedValue(undefined);
  });

  it("shows a loading state until both status and allowlist resolve", () => {
    render(<IpRestrictionsSettings />);

    expect(screen.getByText("loading-spinner")).toBeInTheDocument();
    expect(mockUseAuthenticatedQuery).toHaveBeenNthCalledWith(1, expect.anything(), {
      organizationId: "org_1",
    });
    expect(mockUseAuthenticatedQuery).toHaveBeenNthCalledWith(2, expect.anything(), {
      organizationId: "org_1",
    });
  });

  it("renders the status and toggles IP restrictions", async () => {
    statusData = {
      enabled: false,
      allowlistCount: 0,
    };
    allowlistData = [];

    render(<IpRestrictionsSettings />);

    expect(screen.getByText("IP Restrictions Disabled")).toBeInTheDocument();
    expect(screen.getByText("No IPs in allowlist")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enable IP restrictions" }));

    await waitFor(() => {
      expect(setEnabledProcedure).toHaveBeenCalledWith({
        organizationId: "org_1",
        enabled: true,
      });
      expect(mockShowSuccess).toHaveBeenCalledWith("IP restrictions enabled");
    });
  });

  it("adds and removes allowlist entries", async () => {
    statusData = {
      enabled: true,
      allowlistCount: 1,
    };
    allowlistData = [
      {
        _id: "allow_1" as Id<"organizationIpAllowlist">,
        ipRange: "203.0.113.10",
        description: "Office VPN",
        createdBy: "user_1" as Id<"users">,
        createdByName: "Taylor Rivera",
        createdAt: new Date("2026-03-14").getTime(),
      },
    ];

    render(<IpRestrictionsSettings />);

    expect(screen.getByText("IP Restrictions Active")).toBeInTheDocument();
    expect(screen.getByText("203.0.113.10")).toBeInTheDocument();
    expect(screen.getByText(/Office VPN/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Add IP/i }));
    fireEvent.change(screen.getByLabelText("ipRange"), { target: { value: "10.0.0.0/8" } });
    fireEvent.change(screen.getByLabelText("description"), {
      target: { value: "Internal network" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to Allowlist" }));

    await waitFor(() => {
      expect(addIpProcedure).toHaveBeenCalledWith({
        organizationId: "org_1",
        ipRange: "10.0.0.0/8",
        description: "Internal network",
      });
      expect(mockShowSuccess).toHaveBeenCalledWith("IP added to allowlist");
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove from allowlist" }));

    await waitFor(() => {
      expect(removeIpProcedure).toHaveBeenCalledWith({ id: "allow_1" });
      expect(mockShowSuccess).toHaveBeenCalledWith("IP removed from allowlist");
    });
    expect(mockShowError).not.toHaveBeenCalled();
  });
});
