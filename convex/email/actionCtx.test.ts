import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
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

// Mock the providers
vi.mock("./mailtrap", () => ({
  MailtrapProvider: class {
    send = vi.fn().mockResolvedValue({ success: true, id: "mock-mailtrap-id" });
  },
}));

describe("sendEmail with ActionCtx", () => {
  const mockActionCtx = {
    runQuery: vi.fn(),
    runMutation: vi.fn(),
    runAction: vi.fn(),
    scheduler: { runAfter: vi.fn() },
    auth: { getUserIdentity: vi.fn() },
    vectorSearch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SKIP_USAGE_RECORDING", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should use runQuery to select provider and runMutation to record usage", async () => {
    // Mock selectProviderQuery response
    mockActionCtx.runQuery.mockResolvedValue({ name: "mailtrap" });

    // Mock recordUsageMutation response
    mockActionCtx.runMutation.mockResolvedValue(undefined);

    const result = await sendEmail(mockActionCtx as any, {
      to: "user@example.com",
      subject: "Action Test",
      html: "<p>Test</p>",
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("mailtrap");

    // Verify runQuery was called for provider selection
    expect(mockActionCtx.runQuery).toHaveBeenCalledWith(
      internal.email.index.selectProviderQuery,
      {},
    );

    // Verify runMutation was called for usage recording
    expect(mockActionCtx.runMutation).toHaveBeenCalledWith(
      internal.email.index.recordUsageMutation,
      { provider: "mailtrap", count: 1 },
    );
  });

  it("should fallback to default provider if selectProviderQuery fails", async () => {
    // Mock selectProviderQuery failure
    mockActionCtx.runQuery.mockRejectedValue(new Error("Query failed"));

    // Mock recordUsageMutation response
    mockActionCtx.runMutation.mockResolvedValue(undefined);

    const result = await sendEmail(mockActionCtx as any, {
      to: "user@example.com",
      subject: "Action Test",
      html: "<p>Test</p>",
    });

    // Default provider is mailtrap (priority 1)
    expect(result.success).toBe(true);
    expect(result.provider).toBe("mailtrap");

    // Verify logger error
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to select provider via action"),
      expect.objectContaining({ error: expect.any(Error) }),
    );

    // Verify usage recording still happens for default provider
    expect(mockActionCtx.runMutation).toHaveBeenCalledWith(
      internal.email.index.recordUsageMutation,
      { provider: "mailtrap", count: 1 },
    );
  });

  it("should log error if recordUsageMutation fails but still succeed", async () => {
    // Mock selectProviderQuery response
    mockActionCtx.runQuery.mockResolvedValue({ name: "mailtrap" });

    // Mock recordUsageMutation failure
    mockActionCtx.runMutation.mockRejectedValue(new Error("Mutation failed"));

    const result = await sendEmail(mockActionCtx as any, {
      to: "user@example.com",
      subject: "Action Test",
      html: "<p>Test</p>",
    });

    expect(result.success).toBe(true);

    // Verify logger error
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to record usage via action"),
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });

  it("should skip usage recording if SKIP_USAGE_RECORDING is set", async () => {
    vi.stubEnv("SKIP_USAGE_RECORDING", "true");

    mockActionCtx.runQuery.mockResolvedValue({ name: "mailtrap" });

    await sendEmail(mockActionCtx as any, {
      to: "user@example.com",
      subject: "Action Test",
      html: "<p>Test</p>",
    });

    expect(mockActionCtx.runMutation).not.toHaveBeenCalled();
  });
});
