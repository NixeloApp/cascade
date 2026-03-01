import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock TanStack Router Link component
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({
      to,
      children,
      className,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

// Import after mocks
import { AuthLink, AuthLinkButton } from "./AuthLink";

describe("AuthLink", () => {
  describe("Rendering", () => {
    it("should render children", () => {
      render(<AuthLink to="/signin">Sign In</AuthLink>);

      expect(screen.getByText("Sign In")).toBeInTheDocument();
    });

    it("should render as a link", () => {
      render(<AuthLink to="/signup">Create Account</AuthLink>);

      expect(screen.getByRole("link", { name: "Create Account" })).toBeInTheDocument();
    });

    it("should have correct href", () => {
      render(<AuthLink to="/forgot-password">Forgot Password?</AuthLink>);

      expect(screen.getByRole("link")).toHaveAttribute("href", "/forgot-password");
    });
  });

  describe("Styling", () => {
    it("should apply custom className", () => {
      render(
        <AuthLink to="/signin" className="custom-class">
          Sign In
        </AuthLink>,
      );

      expect(screen.getByRole("link")).toHaveClass("custom-class");
    });

    it("should apply base link styles", () => {
      render(<AuthLink to="/signin">Sign In</AuthLink>);

      expect(screen.getByRole("link")).toHaveClass("text-sm");
    });
  });
});

describe("AuthLinkButton", () => {
  describe("Rendering", () => {
    it("should render children", () => {
      render(<AuthLinkButton onClick={vi.fn()}>Resend Code</AuthLinkButton>);

      expect(screen.getByText("Resend Code")).toBeInTheDocument();
    });

    it("should render as a button", () => {
      render(<AuthLinkButton onClick={vi.fn()}>Click Me</AuthLinkButton>);

      expect(screen.getByRole("button", { name: "Click Me" })).toBeInTheDocument();
    });
  });

  describe("Click Handler", () => {
    it("should call onClick when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<AuthLinkButton onClick={onClick}>Resend Code</AuthLinkButton>);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <AuthLinkButton onClick={onClick} disabled>
          Resend Code
        </AuthLinkButton>,
      );

      await user.click(screen.getByRole("button"));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(
        <AuthLinkButton onClick={vi.fn()} disabled>
          Resend Code
        </AuthLinkButton>,
      );

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should not be disabled by default", () => {
      render(<AuthLinkButton onClick={vi.fn()}>Resend Code</AuthLinkButton>);

      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });

  describe("Variants", () => {
    it("should apply default variant styles by default", () => {
      render(<AuthLinkButton onClick={vi.fn()}>Resend Code</AuthLinkButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-brand-ring");
    });

    it("should apply muted variant styles when specified", () => {
      render(
        <AuthLinkButton onClick={vi.fn()} variant="muted">
          Cancel
        </AuthLinkButton>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-ui-text-tertiary");
    });
  });

  describe("Custom Props", () => {
    it("should apply custom className", () => {
      render(
        <AuthLinkButton onClick={vi.fn()} className="custom-class">
          Click Me
        </AuthLinkButton>,
      );

      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });
  });
});
