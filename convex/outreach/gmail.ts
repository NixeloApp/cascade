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
import type { Id } from "../_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { BOUNDED_LIST_LIMIT, collectInBatches } from "../lib/boundedQueries";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { logger } from "../lib/logger";
import { DAY, MINUTE } from "../lib/timeUtils";
import { suppress } from "./contacts";
import { stopEnrollment } from "./enrollments";
import { isAutoReply } from "./helpers";
import {
  getMailboxRuntimeState,
  listActiveMailboxesForProvider,
  updateMailboxRuntimeHealthCheck,
  updateMailboxRuntimeTokens,
} from "./mailboxRuntime";

// =============================================================================
// Gmail API Helpers
// =============================================================================

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BOUNCE_SENDER_PATTERNS = [/mailer-daemon/i, /postmaster/i, /mail delivery subsystem/i];
const BOUNCE_SUBJECT_PATTERNS = [
  /delivery status notification/i,
  /delivery failure/i,
  /delivery incomplete/i,
  /message blocked/i,
  /returned mail/i,
  /undeliverable/i,
];
const BOUNCE_BODY_PATTERNS = [
  /delivery to the following recipient(?:s)? failed/i,
  /address not found/i,
  /your message wasn't delivered/i,
  /the following address(?:es)? failed/i,
  /diagnostic-code:/i,
  /final-recipient:/i,
  /\bstatus:\s*5\.\d\.\d\b/i,
];
const BOUNCE_EVENT_FALLBACK_DEDUP_WINDOW_MS = 5 * MINUTE;
const BOUNCE_RECIPIENT_PATTERNS = [
  /Final-Recipient:\s*rfc822;\s*<?([^>\s;]+@[^>\s;]+)>?/gi,
  /Original-Recipient:\s*rfc822;\s*<?([^>\s;]+@[^>\s;]+)>?/gi,
  /X-Failed-Recipients:\s*([^\r\n]+)/gi,
  /Delivery to the following recipient(?:s)? failed(?: permanently)?:\s*([\s\S]*?)(?:\n\s*\n|$)/gi,
  /The following address(?:es)? failed:\s*([\s\S]*?)(?:\n\s*\n|$)/gi,
];

type GmailMessageHeader = { name: string; value: string };

type GmailMessagePayload = {
  mimeType?: string;
  headers?: GmailMessageHeader[];
  body?: { data?: string };
  parts?: GmailMessagePayload[];
};

type GmailFullMessage = {
  snippet?: string;
  payload?: GmailMessagePayload;
};

type GmailInboundMessage =
  | { kind: "skip" }
  | { kind: "reply"; senderEmail: string }
  | {
      kind: "bounce";
      recipientEmails: string[];
      diagnosticCode?: string;
      reason?: string;
    };

/** Try to refresh an expiring access token. Returns the new token or null. */
async function tryRefreshToken(
  mailbox: { expiresAt?: number; refreshToken?: string },
  ctx: Pick<import("../_generated/server").ActionCtx, "runMutation">,
  mailboxId: Id<"outreachMailboxes">,
): Promise<string | null> {
  if (!mailbox.expiresAt || mailbox.expiresAt >= Date.now() + 5 * MINUTE || !mailbox.refreshToken) {
    return null;
  }
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) return null;

  const refreshed = await refreshAccessToken(mailbox.refreshToken, clientId, clientSecret);
  if (!refreshed) return null;

  await ctx.runMutation(internal.outreach.gmail.updateMailboxTokens, {
    mailboxId,
    accessToken: refreshed.accessToken,
    expiresAt: refreshed.expiresAt,
  });
  return refreshed.accessToken;
}

/** Extract sender email from a Gmail message's From header. */
function extractSenderEmail(headers: Array<{ name: string; value: string }>): string | null {
  const fromHeader = headers.find((h) => h.name === "From");
  if (!fromHeader?.value) return null;
  const match = fromHeader.value.match(/<([^>]+)>/);
  return (match?.[1] ?? fromHeader.value).toLowerCase().trim() || null;
}

function getHeaderValue(headers: GmailMessageHeader[], name: string): string | null {
  const header = headers.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase());
  return header?.value ?? null;
}

function decodeBase64UrlUtf8(encoded: string | undefined): string {
  if (!encoded) return "";

  try {
    const normalized = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function extractTextFromPayload(payload: GmailMessagePayload | undefined): string {
  if (!payload) return "";

  const sections: string[] = [];
  const mimeType = payload.mimeType?.toLowerCase() ?? "";
  const bodyText = decodeBase64UrlUtf8(payload.body?.data);

  if (
    bodyText &&
    (mimeType.startsWith("text/") ||
      mimeType === "message/delivery-status" ||
      mimeType === "message/rfc822" ||
      mimeType === "")
  ) {
    sections.push(bodyText);
  }

  for (const part of payload.parts ?? []) {
    const partText = extractTextFromPayload(part);
    if (partText) sections.push(partText);
  }

  return sections.join("\n");
}

function collectEmails(value: string): string[] {
  const matches = value.match(EMAIL_PATTERN) ?? [];
  return [...new Set(matches.map((email) => email.toLowerCase().trim()))];
}

function getMessageText(message: GmailFullMessage): string {
  return [message.snippet ?? "", extractTextFromPayload(message.payload)]
    .filter((segment) => segment.length > 0)
    .join("\n");
}

function isBounceLikeMessage(params: {
  mimeType: string;
  from: string;
  subject: string;
  bodyText: string;
}): boolean {
  return (
    params.mimeType === "multipart/report" ||
    BOUNCE_SENDER_PATTERNS.some((pattern) => pattern.test(params.from)) ||
    BOUNCE_SUBJECT_PATTERNS.some((pattern) => pattern.test(params.subject)) ||
    BOUNCE_BODY_PATTERNS.some((pattern) => pattern.test(params.bodyText))
  );
}

function collectBounceRecipients(headers: GmailMessageHeader[], bodyText: string): string[] {
  const recipients = new Set<string>();
  for (const pattern of BOUNCE_RECIPIENT_PATTERNS) {
    for (const match of bodyText.matchAll(pattern)) {
      for (const email of collectEmails(match[1] ?? "")) {
        recipients.add(email);
      }
    }
  }

  const xFailedRecipients = getHeaderValue(headers, "X-Failed-Recipients");
  for (const email of collectEmails(xFailedRecipients ?? "")) {
    recipients.add(email);
  }

  return [...recipients];
}

function extractDiagnosticCode(bodyText: string): string | undefined {
  return (
    bodyText.match(/Diagnostic-Code:\s*[^\r\n;]+;\s*([^\r\n]+)/i)?.[1]?.trim() ??
    bodyText.match(/\b(5\.\d\.\d[^\r\n]*)/i)?.[1]?.trim()
  );
}

function extractBounceDetails(message: GmailFullMessage): {
  recipientEmails: string[];
  diagnosticCode?: string;
  reason?: string;
} | null {
  const headers = message.payload?.headers ?? [];
  const subject = getHeaderValue(headers, "Subject") ?? "";
  const from = getHeaderValue(headers, "From") ?? "";
  const bodyText = getMessageText(message);
  const mimeType = message.payload?.mimeType?.toLowerCase() ?? "";

  if (!isBounceLikeMessage({ mimeType, from, subject, bodyText })) return null;

  const recipientEmails = collectBounceRecipients(headers, bodyText);
  if (recipientEmails.length === 0) return null;

  return {
    recipientEmails,
    diagnosticCode: extractDiagnosticCode(bodyText),
    reason: subject || message.snippet,
  };
}

interface GmailSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
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
  // Sanitize header values — strip CR/LF to prevent header injection
  const sanitize = (v: string) => v.replace(/[\r\n]/g, "");
  const safeFromName = sanitize(params.fromName);
  const safeFrom = sanitize(params.from);
  const safeTo = sanitize(params.to);
  const safeSubject = sanitize(params.subject);

  // Build RFC 2822 email message
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const rawMessage = [
    `From: ${safeFromName} <${safeFrom}>`,
    `To: ${safeTo}`,
    `Subject: ${safeSubject}`,
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
    return { success: true, messageId: data.id, threadId: data.threadId };
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
  } catch (e) {
    logger.warn("OAuth token refresh failed", {
      error: e instanceof Error ? e.message : "unknown",
    });
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
    trackingDomain: v.string(),
  },
  handler: async (ctx, args) => {
    // Get mailbox tokens
    const mailbox = await ctx.runMutation(internal.outreach.gmail.getMailboxTokens, {
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

    // Sanitize tracking domain — strip anything that could break RFC 2822 headers
    const safeTrackingDomain = args.trackingDomain.replace(/[\r\n\s/]/g, "");
    const unsubscribeUrl = `https://${safeTrackingDomain}/t/u/${args.enrollmentId}`;

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

/** Metadata headers requested for reply detection and auto-reply filtering. */
const REPLY_METADATA_HEADERS = [
  "From",
  "Subject",
  "In-Reply-To",
  "Auto-Submitted",
  "X-Auto-Response-Suppress",
  "X-Autoreply",
  "X-Autorespond",
  "Precedence",
];

const REPLY_HEADER_PARAMS = REPLY_METADATA_HEADERS.map((h) => `metadataHeaders=${h}`).join("&");

/** Fetch a single Gmail message and classify it as a reply, bounce, or ignorable noise. */
async function fetchInboundMessage(
  msgId: string,
  authHeaders: Record<string, string>,
): Promise<GmailInboundMessage> {
  const msgResponse = await fetchWithTimeout(
    `${GMAIL_API_BASE}/messages/${msgId}?format=full&${REPLY_HEADER_PARAMS}`,
    { headers: authHeaders },
    10000,
  );
  if (!msgResponse.ok) return { kind: "skip" };

  const msgData = (await msgResponse.json()) as GmailFullMessage;
  const bounceDetails = extractBounceDetails(msgData);
  if (bounceDetails) {
    return { kind: "bounce", ...bounceDetails };
  }

  const headers = msgData.payload?.headers ?? [];
  const messageText = getMessageText(msgData);

  // Skip auto-replies (OOO, bounce notifications, auto-responders)
  if (isAutoReply(headers, messageText)) return { kind: "skip" };

  const senderEmail = extractSenderEmail(headers);
  return senderEmail ? { kind: "reply", senderEmail } : { kind: "skip" };
}

/**
 * Poll a connected Gmail mailbox for new replies to outreach emails.
 *
 * Strategy:
 * 1. List recent messages in inbox (last 24h or since last check)
 * 2. For each message, check if it's a reply to one of our outreach emails
 *    by looking for the X-Nixelo-Enrollment header in the thread
 * 3. If it's a reply, stop the enrollment and record the event
 */
type GmailMessageRef = { id: string; threadId: string };

type FetchPageResult =
  | { status: "ok"; messages: GmailMessageRef[]; nextPageToken?: string }
  | { status: "empty" }
  | { status: "error" };

/** Fetch a single page of Gmail messages with explicit success/empty/error states. */
async function fetchMessagePage(
  authHeaders: Record<string, string>,
  query: string,
  pageToken?: string,
): Promise<FetchPageResult> {
  const url = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}`;
  const response = await fetchWithTimeout(url, { headers: authHeaders }, 15000);
  if (!response.ok) return { status: "error" };
  const data = (await response.json()) as { messages?: GmailMessageRef[]; nextPageToken?: string };
  if (!data.messages?.length) return { status: "empty" };
  return { status: "ok", messages: data.messages, nextPageToken: data.nextPageToken };
}

/** Process a batch of Gmail messages, matching replies to enrollments. */
async function processMessageBatch(
  ctx: Pick<import("../_generated/server").ActionCtx, "runMutation">,
  messages: GmailMessageRef[],
  authHeaders: Record<string, string>,
  mailboxId: Id<"outreachMailboxes">,
): Promise<{ replies: number; bounces: number }> {
  let replies = 0;
  let bounces = 0;
  for (const msg of messages) {
    const inboundMessage = await fetchInboundMessage(msg.id, authHeaders);
    if (inboundMessage.kind === "skip") continue;

    if (inboundMessage.kind === "reply") {
      const result = await ctx.runMutation(internal.outreach.gmail.findEnrollmentForReply, {
        senderEmail: inboundMessage.senderEmail,
        mailboxId,
        gmailThreadId: msg.threadId,
      });
      if (result.matched) replies++;
      continue;
    }

    for (const recipientEmail of inboundMessage.recipientEmails) {
      const result = await ctx.runMutation(internal.outreach.gmail.findEnrollmentForBounce, {
        bouncedRecipientEmail: recipientEmail,
        mailboxId,
        gmailMessageId: msg.id,
        gmailThreadId: msg.threadId,
        diagnosticCode: inboundMessage.diagnosticCode,
        bounceReason: inboundMessage.reason,
      });
      if (result.matched) bounces++;
    }
  }
  return { replies, bounces };
}

/** Paginate through Gmail messages and match replies to enrollments. */
async function pollGmailReplies(
  ctx: Pick<import("../_generated/server").ActionCtx, "runMutation">,
  authHeaders: Record<string, string>,
  query: string,
  mailboxId: Id<"outreachMailboxes">,
): Promise<{ checked: number; replies: number; bounces: number; completedCleanly: boolean }> {
  let replies = 0;
  let bounces = 0;
  let totalChecked = 0;
  let pageToken: string | undefined;
  let completedCleanly = true;

  for (let page = 0; page < 5; page++) {
    const pageResult = await fetchMessagePage(authHeaders, query, pageToken);
    if (pageResult.status === "error") {
      completedCleanly = false;
      break;
    }
    if (pageResult.status === "empty") break;

    const batchResult = await processMessageBatch(ctx, pageResult.messages, authHeaders, mailboxId);
    replies += batchResult.replies;
    bounces += batchResult.bounces;
    totalChecked += pageResult.messages.length;
    pageToken = pageResult.nextPageToken;
    if (!pageToken) break;
  }

  return { checked: totalChecked, replies, bounces, completedCleanly };
}

export const checkReplies = internalAction({
  args: { mailboxId: v.id("outreachMailboxes") },
  handler: async (ctx, args) => {
    const mailbox = await ctx.runMutation(internal.outreach.gmail.getMailboxTokens, {
      mailboxId: args.mailboxId,
    });
    if (!mailbox?.accessToken) return { checked: 0, replies: 0, bounces: 0 };

    const refreshed = await tryRefreshToken(mailbox, ctx, args.mailboxId);
    const accessToken = refreshed ?? mailbox.accessToken;
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const sinceEpoch = mailbox.lastHealthCheckAt
      ? Math.floor((mailbox.lastHealthCheckAt - 5 * MINUTE) / 1000)
      : Math.floor((Date.now() - DAY) / 1000);
    const query = `in:inbox after:${sinceEpoch}`;

    try {
      const result = await pollGmailReplies(ctx, authHeaders, query, args.mailboxId);

      // Advance watermark only when the poll completed cleanly (all pages
      // processed or inbox was empty). Partial failures (API error mid-page)
      // don't advance to avoid skipping unprocessed messages.
      if (result.completedCleanly) {
        await ctx.runMutation(internal.outreach.gmail.updateMailboxHealthCheck, {
          mailboxId: args.mailboxId,
        });
      }
      return { checked: result.checked, replies: result.replies, bounces: result.bounces };
    } catch (e) {
      logger.warn("Gmail reply polling failed", {
        error: e instanceof Error ? e.message : "unknown",
      });
      return { checked: 0, replies: 0, bounces: 0 };
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
    let totalBounces = 0;
    for (const mailbox of mailboxes) {
      const result = await ctx.runAction(internal.outreach.gmail.checkReplies, {
        mailboxId: mailbox._id,
      });
      totalReplies += result.replies;
      totalBounces += result.bounces;
    }

    if (totalReplies > 0 || totalBounces > 0) {
      logger.info(
        `Outreach inbox processing: found ${totalReplies} replies and ${totalBounces} bounces`,
      );
    }
  },
});

// =============================================================================
// Internal Queries/Mutations (called by actions above)
// =============================================================================

/** Get mailbox tokens for sending (internal — tokens never go to client) */
export const getMailboxTokens = internalMutation({
  args: { mailboxId: v.id("outreachMailboxes") },
  handler: async (ctx, args) => await getMailboxRuntimeState(ctx, args.mailboxId),
});

/** Update tokens after refresh */
export const updateMailboxTokens = internalMutation({
  args: {
    mailboxId: v.id("outreachMailboxes"),
    accessToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => await updateMailboxRuntimeTokens(ctx, args),
});

/** Update last health check timestamp */
export const updateMailboxHealthCheck = internalMutation({
  args: { mailboxId: v.id("outreachMailboxes") },
  handler: async (ctx, args) => await updateMailboxRuntimeHealthCheck(ctx, args.mailboxId),
});

/** List active mailboxes for reply polling */
export const listActiveMailboxes = internalQuery({
  args: {},
  handler: async (ctx) => await listActiveMailboxesForProvider(ctx, "google"),
});

async function getActiveMailboxEnrollmentsForContact(
  ctx: Pick<import("../_generated/server").MutationCtx, "db">,
  contactId: Id<"outreachContacts">,
  mailboxId: Id<"outreachMailboxes">,
) {
  const enrollments = await collectInBatches((cursor) =>
    ctx.db
      .query("outreachEnrollments")
      .withIndex("by_contact", (q) => q.eq("contactId", contactId))
      .paginate({ numItems: BOUNDED_LIST_LIMIT, cursor }),
  );

  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "active" || enrollment.status === "paused",
  );

  const enrollmentsWithSequence = await Promise.all(
    activeEnrollments.map(async (enrollment) => ({
      enrollment,
      sequence: await ctx.db.get(enrollment.sequenceId),
    })),
  );

  return enrollmentsWithSequence
    .filter((entry) => entry.sequence?.mailboxId === mailboxId)
    .map((entry) => entry.enrollment);
}

function classifyBounceType(params: { diagnosticCode?: string; reason?: string }): "hard" | "soft" {
  const details = `${params.diagnosticCode ?? ""}\n${params.reason ?? ""}`.toLowerCase();
  if (!details) {
    return "soft";
  }

  if (
    /\b5\.\d\.\d\b/.test(details) ||
    /(^|[^0-9])5\d{2}([^0-9]|$)/.test(details) ||
    /does not exist|not found|unknown user|no such user|invalid recipient|recipient address rejected/.test(
      details,
    )
  ) {
    return "hard";
  }

  if (
    /\b4\.\d\.\d\b/.test(details) ||
    /(^|[^0-9])4\d{2}([^0-9]|$)/.test(details) ||
    /temporary|temporarily|try again|mailbox full|over quota|rate limit|resources temporarily unavailable/.test(
      details,
    )
  ) {
    return "soft";
  }

  return "soft";
}

/**
 * Match an incoming reply to an active enrollment.
 * If matched, stops the enrollment and records the reply event.
 */
export const findEnrollmentForReply = internalMutation({
  args: {
    senderEmail: v.string(),
    mailboxId: v.id("outreachMailboxes"),
    gmailThreadId: v.optional(v.string()),
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

    const activeEnrollments = await getActiveMailboxEnrollmentsForContact(
      ctx,
      contact._id,
      args.mailboxId,
    );

    // Require thread match when threadId is available
    const threadId = args.gmailThreadId;
    const activeEnrollment = threadId
      ? activeEnrollments.find((e) => e.gmailThreadIds?.includes(threadId))
      : activeEnrollments[0];

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

/** Match a Gmail bounce notification to an enrollment and suppress the failed recipient. */
export const findEnrollmentForBounce = internalMutation({
  args: {
    bouncedRecipientEmail: v.string(),
    mailboxId: v.id("outreachMailboxes"),
    gmailMessageId: v.optional(v.string()),
    gmailThreadId: v.optional(v.string()),
    diagnosticCode: v.optional(v.string()),
    bounceReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const mailbox = await ctx.db.get(args.mailboxId);
    if (!mailbox) return { matched: false };
    const now = Date.now();

    const normalizedEmail = args.bouncedRecipientEmail.toLowerCase().trim();
    const contact = await ctx.db
      .query("outreachContacts")
      .withIndex("by_organization_email", (q) =>
        q.eq("organizationId", mailbox.organizationId).eq("email", normalizedEmail),
      )
      .first();
    if (!contact) return { matched: false };

    const activeEnrollments = await getActiveMailboxEnrollmentsForContact(
      ctx,
      contact._id,
      args.mailboxId,
    );
    if (activeEnrollments.length === 0) return { matched: false };

    const threadId = args.gmailThreadId;
    const matchedByThread = threadId
      ? activeEnrollments.find((enrollment) => enrollment.gmailThreadIds?.includes(threadId))
      : undefined;
    const activeEnrollment =
      matchedByThread ?? (activeEnrollments.length === 1 ? activeEnrollments[0] : undefined);
    if (!activeEnrollment) return { matched: false };
    const bounceType = classifyBounceType({
      diagnosticCode: args.diagnosticCode,
      reason: args.bounceReason,
    });
    const existingBounceEvents = await collectInBatches((cursor) =>
      ctx.db
        .query("outreachEvents")
        .withIndex("by_enrollment", (q) => q.eq("enrollmentId", activeEnrollment._id))
        .paginate({ numItems: BOUNDED_LIST_LIMIT, cursor }),
    );
    const alreadyRecorded = args.gmailMessageId
      ? existingBounceEvents.some(
          (event) =>
            event.type === "bounced" && event.metadata?.gmailMessageId === args.gmailMessageId,
        )
      : existingBounceEvents.some(
          (event) =>
            event.type === "bounced" &&
            event.metadata?.failedRecipient === normalizedEmail &&
            event.createdAt >= now - BOUNCE_EVENT_FALLBACK_DEDUP_WINDOW_MS,
        );
    if (alreadyRecorded) {
      return { matched: false };
    }

    await ctx.db.insert("outreachEvents", {
      enrollmentId: activeEnrollment._id,
      sequenceId: activeEnrollment.sequenceId,
      contactId: contact._id,
      organizationId: mailbox.organizationId,
      type: "bounced",
      step: activeEnrollment.currentStep,
      metadata: {
        bounceType,
        diagnosticCode: args.diagnosticCode,
        failedRecipient: normalizedEmail,
        gmailMessageId: args.gmailMessageId,
        replyContent: args.bounceReason,
      },
      createdAt: now,
    });

    if (bounceType === "hard") {
      await stopEnrollment(ctx, activeEnrollment._id, "bounced");
      await suppress(
        ctx,
        mailbox.organizationId,
        normalizedEmail,
        "hard_bounce",
        activeEnrollment._id,
      );
    }

    const sequence = await ctx.db.get(activeEnrollment.sequenceId);
    const stats = sequence?.stats ?? {
      enrolled: 0,
      sent: 0,
      opened: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
    };
    if (sequence) {
      await ctx.db.patch(activeEnrollment.sequenceId, {
        stats: { ...stats, bounced: stats.bounced + 1 },
      });
    }

    logger.info(
      `Outreach ${bounceType} bounce detected: ${normalizedEmail} bounced on sequence ${activeEnrollment.sequenceId}`,
    );

    return { matched: true };
  },
});
