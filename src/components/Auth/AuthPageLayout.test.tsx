import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/components/Landing", () => ({
  NixeloLogo: ({ size }: { size?: number }) => (
    <div data-testid="nixelo-logo" data-size={size}>
      Logo
    </div>
  ),
}));

import { AuthPageLayout } from "./AuthPageLayout";

describe("AuthPageLayout", () => {
  it("renders title and children", () => {
    render(
      <AuthPageLayout title="Welcome back">
        <div data-testid="child-content">Sign in form here</div>
      </AuthPageLayout>,
    );

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Sign in form here")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <AuthPageLayout title="Sign in" subtitle="Enter your credentials to continue">
        <div>Form</div>
      </AuthPageLayout>,
    );

    expect(screen.getByText("Enter your credentials to continue")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(
      <AuthPageLayout title="Sign in">
        <div>Form</div>
      </AuthPageLayout>,
    );

    expect(screen.queryByText("Enter your credentials to continue")).not.toBeInTheDocument();
  });

  it("renders branding elements and footer links", () => {
    render(
      <AuthPageLayout title="Sign in">
        <div>Form</div>
      </AuthPageLayout>,
    );

    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Secure account access")).toBeInTheDocument();
  });
});
