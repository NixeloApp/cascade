import { describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger";
import { sendEmail } from "./index";

// Mock the logger
vi.mock("../lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock providers
const mockSend = vi.fn();

vi.mock("./mailtrap", () => ({
  MailtrapProvider: class {
    send = mockSend;
  },
}));

vi.mock("./resend", () => ({
  ResendProvider: class {
    send = vi.fn();
  },
}));

vi.mock("./sendpulse", () => ({
  SendPulseProvider: class {
    send = vi.fn();
  },
}));

describe("sendEmail Error Handling", () => {
  it("should catch provider error and return success: false", async () => {
    // Configure mock to reject
    mockSend.mockRejectedValue(new Error("Provider Crashed"));

    // Force NODE_ENV to bypass test skip
    vi.stubEnv("NODE_ENV", "development");

    const result = await sendEmail(null, {
      to: "user@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Provider Crashed",
      }),
    );

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      "Provider send failed",
      expect.objectContaining({
        error: expect.objectContaining({ message: "Provider Crashed" }),
        provider: "mailtrap",
      }),
    );

    vi.unstubAllEnvs();
  });
});
