import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock useNavigate
const mockNavigate = vi.fn();

// Mock TanStack Router
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/signin" }),
  };
});

// Mock Convex useQuery
let mockRedirectPath: string | undefined;
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockRedirectPath),
}));

// Import after mocks
import { AuthRedirect } from "./AuthRedirect";

describe("AuthRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirectPath = undefined;
  });

  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <AuthRedirect>
          <div data-testid="child">Sign In Form</div>
        </AuthRedirect>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Sign In Form")).toBeInTheDocument();
    });

    it("should render children even when redirect is pending", () => {
      mockRedirectPath = "/dashboard";

      render(
        <AuthRedirect>
          <form data-testid="auth-form">Form content</form>
        </AuthRedirect>,
      );

      // Children should still be rendered during transition
      expect(screen.getByTestId("auth-form")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to redirect path when different from current", () => {
      mockRedirectPath = "/dashboard";

      render(
        <AuthRedirect>
          <div>Content</div>
        </AuthRedirect>,
      );

      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/dashboard",
        replace: true,
      });
    });

    it("should not navigate when redirect path is undefined", () => {
      mockRedirectPath = undefined;

      render(
        <AuthRedirect>
          <div>Content</div>
        </AuthRedirect>,
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should not navigate when redirect path matches current location", async () => {
      // Current location is /signin (from mock)
      mockRedirectPath = "/signin";

      render(
        <AuthRedirect>
          <div>Content</div>
        </AuthRedirect>,
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should use replace navigation mode", () => {
      mockRedirectPath = "/onboarding";

      render(
        <AuthRedirect>
          <div>Content</div>
        </AuthRedirect>,
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          replace: true,
        }),
      );
    });
  });
});
