/**
 * Email Service - Universal Email Wrapper with Provider Rotation
 *
 * ALL emails (notifications, OTP, password reset) go through this system.
 * Automatically rotates between providers to maximize free tier usage.
 *
 * Providers (in priority order):
 * 1. Mailtrap - 4,000/month, 150/day (sandbox mode for dev/E2E)
 * 2. Resend - 3,000/month, 100/day
 * 3. SendPulse - 12,000/month, 400/day (highest capacity, configure later)
 *
 * Total free capacity: 19,000 emails/month
 */

import type { DatabaseReader, MutationCtx, QueryCtx } from "../_generated/server";
import { logger } from "../lib/logger";
import { MailtrapProvider } from "./mailtrap";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";
import { ResendProvider } from "./resend";
import { SendPulseProvider } from "./sendpulse";

/**
 * Context type for functions that need database access.
 * More permissive than MutationCtx/QueryCtx to support auth provider callbacks.
 */
export type DbContext = { db: DatabaseReader } | QueryCtx | MutationCtx;

// =============================================================================
// Provider Configuration (hardcoded - no DB seed needed)
// =============================================================================

const PROVIDER_CONFIG: Record<
  string,
  { freePerMonth: number; freePerDay: number; priority: number; factory: () => EmailProvider }
> = {
  mailtrap: {
    freePerMonth: 4000,
    freePerDay: 150,
    priority: 1,
    factory: () => new MailtrapProvider(),
  },
  resend: {
    freePerMonth: 3000,
    freePerDay: 100,
    priority: 2,
    factory: () => new ResendProvider(),
  },
  sendpulse: {
    freePerMonth: 12000,
    freePerDay: 400,
    priority: 3,
    factory: () => new SendPulseProvider(),
  },
};

// Providers sorted by priority
const PROVIDERS_BY_PRIORITY = Object.entries(PROVIDER_CONFIG)
  .sort(([, a], [, b]) => a.priority - b.priority)
  .map(([name]) => name);

// =============================================================================
// Provider Selection
// =============================================================================

/**
 * Get current month string (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get current date string (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Select the best provider based on free tier usage (both daily and monthly limits)
 */
async function selectProvider(ctx: QueryCtx): Promise<{ name: string; provider: EmailProvider }> {
  const month = getCurrentMonth();
  const date = getCurrentDate();

  // Check each provider in priority order
  for (const name of PROVIDERS_BY_PRIORITY) {
    const config = PROVIDER_CONFIG[name];

    // Get monthly usage
    const monthlyUsage = await ctx.db
      .query("serviceUsage")
      .withIndex("by_provider_month", (q) => q.eq("provider", name).eq("month", month))
      .first();

    // Get daily usage (stored with date as "month" field)
    const dailyUsage = await ctx.db
      .query("serviceUsage")
      .withIndex("by_provider_month", (q) => q.eq("provider", name).eq("month", date))
      .first();

    const monthlyUsed = monthlyUsage?.unitsUsed ?? 0;
    const dailyUsed = dailyUsage?.unitsUsed ?? 0;

    const monthlyRemaining = config.freePerMonth - monthlyUsed;
    const dailyRemaining = config.freePerDay - dailyUsed;

    // Provider is available if both daily AND monthly limits have capacity
    if (monthlyRemaining > 0 && dailyRemaining > 0) {
      return { name, provider: config.factory() };
    }
  }

  // All free tiers exhausted - use first provider (will be paid)
  const firstName = PROVIDERS_BY_PRIORITY[0];
  return { name: firstName, provider: PROVIDER_CONFIG[firstName].factory() };
}

/**
 * Get first provider (fallback when no ctx available)
 */
function getFirstProvider(): { name: string; provider: EmailProvider } {
  const name = PROVIDERS_BY_PRIORITY[0];
  return { name, provider: PROVIDER_CONFIG[name].factory() };
}

// =============================================================================
// Usage Tracking
// =============================================================================

/**
 * Record email usage (both daily and monthly)
 */
async function recordUsage(ctx: MutationCtx, providerName: string, count: number): Promise<void> {
  const month = getCurrentMonth();
  const date = getCurrentDate();
  const config = PROVIDER_CONFIG[providerName];
  if (!config) return;

  // Record monthly usage
  const monthlyExisting = await ctx.db
    .query("serviceUsage")
    .withIndex("by_provider_month", (q) => q.eq("provider", providerName).eq("month", month))
    .first();

  const monthlyUsed = monthlyExisting?.unitsUsed ?? 0;
  const newMonthlyTotal = monthlyUsed + count;
  const paidUnits = Math.max(0, newMonthlyTotal - config.freePerMonth);

  if (monthlyExisting) {
    await ctx.db.patch(monthlyExisting._id, {
      unitsUsed: newMonthlyTotal,
      paidUnitsUsed: paidUnits,
      lastUpdatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("serviceUsage", {
      serviceType: "email",
      provider: providerName,
      month,
      unitsUsed: newMonthlyTotal,
      freeUnitsLimit: config.freePerMonth,
      paidUnitsUsed: paidUnits,
      estimatedCost: 0,
      lastUpdatedAt: Date.now(),
    });
  }

  // Record daily usage (uses date string in month field)
  const dailyExisting = await ctx.db
    .query("serviceUsage")
    .withIndex("by_provider_month", (q) => q.eq("provider", providerName).eq("month", date))
    .first();

  const dailyUsed = dailyExisting?.unitsUsed ?? 0;
  const newDailyTotal = dailyUsed + count;

  if (dailyExisting) {
    await ctx.db.patch(dailyExisting._id, {
      unitsUsed: newDailyTotal,
      lastUpdatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("serviceUsage", {
      serviceType: "email",
      provider: providerName,
      month: date, // Daily tracking uses YYYY-MM-DD
      unitsUsed: newDailyTotal,
      freeUnitsLimit: config.freePerDay,
      paidUnitsUsed: 0, // Daily doesn't track paid (monthly does)
      estimatedCost: 0,
      lastUpdatedAt: Date.now(),
    });
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Send an email using the best available provider
 *
 * @param ctx - Convex context (for usage tracking and provider selection)
 * @param params - Email parameters (to, subject, html, etc.)
 *
 * @example
 * await sendEmail(ctx, {
 *   to: "user@example.com",
 *   subject: "Hello",
 *   html: "<p>Hello!</p>",
 * });
 */
export async function sendEmail(
  ctx: DbContext | null,
  params: EmailSendParams,
): Promise<EmailSendResult & { provider?: string }> {
  // Mock sending for E2E test emails to prevent rate limits and timeouts
  // This is safe because E2E tests retrieve OTPs from the database (via storeTestOtp)
  // or verify UI changes (toasts), rather than checking an external inbox.
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const isTestEmail = recipients.some((email) => email.endsWith("@inbox.mailtrap.io"));
  // Also mock in unit test environment to avoid missing API key errors
  const isTestEnv = process.env.NODE_ENV === "test";

  if (isTestEmail || isTestEnv) {
    return {
      id: "mock-email-id",
      success: true,
      provider: "mock",
    };
  }

  // Select provider
  let selected: { name: string; provider: EmailProvider };

  if (ctx) {
    try {
      selected = await selectProvider(ctx as QueryCtx);
    } catch (e) {
      // DB error - fallback to first provider
      logger.error("Failed to select provider, falling back to default", { error: e });
      selected = getFirstProvider();
    }
  } else {
    // No ctx - use first provider (no rotation)
    selected = getFirstProvider();
  }

  // Send email
  const result = await selected.provider.send(params);

  // Record usage if successful and we have mutation context
  if (ctx && result.success && "scheduler" in ctx) {
    try {
      await recordUsage(ctx as MutationCtx, selected.name, 1);
    } catch (e) {
      // Don't fail send because of usage tracking error
      logger.error("Failed to record usage", { error: e });
    }
  }

  return { ...result, provider: selected.name };
}

/**
 * Send email using a specific provider (for testing)
 */
export async function sendEmailWithProvider(
  ctx: MutationCtx | null,
  providerName: string,
  params: EmailSendParams,
): Promise<EmailSendResult & { provider: string }> {
  const config = PROVIDER_CONFIG[providerName];
  if (!config) {
    return {
      id: "unknown-provider",
      success: false,
      error: `Unknown provider: ${providerName}`,
      provider: providerName,
    };
  }

  const provider = config.factory();
  const result = await provider.send(params);

  if (ctx && result.success) {
    try {
      await recordUsage(ctx, providerName, 1);
    } catch (e) {
      // Don't fail send because of usage tracking error
      logger.error("Failed to record usage", { error: e });
    }
  }

  return { ...result, provider: providerName };
}

// Re-export types
export type { EmailSendParams, EmailSendResult };
