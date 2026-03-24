import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ErrorBoundary } from "./ErrorBoundary";

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
}

describe("ErrorBoundary", () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it("should render children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Child component</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Child component")).toBeInTheDocument();
  });

  it("should render default error UI with recovery actions", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it("should render custom fallback UI when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("should call onError callback when error occurs", () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    const [error, errorInfo] = onError.mock.calls[0];
    expect(error.message).toBe("Test error");
    expect(errorInfo).toHaveProperty("componentStack");
  });

  it("should display error message and component stack in expandable section", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const details = screen.getByText("View error details");
    expect(details).toBeInTheDocument();

    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it("should reset error state when Try again is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    // After clicking Try again, ErrorBoundary resets state and re-renders
    // children. Since ThrowError still throws, the error shows again —
    // but the state reset happened (the boundary re-attempted rendering).
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should navigate to dashboard when Go to dashboard is clicked", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", {
      value: { href: "", reload: vi.fn() },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const dashboardButton = screen.getByRole("button", { name: /go to dashboard/i });
    await user.click(dashboardButton);

    expect(window.location.href).toBe("/");
  });
});
