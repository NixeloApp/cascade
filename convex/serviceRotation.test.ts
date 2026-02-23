import { convexTest } from "convex-test";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("Service Rotation", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env = { ...originalEnv };
    process.env.BOT_SERVICE_API_KEY = "test-bot-key";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    // Set date to 2024-01-15 so month is "2024-01"
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setupProviders = async (t: any) => {
    await t.run(async (ctx: any) => {
      const now = Date.now();

      // Provider 1: High priority, has free units
      await ctx.db.insert("serviceProviders", {
        serviceType: "transcription",
        provider: "provider1",
        displayName: "Provider 1",
        freeUnitsPerMonth: 100,
        freeUnitsType: "monthly",
        costPerUnit: 1.0,
        unitType: "minute",
        isEnabled: true,
        isConfigured: true,
        priority: 1,
        updatedAt: now,
      });

      // Provider 2: Lower priority, has free units
      await ctx.db.insert("serviceProviders", {
        serviceType: "transcription",
        provider: "provider2",
        displayName: "Provider 2",
        freeUnitsPerMonth: 100,
        freeUnitsType: "monthly",
        costPerUnit: 0.5,
        unitType: "minute",
        isEnabled: true,
        isConfigured: true,
        priority: 2,
        updatedAt: now,
      });

      // Provider 3: One-time credits
      await ctx.db.insert("serviceProviders", {
        serviceType: "transcription",
        provider: "provider3",
        displayName: "Provider 3",
        freeUnitsPerMonth: 0,
        freeUnitsType: "one_time",
        oneTimeUnitsRemaining: 50,
        costPerUnit: 2.0,
        unitType: "minute",
        isEnabled: true,
        isConfigured: true,
        priority: 3,
        updatedAt: now,
      });
    });
  };

  describe("selectProvider", () => {
    it("should select the highest priority provider with free units", async () => {
      const t = convexTest(schema, modules);
      await setupProviders(t);

      const result = await t.query(api.serviceRotation.selectProvider, {
        serviceType: "transcription",
      });

      expect(result).not.toBeNull();
      expect(result?.provider).toBe("provider1");
      expect(result?.isUsingFreeTier).toBe(true);
    });

    it("should skip providers with no free units remaining", async () => {
      const t = convexTest(schema, modules);
      await setupProviders(t);

      // Exhaust provider 1
      await t.run(async (ctx: any) => {
        await ctx.db.insert("serviceUsage", {
          serviceType: "transcription",
          provider: "provider1",
          month: "2024-01",
          unitsUsed: 100,
          freeUnitsLimit: 100,
          paidUnitsUsed: 0,
          estimatedCost: 0,
          lastUpdatedAt: Date.now(),
        });
      });

      const result = await t.query(api.serviceRotation.selectProvider, {
        serviceType: "transcription",
      });

      // Should pick provider 2 (priority 2)
      expect(result?.provider).toBe("provider2");
      expect(result?.isUsingFreeTier).toBe(true);
    });

    it("should fall back to cheapest configured provider if all free units exhausted", async () => {
      const t = convexTest(schema, modules);
      await setupProviders(t);

      // Exhaust all providers
      await t.run(async (ctx: any) => {
        const now = Date.now();
        // Provider 1 exhausted
        await ctx.db.insert("serviceUsage", {
          serviceType: "transcription",
          provider: "provider1",
          month: "2024-01",
          unitsUsed: 100,
          freeUnitsLimit: 100,
          paidUnitsUsed: 0,
          estimatedCost: 0,
          lastUpdatedAt: now,
        });
        // Provider 2 exhausted
        await ctx.db.insert("serviceUsage", {
          serviceType: "transcription",
          provider: "provider2",
          month: "2024-01",
          unitsUsed: 100,
          freeUnitsLimit: 100,
          paidUnitsUsed: 0,
          estimatedCost: 0,
          lastUpdatedAt: now,
        });
        // Provider 3 exhausted (one-time)
        // Note: For one-time, we check the provider config directly in selectProvider
        // So we need to update the provider config to show 0 remaining
        const p3 = await ctx.db
          .query("serviceProviders")
          .withIndex("by_provider", (q: any) => q.eq("provider", "provider3"))
          .first();
        if (p3) {
          await ctx.db.patch(p3._id, { oneTimeUnitsRemaining: 0 });
        }
      });

      const result = await t.query(api.serviceRotation.selectProvider, {
        serviceType: "transcription",
      });

      // Should pick provider 2 because it's cheaper (0.5 vs 1.0 vs 2.0)
      expect(result?.provider).toBe("provider2");
      expect(result?.isUsingFreeTier).toBe(false);
      expect(result?.costPerUnit).toBe(0.5);
    });

    it("should use one-time credits if available", async () => {
      const t = convexTest(schema, modules);
      await setupProviders(t);

      // Exhaust monthly providers
      await t.run(async (ctx: any) => {
        const now = Date.now();
        await ctx.db.insert("serviceUsage", {
          serviceType: "transcription",
          provider: "provider1",
          month: "2024-01",
          unitsUsed: 100,
          freeUnitsLimit: 100,
          paidUnitsUsed: 0,
          estimatedCost: 0,
          lastUpdatedAt: now,
        });
        await ctx.db.insert("serviceUsage", {
          serviceType: "transcription",
          provider: "provider2",
          month: "2024-01",
          unitsUsed: 100,
          freeUnitsLimit: 100,
          paidUnitsUsed: 0,
          estimatedCost: 0,
          lastUpdatedAt: now,
        });
      });

      const result = await t.query(api.serviceRotation.selectProvider, {
        serviceType: "transcription",
      });

      // Should pick provider 3 (one-time credits)
      expect(result?.provider).toBe("provider3");
      expect(result?.isUsingFreeTier).toBe(true);
      expect(result?.freeUnitsRemaining).toBe(50);
    });
  });

  describe("recordUsage", () => {
    it("should fail without valid API key", async () => {
      const t = convexTest(schema, modules);
      await setupProviders(t);

      await expect(async () => {
        await t.mutation(api.serviceRotation.recordUsage, {
          apiKey: "invalid-key",
          serviceType: "transcription",
          provider: "provider1",
          unitsUsed: 10,
        });
      }).rejects.toThrow(/Invalid bot service API key/);
    });

    it("should create new usage record and track free units", async () => {
      const t = convexTest(schema, modules);
      await setupProviders(t);

      const result = await t.mutation(api.serviceRotation.recordUsage, {
        apiKey: "test-bot-key",
        serviceType: "transcription",
        provider: "provider1",
        unitsUsed: 10,
      });

      expect(result.unitsUsed).toBe(10);
      expect(result.totalUnitsThisMonth).toBe(10);
      expect(result.freeUnitsRemaining).toBe(90); // 100 - 10
      expect(result.isUsingFreeTier).toBe(true);

      // Verify DB
      const usage = await t.run(async (ctx: any) => {
        return await ctx.db
          .query("serviceUsage")
          .withIndex("by_provider_month", (q: any) =>
            q.eq("provider", "provider1").eq("month", "2024-01"),
          )
          .first();
      });

      expect(usage).toBeDefined();
      expect(usage?.unitsUsed).toBe(10);
      expect(usage?.paidUnitsUsed).toBe(0);
    });

    it("should update existing usage and calculate paid units", async () => {
      const t = convexTest(schema, modules);
      await setupProviders(t);

      // First call: Use 90 units
      await t.mutation(api.serviceRotation.recordUsage, {
        apiKey: "test-bot-key",
        serviceType: "transcription",
        provider: "provider1",
        unitsUsed: 90,
      });

      // Second call: Use 20 units (total 110, limit 100)
      const result = await t.mutation(api.serviceRotation.recordUsage, {
        apiKey: "test-bot-key",
        serviceType: "transcription",
        provider: "provider1",
        unitsUsed: 20,
      });

      expect(result.totalUnitsThisMonth).toBe(110);
      expect(result.freeUnitsRemaining).toBe(0);
      expect(result.isUsingFreeTier).toBe(false);

      // Verify DB
      const usage = await t.run(async (ctx: any) => {
        return await ctx.db
          .query("serviceUsage")
          .withIndex("by_provider_month", (q: any) =>
            q.eq("provider", "provider1").eq("month", "2024-01"),
          )
          .first();
      });

      expect(usage?.unitsUsed).toBe(110);
      expect(usage?.paidUnitsUsed).toBe(10); // 110 - 100
      expect(usage?.estimatedCost).toBe(10 * 1.0); // 10 units * $1.0
    });

    it("should decrement one-time credits", async () => {
      const t = convexTest(schema, modules);
      await setupProviders(t);

      const result = await t.mutation(api.serviceRotation.recordUsage, {
        apiKey: "test-bot-key",
        serviceType: "transcription",
        provider: "provider3",
        unitsUsed: 20,
      });

      expect(result.provider).toBe("provider3");
      expect(result.freeUnitsRemaining).toBe(30); // 50 - 20

      // Verify DB - Check provider config updated
      const provider = await t.run(async (ctx: any) => {
        return await ctx.db
          .query("serviceProviders")
          .withIndex("by_provider", (q: any) => q.eq("provider", "provider3"))
          .first();
      });

      expect(provider?.oneTimeUnitsRemaining).toBe(30);
    });
  });

  describe("getUsageSummary", () => {
    it("should return summary for the month", async () => {
      const t = convexTest(schema, modules);
      await setupProviders(t);

      // Add some usage
      await t.mutation(api.serviceRotation.recordUsage, {
        apiKey: "test-bot-key",
        serviceType: "transcription",
        provider: "provider1",
        unitsUsed: 50,
      });

      await t.mutation(api.serviceRotation.recordUsage, {
        apiKey: "test-bot-key",
        serviceType: "transcription",
        provider: "provider2",
        unitsUsed: 120, // 20 over limit
      });

      const summary = await t.query(api.serviceRotation.getUsageSummary, {
        serviceType: "transcription",
        month: "2024-01",
      });

      expect(summary.month).toBe("2024-01");
      expect(summary.providers).toHaveLength(3);

      const p1 = summary.providers.find((p: any) => p.provider === "provider1");
      expect(p1?.unitsUsed).toBe(50);
      expect(p1?.freeUnitsRemaining).toBe(50);

      const p2 = summary.providers.find((p: any) => p.provider === "provider2");
      expect(p2?.unitsUsed).toBe(120);
      expect(p2?.paidUnitsUsed).toBe(20);
      expect(p2?.estimatedCost).toBe(20 * 0.5); // 10 cents

      expect(summary.totals.unitsUsed).toBe(50 + 120);
      expect(summary.totals.estimatedCostCents).toBe(10);
    });
  });
});

  describe("upsertProvider", () => {
    it("should return object with providerId when inserting", async () => {
      const t = convexTest(schema, modules);

      const result = await t.mutation(internal.serviceRotation.upsertProvider, {
        serviceType: "transcription",
        provider: "test-provider",
        displayName: "Test Provider",
        freeUnitsPerMonth: 100,
        freeUnitsType: "monthly",
        costPerUnit: 1.0,
        unitType: "minute",
        isEnabled: true,
        isConfigured: true,
        priority: 1,
      });

      expect(result).toEqual(expect.objectContaining({
        providerId: expect.any(String),
      }));
    });

    it("should return object with providerId when updating", async () => {
      const t = convexTest(schema, modules);

      // Insert first
      const { providerId } = await t.mutation(internal.serviceRotation.upsertProvider, {
        serviceType: "transcription",
        provider: "test-provider",
        displayName: "Test Provider",
        freeUnitsPerMonth: 100,
        freeUnitsType: "monthly",
        costPerUnit: 1.0,
        unitType: "minute",
        isEnabled: true,
        isConfigured: true,
        priority: 1,
      });

      // Update
      const updateResult = await t.mutation(internal.serviceRotation.upsertProvider, {
        serviceType: "transcription",
        provider: "test-provider",
        displayName: "Test Provider Updated",
        freeUnitsPerMonth: 200,
        freeUnitsType: "monthly",
        costPerUnit: 1.0,
        unitType: "minute",
        isEnabled: true,
        isConfigured: true,
        priority: 1,
      });

      expect(updateResult).toEqual({ providerId });
    });
  });

  describe("setProviderConfigured", () => {
    it("should return { success: true }", async () => {
      const t = convexTest(schema, modules);

      // Insert provider first
      await t.mutation(internal.serviceRotation.upsertProvider, {
        serviceType: "transcription",
        provider: "test-provider",
        displayName: "Test Provider",
        freeUnitsPerMonth: 100,
        freeUnitsType: "monthly",
        costPerUnit: 1.0,
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 1,
      });

      const result = await t.mutation(internal.serviceRotation.setProviderConfigured, {
        provider: "test-provider",
        isConfigured: true,
      });

      expect(result).toEqual({ success: true });
    });
  });
