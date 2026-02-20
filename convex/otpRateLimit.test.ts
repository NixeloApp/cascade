import { describe, expect, it, vi } from "vitest";
import { otpPasswordReset } from "./otpPasswordReset";

// Mock internal object because codegen hasn't run
vi.mock("./_generated/api", () => ({
  internal: {
    authWrapper: {
      checkPasswordResetRateLimitByEmail: "mocked-mutation-ref",
    },
  },
}));

// Mock React Email templates and render function to avoid JSX transformation issues in tests
vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html>Mocked email HTML</html>"),
}));

vi.mock("../emails/PasswordResetEmail", () => ({
  PasswordResetEmail: vi.fn(() => null),
}));

// Mock sendEmail
vi.mock("./email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe("OTP Rate Limiting", () => {
  it("should enforce rate limiting on password reset requests", async () => {
    const mockRunMutation = vi.fn().mockResolvedValue(undefined);
    const mockCtx = {
      runMutation: mockRunMutation,
      db: {
        query: () => ({
          withIndex: () => ({
            first: () => Promise.resolve(null),
          }),
        }),
      } as any,
      scheduler: {} as any,
    };

    const email = "victim@example.com";
    const token = "123456";

    // Access custom implementation
    const sendVerificationRequest = (otpPasswordReset as any).options.sendVerificationRequest;

    // Call once
    await sendVerificationRequest({ identifier: email, token }, mockCtx as any);

    // Verify rate limit mutation was called
    expect(mockRunMutation).toHaveBeenCalledWith("mocked-mutation-ref", { email });

    // Now simulate rate limit exceeded
    mockRunMutation.mockRejectedValueOnce(new Error("Rate limit exceeded"));

    // Expect it to throw
    await expect(
      sendVerificationRequest({ identifier: email, token }, mockCtx as any),
    ).rejects.toThrow("Too many password reset requests. Please try again later.");
  });
});
