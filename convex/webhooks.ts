import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  type ActionCtx,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { authenticatedMutation, authenticatedQuery, projectAdminMutation } from "./customFunctions";
import { notFound, validation } from "./lib/errors";
import { fetchPaginatedQuery } from "./lib/queryHelpers";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";
import { assertIsProjectAdmin } from "./projectAccess";
import { isTest } from "./testConfig";
import { webhookResultStatuses } from "./validators";

const WEBHOOK_TIMEOUT_MS = 10000;

/** Create a new webhook for a project. Requires project admin role. */
export const createWebhook = projectAdminMutation({
  args: {
    name: v.string(),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check
    validateWebhookUrl(args.url);

    const webhookId = await ctx.db.insert("webhooks", {
      projectId: ctx.projectId,
      name: args.name,
      url: args.url,
      events: args.events,
      secret: args.secret,
      isActive: true,
      createdBy: ctx.userId,
    });

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "webhook_created",
        actorId: ctx.userId,
        targetId: webhookId,
        targetType: "webhooks",
        metadata: {
          projectId: ctx.projectId,
          name: args.name,
          events: args.events,
        },
      });
    }

    return webhookId;
  },
});

/** List all webhooks for a project. Returns webhooks with hasSecret flag instead of exposing secret values. */
export const listByProject = authenticatedQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Only admins can view webhooks
    await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

    // Don't expose secrets to the client - only show if secret is configured
    return webhooks.map((w) => ({
      ...w,
      secret: undefined,
      hasSecret: !!w.secret,
    }));
  },
});

/** Update webhook configuration including name, URL, events, secret, or active status. Requires project admin role. */
export const updateWebhook = authenticatedMutation({
  args: {
    id: v.id("webhooks"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    secret: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.id);
    if (!webhook || webhook.isDeleted) throw notFound("webhook", args.id);

    // Only admins can update webhooks
    if (!webhook.projectId) {
      throw validation("projectId", "Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, ctx.userId);

    const updates: Partial<typeof webhook> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.url !== undefined) {
      validateWebhookUrl(args.url);
      updates.url = args.url;
    }
    if (args.events !== undefined) updates.events = args.events;
    if (args.secret !== undefined) updates.secret = args.secret;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.id, updates);

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "webhook_updated",
        actorId: ctx.userId,
        targetId: args.id,
        targetType: "webhooks",
        metadata: updates,
      });
    }
  },
});

/** Soft-delete a webhook by setting deletion metadata. Requires project admin role. */
export const softDeleteWebhook = authenticatedMutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.id);
    if (!webhook || webhook.isDeleted) throw notFound("webhook", args.id);

    // Only admins can delete webhooks
    if (!webhook.projectId) {
      throw validation("projectId", "Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, ctx.userId);

    await ctx.db.patch(args.id, softDeleteFields(ctx.userId));

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "webhook_deleted",
        actorId: ctx.userId,
        targetId: args.id,
        targetType: "webhooks",
      });
    }
  },
});

/** Deliver webhook payloads to all active webhooks for a given project event. Creates execution logs for each delivery attempt. */
export const trigger = internalAction({
  args: {
    projectId: v.id("projects"),
    event: v.string(),
    /** External webhook payload - structure varies by provider. v.any() is intentional. */
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // Get all active webhooks for this project that listen to this event directly via database
    const webhooks = await ctx.runQuery(internal.webhooks.getActiveWebhooksForEvent, {
      projectId: args.projectId,
      event: args.event,
    });

    // Trigger each webhook
    for (const webhook of webhooks) {
      await triggerSingleWebhook(ctx, webhook, args.event, args.payload);
    }
  },
});

async function triggerSingleWebhook(
  ctx: ActionCtx,
  webhook: Doc<"webhooks">,
  event: string,
  payload: Record<string, unknown>,
) {
  const requestPayload = JSON.stringify({
    event: event,
    payload: payload,
    timestamp: Date.now(),
  });

  // Create execution log
  const executionId = await ctx.runMutation(internal.webhooks.createExecution, {
    webhookId: webhook._id,
    event: event,
    requestPayload,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Event": event,
        ...(webhook.secret && {
          "X-Webhook-Signature": await generateSignature(requestPayload, webhook.secret),
        }),
      },
      body: requestPayload,
      signal: controller.signal,
    });

    const responseBody = await response.text();

    // Update execution log with success
    await ctx.runMutation(internal.webhooks.updateExecution, {
      id: executionId,
      status: response.ok ? "success" : "failed",
      responseStatus: response.status,
      responseBody: responseBody.substring(0, 1000), // Limit to 1000 chars
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    });

    // Update last triggered time
    await ctx.runMutation(internal.webhooks.updateLastTriggered, {
      id: webhook._id,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Timeout: Webhook delivery exceeded ${WEBHOOK_TIMEOUT_MS}ms`
          : error.message
        : "Unknown error";

    // Update execution log with failure
    await ctx.runMutation(internal.webhooks.updateExecution, {
      id: executionId,
      status: "failed",
      error: errorMessage,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Retrieve all active webhooks subscribed to a specific event type within a project. */
export const getActiveWebhooksForEvent = internalQuery({
  args: {
    projectId: v.id("projects"),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    // Use project index (not global active scan) for better performance
    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

    // Filter for active webhooks that handle this event
    return webhooks.filter((w) => w.isActive && w.events.includes(args.event));
  },
});

/** Update the lastTriggered timestamp for a webhook after successful delivery. Skipped in test mode. */
export const updateLastTriggered = internalMutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    if (isTest) return;
    await ctx.db.patch(args.id, {
      lastTriggered: Date.now(),
    });
  },
});

/** Retrieve paginated execution logs for a webhook. Requires project admin role. */
export const listExecutions = authenticatedQuery({
  args: {
    webhookId: v.id("webhooks"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || webhook.isDeleted) throw notFound("webhook", args.webhookId);

    // Only admins can view webhook logs
    if (!webhook.projectId) {
      throw validation("projectId", "Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, ctx.userId);

    return await fetchPaginatedQuery(ctx, {
      paginationOpts: args.paginationOpts,
      query: (db) =>
        db
          .query("webhookExecutions")
          .withIndex("by_webhook", (q) => q.eq("webhookId", args.webhookId))
          .order("desc"),
    });
  },
});

/** Send a test ping event to a webhook endpoint. Requires project admin role. */
export const test = authenticatedMutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.id);
    if (!webhook || webhook.isDeleted) throw notFound("webhook", args.id);

    // Only admins can test webhooks
    if (!webhook.projectId) {
      throw validation("projectId", "Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, ctx.userId);

    // Schedule the test webhook delivery
    await ctx.scheduler.runAfter(0, internal.webhooks.deliverTestWebhook, {
      webhookId: args.id,
    });

    return { success: true };
  },
});

/** Deliver a test ping payload to a webhook endpoint and log the execution result. */
export const deliverTestWebhook = internalAction({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    const webhook = await ctx.runQuery(internal.webhooks.getWebhookById, {
      id: args.webhookId,
    });
    if (!webhook) return;

    const requestPayload = JSON.stringify({
      event: "ping",
      payload: { message: "Test webhook from Nixelo" },
      timestamp: Date.now(),
    });

    // Create execution log
    const executionId = await ctx.runMutation(internal.webhooks.createExecution, {
      webhookId: webhook._id,
      event: "ping",
      requestPayload,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": "ping",
          ...(webhook.secret && {
            "X-Webhook-Signature": await generateSignature(requestPayload, webhook.secret),
          }),
        },
        body: requestPayload,
        signal: controller.signal,
      });

      const responseBody = await response.text();

      // Update execution log
      await ctx.runMutation(internal.webhooks.updateExecution, {
        id: executionId,
        status: response.ok ? "success" : "failed",
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.name === "AbortError"
            ? `Timeout: Webhook delivery exceeded ${WEBHOOK_TIMEOUT_MS}ms`
            : error.message
          : "Unknown error";

      await ctx.runMutation(internal.webhooks.updateExecution, {
        id: executionId,
        status: "failed",
        error: errorMessage,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

/** Retrieve a webhook by its ID. Returns null if webhook does not exist. */
export const getWebhookById = internalQuery({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Create a new execution log entry for a webhook delivery attempt. Returns mock ID in test mode. */
export const createExecution = internalMutation({
  args: {
    webhookId: v.id("webhooks"),
    event: v.string(),
    requestPayload: v.string(),
  },
  handler: async (ctx, args) => {
    if (isTest) {
      return "webhookExecutions:00000000000000000000000000000000" as Id<"webhookExecutions">;
    }
    return await ctx.db.insert("webhookExecutions", {
      webhookId: args.webhookId,
      event: args.event,
      requestPayload: args.requestPayload,
      status: "retrying",
      attempts: 1,
    });
  },
});

/** Update an execution log with delivery status, response data, and error information. Skipped in test mode. */
export const updateExecution = internalMutation({
  args: {
    id: v.id("webhookExecutions"),
    status: webhookResultStatuses,
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (isTest) return;
    await ctx.db.patch(args.id, {
      status: args.status,
      responseStatus: args.responseStatus,
      responseBody: args.responseBody,
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

/** Retry a failed webhook execution by scheduling a new delivery attempt. Requires project admin role. */
export const retryExecution = authenticatedMutation({
  args: { id: v.id("webhookExecutions") },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution) throw notFound("webhookExecution", args.id);

    const webhook = await ctx.db.get(execution.webhookId);
    if (!webhook || webhook.isDeleted) throw notFound("webhook", execution.webhookId);

    // Only admins can retry webhooks
    if (!webhook.projectId) {
      throw validation("projectId", "Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, ctx.userId);

    // Schedule the retry
    await ctx.scheduler.runAfter(0, internal.webhooks.retryWebhookDelivery, {
      executionId: args.id,
      webhookId: webhook._id,
    });

    return { success: true };
  },
});

/** Reattempt webhook delivery for a failed execution and increment the attempt counter. */
export const retryWebhookDelivery = internalAction({
  args: {
    executionId: v.id("webhookExecutions"),
    webhookId: v.id("webhooks"),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.runQuery(internal.webhooks.getExecutionById, {
      id: args.executionId,
    });
    if (!execution) return;

    const webhook = await ctx.runQuery(internal.webhooks.getWebhookById, {
      id: args.webhookId,
    });
    if (!webhook) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": execution.event,
          ...(webhook.secret && {
            "X-Webhook-Signature": await generateSignature(
              execution.requestPayload,
              webhook.secret,
            ),
          }),
        },
        body: execution.requestPayload,
        signal: controller.signal,
      });

      const responseBody = await response.text();

      // Update execution log
      await ctx.runMutation(internal.webhooks.incrementExecutionAttempt, {
        id: args.executionId,
        status: response.ok ? "success" : "failed",
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.name === "AbortError"
            ? `Timeout: Webhook delivery exceeded ${WEBHOOK_TIMEOUT_MS}ms`
            : error.message
          : "Unknown error";

      await ctx.runMutation(internal.webhooks.incrementExecutionAttempt, {
        id: args.executionId,
        status: "failed",
        error: errorMessage,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

/** Retrieve a webhook execution log by its ID. Returns null if execution does not exist. */
export const getExecutionById = internalQuery({
  args: { id: v.id("webhookExecutions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Update execution log with retry results and increment the attempt counter. Skipped in test mode. */
export const incrementExecutionAttempt = internalMutation({
  args: {
    id: v.id("webhookExecutions"),
    status: webhookResultStatuses,
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (isTest) return;
    const execution = await ctx.db.get(args.id);
    if (!execution) return;

    await ctx.db.patch(args.id, {
      status: args.status,
      responseStatus: args.responseStatus,
      responseBody: args.responseBody,
      error: args.error,
      attempts: execution.attempts + 1,
      completedAt: Date.now(),
    });
  },
});

// Helper function to generate HMAC signature
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Check if hostname is a loopback address */
function isLoopbackAddress(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname.startsWith("127.")
  );
}

/** Check if hostname is a private IPv4 address */
function isPrivateIPv4(hostname: string): boolean {
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (!isIPv4) return false;

  // 10.0.0.0/8
  if (hostname.startsWith("10.")) return true;
  // 192.168.0.0/16
  if (hostname.startsWith("192.168.")) return true;
  // 172.16.0.0/12
  if (hostname.startsWith("172.")) {
    const parts = hostname.split(".");
    const secondOctet = parseInt(parts[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  return false;
}

/** Check if hostname is AWS/cloud metadata endpoint */
function isMetadataEndpoint(hostname: string): boolean {
  return hostname === "169.254.169.254";
}

function validateWebhookUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw validation("url", "Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw validation("url", "Invalid URL protocol. Must be http or https.");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (isLoopbackAddress(hostname)) {
    throw validation("url", "Localhost URLs are not allowed.");
  }

  if (isPrivateIPv4(hostname)) {
    throw validation("url", "Private IP addresses are not allowed.");
  }

  if (isMetadataEndpoint(hostname)) {
    throw validation("url", "Metadata service URLs are not allowed.");
  }
}
