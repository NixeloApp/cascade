import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import { performPasswordResetHandler } from "./authWrapper";
import { logger } from "./lib/logger";

// Mock logger
vi.mock("./lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("performPasswordResetHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log error if signIn action throws", async () => {
    const mockCtx = {
      runAction: vi.fn().mockRejectedValue(new Error("signIn failed")),
    } as any;
    const args = { email: "test@example.com" };

    await performPasswordResetHandler(mockCtx, args);

    expect(logger.error).toHaveBeenCalledWith(
      "Password reset request failed",
      expect.objectContaining({
        error: expect.objectContaining({
          message: "signIn failed",
        }),
      }),
    );
  });

  it("should call auth signIn reset flow and not log on success", async () => {
    const mockCtx = {
      runAction: vi.fn().mockResolvedValue(undefined),
    } as any;
    const args = { email: "test@example.com" };

    await performPasswordResetHandler(mockCtx, args);

    expect(mockCtx.runAction).toHaveBeenCalledWith(api.auth.signIn, {
      provider: "password",
      params: { email: args.email, flow: "reset" },
    });
    expect(logger.error).not.toHaveBeenCalled();
  });
});
