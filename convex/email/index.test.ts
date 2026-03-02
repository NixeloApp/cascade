import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger";
import { sendEmail } from "./index";

// Mock the logger to verify calls
vi.mock("../lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the providers to avoid actual network calls
vi.mock("./mailtrap", () => ({
  MailtrapProvider: class {
    send = vi.fn().mockResolvedValue({ success: true, id: "mock-mailtrap-id" });
  },
}));

vi.mock("./resend", () => ({
  ResendProvider: class {
    send = vi.fn().mockResolvedValue({ success: true, id: "mock-resend-id" });
  },
}));

vi.mock("./sendpulse", () => ({
  SendPulseProvider: class {
    send = vi.fn().mockResolvedValue({ success: true, id: "mock-sendpulse-id" });
  },
}));

describe("sendEmail Error Handling", () => {
  const mockDb = {
    query: vi.fn().mockReturnThis(),
    withIndex: vi.fn().mockReturnThis(),
    first: vi.fn(),
    patch: vi.fn(),
    insert: vi.fn(),
  };

  const mockCtx = {
    db: mockDb,
    scheduler: { runAfter: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Force NODE_ENV to something other than 'test' to bypass the test skip logic in sendEmail
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should log error when provider selection fails", async () => {
    // Simulate DB error during selection
    mockDb.first.mockRejectedValueOnce(new Error("DB Connection Failed"));

    await sendEmail(mockCtx as any, {
      to: "user@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to select provider"),
      expect.objectContaining({
        error: expect.objectContaining({ message: "DB Connection Failed" }),
      }),
    );
  });

  it("should log error when usage recording fails", async () => {
    // Simulate successful selection (mocking DB calls for usage check)
    mockDb.first.mockResolvedValue({ unitsUsed: 0 });

    // Simulate usage recording failure (e.g., patch fails)
    // First call to first() is for provider selection (monthly usage)
    // Second call to first() is for provider selection (daily usage)
    // Third call to first() is for usage recording (monthly usage)
    // Fourth call to first() is for usage recording (daily usage)
    // Actually, recordUsage calls first() then patch() or insert().

    // Let's make first() succeed always
    mockDb.first.mockResolvedValue({ _id: "usage-id", unitsUsed: 0 });

    // Make patch() fail
    mockDb.patch.mockRejectedValueOnce(new Error("Usage Update Failed"));

    await sendEmail(mockCtx as any, {
      to: "user@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to record usage"),
      expect.objectContaining({
        error: expect.objectContaining({ message: "Usage Update Failed" }),
      }),
    );
  });
});
