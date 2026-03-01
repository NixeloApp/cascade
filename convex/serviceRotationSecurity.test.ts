import { convexTest } from "convex-test";
import { afterEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("Service Rotation Security", () => {
  const MOCK_API_KEY = "test-bot-api-key-123";

  afterEach(() => {
    delete process.env.BOT_SERVICE_API_KEY;
  });

  it("should block unauthenticated access", async () => {
    const t = convexTest(schema, modules);

    // Call getUsageSummary without auth
    await expect(
      t.query(api.serviceRotation.getUsageSummary, {
        serviceType: "transcription",
      }),
    ).rejects.toThrow(/Unauthenticated/i); // Matches "Unauthenticated" or "unauthenticated"

    // Call selectProvider without auth
    await expect(
      t.query(api.serviceRotation.selectProvider, {
        serviceType: "transcription",
      }),
    ).rejects.toThrow(/Unauthenticated/i);
  });

  it("should allow access with valid API key", async () => {
    // Setup env var
    process.env.BOT_SERVICE_API_KEY = MOCK_API_KEY;
    const t = convexTest(schema, modules);

    // Call getUsageSummary with key
    const summary = await t.query(api.serviceRotation.getUsageSummary, {
      serviceType: "transcription",
      apiKey: MOCK_API_KEY,
    });
    expect(summary).toBeDefined();

    // Call selectProvider with key
    // Might return null if no providers, but shouldn't throw auth error
    const selection = await t.query(api.serviceRotation.selectProvider, {
      serviceType: "transcription",
      apiKey: MOCK_API_KEY,
    });
    // Just asserting no error
  });

  it("should allow access for authenticated users", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ name: "Admin User", email: "admin@example.com" });

    // Call getUsageSummary as user
    const summary = await asUser.query(api.serviceRotation.getUsageSummary, {
      serviceType: "transcription",
    });
    expect(summary).toBeDefined();

    // Call selectProvider as user
    const selection = await asUser.query(api.serviceRotation.selectProvider, {
      serviceType: "transcription",
    });
    // Just asserting no error
  });

  it("should reject invalid API key", async () => {
    process.env.BOT_SERVICE_API_KEY = MOCK_API_KEY;
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.serviceRotation.getUsageSummary, {
        serviceType: "transcription",
        apiKey: "wrong-key",
      }),
    ).rejects.toThrow(/Invalid bot service API key/i);
  });
});
