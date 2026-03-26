import { describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { fireEvent, render, screen } from "@/test/custom-render";
import { AuthEmailFormSection } from "./AuthEmailFormSection";

describe("AuthEmailFormSection", () => {
  it("renders the collapsed call-to-action and requests expansion", () => {
    const onRequestOpen = vi.fn();

    render(
      <AuthEmailFormSection
        open={false}
        submitting={false}
        submitLabel="Sign in"
        onRequestOpen={onRequestOpen}
      >
        <div>Fields</div>
      </AuthEmailFormSection>,
    );

    expect(screen.getByRole("button", { name: "Continue with email" })).toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.AUTH.EMAIL_FORM)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
    expect(onRequestOpen).toHaveBeenCalledTimes(1);
  });

  it("renders expanded fields, ready marker, and footer content", () => {
    render(
      <AuthEmailFormSection
        open
        submitting={false}
        submitLabel="Create account"
        onRequestOpen={() => {}}
        footer={<button type="button">Forgot password?</button>}
      >
        <input data-testid="field" />
      </AuthEmailFormSection>,
    );

    expect(screen.getByTestId(TEST_IDS.AUTH.EMAIL_FORM)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.AUTH.FORM_READY)).toBeInTheDocument();
    expect(screen.getByTestId("field")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Forgot password?" })).toBeInTheDocument();
  });
});
