import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import { SECOND } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

// --- TOTP Helpers (Duplicated for Black-Box Testing) ---

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
  const counter = Math.floor(timestamp / SECOND / TOTP_PERIOD);
  const key = base32Decode(secret);

  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setBigUint64(0, BigInt(counter), false);

  const hmac = await hmacSha1(key, new Uint8Array(counterBuffer));

  // Dynamic truncation
  const offset = hmac[19] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  // Get 6-digit code
  return String(code % 1000000).padStart(6, "0");
}

describe("Two Factor Authentication Replay Attack", () => {
  const FIXED_TIME = 1678886400000; // 2023-03-15T16:00:00.000Z

  it("should allow replay of TOTP code for disable", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TIME);

    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // 1. Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    await asUser.mutation(api.twoFactor.completeSetup, { code: setupCode });

    // 2. Advance time and generate a valid code
    const newTime = FIXED_TIME + 30000;
    vi.setSystemTime(newTime);
    const validCode = await generateTestTOTP(secret, newTime);

    // 3. Use it to "Login" (verifyCode)
    const verifyResult = await asUser.mutation(api.twoFactor.verifyCode, { code: validCode });
    if (!verifyResult.success) {
      console.error("verifyCode failed:", verifyResult.error);
    }
    expect(verifyResult.success).toBe(true);

    // 4. Reuse the SAME code to DISABLE 2FA immediately
    const disableResult = await asUser.mutation(api.twoFactor.disable, { code: validCode });

    // THIS SHOULD FAIL now
    expect(disableResult.success).toBe(false);
    expect(disableResult.error).toBe("Invalid verification code");

    // 5. Verify 2FA is still ENABLED
    const status = await asUser.query(api.twoFactor.getStatus);
    expect(status.enabled).toBe(true);

    vi.useRealTimers();
  });
});
