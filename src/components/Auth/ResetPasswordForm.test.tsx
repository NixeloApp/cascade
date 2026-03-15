import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";

const mockSignIn = vi.fn();

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("./PasswordStrengthIndicator", () => ({
  PasswordStrengthIndicator: () => <div data-testid="password-strength">strength</div>,
}));

import { showError, showSuccess } from "@/lib/toast";
import { ResetPasswordForm } from "./ResetPasswordForm";

describe("ResetPasswordForm", () => {
  const defaultProps = {
    email: "test@example.com",
    onSuccess: vi.fn(),
    onRetry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with code input, password input, and email display", () => {
    render(<ResetPasswordForm {...defaultProps} />);

    expect(screen.getByText("Enter reset code")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.RESET_CODE_INPUT)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.RESET_PASSWORD_INPUT)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.RESET_SUBMIT_BUTTON)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /didn't receive a code/i })).toBeInTheDocument();
  });

  it("calls onSuccess and shows toast after successful reset", async () => {
    mockSignIn.mockResolvedValue(undefined);

    render(<ResetPasswordForm {...defaultProps} />);

    const codeInput = screen.getByTestId(TEST_IDS.AUTH.RESET_CODE_INPUT);
    fireEvent.change(codeInput, { target: { value: "12345678" } });

    const passwordInput = screen.getByTestId(TEST_IDS.AUTH.RESET_PASSWORD_INPUT);
    fireEvent.change(passwordInput, { target: { value: "newPassword123" } });

    const submitButton = screen.getByTestId(TEST_IDS.AUTH.RESET_SUBMIT_BUTTON);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("password", expect.any(FormData));
    });

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith("Password reset successfully!");
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it("shows error on submission failure", async () => {
    const error = new Error("Invalid code");
    mockSignIn.mockRejectedValue(error);

    render(<ResetPasswordForm {...defaultProps} />);

    const codeInput = screen.getByTestId(TEST_IDS.AUTH.RESET_CODE_INPUT);
    fireEvent.change(codeInput, { target: { value: "12345678" } });

    const passwordInput = screen.getByTestId(TEST_IDS.AUTH.RESET_PASSWORD_INPUT);
    fireEvent.change(passwordInput, { target: { value: "newPassword123" } });

    const submitButton = screen.getByTestId(TEST_IDS.AUTH.RESET_SUBMIT_BUTTON);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(error, "Password reset");
    });
  });

  it("calls onRetry when retry link is clicked", () => {
    render(<ResetPasswordForm {...defaultProps} />);

    const retryButton = screen.getByRole("button", { name: /didn't receive a code/i });
    fireEvent.click(retryButton);

    expect(defaultProps.onRetry).toHaveBeenCalled();
  });
});
