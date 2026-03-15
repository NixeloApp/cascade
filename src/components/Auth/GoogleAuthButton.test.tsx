import { describe, expect, it, vi } from "vitest";
import { usePublicQuery } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { GoogleAuthButton } from "./GoogleAuthButton";

const mockSignIn = vi.fn();

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  usePublicQuery: vi.fn(),
}));

const mockUsePublicQuery = vi.mocked(usePublicQuery);

describe("GoogleAuthButton", () => {
  it("renders enabled button with custom text when google auth is enabled", () => {
    mockUsePublicQuery.mockReturnValue(true);

    render(<GoogleAuthButton text="Sign in with Google" />);

    const button = screen.getByTestId(TEST_IDS.AUTH.GOOGLE_BUTTON);
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  it("renders disabled state with message when google auth is disabled", () => {
    mockUsePublicQuery.mockReturnValue(false);

    render(<GoogleAuthButton text="Sign in with Google" />);

    const button = screen.getByTestId(TEST_IDS.AUTH.GOOGLE_BUTTON);
    expect(button).toBeDisabled();
    expect(screen.getByText("Google sign-in temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByText(/OAuth recovery/)).toBeInTheDocument();
  });

  it("renders button while feature flag is loading", () => {
    mockUsePublicQuery.mockReturnValue(undefined);

    render(<GoogleAuthButton text="Continue with Google" />);

    const button = screen.getByTestId(TEST_IDS.AUTH.GOOGLE_BUTTON);
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});
