/**
 * Gmail API — Send emails and detect replies via user's connected Gmail
 *
 * Uses the Gmail REST API (not SMTP) since we already have OAuth tokens.
 * This avoids needing nodemailer or IMAP — everything goes through Google's API.
 *
 * Endpoints used:
 * - POST /gmail/v1/users/me/messages/send — Send an email
 * - GET /gmail/v1/users/me/messages — List messages (for reply detection)
 * - GET /gmail/v1/users/me/messages/{id} — Get message details
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { logger } from "../lib/logger";
import { DAY, MINUTE } from "../lib/timeUtils";
import { stopEnrollment } from "./enrollments";

// =============================================================================
// Gmail API Helpers
// =============================================================================

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via Gmail API.
 *
 * Gmail API requires the email as a base64url-encoded RFC 2822 message.
 */
async function sendViaGmail(
  accessToken: string,
  params: {
    from: string;
    fromName: string;
    to: string;
    subject: string;
    htmlBody: string;
    enrollmentId: string;
    unsubscribeUrl: string;
  },
): Promise<GmailSendResult> {
  // Build RFC 2822 email message
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const rawMessage = [
    `From: ${params.fromName} <${params.from}>`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    // RFC 8058 one-click unsubscribe headers (required by Google/Yahoo since 2024)
    `List-Unsubscribe: <${params.unsubscribeUrl}>`,
    `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
    // Custom header to identify outreach emails (for reply matching)
    `X-Nixelo-Enrollment: ${params.enrollmentId}`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    stripHtml(params.htmlBody),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    params.htmlBody,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  // Base64url encode (Gmail API requirement)
  const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const response = await fetchWithTimeout(
      `${GMAIL_API_BASE}/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encoded }),
      },
      15000,
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Gmail send failed: ${response.status}`, { error: errorText });
      return {
        success: false,
        error: `Gmail API ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    const data = (await response.json()) as { id: string; threadId: string };
    return { success: true, messageId: data.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logger.error("Gmail send exception", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Refresh an expired OAuth access token using the refresh token.
 */
async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; expiresAt: number } | null> {
  try {
    const response = await fetchWithTimeout(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        }),
      },
      10000,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as { access_token: string; expires_in: number };
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  } catch {
    return null;
  }
}

/** Strip HTML tags for plain text alternative */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// =============================================================================
// Send Email Action (called by sendEngine)
// =============================================================================

/**
 * Send a sequence email via the user's connected Gmail.
 * This replaces the placeholder in sendEngine.ts.
 */
export const sendViaGmailAction = internalAction({
  args: {
    mailboxId: v.id("outreachMailboxes"),
    enrollmentId: v.id("outreachEnrollments"),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
  },
  handler: async (ctx, args) => {
    // Get mailbox tokens
    const mailbox = await ctx.runQuery(internal.outreach.gmail.getMailboxTokens, {
      mailboxId: args.mailboxId,
    });

    if (!mailbox) {
      return { success: false, error: "Mailbox not found or inactive" };
    }

    let { accessToken } = mailbox;

    // Refresh token if expired (or about to expire in next 5 minutes)
    if (mailbox.expiresAt && mailbox.expiresAt < Date.now() + 5 * MINUTE) {
      if (!mailbox.refreshToken) {
        return { success: false, error: "Access token expired and no refresh token available" };
      }

      const clientId = process.env.AUTH_GOOGLE_ID;
      const clientSecret = process.env.AUTH_GOOGLE_SECRET;
      if (!clientId || !clientSecret) {
        return { success: false, error: "Google OAuth not configured" };
      }

      const refreshed = await refreshAccessToken(mailbox.refreshToken, clientId, clientSecret);
      if (!refreshed) {
        return { success: false, error: "Failed to refresh access token" };
      }

      // Update stored tokens
      await ctx.runMutation(internal.outreach.gmail.updateMailboxTokens, {
        mailboxId: args.mailboxId,
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
      });

      accessToken = refreshed.accessToken;
    }

    // Build unsubscribe URL
    const trackingDomain = "track.nixelo.com"; // TODO: make configurable per sequence
    const unsubscribeUrl = `https://${trackingDomain}/t/u/${args.enrollmentId}`;

    // Send via Gmail API
    const result = await sendViaGmail(accessToken, {
      from: args.fromEmail,
      fromName: args.fromName,
      to: args.to,
      subject: args.subject,
      htmlBody: args.body,
      enrollmentId: args.enrollmentId,
      unsubscribeUrl,
    });

    return result;
  },
});

// =============================================================================
// Reply Detection Action (called by cron)
// =============================================================================

/**
 * Poll a connected Gmail mailbox for new replies to outreach emails.
 *
 * Strategy:
 * 1. List recent messages in inbox (last 24h or since last check)
 * 2. For each message, check if it's a reply to one of our outreach emails
 *    by looking for the X-Nixelo-Enrollment header in the thread
 * 3. If it's a reply, stop the enrollment and record the event
 */
export const checkReplies = internalAction({
  args: { mailboxId: v.id("outreachMailboxes") },
  handler: async (ctx, args) => {
    const mailbox = await ctx.runQuery(internal.outreach.gmail.getMailboxTokens, {
      mailboxId: args.mailboxId,
    });

    if (!mailbox?.accessToken) return { checked: 0, replies: 0 };

    let { accessToken } = mailbox;

    // Refresh if needed
    if (mailbox.expiresAt && mailbox.expiresAt < Date.now() + 5 * MINUTE && mailbox.refreshToken) {
      const clientId = process.env.AUTH_GOOGLE_ID;
      const clientSecret = process.env.AUTH_GOOGLE_SECRET;
      if (clientId && clientSecret) {
        const refreshed = await refreshAccessToken(mailbox.refreshToken, clientId, clientSecret);
        if (refreshed) {
          await ctx.runMutation(internal.outreach.gmail.updateMailboxTokens, {
            mailboxId: args.mailboxId,
            accessToken: refreshed.accessToken,
            expiresAt: refreshed.expiresAt,
          });
          accessToken = refreshed.accessToken;
        }
      }
    }

    // List recent inbox messages (last 24 hours, unread)
    const oneDayAgo = Math.floor((Date.now() - DAY) / 1000);
    const query = `in:inbox is:unread after:${oneDayAgo}`;

    try {
      const response = await fetchWithTimeout(
        `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=50`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        15000,
      );

      if (!response.ok) {
        logger.warn(`Gmail list messages failed: ${response.status}`);
        return { checked: 0, replies: 0 };
      }

      const data = (await response.json()) as {
        messages?: Array<{ id: string; threadId: string }>;
      };

      if (!data.messages || data.messages.length === 0) {
        return { checked: 0, replies: 0 };
      }

      let replies = 0;

      for (const msg of data.messages) {
        // Fetch full message to check headers
        const msgResponse = await fetchWithTimeout(
          `${GMAIL_API_BASE}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=In-Reply-To&metadataHeaders=X-Nixelo-Enrollment`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
          10000,
        );

        if (!msgResponse.ok) continue;

        const msgData = (await msgResponse.json()) as {
          id: string;
          threadId: string;
          payload: {
            headers: Array<{ name: string; value: string }>;
          };
        };

        // Check if this thread contains an outreach email
        // Look for In-Reply-To or check if we have an enrollment for the sender
        const fromHeader = msgData.payload.headers.find((h) => h.name === "From");
        const senderEmail = fromHeader?.value?.match(/<([^>]+)>/)?.[1] ?? fromHeader?.value;

        if (!senderEmail) continue;

        // Check if this sender is an active outreach contact
        const matchResult = await ctx.runMutation(internal.outreach.gmail.findEnrollmentForReply, {
          senderEmail: senderEmail.toLowerCase().trim(),
          mailboxId: args.mailboxId,
        });

        if (matchResult.matched) {
          replies++;
        }
      }

      // Update last health check
      await ctx.runMutation(internal.outreach.gmail.updateMailboxHealthCheck, {
        mailboxId: args.mailboxId,
      });

      return { checked: data.messages.length, replies };
    } catch (e) {
      logger.warn("Gmail reply polling failed", {
        error: e instanceof Error ? e.message : "unknown",
      });
      return { checked: 0, replies: 0 };
    }
  },
});

/**
 * Poll all active mailboxes for replies.
 * Called by cron every 5 minutes.
 */
export const checkAllMailboxReplies = internalAction({
  args: {},
  handler: async (ctx) => {
    const mailboxes = await ctx.runQuery(internal.outreach.gmail.listActiveMailboxes, {});

    let totalReplies = 0;
    for (const mailbox of mailboxes) {
      const result = await ctx.runAction(internal.outreach.gmail.checkReplies, {
        mailboxId: mailbox._id,
      });
      totalReplies += result.replies;
    }

    if (totalReplies > 0) {
      logger.info(`Outreach reply detection: found ${totalReplies} new replies`);
    }
  },
});

// =============================================================================
// Internal Queries/Mutations (called by actions above)
// =============================================================================

/** Get mailbox tokens for sending (internal — tokens never go to client) */
export const getMailboxTokens = internalQuery({
  args: { mailboxId: v.id("outreachMailboxes") },
  handler: async (ctx, args) => {
    const mailbox = await ctx.db.get(args.mailboxId);
    if (!mailbox?.isActive) return null;

    return {
      accessToken: mailbox.accessToken,
      refreshToken: mailbox.refreshToken,
      expiresAt: mailbox.expiresAt,
      email: mailbox.email,
      displayName: mailbox.displayName,
    };
  },
});

/** Update tokens after refresh */
export const updateMailboxTokens = internalMutation({
  args: {
    mailboxId: v.id("outreachMailboxes"),
    accessToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mailboxId, {
      accessToken: args.accessToken,
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
  },
});

/** Update last health check timestamp */
export const updateMailboxHealthCheck = internalMutation({
  args: { mailboxId: v.id("outreachMailboxes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mailboxId, {
      lastHealthCheckAt: Date.now(),
    });
  },
});

/** List active mailboxes for reply polling */
export const listActiveMailboxes = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("outreachMailboxes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(BOUNDED_LIST_LIMIT);
  },
});

/**
 * Match an incoming reply to an active enrollment.
 * If matched, stops the enrollment and records the reply event.
 */
export const findEnrollmentForReply = internalMutation({
  args: {
    senderEmail: v.string(),
    mailboxId: v.id("outreachMailboxes"),
  },
  handler: async (ctx, args) => {
    // Find the mailbox's organization
    const mailbox = await ctx.db.get(args.mailboxId);
    if (!mailbox) return { matched: false };

    // Find a contact with this email in the organization
    const contact = await ctx.db
      .query("outreachContacts")
      .withIndex("by_organization_email", (q) =>
        q.eq("organizationId", mailbox.organizationId).eq("email", args.senderEmail),
      )
      .first();

    if (!contact) return { matched: false };

    // Find an active enrollment for this contact
    const enrollments = await ctx.db
      .query("outreachEnrollments")
      .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
      .take(BOUNDED_LIST_LIMIT);

    const activeEnrollment = enrollments.find(
      (e) => e.status === "active" || e.status === "paused",
    );

    if (!activeEnrollment) return { matched: false };

    // Record reply event
    await ctx.db.insert("outreachEvents", {
      enrollmentId: activeEnrollment._id,
      sequenceId: activeEnrollment.sequenceId,
      contactId: contact._id,
      organizationId: mailbox.organizationId,
      type: "replied",
      step: activeEnrollment.currentStep,
      createdAt: Date.now(),
    });

    // Stop the enrollment
    await stopEnrollment(ctx, activeEnrollment._id, "replied");

    // Update sequence stats
    const sequence = await ctx.db.get(activeEnrollment.sequenceId);
    if (sequence?.stats) {
      await ctx.db.patch(activeEnrollment.sequenceId, {
        stats: { ...sequence.stats, replied: sequence.stats.replied + 1 },
      });
    }

    logger.info(
      `Outreach reply detected: ${args.senderEmail} replied to sequence ${activeEnrollment.sequenceId}`,
    );

    return { matched: true };
  },
});
