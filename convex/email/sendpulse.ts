/**
 * SendPulse Email Provider Implementation
 *
 * Free tier: 15,000 emails/month (up to 500 subscribers)
 * Docs: https://sendpulse.com/integrations/api/smtp
 */

import { getSendPulseFromEmail, getSendPulseId, getSendPulseSecret } from "../lib/env";
import { validation } from "../lib/errors";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { SECOND } from "../lib/timeUtils";
import type { EmailProvider, EmailSendParams, EmailSendResult } from "./provider";

interface SendPulseTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SendPulseSmtpResponse {
  result: boolean;
  id?: string;
  message?: string;
}

export class SendPulseProvider implements EmailProvider {
  private clientId: string | undefined;
  private clientSecret: string | undefined;
  private defaultFrom: string | undefined;
  private accessToken: string | undefined;
  private tokenExpiry = 0;
  private baseUrl = "https://api.sendpulse.com";

  private getCredentials(): { clientId: string; clientSecret: string; defaultFrom: string } {
    // Lazy-load credentials only when needed
    if (!this.clientId) this.clientId = getSendPulseId();
    if (!this.clientSecret) this.clientSecret = getSendPulseSecret();
    if (!this.defaultFrom) this.defaultFrom = getSendPulseFromEmail();
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      defaultFrom: this.defaultFrom,
    };
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const { clientId, clientSecret } = this.getCredentials();

    const response = await fetchWithTimeout(
      `${this.baseUrl}/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
      10000,
    );

    if (!response.ok) {
      throw validation(
        "sendpulse",
        `SendPulse auth failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = (await response.json()) as SendPulseTokenResponse;
    this.accessToken = data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * SECOND;

    return this.accessToken;
  }

  private parseFromAddress(from: string): { email: string; name?: string } {
    // Parse "Name <email@example.com>" format
    const match = from.match(/^(.+?)\s*<(.+)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: from };
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    try {
      const token = await this.getAccessToken();
      const { defaultFrom } = this.getCredentials();
      const fromParsed = this.parseFromAddress(params.from || defaultFrom);
      const toList = Array.isArray(params.to) ? params.to : [params.to];

      const response = await fetchWithTimeout(
        `${this.baseUrl}/smtp/emails`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: {
              html: params.html,
              text: params.text || "",
              subject: params.subject,
              from: {
                name: fromParsed.name || "Nixelo",
                email: fromParsed.email,
              },
              to: toList.map((email) => ({ email })),
            },
          }),
        },
        10000,
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          id: "",
          success: false,
          error: `SendPulse API error: ${response.status} ${errorText}`,
        };
      }

      const result = (await response.json()) as SendPulseSmtpResponse;

      if (result.result) {
        return {
          id: result.id || "",
          success: true,
        };
      } else {
        return {
          id: "",
          success: false,
          error: result.message || "SendPulse send failed",
        };
      }
    } catch (error) {
      return {
        id: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
