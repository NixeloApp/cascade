/**
 * Microsoft Graph mail sender for outreach mailboxes.
 *
 * This covers the connection + send path for delegated Microsoft 365 mailboxes.
 * Reply polling remains Gmail-only for now.
 */

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";
import { getMicrosoftClientId, getMicrosoftClientSecret } from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { logger } from "../lib/logger";
import { MINUTE } from "../lib/timeUtils";
import { getMailboxRuntimeState, updateMailboxRuntimeTokens } from "./mailboxRuntime";

const MICROSOFT_GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

type MicrosoftSendResult = {
  error?: string;
  success: boolean;
};

type MailboxRuntimeState = Awaited<ReturnType<typeof getMailboxRuntimeState>>;

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]/g, "");
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
} | null> {
  try {
    const response = await fetchWithTimeout(
      MICROSOFT_TOKEN_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      },
      10000,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    logger.warn("Microsoft OAuth token refresh failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

async function sendViaMicrosoftGraph(
  accessToken: string,
  params: {
    enrollmentId: string;
    htmlBody: string;
    subject: string;
    to: string;
    unsubscribeUrl: string;
  },
): Promise<MicrosoftSendResult> {
  try {
    const response = await fetchWithTimeout(
      `${MICROSOFT_GRAPH_API_BASE}/me/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            body: {
              content: params.htmlBody,
              contentType: "HTML",
            },
            internetMessageHeaders: [
              {
                name: "List-Unsubscribe",
                value: `<${sanitizeHeaderValue(params.unsubscribeUrl)}>`,
              },
              {
                name: "List-Unsubscribe-Post",
                value: "List-Unsubscribe=One-Click",
              },
              {
                name: "X-Nixelo-Enrollment",
                value: sanitizeHeaderValue(params.enrollmentId),
              },
            ],
            subject: sanitizeHeaderValue(params.subject),
            toRecipients: [
              {
                emailAddress: {
                  address: sanitizeHeaderValue(params.to),
                },
              },
            ],
          },
          saveToSentItems: true,
        }),
      },
      15000,
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Microsoft Graph send failed: ${response.status}`, { error: errorText });
      return {
        success: false,
        error: `Microsoft Graph ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Microsoft Graph send exception", { error: message });
    return { success: false, error: message };
  }
}

export const sendViaMicrosoftAction = internalAction({
  args: {
    body: v.string(),
    enrollmentId: v.id("outreachEnrollments"),
    fromEmail: v.string(),
    fromName: v.string(),
    mailboxId: v.id("outreachMailboxes"),
    subject: v.string(),
    to: v.string(),
    trackingDomain: v.string(),
  },
  handler: async (ctx, args): Promise<{ error?: string; success: boolean }> => {
    const mailbox: MailboxRuntimeState = await ctx.runMutation(
      internal.outreach.microsoft.getMailboxTokens,
      {
        mailboxId: args.mailboxId,
      },
    );

    if (!mailbox) {
      return { success: false, error: "Mailbox not found or inactive" };
    }

    let accessToken: string = mailbox.accessToken;

    if (mailbox.expiresAt && mailbox.expiresAt < Date.now() + 5 * MINUTE) {
      if (!mailbox.refreshToken) {
        return { success: false, error: "Access token expired and no refresh token available" };
      }

      const clientId = getMicrosoftClientId();
      const clientSecret = getMicrosoftClientSecret();
      const refreshed = await refreshAccessToken(mailbox.refreshToken, clientId, clientSecret);
      if (!refreshed) {
        return { success: false, error: "Failed to refresh access token" };
      }

      await ctx.runMutation(internal.outreach.microsoft.updateMailboxTokens, {
        mailboxId: args.mailboxId,
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
        refreshToken: refreshed.refreshToken,
      });

      accessToken = refreshed.accessToken;
    }

    const safeTrackingDomain = args.trackingDomain.replace(/[\r\n\s/]/g, "");
    const unsubscribeUrl = `https://${safeTrackingDomain}/t/u/${args.enrollmentId}`;

    return await sendViaMicrosoftGraph(accessToken, {
      enrollmentId: args.enrollmentId,
      htmlBody: args.body,
      subject: args.subject,
      to: args.to,
      unsubscribeUrl,
    });
  },
});

export const getMailboxTokens = internalMutation({
  args: { mailboxId: v.id("outreachMailboxes") },
  handler: async (ctx, args) => await getMailboxRuntimeState(ctx, args.mailboxId),
});

export const updateMailboxTokens = internalMutation({
  args: {
    mailboxId: v.id("outreachMailboxes"),
    accessToken: v.string(),
    expiresAt: v.number(),
    refreshToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => await updateMailboxRuntimeTokens(ctx, args),
});
