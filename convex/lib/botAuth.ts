import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getBotServiceApiKey } from "./env";
import { forbidden, unauthenticated } from "./errors";

/**
 * Validate bot service API key
 * The bot service uses a dedicated API key stored in environment variables
 * This is simpler than the user API key system since there's only one bot service
 */

function validateBotApiKey(_ctx: QueryCtx | MutationCtx, apiKey: string): boolean {
  // Get the expected API key from environment variables
  const expectedKey = getBotServiceApiKey();

  // Simple constant-time comparison to prevent timing attacks
  if (apiKey.length !== expectedKey.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ expectedKey.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate bot API key and throw if invalid
 */
export function requireBotApiKey(ctx: QueryCtx | MutationCtx, apiKey: string | undefined): void {
  if (!apiKey) {
    throw unauthenticated();
  }
  const isValid = validateBotApiKey(ctx, apiKey);
  if (!isValid) {
    throw forbidden(undefined, "Invalid bot service API key");
  }
}
