import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Typography } from "@/components/ui/Typography";
import { render, screen } from "@/test/custom-render";

const { mockUseSearch, mockSignUpForm } = vi.hoisted(() => ({
  mockUseSearch: vi.fn(),
  mockSignUpForm: vi.fn(({ initialVerificationEmail }: { initialVerificationEmail?: string }) => (
    <div data-testid="signup-form">{initialVerificationEmail ?? "default"}</div>
  )),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    useSearch: mockUseSearch,
  }),
}));

vi.mock("@/components/Auth", () => ({
  AuthLink: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  AuthPageLayout: ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle: ReactNode;
    children: ReactNode;
  }) => (
    <section>
      <Typography as="h1">{title}</Typography>
      <div>{subtitle}</div>
      {children}
    </section>
  ),
  AuthRedirect: ({ children }: { children: ReactNode }) => <>{children}</>,
  SignUpForm: mockSignUpForm,
}));

import { SignUpRoute } from "./signup";

describe("signup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({});
  });

  it("renders the default signup state when no verification search is present", () => {
    render(<SignUpRoute />);

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    expect(mockSignUpForm).toHaveBeenCalledWith({}, undefined);
  });

  it("passes the search-provided verification email into the signup flow", () => {
    mockUseSearch.mockReturnValue({
      step: "verify",
      email: "screenshots@inbox.mailtrap.io",
    });

    render(<SignUpRoute />);

    expect(screen.getByTestId("signup-form")).toHaveTextContent("screenshots@inbox.mailtrap.io");
    expect(mockSignUpForm).toHaveBeenCalledWith(
      { initialVerificationEmail: "screenshots@inbox.mailtrap.io" },
      undefined,
    );
  });
});
