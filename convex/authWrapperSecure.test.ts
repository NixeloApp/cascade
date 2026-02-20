import { beforeEach, describe, expect, it, vi } from "vitest";
import { performPasswordResetHandler } from "./authWrapper";
import { logger } from "./lib/logger";

// Mock logger
vi.mock("./lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock getConvexSiteUrl
vi.mock("./lib/env", () => ({
  getConvexSiteUrl: () => "https://example.com",
}));

describe("performPasswordResetHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log error if fetch returns non-200 status", async () => {
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const mockCtx = {} as any;
    const args = { email: "test@example.com" };

    await performPasswordResetHandler(mockCtx, args);

    expect(logger.error).toHaveBeenCalledWith(
      "Password reset request failed",
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Auth endpoint returned 500: Internal Server Error",
        }),
      }),
    );
  });

  it("should succeed if fetch returns 200", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    const mockCtx = {} as any;
    const args = { email: "test@example.com" };

    await performPasswordResetHandler(mockCtx, args);

    expect(logger.error).not.toHaveBeenCalled();
  });
});
