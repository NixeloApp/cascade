import { describe, expect, it, vi } from "vitest";
import { addBreadcrumb, reportError, setErrorReportingProvider } from "./errorReporting";

describe("errorReporting", () => {
  it("reports errors to the configured provider", () => {
    const captureException = vi.fn();
    setErrorReportingProvider({ captureException });

    const error = new Error("test error");
    reportError(error, { context: "test" });

    expect(captureException).toHaveBeenCalledWith(error, { context: "test" });
  });

  it("normalizes string errors to Error instances", () => {
    const captureException = vi.fn();
    setErrorReportingProvider({ captureException });

    reportError("string error");

    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "string error" }),
      undefined,
    );
  });

  it("normalizes unknown errors to Error instances", () => {
    const captureException = vi.fn();
    setErrorReportingProvider({ captureException });

    reportError(42);

    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "42" }),
      undefined,
    );
  });

  it("records breadcrumbs when provider supports it", () => {
    const mockAddBreadcrumb = vi.fn();
    setErrorReportingProvider({
      captureException: vi.fn(),
      addBreadcrumb: mockAddBreadcrumb,
    });

    addBreadcrumb("user clicked save", { formId: "settings" });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith("user clicked save", { formId: "settings" });
  });

  it("works without a provider (development fallback)", () => {
    setErrorReportingProvider(null as never);

    // Should not throw
    expect(() => reportError(new Error("no provider"))).not.toThrow();
    expect(() => addBreadcrumb("test")).not.toThrow();
  });
});
