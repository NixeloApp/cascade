import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

const {
  mockUseParams,
  mockUseSearch,
  mockNavigate,
  mockUsePublicQuery,
  mockUseAuthenticatedMutation,
  mockSignInForm,
} = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
  mockUseSearch: vi.fn(),
  mockNavigate: vi.fn(),
  mockUsePublicQuery: vi.fn(),
  mockUseAuthenticatedMutation: vi.fn(),
  mockSignInForm: vi.fn(() => <div data-testid="invite-sign-in-form">sign-in form</div>),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  createFileRoute: () => () => ({
    useParams: mockUseParams,
    useSearch: mockUseSearch,
  }),
}));

vi.mock("convex/react", () => ({
  Authenticated: ({ children }: { children: ReactNode }) => <>{children}</>,
  Unauthenticated: () => null,
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  usePublicQuery: mockUsePublicQuery,
  useAuthenticatedMutation: mockUseAuthenticatedMutation,
}));

vi.mock("@/components/Auth", () => ({
  AuthRedirect: ({ children }: { children: ReactNode }) => <>{children}</>,
  SignInForm: mockSignInForm,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { InviteRoute } from "./invite.$token";

describe("invite route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ token: "invite-test-token" });
    mockUseSearch.mockReturnValue({});
    mockUseAuthenticatedMutation.mockReturnValue({ mutate: vi.fn() });
  });

  it("renders the branded loading state while the invite query is unresolved", () => {
    mockUsePublicQuery.mockReturnValue(undefined);

    render(<InviteRoute />);

    expect(screen.getByText("Nixelo")).toBeInTheDocument();
    expect(screen.getByText("Loading invitation...")).toBeInTheDocument();
  });

  it("renders the invalid invitation branch inside the invite shell", () => {
    mockUsePublicQuery.mockReturnValue(null);

    render(<InviteRoute />);

    expect(screen.getByText("Nixelo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Invalid Invitation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Home" })).toBeInTheDocument();
  });

  it("renders the expired invitation branch inside the invite shell", () => {
    mockUseParams.mockReturnValue({ token: "screenshot-test-token" });
    mockUseSearch.mockReturnValue({ previewState: "expired" });
    mockUsePublicQuery.mockReturnValue(null);

    render(<InviteRoute />);

    expect(screen.getByRole("heading", { name: "Invitation Expired" })).toBeInTheDocument();
    expect(screen.getByText("Emily Chen")).toBeInTheDocument();
    expect(screen.getByText("Nixelo")).toBeInTheDocument();
  });

  it("renders the revoked invitation branch inside the invite shell", () => {
    mockUseParams.mockReturnValue({ token: "screenshot-test-token" });
    mockUseSearch.mockReturnValue({ previewState: "revoked" });
    mockUsePublicQuery.mockReturnValue(null);

    render(<InviteRoute />);

    expect(screen.getByRole("heading", { name: "Invitation Revoked" })).toBeInTheDocument();
    expect(screen.getByText(/team administrator/i)).toBeInTheDocument();
  });

  it("renders the accepted invitation branch inside the invite shell", () => {
    mockUseParams.mockReturnValue({ token: "screenshot-test-token" });
    mockUseSearch.mockReturnValue({ previewState: "accepted" });
    mockUsePublicQuery.mockReturnValue(null);

    render(<InviteRoute />);

    expect(screen.getByRole("heading", { name: "Already Accepted" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Dashboard" })).toBeInTheDocument();
  });

  it("renders the pending invitation card with project details", () => {
    mockUsePublicQuery.mockReturnValue({
      email: "invitee@nixelo.test",
      inviterName: "Alex Rivera",
      isExpired: false,
      projectId: "project_123",
      projectName: "Demo Project",
      projectRole: "viewer",
      role: "user",
      status: "pending",
    });

    render(<InviteRoute />);

    expect(screen.getByRole("heading", { name: "You're Invited!" })).toBeInTheDocument();
    expect(screen.getAllByText("Demo Project")).not.toHaveLength(0);
    expect(screen.getByText("viewer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept Invitation" })).toBeInTheDocument();
  });
});
