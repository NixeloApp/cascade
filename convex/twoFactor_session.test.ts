import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

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

describe("Two Factor Authentication Session Scope", () => {
  it("should NOT verify 2FA across different sessions", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    // Session A
    const sessionA = "session-a";
    const asSessionA = t.withIdentity({ subject: `${userId}|${sessionA}` });

    // Enable 2FA on Session A
    const { secret } = await asSessionA.mutation(api.twoFactor.beginSetup);
    const code = await generateTestTOTP(secret);
    await asSessionA.mutation(api.twoFactor.completeSetup, { code });

    // Verify Session A is verified
    // We check getRedirectDestination. If it is NOT verify2FA, then it is verified.
    const destA = await asSessionA.query(api.auth.getRedirectDestination);
    expect(destA).not.toBe("/verify-2fa"); // Should be dashboard or onboarding

    // Session B (same user, different session)
    const sessionB = "session-b";
    const asSessionB = t.withIdentity({ subject: `${userId}|${sessionB}` });

    // Verify Session B status
    const destB = await asSessionB.query(api.auth.getRedirectDestination);

    // EXPECTED FIX: Session B should require 2FA
    expect(destB).toBe("/verify-2fa");
  });
});
