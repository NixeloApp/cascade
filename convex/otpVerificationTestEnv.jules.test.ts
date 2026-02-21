import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { sendEmail } from "./email";
import { otpVerification } from "./otpVerification";

// Mock dependencies
vi.mock("./email", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html>Mocked email HTML</html>"),
}));

vi.mock("../emails/VerifyEmail", () => ({
  VerifyEmail: vi.fn(() => null),
}));

// Access the internal function hidden in the provider options
// Using 'any' cast to bypass TypeScript type limitations for testing internal functions
const sendVerificationRequest = (otpVerification as any).options
  ? (otpVerification as any).options.sendVerificationRequest
  : (otpVerification as any).sendVerificationRequest;

describe("OTP Verification Environment Safety", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should store OTP for test email in safe environment", async () => {
    // Setup safe environment
    process.env.NODE_ENV = "test";
    process.env.E2E_API_KEY = "test-key";

    const mockCtx = {
      runMutation: vi.fn().mockResolvedValue(undefined),
      runQuery: vi.fn(),
      runAction: vi.fn(),
    };

    // Mock successful email send
    vi.mocked(sendEmail).mockResolvedValue({ success: true, id: "test-id" });

    const email = "user@inbox.mailtrap.io";
    const token = "123456";

    // biome-ignore lint/suspicious/noTsIgnore: accessing private internal function for testing
    // @ts-ignore
    // biome-ignore lint/suspicious/noTsIgnore: accessing private internal function for testing
    // @ts-ignore
    // biome-ignore lint/suspicious/noTsIgnore: accessing private internal function for testing
    // @ts-ignore
    await sendVerificationRequest({ identifier: email, token }, mockCtx);

    // Verify calls
    // Expect 2 mutations: rate limit check + store test OTP
    expect(mockCtx.runMutation).toHaveBeenCalledTimes(2);

    // First call: Rate limit
    expect(mockCtx.runMutation).toHaveBeenNthCalledWith(1, expect.anything(), { email });

    // Second call: Store OTP
    expect(mockCtx.runMutation).toHaveBeenNthCalledWith(2, internal.e2e.storeTestOtp, {
      email,
      code: token,
      type: "verification",
    });
  });

  it("should NOT store OTP for test email in UNSAFE environment", async () => {
    // Setup unsafe environment (Production, no CI, no E2E Key)
    process.env.NODE_ENV = "production";
    delete process.env.CI;
    delete process.env.E2E_API_KEY;

    const mockCtx = {
      runMutation: vi.fn().mockResolvedValue(undefined),
      runQuery: vi.fn(),
      runAction: vi.fn(),
    };

    vi.mocked(sendEmail).mockResolvedValue({ success: true, id: "test-id" });

    const email = "user@inbox.mailtrap.io";
    const token = "123456";

    // @ts-expect-error
    await sendVerificationRequest({ identifier: email, token }, mockCtx);

    // Should only call rate limit (1 time), NOT store OTP
    expect(mockCtx.runMutation).toHaveBeenCalledTimes(1);
    expect(mockCtx.runMutation).toHaveBeenCalledWith(expect.anything(), { email });

    // But email should still be sent
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("should NOT store OTP for regular user even in safe environment", async () => {
    // Setup safe environment
    process.env.NODE_ENV = "test";
    process.env.E2E_API_KEY = "test-key";

    const mockCtx = {
      runMutation: vi.fn().mockResolvedValue(undefined),
      runQuery: vi.fn(),
      runAction: vi.fn(),
    };

    vi.mocked(sendEmail).mockResolvedValue({ success: true, id: "test-id" });

    const email = "regular@example.com"; // NOT mailtrap
    const token = "123456";

    // @ts-expect-error
    await sendVerificationRequest({ identifier: email, token }, mockCtx);

    // Should only call rate limit
    expect(mockCtx.runMutation).toHaveBeenCalledTimes(1);
    // Verify the only call was NOT for storing OTP (checking args)
    expect(mockCtx.runMutation).toHaveBeenLastCalledWith(expect.anything(), { email });
  });

  it("should suppress email errors for test emails", async () => {
    // Setup safe environment
    process.env.NODE_ENV = "test";

    const mockCtx = {
      runMutation: vi.fn().mockResolvedValue(undefined),
      runQuery: vi.fn(),
      runAction: vi.fn(),
    };

    // Mock email FAILURE
    vi.mocked(sendEmail).mockResolvedValue({
      success: false,
      error: "Mock Error",
      id: "mock-failure-id",
    });

    const email = "user@inbox.mailtrap.io";
    const token = "123456";

    // Should NOT throw (email error is swallowed for test emails)
    await expect(
      sendVerificationRequest({ identifier: email, token }, mockCtx),
    ).resolves.toBeUndefined();

    // Store OTP should still have been called before email send
    expect(mockCtx.runMutation).toHaveBeenCalledWith(internal.e2e.storeTestOtp, expect.anything());
  });

  it("should THROW email errors for regular emails", async () => {
    // Setup safe environment
    process.env.NODE_ENV = "test";

    const mockCtx = {
      runMutation: vi.fn().mockResolvedValue(undefined),
      runQuery: vi.fn(),
      runAction: vi.fn(),
    };

    // Mock email FAILURE
    vi.mocked(sendEmail).mockResolvedValue({
      success: false,
      error: "Mock Error",
      id: "mock-failure-id",
    });

    const email = "regular@example.com";
    const token = "123456";

    // Should THROW (email errors propagate for regular emails)
    await expect(sendVerificationRequest({ identifier: email, token }, mockCtx)).rejects.toThrow(
      "Could not send verification email",
    );
  });
});
