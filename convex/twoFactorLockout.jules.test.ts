import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { MINUTE, SECOND } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

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

describe("Two Factor Authentication Lockout Vulnerability", () => {
  const FIXED_TIME = 1678886400000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TIME);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("SHOULD enforce lockout on disable 2FA", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = t.withIdentity({ subject: userId });

    // Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    await asUser.mutation(api.twoFactor.completeSetup, { code: setupCode });

    // Advance time slightly to avoid replay check issues
    vi.setSystemTime(FIXED_TIME + 30 * SECOND);

    // Attempt 5 failures (lockout threshold)
    for (let i = 0; i < 5; i++) {
      const result = await asUser.mutation(api.twoFactor.disable, { code: "000000" });
      expect(result.success).toBe(false);

      if (result.success) throw new Error("Expected failure");

      if (i < 4) {
        expect((result as any).error).toBe("Invalid verification code");
      } else {
        // 5th attempt triggers lockout
        expect((result as any).error).toContain("Account temporarily locked");
        expect((result as any).lockedUntil).toBeDefined();
      }
    }

    // Check internal state directly
    const user = await t.query(internal.users.getInternal, { id: userId });
    expect(user?.twoFactorLockedUntil).toBeDefined();

    // Attempt 6th time (should be locked)
    const lockedResult = await asUser.mutation(api.twoFactor.disable, { code: "000000" });
    expect(lockedResult.success).toBe(false);
    if (lockedResult.success) throw new Error("Expected failure");
    expect((lockedResult as any).error).toContain("Too many failed attempts");
  });

  it("SHOULD enforce lockout on verifyBackupCode", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = t.withIdentity({ subject: userId });

    // Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    await asUser.mutation(api.twoFactor.completeSetup, { code: setupCode });

    // Attempt 5 failures
    for (let i = 0; i < 5; i++) {
      const result = await asUser.mutation(api.twoFactor.verifyBackupCode, { code: "INVALID" });
      expect(result.success).toBe(false);

      if (result.success) throw new Error("Expected failure");

      if (i < 4) {
        expect((result as any).error).toBe("Invalid backup code");
      } else {
        expect((result as any).error).toContain("Account temporarily locked");
        expect((result as any).lockedUntil).toBeDefined();
      }
    }

    // Check internal state directly
    const user = await t.query(internal.users.getInternal, { id: userId });
    expect(user?.twoFactorLockedUntil).toBeDefined();

    // Attempt 6th time (should be locked)
    const lockedResult = await asUser.mutation(api.twoFactor.verifyBackupCode, { code: "INVALID" });
    expect(lockedResult.success).toBe(false);
    if (lockedResult.success) throw new Error("Expected failure");
    expect((lockedResult as any).error).toContain("Too many failed attempts");
  });
});
