import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";

const mockSignIn = vi.fn();

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

import { showError } from "@/lib/toast";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  const defaultProps = {
    onCodeSent: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with email input and submit button", () => {
    render(<ForgotPasswordForm {...defaultProps} />);

    expect(screen.getByText("Reset your password")).toBeInTheDocument();
    expect(screen.getByText(/send you a code/)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset code/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to sign in/i })).toBeInTheDocument();
  });

  it("calls onCodeSent after successful submission", async () => {
    mockSignIn.mockResolvedValue(undefined);

    render(<ForgotPasswordForm {...defaultProps} />);

    const emailInput = screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", { name: /send reset code/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("password", expect.any(FormData));
    });

    await waitFor(() => {
      expect(defaultProps.onCodeSent).toHaveBeenCalledWith("test@example.com");
    });
  });

  it("shows error on submission failure", async () => {
    const error = new Error("Network error");
    mockSignIn.mockRejectedValue(error);

    render(<ForgotPasswordForm {...defaultProps} />);

    const emailInput = screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", { name: /send reset code/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(error, "Password reset request");
    });
  });

  it("calls onBack when back link is clicked", () => {
    render(<ForgotPasswordForm {...defaultProps} />);

    const backButton = screen.getByRole("button", { name: /back to sign in/i });
    fireEvent.click(backButton);

    expect(defaultProps.onBack).toHaveBeenCalled();
  });
});
