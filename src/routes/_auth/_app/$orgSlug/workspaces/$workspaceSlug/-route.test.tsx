import type { Id } from "@convex/_generated/dataModel";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { render, screen } from "@/test/custom-render";
import { WorkspaceLayout } from "./route";

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    activeOptions: _activeOptions,
    activeProps: _activeProps,
    ...props
  }: {
    to: string;
    children: ReactNode;
    activeOptions?: unknown;
    activeProps?: unknown;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Outlet: () => <div>Workspace content</div>,
  createFileRoute: () => () => ({
    useParams: () => ({
      workspaceSlug: "platform",
    }),
  }),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

describe("WorkspaceLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });

    mockUseAuthenticatedQuery.mockReturnValue({
      _id: "workspace-1" as Id<"workspaces">,
      name: "Platform",
      description: "Delivery workspace",
      slug: "platform",
    });
  });

  it("renders the workspace sections nav inside the shared page-controls shell", () => {
    render(<WorkspaceLayout />);

    expect(screen.getByRole("heading", { level: 2, name: "Platform" })).toBeInTheDocument();
    expect(screen.getByText("Delivery workspace")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Workspace sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Teams" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Workspace content")).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Workspace sections" });
    expect(nav.closest(".gap-4")).not.toBeNull();
  });
});
