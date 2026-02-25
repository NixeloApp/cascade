import { ConvexError } from "convex/values";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { QueryCtx } from "../_generated/server";
import { requireBotApiKey } from "./botAuth";

describe("botAuth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockCtx = {} as QueryCtx;

  it("should throw UNAUTHENTICATED if apiKey is missing", () => {
    expect.assertions(2);
    try {
      requireBotApiKey(mockCtx, undefined);
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as ConvexError<{ code: string }>).data.code).toBe("UNAUTHENTICATED");
    }
  });

  it("should throw VALIDATION if env var is missing", () => {
    expect.assertions(3);
    delete process.env.BOT_SERVICE_API_KEY;

    try {
      requireBotApiKey(mockCtx, "some-key");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as ConvexError<{ code: string }>).data.code).toBe("VALIDATION");
      expect((e as ConvexError<{ code: string; message: string }>).data.message).toContain(
        "Missing required environment variable: BOT_SERVICE_API_KEY",
      );
    }
  });

  it("should pass if apiKey matches env var", () => {
    process.env.BOT_SERVICE_API_KEY = "secret-key";
    expect(() => requireBotApiKey(mockCtx, "secret-key")).not.toThrow();
  });

  it("should throw FORBIDDEN if apiKey does not match env var", () => {
    expect.assertions(2);
    process.env.BOT_SERVICE_API_KEY = "secret-key";

    try {
      requireBotApiKey(mockCtx, "wrong-key");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as ConvexError<{ code: string }>).data.code).toBe("FORBIDDEN");
    }
  });

  it("should throw FORBIDDEN if apiKey length does not match env var", () => {
    expect.assertions(2);
    process.env.BOT_SERVICE_API_KEY = "secret-key";

    try {
      requireBotApiKey(mockCtx, "secret-key-extra");
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as ConvexError<{ code: string }>).data.code).toBe("FORBIDDEN");
    }
  });
});
