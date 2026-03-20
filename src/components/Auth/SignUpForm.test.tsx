import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("./GoogleAuthButton", () => ({
  GoogleAuthButton: ({ text }: { text: string }) => (
    <button type="button" data-testid="google-button">
      {text}
    </button>
  ),
}));

vi.mock("./PasswordStrengthIndicator", () => ({
  PasswordStrengthIndicator: () => <div data-testid="password-strength">strength</div>,
}));

vi.mock("./EmailVerificationForm", () => ({
  EmailVerificationForm: ({ email }: { email: string }) => (
    <div data-testid="verification-form">Verifying {email}</div>
  ),
}));

import { showError, showSuccess } from "@/lib/toast";
import { SignUpForm } from "./SignUpForm";

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initial state with Google button and email toggle", () => {
    render(<SignUpForm />);

    expect(screen.getByTestId("google-button")).toBeInTheDocument();
    expect(screen.getByText("Sign up with Google")).toBeInTheDocument();
    expect(screen.getByText("or")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON)).toBeInTheDocument();
    expect(screen.getByText("Continue with email")).toBeInTheDocument();
  });

  it("expands email form when Continue with email is clicked", async () => {
    render(<SignUpForm />);

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.AUTH.FORM_HYDRATED)).toBeInTheDocument();
    });

    const submitButton = screen.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_FORM)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.FORM_READY)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT)).toBeInTheDocument();
    });

    expect(screen.getByText("Create account")).toBeInTheDocument();
  });

  it("shows verification form after successful sign up", async () => {
    mockSignIn.mockResolvedValue(undefined);

    render(<SignUpForm />);

    // Expand the form
    const expandButton = screen.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.AUTH.FORM_READY)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT)).toBeInTheDocument();
    });

    const emailInput = screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT);
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });

    const passwordInput = screen.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT);
    fireEvent.change(passwordInput, { target: { value: "StrongPassword1!" } });

    const form = screen.getByTestId(TEST_IDS.AUTH.FORM);
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("password", expect.any(FormData));
    });

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith("Check your email for a verification code");
      expect(screen.getByTestId("verification-form")).toBeInTheDocument();
      expect(screen.getByText("Verifying new@example.com")).toBeInTheDocument();
    });
  });

  it("shows error on sign up failure", async () => {
    const error = new Error("Email already in use");
    mockSignIn.mockRejectedValue(error);

    render(<SignUpForm />);

    // Expand the form
    const expandButton = screen.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.AUTH.FORM_READY)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT)).toBeInTheDocument();
    });

    const emailInput = screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT);
    fireEvent.change(emailInput, { target: { value: "existing@example.com" } });

    const passwordInput = screen.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT);
    fireEvent.change(passwordInput, { target: { value: "StrongPassword1!" } });

    const form = screen.getByTestId(TEST_IDS.AUTH.FORM);
    fireEvent.submit(form);

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(error, "Could not create account");
    });
  });
});
