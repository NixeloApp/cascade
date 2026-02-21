/**
 * Environment variable utilities
 *
 * All env vars are required. Set them in Convex dashboard.
 */

import { validation } from "./errors";

/**
 * Get a required environment variable. Throws if not defined.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw validation(name, `Missing required environment variable: ${name}`);
  }
  return value;
}

// ===========================================
// App URLs
// ===========================================

export function getSiteUrl(): string {
  return requireEnv("SITE_URL");
}

export function getConvexSiteUrl(): string {
  return requireEnv("CONVEX_SITE_URL");
}

/**
 * Check if the Convex site URL is localhost (for E2E/dev environments)
 */
export function isLocalhost(): boolean {
  try {
    const siteUrl = getConvexSiteUrl();
    const url = new URL(siteUrl);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  } catch {
    return false;
  }
}

// ===========================================
// Google OAuth
// ===========================================

export function getGoogleClientId(): string {
  return requireEnv("AUTH_GOOGLE_ID");
}

export function getGoogleClientSecret(): string {
  return requireEnv("AUTH_GOOGLE_SECRET");
}

export function isGoogleOAuthConfigured(): boolean {
  return !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;
}

// ===========================================
// GitHub OAuth (for repository linking, not authentication)
// ===========================================

export function getGitHubClientId(): string {
  return requireEnv("GITHUB_CLIENT_ID");
}

export function getGitHubClientSecret(): string {
  return requireEnv("GITHUB_CLIENT_SECRET");
}

export function isGitHubOAuthConfigured(): boolean {
  return !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
}

// ===========================================
// Bot Service
// ===========================================

export function getBotServiceUrl(): string {
  return requireEnv("BOT_SERVICE_URL");
}

export function getBotServiceApiKey(): string {
  return requireEnv("BOT_SERVICE_API_KEY");
}

// ===========================================
// AI - Anthropic
// ===========================================

export function getAnthropicApiKey(): string {
  return requireEnv("ANTHROPIC_API_KEY");
}

export function getAnthropicModel(): string {
  return requireEnv("ANTHROPIC_MODEL");
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY && !!process.env.ANTHROPIC_MODEL;
}

// ===========================================
// AI - Voyage
// ===========================================

export function getVoyageApiKey(): string {
  return requireEnv("VOYAGE_API_KEY");
}

// ===========================================
// Email - Resend
// ===========================================

export function getResendApiKey(): string {
  return requireEnv("RESEND_API_KEY");
}

export function getResendFromEmail(): string {
  return requireEnv("RESEND_FROM_EMAIL");
}

// ===========================================
// Email - SendPulse
// ===========================================

export function getSendPulseId(): string {
  return requireEnv("SENDPULSE_ID");
}

export function getSendPulseSecret(): string {
  return requireEnv("SENDPULSE_SECRET");
}

export function getSendPulseFromEmail(): string {
  return requireEnv("SENDPULSE_FROM_EMAIL");
}

// ===========================================
// Email - Mailtrap
// ===========================================

export function getMailtrapApiToken(): string {
  return requireEnv("MAILTRAP_API_TOKEN");
}

export function getMailtrapInboxId(): string {
  return requireEnv("MAILTRAP_INBOX_ID");
}

export function getMailtrapFromEmail(): string {
  return requireEnv("MAILTRAP_FROM_EMAIL");
}

export function getMailtrapMode(): "sandbox" | "production" {
  const mode = requireEnv("MAILTRAP_MODE");
  if (mode !== "sandbox" && mode !== "production") {
    throw validation(
      "MAILTRAP_MODE",
      `Invalid MAILTRAP_MODE: ${mode}. Must be "sandbox" or "production"`,
    );
  }
  return mode;
}

// For E2E tests to read inbox
export function getMailtrapAccountId(): string {
  return requireEnv("MAILTRAP_ACCOUNT_ID");
}
