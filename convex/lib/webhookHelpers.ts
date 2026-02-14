import { getErrorMessage } from "./errors";
import { validateDestination } from "./ssrf";

const WEBHOOK_TIMEOUT_MS = 10000;

export type WebhookDeliveryResult = {
  status: "success" | "failed";
  responseStatus?: number;
  responseBody?: string;
  error?: string;
};

/**
 * Delivers a webhook payload to a destination URL with timeout, signature, and error handling.
 */
export async function deliverWebhook(
  url: string,
  payload: string,
  event: string,
  secret?: string,
): Promise<WebhookDeliveryResult> {
  // 1. Validate destination URL (SSRF protection)
  try {
    validateDestination(url);
  } catch (e) {
    // If validation fails, return failed status immediately
    return {
      status: "failed",
      error: getErrorMessage(e),
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": event,
    };

    if (secret) {
      headers["X-Webhook-Signature"] = await generateSignature(payload, secret);
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: payload,
      signal: controller.signal,
    });

    const responseBody = await response.text();

    if (!response.ok) {
      return {
        status: "failed",
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000),
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      status: "success",
      responseStatus: response.status,
      responseBody: responseBody.substring(0, 1000),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.name === "AbortError"
        ? `Timeout: Webhook delivery exceeded ${WEBHOOK_TIMEOUT_MS}ms`
        : getErrorMessage(error);

    return {
      status: "failed",
      error: errorMessage,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

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
