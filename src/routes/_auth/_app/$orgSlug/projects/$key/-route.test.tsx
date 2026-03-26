import type { Id } from "@convex/_generated/dataModel";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProjectByKey } from "@/hooks/useProjectByKey";
import { render, screen } from "@/test/custom-render";
import { ProjectLayout } from "./route";

const { mockNavigate, mockUseLocation } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseCurrentUser = vi.mocked(useCurrentUser);
const mockUseProjectByKey = vi.mocked(useProjectByKey);

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
  Outlet: () => <div>Project content</div>,
  createFileRoute: () => () => ({
    useParams: () => ({
      key: "NX",
      orgSlug: "acme",
    }),
  }),
  useLocation: mockUseLocation,
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/useProjectByKey", () => ({
  useProjectByKey: vi.fn(),
}));

describe("ProjectLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseLocation.mockReturnValue({
      pathname: "/acme/projects/NX/board",
    });

    mockUseCurrentUser.mockReturnValue({
      user: {
        _id: "user-1" as Id<"users">,
      },
      isLoading: false,
      isAuthenticated: true,
    } as ReturnType<typeof useCurrentUser>);

    mockUseProjectByKey.mockReturnValue({
      _id: "project-1" as Id<"projects">,
      key: "NX",
      name: "Nixelo",
      boardType: "scrum",
      ownerId: "owner-1" as Id<"users">,
    } as ReturnType<typeof useProjectByKey>);

    mockUseAuthenticatedQuery.mockReturnValue("admin");
  });

  it("renders the shared project controls shell with scrum and admin tabs", () => {
    render(<ProjectLayout />);

    expect(screen.getByText("Nixelo")).toBeInTheDocument();
    expect(screen.getAllByText("Scrum project")).toHaveLength(1);
    expect(screen.getByText("scrum")).toBeInTheDocument();
    expect(screen.getByText("NX")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sprints" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More project sections" })).toBeInTheDocument();
    expect(screen.getByText("Project content")).toBeInTheDocument();

    const projectNavs = screen.getAllByRole("navigation", { name: "Project sections" });
    expect(projectNavs).toHaveLength(2);
    expect(projectNavs[1]?.closest(".gap-4")).not.toBeNull();
  });

  it("omits scrum and admin-only tabs when the viewer is not an admin on a kanban project", () => {
    mockUseProjectByKey.mockReturnValue({
      _id: "project-1" as Id<"projects">,
      key: "NX",
      name: "Nixelo",
      boardType: "kanban",
      ownerId: "owner-2" as Id<"users">,
    } as ReturnType<typeof useProjectByKey>);
    mockUseAuthenticatedQuery.mockReturnValue("member");

    render(<ProjectLayout />);

    expect(screen.getByText("Kanban project")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sprints" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("renders a project not found error when the project lookup returns null", () => {
    mockUseProjectByKey.mockReturnValue(null);

    render(<ProjectLayout />);

    expect(screen.getByRole("heading", { name: "Project Not Found" })).toBeInTheDocument();
    expect(
      screen.getByText(`The project "NX" doesn't exist or you don't have access to it.`),
    ).toBeInTheDocument();
  });
});
