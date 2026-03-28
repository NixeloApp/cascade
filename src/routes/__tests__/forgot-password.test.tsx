import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Typography } from "@/components/ui/Typography";
import { render, screen } from "@/test/custom-render";

const { mockUseSearch, mockNavigate, mockForgotPasswordForm, mockResetPasswordForm } = vi.hoisted(
  () => ({
    mockUseSearch: vi.fn(),
    mockNavigate: vi.fn(),
    mockForgotPasswordForm: vi.fn(({ onCodeSent }: { onCodeSent: (email: string) => void }) => (
      <button type="button" onClick={() => onCodeSent("flow@example.com")}>
        Start reset
      </button>
    )),
    mockResetPasswordForm: vi.fn(({ email }: { email: string }) => (
      <div data-testid="reset-password-form">{email}</div>
    )),
  }),
);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    useSearch: mockUseSearch,
    useNavigate: () => mockNavigate,
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
  ForgotPasswordForm: mockForgotPasswordForm,
  ResetPasswordForm: mockResetPasswordForm,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

import { ForgotPasswordRoute } from "../forgot-password";

describe("forgot password route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    mockUseSearch.mockReturnValue({});
  });

  it("renders the request step by default", () => {
    render(<ForgotPasswordRoute />);

    expect(screen.getByText("Reset your password")).toBeInTheDocument();
    expect(mockForgotPasswordForm).toHaveBeenCalled();
    expect(mockResetPasswordForm).not.toHaveBeenCalled();
  });

  it("renders the reset step from search-provided email without relying on session storage", () => {
    mockUseSearch.mockReturnValue({
      step: "reset",
      email: "screenshots@inbox.mailtrap.io",
    });

    render(<ForgotPasswordRoute />);

    expect(screen.getByText("Check your email")).toBeInTheDocument();
    expect(screen.getByTestId("reset-password-form")).toHaveTextContent(
      "screenshots@inbox.mailtrap.io",
    );
    expect(window.sessionStorage.getItem("auth:forgot-password-email")).toBe(
      "screenshots@inbox.mailtrap.io",
    );
  });
});
