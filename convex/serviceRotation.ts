/**
 * Service Rotation - Free Tier Management
 *
 * Automatically rotates between service providers to maximize free tier usage.
 * Supports: transcription, email, sms, ai
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireBotApiKey } from "./lib/botAuth";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { notFound, unauthenticated } from "./lib/errors";
import { freeUnitTypes, serviceTypes } from "./validators";

// Get current month string
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================
// Queries
// ============================================

/** Selects the best available provider for a service type, prioritizing those with remaining free tier capacity. */
export const selectProvider = query({
  args: {
    serviceType: serviceTypes,
    unitsNeeded: v.optional(v.number()), // Estimate of units needed (optional)
    apiKey: v.optional(v.string()), // Optional bot API key
  },
  returns: v.union(
    v.object({
      provider: v.string(),
      displayName: v.string(),
      freeUnitsRemaining: v.number(),
      isUsingFreeTier: v.boolean(),
      costPerUnit: v.number(),
      unitType: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Dual Authentication: API Key (Bot) OR User Session (Dashboard)
    if (args.apiKey) {
      await requireBotApiKey(ctx, args.apiKey);
    } else {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw unauthenticated();
      }
      // Note: Ideally check for admin role here, but enforcing basic auth is a huge improvement
      // over public access. We assume any authenticated user can view service status for now.
    }

    const month = getCurrentMonth();

    // Get all enabled providers for this service type, ordered by priority
    const providers = await ctx.db
      .query("serviceProviders")
      .withIndex("by_service_enabled", (q) =>
        q.eq("serviceType", args.serviceType).eq("isEnabled", true),
      )
      .take(BOUNDED_LIST_LIMIT);

    // Sort by priority
    providers.sort((a, b) => a.priority - b.priority);

    // Get usage for each provider this month
    const providersWithUsage = await Promise.all(
      providers.map(async (provider) => {
        const usage = await ctx.db
          .query("serviceUsage")
          .withIndex("by_provider_month", (q) =>
            q.eq("provider", provider.provider).eq("month", month),
          )
          .first();

        const unitsUsed = usage?.unitsUsed ?? 0;
        let freeUnitsRemaining: number;

        if (provider.freeUnitsType === "one_time") {
          // One-time credits
          freeUnitsRemaining = provider.oneTimeUnitsRemaining ?? 0;
        } else {
          // Monthly/yearly resets
          freeUnitsRemaining = Math.max(0, provider.freeUnitsPerMonth - unitsUsed);
        }

        return {
          ...provider,
          unitsUsed,
          freeUnitsRemaining,
          hasCapacity: freeUnitsRemaining > 0,
        };
      }),
    );

    // Find first provider with free capacity
    const freeProvider = providersWithUsage.find((p) => p.hasCapacity && p.isConfigured);

    // If no free capacity, fall back to the configured provider with lowest cost
    const fallbackProvider = providersWithUsage
      .filter((p) => p.isConfigured)
      .sort((a, b) => a.costPerUnit - b.costPerUnit)[0];

    const selected = freeProvider || fallbackProvider;

    return selected
      ? {
          provider: selected.provider,
          displayName: selected.displayName,
          freeUnitsRemaining: selected.freeUnitsRemaining,
          isUsingFreeTier: (selected.freeUnitsRemaining ?? 0) > 0,
          costPerUnit: selected.costPerUnit,
          unitType: selected.unitType,
        }
      : null;
  },
});

/**
 * Get usage summary for all providers of a service type
 */
export const getUsageSummary = query({
  args: {
    serviceType: serviceTypes,
    month: v.optional(v.string()),
    apiKey: v.optional(v.string()), // Optional bot API key
  },
  returns: v.object({
    month: v.string(),
    serviceType: serviceTypes,
    providers: v.array(
      v.object({
        provider: v.string(),
        displayName: v.string(),
        isEnabled: v.boolean(),
        isConfigured: v.boolean(),
        priority: v.number(),
        freeUnitsPerMonth: v.number(),
        freeUnitsType: freeUnitTypes,
        unitsUsed: v.number(),
        freeUnitsRemaining: v.number(),
        paidUnitsUsed: v.number(),
        estimatedCost: v.number(),
        unitType: v.string(),
      }),
    ),
    totals: v.object({
      freeUnitsRemaining: v.number(),
      unitsUsed: v.number(),
      estimatedCostCents: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    // Dual Authentication: API Key (Bot) OR User Session (Dashboard)
    if (args.apiKey) {
      await requireBotApiKey(ctx, args.apiKey);
    } else {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw unauthenticated();
      }
    }

    const month = args.month ?? getCurrentMonth();

    const providers = await ctx.db
      .query("serviceProviders")
      .withIndex("by_service_type", (q) => q.eq("serviceType", args.serviceType))
      .take(BOUNDED_LIST_LIMIT);

    const summary = await Promise.all(
      providers.map(async (provider) => {
        const usage = await ctx.db
          .query("serviceUsage")
          .withIndex("by_provider_month", (q) =>
            q.eq("provider", provider.provider).eq("month", month),
          )
          .first();

        const unitsUsed = usage?.unitsUsed ?? 0;
        let freeUnitsRemaining: number;

        if (provider.freeUnitsType === "one_time") {
          freeUnitsRemaining = provider.oneTimeUnitsRemaining ?? 0;
        } else {
          freeUnitsRemaining = Math.max(0, provider.freeUnitsPerMonth - unitsUsed);
        }

        return {
          provider: provider.provider,
          displayName: provider.displayName,
          isEnabled: provider.isEnabled,
          isConfigured: provider.isConfigured,
          priority: provider.priority,
          freeUnitsPerMonth: provider.freeUnitsPerMonth,
          freeUnitsType: provider.freeUnitsType,
          unitsUsed,
          freeUnitsRemaining,
          paidUnitsUsed: usage?.paidUnitsUsed ?? 0,
          estimatedCost: usage?.estimatedCost ?? 0,
          unitType: provider.unitType,
        };
      }),
    );

    // Sort by priority
    summary.sort((a, b) => a.priority - b.priority);

    const totalFreeRemaining = summary.reduce((sum, p) => sum + p.freeUnitsRemaining, 0);
    const totalUsed = summary.reduce((sum, p) => sum + p.unitsUsed, 0);
    const totalCost = summary.reduce((sum, p) => sum + p.estimatedCost, 0);

    return {
      month,
      serviceType: args.serviceType,
      providers: summary,
      totals: {
        freeUnitsRemaining: totalFreeRemaining,
        unitsUsed: totalUsed,
        estimatedCostCents: totalCost,
      },
    };
  },
});

// ============================================
// Mutations
// ============================================

/** Records usage for a provider after each API call to track consumption and calculate free vs paid units. */
export const recordUsage = mutation({
  args: {
    apiKey: v.string(),
    serviceType: serviceTypes,
    provider: v.string(),
    unitsUsed: v.number(),
  },
  returns: v.object({
    provider: v.string(),
    unitsUsed: v.number(),
    totalUnitsThisMonth: v.number(),
    freeUnitsRemaining: v.number(),
    isUsingFreeTier: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

    const month = getCurrentMonth();

    // Get provider config
    const providerConfig = await ctx.db
      .query("serviceProviders")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .first();

    if (!providerConfig) {
      throw notFound("provider", args.provider);
    }

    // Get or create usage record for this month
    const existingUsage = await ctx.db
      .query("serviceUsage")
      .withIndex("by_provider_month", (q) => q.eq("provider", args.provider).eq("month", month))
      .first();

    const currentUnitsUsed = existingUsage?.unitsUsed ?? 0;
    const newTotalUnits = currentUnitsUsed + args.unitsUsed;

    // Calculate free vs paid units
    let freeLimit: number;
    if (providerConfig.freeUnitsType === "one_time") {
      freeLimit = providerConfig.oneTimeUnitsRemaining ?? 0;
    } else {
      freeLimit = providerConfig.freeUnitsPerMonth;
    }

    const paidUnits = Math.max(0, newTotalUnits - freeLimit);
    const estimatedCost = paidUnits * providerConfig.costPerUnit;

    if (existingUsage) {
      await ctx.db.patch(existingUsage._id, {
        unitsUsed: newTotalUnits,
        paidUnitsUsed: paidUnits,
        estimatedCost,
        lastUpdatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("serviceUsage", {
        serviceType: args.serviceType,
        provider: args.provider,
        month,
        unitsUsed: newTotalUnits,
        freeUnitsLimit: freeLimit,
        paidUnitsUsed: paidUnits,
        estimatedCost,
        lastUpdatedAt: Date.now(),
      });
    }

    // Update one-time credits if applicable
    if (providerConfig.freeUnitsType === "one_time" && providerConfig.oneTimeUnitsRemaining) {
      const newRemaining = Math.max(0, providerConfig.oneTimeUnitsRemaining - args.unitsUsed);
      await ctx.db.patch(providerConfig._id, {
        oneTimeUnitsRemaining: newRemaining,
        updatedAt: Date.now(),
      });
    }

    return {
      provider: args.provider,
      unitsUsed: args.unitsUsed,
      totalUnitsThisMonth: newTotalUnits,
      freeUnitsRemaining: Math.max(0, freeLimit - newTotalUnits),
      isUsingFreeTier: newTotalUnits <= freeLimit,
    };
  },
});

/**
 * Initialize or update a provider configuration
 */
export const upsertProvider = internalMutation({
  args: {
    serviceType: serviceTypes,
    provider: v.string(),
    displayName: v.string(),
    freeUnitsPerMonth: v.number(),
    freeUnitsType: freeUnitTypes,
    oneTimeUnitsRemaining: v.optional(v.number()),
    costPerUnit: v.number(),
    unitType: v.string(),
    isEnabled: v.boolean(),
    isConfigured: v.boolean(),
    priority: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.id("serviceProviders"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serviceProviders")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("serviceProviders", {
        ...args,
        updatedAt: now,
      });
    }
  },
});

/** Seeds default provider configurations with monthly-reset free tiers for transcription and email services. */
export const seedProviders = internalMutation({
  args: {},
  returns: v.object({ seeded: v.boolean() }),
  handler: async (ctx) => {
    const now = Date.now();

    // Transcription providers - ONLY monthly reset free tiers
    // Total free capacity: 22 hours/month (8 + 8 + 5 + 1)
    const transcriptionProviders = [
      {
        serviceType: "transcription" as const,
        provider: "speechmatics",
        displayName: "Speechmatics",
        freeUnitsPerMonth: 480, // 8 hours
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.5, // $0.005/min = 0.5 cents
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 1,
        notes: "8 hrs/month free, resets monthly. Best accuracy for accents.",
      },
      {
        serviceType: "transcription" as const,
        provider: "gladia",
        displayName: "Gladia",
        freeUnitsPerMonth: 480, // 8 hours
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.5, // $0.005/min
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 2,
        notes: "8 hrs/month free, resets monthly. Good accuracy, includes translation.",
      },
      {
        serviceType: "transcription" as const,
        provider: "azure",
        displayName: "Azure Speech",
        freeUnitsPerMonth: 300, // 5 hours
        freeUnitsType: "monthly" as const,
        costPerUnit: 1.7, // $0.017/min
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 3,
        notes: "5 hrs/month free, resets monthly. Enterprise-grade reliability.",
      },
      {
        serviceType: "transcription" as const,
        provider: "google",
        displayName: "Google Cloud STT",
        freeUnitsPerMonth: 60, // 1 hour
        freeUnitsType: "monthly" as const,
        costPerUnit: 2.4, // $0.024/min = 2.4 cents
        unitType: "minute",
        isEnabled: true,
        isConfigured: false,
        priority: 4,
        notes: "1 hr/month free, resets monthly. Google infrastructure reliability.",
      },
      // NOTE: AssemblyAI and Deepgram excluded - one-time credits only
      // NOTE: OpenAI Whisper excluded - no free tier
      // See docs/service-providers-research.md for details
    ];

    // Email providers - ONLY monthly reset free tiers
    // Total free capacity: 22,000 emails/month (3000 + 15000 + 1000 + 3000)
    const emailProviders = [
      {
        serviceType: "email" as const,
        provider: "resend",
        displayName: "Resend",
        freeUnitsPerMonth: 3000, // 3000 emails/month
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.1, // $0.001/email = 0.1 cents
        unitType: "email",
        isEnabled: true,
        isConfigured: false,
        priority: 1,
        notes: "3000 emails/month free (100/day limit). Excellent deliverability.",
      },
      {
        serviceType: "email" as const,
        provider: "sendpulse",
        displayName: "SendPulse",
        freeUnitsPerMonth: 15000, // 15000 emails/month
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.08, // ~$0.0008/email
        unitType: "email",
        isEnabled: true,
        isConfigured: false,
        priority: 2,
        notes: "15000 emails/month free (up to 500 subscribers). Most generous.",
      },
      {
        serviceType: "email" as const,
        provider: "mailgun",
        displayName: "Mailgun",
        freeUnitsPerMonth: 1000, // 1000 emails/month (flex trial)
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.1, // $0.001/email
        unitType: "email",
        isEnabled: true,
        isConfigured: false,
        priority: 3,
        notes: "1000 emails/month on flex plan. Excellent deliverability.",
      },
      {
        serviceType: "email" as const,
        provider: "sendgrid",
        displayName: "SendGrid",
        freeUnitsPerMonth: 3000, // 100/day × 30 = ~3000/month
        freeUnitsType: "monthly" as const,
        costPerUnit: 0.1, // $0.001/email
        unitType: "email",
        isEnabled: true,
        isConfigured: false,
        priority: 4,
        notes: "100 emails/day free (~3000/month). Industry leader, excellent deliverability.",
      },
    ];

    // Check and insert all providers in parallel
    const allProviders = [...transcriptionProviders, ...emailProviders];
    const existingProviders = await Promise.all(
      allProviders.map((provider) =>
        ctx.db
          .query("serviceProviders")
          .withIndex("by_provider", (q) => q.eq("provider", provider.provider))
          .first(),
      ),
    );

    // Insert non-existing providers in parallel
    const providersToInsert = allProviders.filter((_, i) => !existingProviders[i]);
    await Promise.all(
      providersToInsert.map((provider) =>
        ctx.db.insert("serviceProviders", {
          ...provider,
          updatedAt: now,
        }),
      ),
    );

    return { seeded: true };
  },
});

/**
 * Mark a provider as configured (has API key)
 */
export const setProviderConfigured = internalMutation({
  args: {
    provider: v.string(),
    isConfigured: v.boolean(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("serviceProviders")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .first();

    if (!existing) {
      throw notFound("provider", args.provider);
    }

    await ctx.db.patch(existing._id, {
      isConfigured: args.isConfigured,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
