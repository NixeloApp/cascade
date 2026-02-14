import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("e2e integration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should store plaintext OTP when E2E_API_KEY is missing (dev mode)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("E2E_API_KEY", ""); // Ensure it's empty

    const t = convexTest(schema, modules);

    const email = "test@inbox.mailtrap.io";
    const code = "123456";

    await t.mutation(internal.e2e.storeTestOtp, { email, code });

    const storedCode = await t.query(internal.e2e.getLatestOTP, { email });
    expect(storedCode).toBe(code);
  });

  it("should encrypt OTP when E2E_API_KEY is present", async () => {
    const apiKey = "test-api-key";
    vi.stubEnv("E2E_API_KEY", apiKey);

    const t = convexTest(schema, modules);

    const email = "test-enc@inbox.mailtrap.io";
    const code = "123456";

    await t.mutation(internal.e2e.storeTestOtp, { email, code });

    // Verify it's encrypted
    await t.run(async (ctx) => {
      const entry = await ctx.db
        .query("testOtpCodes")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      expect(entry).not.toBeNull();
      expect(entry!.code).not.toBe(code);
      expect(entry!.code).toMatch(/^enc:/);
    });

    // Verify retrieval works
    const storedCode = await t.query(internal.e2e.getLatestOTP, { email });
    expect(storedCode).toBe(code);
  });

  it("should fail to retrieve encrypted OTP if key is missing", async () => {
    const apiKey = "test-api-key";

    // 1. Store with key
    vi.stubEnv("E2E_API_KEY", apiKey);
    const t = convexTest(schema, modules);
    const email = "test-fail@inbox.mailtrap.io";
    const code = "123456";
    await t.mutation(internal.e2e.storeTestOtp, { email, code });

    // 2. Clear key and try to retrieve
    vi.stubEnv("E2E_API_KEY", "");

    // Note: The t context might have cached env vars?
    // But since it runs in the same process, accessing process.env inside the function should see the change.

    await expect(t.query(internal.e2e.getLatestOTP, { email })).rejects.toThrow();
  });
});
