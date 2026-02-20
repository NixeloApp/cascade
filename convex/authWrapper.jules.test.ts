import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import { performPasswordResetHandler, schedulePasswordResetHandler } from "./authWrapper";
import { logger } from "./lib/logger";

// Mock logger
vi.mock("./lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock rateLimits to avoid top-level execution that requires components
vi.mock("./rateLimits", () => ({
  rateLimit: vi.fn(),
}));

// Mock internal object structure
vi.mock("./_generated/api", () => ({
  internal: {
    authWrapper: {
      performPasswordReset: "performPasswordReset",
    },
  },
}));

describe("authWrapper", () => {
  describe("performPasswordResetHandler", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
      process.env.CONVEX_SITE_URL = "https://example.com";
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it("should call fetch with correct parameters", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", mockFetch);

      await performPasswordResetHandler({} as any, {
        email: "test@example.com",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/api/auth/signin/password",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("email=test%40example.com"),
        }),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("flow=reset"),
        }),
      );
    });

    it("should log error on fetch failure", async () => {
      const error = new Error("Network error");
      const mockFetch = vi.fn().mockRejectedValue(error);
      vi.stubGlobal("fetch", mockFetch);

      await performPasswordResetHandler({} as any, {
        email: "test@example.com",
      });

      expect(logger.error).toHaveBeenCalledWith(
        "Password reset request failed",
        expect.objectContaining({ error: error }),
      );
    });
  });

  describe("schedulePasswordResetHandler", () => {
    it("should schedule the password reset action", async () => {
      const mockScheduler = {
        runAfter: vi.fn(),
      };
      const mockCtx = {
        scheduler: mockScheduler,
      } as any;

      const args = { email: "test@example.com" };

      await schedulePasswordResetHandler(mockCtx, args);

      expect(mockScheduler.runAfter).toHaveBeenCalledWith(
        0,
        internal.authWrapper.performPasswordReset,
        { email: args.email },
      );
    });
  });
});
