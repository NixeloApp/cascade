import type { Id } from "@convex/_generated/dataModel";
import { MINUTE } from "@convex/lib/timeUtils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { fireEvent, render, screen } from "@/test/custom-render";
import { OAuthHealthDashboard } from "./OAuthHealthDashboard";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
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
    variant,
  }: {
    children: ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
  }) => (
    <button data-variant={variant} onClick={onClick} type="button">
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

vi.mock("../ui/EmptyState", () => ({
  EmptyState: ({
    title,
    description,
  }: {
    title: string;
    description: string;
    icon?: LucideIcon;
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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

const mockUseOrganization = vi.mocked(useOrganization);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

describe("OAuthHealthDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      organizationId: "org_123" as Id<"organizations">,
      organizationName: "Test Org",
      orgSlug: "test-org",
      userRole: "admin",
      billingEnabled: true,
    });
  });

  it("returns null when no organizationId", () => {
    mockUseOrganization.mockReturnValue({
      organizationId: "" as Id<"organizations">,
      organizationName: "",
      orgSlug: "",
      userRole: "member",
      billingEnabled: false,
    });

    const { container } = render(<OAuthHealthDashboard />);
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state when stats are undefined", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<OAuthHealthDashboard />);

    expect(screen.getByText("Loading OAuth health stats...")).toBeInTheDocument();
  });

  it("shows empty state when no health checks in range", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      totalChecks: 0,
      successRate: 0,
      p95LatencyMs: null,
      avgLatencyMs: null,
      consecutiveFailures: 0,
      lastCheckAt: null,
      firstFailAt: null,
      lastFailAt: null,
      recoveredAt: null,
      recentFailures: [],
    });

    render(<OAuthHealthDashboard />);

    expect(screen.getByText("No health checks in selected range")).toBeInTheDocument();
  });

  it("renders health stats when data is available", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      totalChecks: 100,
      successRate: 98.5,
      p95LatencyMs: 250,
      avgLatencyMs: 120,
      consecutiveFailures: 0,
      lastCheckAt: Date.now(),
      firstFailAt: null,
      lastFailAt: null,
      recoveredAt: null,
      recentFailures: [],
    });

    render(<OAuthHealthDashboard />);

    expect(screen.getByText("98.5%")).toBeInTheDocument();
    expect(screen.getByText("250ms")).toBeInTheDocument();
    expect(screen.getByText("120ms")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("shows degraded status when there are consecutive failures", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      totalChecks: 100,
      successRate: 95,
      p95LatencyMs: 300,
      avgLatencyMs: 150,
      consecutiveFailures: 3,
      lastCheckAt: Date.now(),
      firstFailAt: Date.now() - MINUTE,
      lastFailAt: Date.now() - MINUTE / 2,
      recoveredAt: null,
      recentFailures: [],
    });

    render(<OAuthHealthDashboard />);

    expect(screen.getByText("Degraded")).toBeInTheDocument();
  });

  it("renders recent failures when present", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      totalChecks: 100,
      successRate: 95,
      p95LatencyMs: 300,
      avgLatencyMs: 150,
      consecutiveFailures: 0,
      lastCheckAt: Date.now(),
      firstFailAt: null,
      lastFailAt: null,
      recoveredAt: null,
      recentFailures: [
        {
          timestamp: Date.now() - MINUTE,
          error: "Connection timeout",
          latencyMs: 5000,
          errorCode: "ETIMEDOUT",
        },
      ],
    });

    render(<OAuthHealthDashboard />);

    expect(screen.getByText("Recent Failures")).toBeInTheDocument();
    expect(screen.getByText("Connection timeout")).toBeInTheDocument();
    expect(screen.getByText("5000ms")).toBeInTheDocument();
    expect(screen.getByText("ETIMEDOUT")).toBeInTheDocument();
  });

  it("switches between 7d and 30d ranges", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      totalChecks: 100,
      successRate: 98,
      p95LatencyMs: 200,
      avgLatencyMs: 100,
      consecutiveFailures: 0,
      lastCheckAt: Date.now(),
      firstFailAt: null,
      lastFailAt: null,
      recoveredAt: null,
      recentFailures: [],
    });

    render(<OAuthHealthDashboard />);

    // Check that both range buttons exist
    expect(screen.getByRole("button", { name: "7d" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30d" })).toBeInTheDocument();

    // Click on 30d
    fireEvent.click(screen.getByRole("button", { name: "30d" }));

    // Verify query was called with updated days
    expect(mockUseAuthenticatedQuery).toHaveBeenLastCalledWith(expect.anything(), {
      organizationId: "org_123",
      days: 30,
    });
  });
});
