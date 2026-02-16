import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./email";
import { OTPVerification } from "./OTPVerification";

// Mock the email module
vi.mock("./email", () => ({
  sendEmail: vi.fn(),
}));

const sendVerificationRequest = (OTPVerification as any).options
  ? (OTPVerification as any).options.sendVerificationRequest
  : (OTPVerification as any).sendVerificationRequest;

describe("OTP Verification Rate Limit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should check rate limit before sending email", async () => {
    const mockCtx = {
      runMutation: vi.fn().mockResolvedValue(undefined), // Mock successful rate limit check
      runQuery: vi.fn(),
    };
    const email = "test@example.com";
    const token = "123456";

    // Mock successful email send
    vi.mocked(sendEmail).mockResolvedValue({ success: true });

    await sendVerificationRequest({ identifier: email, token }, mockCtx);

    // Rate limit check performed
    expect(mockCtx.runMutation).toHaveBeenCalledTimes(1);
    expect(mockCtx.runMutation).toHaveBeenCalledWith(expect.anything(), { email });

    // Email sent
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("should throw error if rate limit check fails", async () => {
    const mockCtx = {
      runMutation: vi.fn().mockRejectedValue(new Error("Rate limit exceeded")),
      runQuery: vi.fn(),
    };
    const email = "test@example.com";
    const token = "123456";

    await expect(sendVerificationRequest({ identifier: email, token }, mockCtx)).rejects.toThrow(
      "Too many verification requests. Please try again later.",
    );

    // Email NOT sent
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
