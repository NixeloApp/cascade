/**
 * Mailtrap Email Provider Implementation
 *
 * Supports two modes:
 * - Sandbox: Emails land in Mailtrap inbox for E2E testing (dev)
 * - Production: Emails delivered to real recipients (prod)
 *
 * Free tier: 4,000 emails/month, 150/day
 * Docs: https://api-docs.mailtrap.io/docs/mailtrap-api-docs/
 */

import {
  getMailtrapApiToken,
  getMailtrapFromEmail,
  getMailtrapInboxId,
  getMailtrapMode,
} from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

interface MailtrapSendResponse {
  success: boolean;
  message_ids?: string[];
  errors?: string[];
}

export class MailtrapProvider implements EmailProvider {
  private apiToken = getMailtrapApiToken();
  private inboxId = getMailtrapInboxId();
  private defaultFrom = getMailtrapFromEmail();
  private mode = getMailtrapMode();

  private parseFromAddress(from: string): { email: string; name?: string } {
    // Parse "Name <email@example.com>" format
    const match = from.match(/^(.+?)\s*<(.+)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: from };
  }

  private getApiUrl(): string {
    if (this.mode === "production") {
      // Production API - delivers to real recipients
      return "https://send.api.mailtrap.io/api/send";
    }
    // Sandbox API - emails go to Mailtrap inbox
    return `https://sandbox.api.mailtrap.io/api/send/${this.inboxId}`;
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    try {
      const fromParsed = this.parseFromAddress(
        params.from || this.defaultFrom || "Nixelo <noreply@nixelo.com>",
      );
      const toList = Array.isArray(params.to) ? params.to : [params.to];

      const response = await fetchWithTimeout(
        this.getApiUrl(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiToken}`,
          },
          body: JSON.stringify({
            from: {
              email: fromParsed.email,
              name: fromParsed.name || "Nixelo",
            },
            to: toList.map((email) => ({ email })),
            subject: params.subject,
            html: params.html,
            text: params.text || "",
          }),
        },
        10000,
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          id: "",
          success: false,
          error: `Mailtrap API error: ${response.status} ${errorText}`,
        };
      }

      const result = (await response.json()) as MailtrapSendResponse;

      if (result.success) {
        return {
          id: result.message_ids?.[0] || "",
          success: true,
        };
      }
      return {
        id: "",
        success: false,
        error: result.errors?.join(", ") || "Mailtrap send failed",
      };
    } catch (error) {
      return {
        id: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
