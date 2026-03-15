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

import { showError, showSuccess } from "@/lib/toast";
import { EmailVerificationForm } from "./EmailVerificationForm";

describe("EmailVerificationForm", () => {
  const defaultProps = {
    email: "user@example.com",
    onVerified: vi.fn(),
    onResend: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with email display and code input", () => {
    render(<EmailVerificationForm {...defaultProps} />);

    expect(screen.getByText("Verify your email")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.VERIFICATION_CODE_INPUT)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.VERIFICATION_SUBMIT_BUTTON)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /didn't receive a code/i })).toBeInTheDocument();
  });

  it("calls onVerified and shows success toast after successful verification", async () => {
    mockSignIn.mockResolvedValue(undefined);

    render(<EmailVerificationForm {...defaultProps} />);

    const codeInput = screen.getByTestId(TEST_IDS.AUTH.VERIFICATION_CODE_INPUT);
    fireEvent.change(codeInput, { target: { value: "12345678" } });

    const submitButton = screen.getByTestId(TEST_IDS.AUTH.VERIFICATION_SUBMIT_BUTTON);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("password", expect.any(FormData));
    });

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith("Email verified successfully!");
      expect(defaultProps.onVerified).toHaveBeenCalled();
    });
  });

  it("shows error on invalid code", async () => {
    mockSignIn.mockRejectedValue(new Error("Invalid code"));

    render(<EmailVerificationForm {...defaultProps} />);

    const codeInput = screen.getByTestId(TEST_IDS.AUTH.VERIFICATION_CODE_INPUT);
    fireEvent.change(codeInput, { target: { value: "12345678" } });

    const submitButton = screen.getByTestId(TEST_IDS.AUTH.VERIFICATION_SUBMIT_BUTTON);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("Invalid code. Please try again.");
    });
  });

  it("handles resend code action", async () => {
    mockSignIn.mockRejectedValue(new Error("User exists"));

    render(<EmailVerificationForm {...defaultProps} />);

    const resendButton = screen.getByRole("button", { name: /didn't receive a code/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith("Verification code resent!");
      expect(defaultProps.onResend).toHaveBeenCalled();
    });
  });
});
