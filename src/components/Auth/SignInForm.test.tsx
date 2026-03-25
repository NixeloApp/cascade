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

vi.mock("@/hooks/useConvexHelpers", () => ({
  usePublicQuery: vi.fn(() => undefined),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

vi.mock("./GoogleAuthButton", () => ({
  GoogleAuthButton: ({ text }: { text: string }) => (
    <button type="button" data-testid="google-button">
      {text}
    </button>
  ),
}));

import { showError } from "@/lib/toast";
import { SignInForm } from "./SignInForm";

describe("SignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders initial state with Google button and email toggle", () => {
    render(<SignInForm />);

    expect(screen.getByTestId("google-button")).toBeInTheDocument();
    expect(screen.getByText("or")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON)).toBeInTheDocument();
    expect(screen.getByText("Continue with email")).toBeInTheDocument();
  });

  it("expands email form when Continue with email is clicked", async () => {
    render(<SignInForm />);

    const submitButton = screen.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_FORM)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.FORM_READY)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT)).toBeInTheDocument();
    });

    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT)).toHaveFocus();
  });

  it("calls signIn and navigates on successful submission", async () => {
    mockSignIn.mockResolvedValue(undefined);

    render(<SignInForm />);

    // Expand the form
    const expandButton = screen.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.AUTH.FORM_READY)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT)).toBeInTheDocument();
    });

    const emailInput = screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const passwordInput = screen.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Submit the form
    const form = screen.getByTestId(TEST_IDS.AUTH.FORM);
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("password", expect.any(FormData));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: expect.any(String) });
    });
  });

  it("shows error on sign in failure", async () => {
    mockSignIn.mockRejectedValue(new Error("Could not sign in"));

    render(<SignInForm />);

    // Expand the form
    const expandButton = screen.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON);
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.AUTH.FORM_READY)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT)).toBeInTheDocument();
    });

    const emailInput = screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const passwordInput = screen.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT);
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    const form = screen.getByTestId(TEST_IDS.AUTH.FORM);
    fireEvent.submit(form);

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(
        "Could not sign in. Please check your credentials and try again.",
      );
    });
  });

  it("shows verification guidance for unverified email errors", async () => {
    mockSignIn.mockRejectedValue(new Error("Please verify your email before signing in"));

    render(<SignInForm />);

    fireEvent.click(screen.getByTestId(TEST_IDS.AUTH.SUBMIT_BUTTON));

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId(TEST_IDS.AUTH.EMAIL_INPUT), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByTestId(TEST_IDS.AUTH.PASSWORD_INPUT), {
      target: { value: "password123" },
    });

    fireEvent.submit(screen.getByTestId(TEST_IDS.AUTH.FORM));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("Verify your email before signing in.");
    });
  });
});
