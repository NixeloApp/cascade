/**
 * Outreach Tracking — Open pixel, click redirect, and unsubscribe endpoints
 *
 * These are HTTP handlers registered in the router. They handle:
 * - GET /t/o/{enrollmentId} → open tracking pixel (1x1 transparent GIF)
 * - GET /t/c/{linkId} → click tracking redirect (302 to original URL)
 * - GET /t/u/{enrollmentId} → unsubscribe page
 * - POST /t/u/{enrollmentId} → RFC 8058 one-click unsubscribe
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { httpAction, internalMutation, internalQuery } from "../_generated/server";
import { suppress } from "./contacts";
import { stopEnrollment } from "./enrollments";

// =============================================================================
// 1x1 Transparent GIF (pre-computed)
// =============================================================================

const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
]);

// =============================================================================
// HTTP Handlers (registered in router.ts)
// =============================================================================

/** Open tracking pixel — GET /t/o/{enrollmentId} */
export const handleOpenPixel = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const enrollmentId = parts[parts.length - 1];

  if (enrollmentId) {
    // Record open event asynchronously (don't block the pixel response)
    try {
      await ctx.runMutation(internal.outreach.tracking.recordOpen, {
        enrollmentId: enrollmentId as never,
      });
    } catch {
      // Silently fail — never block the pixel
    }
  }

  return new Response(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
});

/** Click tracking redirect — GET /t/c/{linkId} */
export const handleClickRedirect = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const linkId = parts[parts.length - 1];

  if (!linkId) {
    return new Response("Not found", { status: 404 });
  }

  // Look up the original URL
  const link = await ctx.runQuery(internal.outreach.tracking.getTrackingLink, {
    linkId: linkId as never,
  });

  if (!link) {
    return new Response("Not found", { status: 404 });
  }

  // Record click event asynchronously
  try {
    await ctx.runMutation(internal.outreach.tracking.recordClick, {
      trackingLinkId: linkId as never,
      enrollmentId: link.enrollmentId as never,
    });
  } catch {
    // Silently fail — always redirect
  }

  return new Response(null, {
    status: 302,
    headers: { Location: link.originalUrl },
  });
});

/** Unsubscribe page — GET /t/u/{enrollmentId} */
export const handleUnsubscribeGet = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const enrollmentId = parts[parts.length - 1];

  if (!enrollmentId) {
    return new Response("Not found", { status: 404 });
  }

  // Process unsubscribe
  try {
    await ctx.runMutation(internal.outreach.tracking.processUnsubscribe, {
      enrollmentId: enrollmentId as never,
    });
  } catch {
    // Still show success page even if already unsubscribed
  }

  return new Response(
    `<!DOCTYPE html>
<html><head><title>Unsubscribed</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px;">
<h2>You have been unsubscribed</h2>
<p>You will no longer receive emails from this sequence.</p>
</body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    },
  );
});

/** RFC 8058 one-click unsubscribe — POST /t/u/{enrollmentId} */
export const handleUnsubscribePost = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const enrollmentId = parts[parts.length - 1];

  if (!enrollmentId) {
    return new Response("Not found", { status: 404 });
  }

  try {
    await ctx.runMutation(internal.outreach.tracking.processUnsubscribe, {
      enrollmentId: enrollmentId as never,
    });
  } catch {
    // RFC 8058 requires 200 even on failure
  }

  return new Response(null, { status: 200 });
});

// =============================================================================
// Internal Mutations (called by HTTP handlers)
// =============================================================================

/** Record an open event for an enrollment */
export const recordOpen = internalMutation({
  args: { enrollmentId: v.id("outreachEnrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) return;

    await ctx.db.insert("outreachEvents", {
      enrollmentId: args.enrollmentId,
      sequenceId: enrollment.sequenceId,
      contactId: enrollment.contactId,
      organizationId: enrollment.organizationId,
      type: "opened",
      step: enrollment.currentStep,
      createdAt: Date.now(),
    });

    // Update enrollment timestamp (only first open matters)
    if (!enrollment.lastOpenedAt) {
      await ctx.db.patch(args.enrollmentId, { lastOpenedAt: Date.now() });
    }

    // Update sequence stats
    const sequence = await ctx.db.get(enrollment.sequenceId);
    if (sequence?.stats) {
      await ctx.db.patch(enrollment.sequenceId, {
        stats: { ...sequence.stats, opened: sequence.stats.opened + 1 },
      });
    }
  },
});

/** Look up a tracking link by ID */
export const getTrackingLink = internalQuery({
  args: { linkId: v.id("outreachTrackingLinks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.linkId);
  },
});

/** Record a click event */
export const recordClick = internalMutation({
  args: {
    trackingLinkId: v.id("outreachTrackingLinks"),
    enrollmentId: v.id("outreachEnrollments"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) return;

    const link = await ctx.db.get(args.trackingLinkId);

    await ctx.db.insert("outreachEvents", {
      enrollmentId: args.enrollmentId,
      sequenceId: enrollment.sequenceId,
      contactId: enrollment.contactId,
      organizationId: enrollment.organizationId,
      type: "clicked",
      step: enrollment.currentStep,
      trackingLinkId: args.trackingLinkId,
      metadata: link ? { linkUrl: link.originalUrl } : undefined,
      createdAt: Date.now(),
    });

    // Update enrollment timestamp
    if (!enrollment.lastClickedAt) {
      await ctx.db.patch(args.enrollmentId, { lastClickedAt: Date.now() });
    }
  },
});

/** Process an unsubscribe request */
export const processUnsubscribe = internalMutation({
  args: { enrollmentId: v.id("outreachEnrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) return;

    const contact = await ctx.db.get(enrollment.contactId);
    if (!contact) return;

    // Log unsubscribe event
    await ctx.db.insert("outreachEvents", {
      enrollmentId: args.enrollmentId,
      sequenceId: enrollment.sequenceId,
      contactId: enrollment.contactId,
      organizationId: enrollment.organizationId,
      type: "unsubscribed",
      step: enrollment.currentStep,
      createdAt: Date.now(),
    });

    // Stop the enrollment
    await stopEnrollment(ctx, args.enrollmentId, "unsubscribed");

    // Add to global suppression list
    await suppress(ctx, enrollment.organizationId, contact.email, "unsubscribe", args.enrollmentId);

    // Update sequence stats
    const sequence = await ctx.db.get(enrollment.sequenceId);
    if (sequence?.stats) {
      await ctx.db.patch(enrollment.sequenceId, {
        stats: { ...sequence.stats, unsubscribed: sequence.stats.unsubscribed + 1 },
      });
    }
  },
});
