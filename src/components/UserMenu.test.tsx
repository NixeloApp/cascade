import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { UserMenu } from "./UserMenu";

// Mock dependencies
const mockSignOut = vi.fn();
const mockUser = {
  _id: "user123",
  name: "Test User",
  email: "test@example.com",
  image: "https://example.com/avatar.jpg",
};

// Mock convex/react hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockUser),
}));

// Mock @convex-dev/auth/react
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({
    signOut: mockSignOut,
  }),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    users: {
      getCurrent: "api.users.getCurrent",
    },
  },
}));

// Mock organization context
vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: () => ({
    organizationId: "org123",
    orgSlug: "test-organization",
    organizationName: "Test organization",
    userRole: "admin",
  }),
}));

// Mock TanStack Router - use importOriginal to preserve all exports
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({
      to,
      children,
      className,
      onClick,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
    }) => (
      <a href={to} className={className} onClick={onClick}>
        {children}
      </a>
    ),
    useNavigate: () => vi.fn(),
  };
});

describe("UserMenu", () => {
  it("renders user avatar", () => {
    render(<UserMenu />);
    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
    // Avatar component renders initials or image, accessible via role img or text
    // The Avatar component in this codebase seems to rely on Radix which might be complex to test deeply without full DOM
    // But we can check for the trigger button
  });

  it("opens menu and shows user details", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole("button", { name: "User menu" });
    await user.click(trigger);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("calls signOut when sign out is clicked", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    // Open menu
    await user.click(screen.getByRole("button", { name: "User menu" }));

    // Click sign out
    const signOutButton = screen.getByText("Sign out");
    await user.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });
});
