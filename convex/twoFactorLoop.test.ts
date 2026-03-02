import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// --- TOTP Helpers ---
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD = 30;

function base32Decode(encoded: string): Uint8Array {
  const cleanEncoded = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const output = [];
  let bits = 0;
  let value = 0;

  for (const char of cleanEncoded) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message as unknown as BufferSource);
  return new Uint8Array(signature);
}

async function generateTestTOTP(secret: string, timestamp = Date.now()): Promise<string> {
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD);
  const key = base32Decode(secret);
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setBigUint64(0, BigInt(counter), false);
  const hmac = await hmacSha1(key, new Uint8Array(counterBuffer));
  const offset = hmac[19] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
}

describe("Two Factor Authentication Loop", () => {
  const FIXED_TIME = 1678886400000; // 2023-03-15T16:00:00.000Z

  it("should fail verification if session ID is missing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TIME);

    const t = convexTest(schema, modules);

    // Create user in DB
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        email: "test@example.com",
        name: "Test User",
        emailVerificationTime: Date.now(),
      });
    });

    const setupSession = "setup-session";
    const asSetup = t.withIdentity({ subject: `${userId}|${setupSession}` });

    // Enable 2FA
    const { secret } = await asSetup.mutation(api.twoFactor.beginSetup);
    const code = await generateTestTOTP(secret, FIXED_TIME);
    await asSetup.mutation(api.twoFactor.completeSetup, { code });

    // Now simulate a session WITHOUT a session ID (just user ID)
    // This simulates a malformed auth token or weird state
    const asNoSession = t.withIdentity({ subject: userId });

    // Check redirect - should be /verify-2fa because sessionId is missing
    const dest = await asNoSession.query(api.auth.getRedirectDestination);
    expect(dest).toBe("/verify-2fa");

    // Advance time to avoid replay detection (30s)
    const newTime = FIXED_TIME + 30000;
    vi.setSystemTime(newTime);

    // Try to verify
    const verifyCode = await generateTestTOTP(secret, newTime);

    // CURRENT BEHAVIOR: Returns success: true, but doesn't record session verification
    // DESIRED BEHAVIOR: Should fail or throw because no session to verify
    const result = await asNoSession.mutation(api.twoFactor.verifyCode, { code: verifyCode });

    // If this assertion fails, it means the bug is present (it returned success)
    expect(result.success).toBe(false);
    expect(result.error).toContain("Session ID required");

    vi.useRealTimers();
  });
});
