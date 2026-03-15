import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen } from "@/test/custom-render";
import { EmailVerificationRequired } from "./EmailVerificationRequired";

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn, signOut: mockSignOut }),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("./AuthPageLayout", () => ({
  AuthPageLayout: ({
    children,
    title,
    subtitle,
  }: {
    children: ReactNode;
    title: string;
    subtitle?: ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      {subtitle && <div>{subtitle}</div>}
      {children}
    </div>
  ),
}));

vi.mock("./AuthLink", () => ({
  AuthLinkButton: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

describe("EmailVerificationRequired", () => {
  it("renders the verification form with code input", () => {
    mockUseAuthenticatedQuery.mockReturnValue({ email: "user@test.com" });

    render(<EmailVerificationRequired />);

    expect(screen.getByText("Check your email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter 8-digit code")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify email" })).toBeInTheDocument();
  });

  it("shows resend and sign out options", () => {
    mockUseAuthenticatedQuery.mockReturnValue({ email: "user@test.com" });

    render(<EmailVerificationRequired />);

    expect(screen.getByText("Resend code")).toBeInTheDocument();
    expect(screen.getByText("Use a different account")).toBeInTheDocument();
  });

  it("displays the user email", () => {
    mockUseAuthenticatedQuery.mockReturnValue({ email: "hello@example.com" });

    render(<EmailVerificationRequired />);

    expect(screen.getByText("hello@example.com")).toBeInTheDocument();
  });
});
