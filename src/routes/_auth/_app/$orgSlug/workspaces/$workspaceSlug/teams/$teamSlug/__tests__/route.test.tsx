import type { Id } from "@convex/_generated/dataModel";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { render, screen } from "@/test/custom-render";
import { TeamLayout } from "../route";

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
  Outlet: () => <div>Team content</div>,
  createFileRoute: () => () => ({
    useParams: () => ({
      workspaceSlug: "platform",
      teamSlug: "delivery",
    }),
  }),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

describe("TeamLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });

    mockUseAuthenticatedQuery
      .mockReturnValueOnce({
        _id: "workspace-1" as Id<"workspaces">,
        name: "Platform",
        description: "Delivery workspace",
        slug: "platform",
      })
      .mockReturnValueOnce({
        _id: "team-1" as Id<"teams">,
        workspaceId: "workspace-1" as Id<"workspaces">,
        name: "Delivery",
        description: "Core product team",
        slug: "delivery",
      })
      .mockReturnValueOnce([
        {
          _id: "membership-1" as Id<"teamMembers">,
          user: {
            name: "Alex Rivera",
            image: null,
          },
        },
        {
          _id: "membership-2" as Id<"teamMembers">,
          user: {
            name: "Mina Patel",
            image: null,
          },
        },
      ] as ReturnType<typeof useAuthenticatedQuery>);
  });

  it("renders the team sections nav inside the shared page-controls shell", () => {
    render(<TeamLayout />);

    expect(screen.getByRole("heading", { level: 2, name: "Delivery" })).toBeInTheDocument();
    expect(screen.getByText("Core product team")).toBeInTheDocument();
    expect(screen.getByText("2 members")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Team sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Board" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Team content")).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Team sections" });
    expect(nav.closest(".gap-4")).not.toBeNull();
  });
});
