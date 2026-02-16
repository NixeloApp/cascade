import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
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
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
  return new Uint8Array(signature);
}

async function generateTestTOTP(secret: string, timestamp = Date.now()): Promise<string> {
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD);
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

describe("Two Factor Authentication", () => {
  const FIXED_TIME = 1678886400000; // 2023-03-15T16:00:00.000Z

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TIME);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should setup 2FA successfully", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // 1. Check status (disabled)
    const statusBefore = await asUser.query(api.twoFactor.getStatus);
    expect(statusBefore.enabled).toBe(false);

    // 2. Begin setup
    const { secret, otpauthUrl } = await asUser.mutation(api.twoFactor.beginSetup);
    expect(secret).toBeDefined();
    expect(otpauthUrl).toContain(`secret=${secret}`);

    // 3. Complete setup with valid code
    const code = await generateTestTOTP(secret, FIXED_TIME);
    const result = await asUser.mutation(api.twoFactor.completeSetup, { code });

    expect(result.success).toBe(true);
    expect(result.backupCodes).toHaveLength(8);

    // 4. Check status (enabled)
    const statusAfter = await asUser.query(api.twoFactor.getStatus);
    expect(statusAfter.enabled).toBe(true);
    expect(statusAfter.hasBackupCodes).toBe(true);
  });

  it("should fail setup with invalid code", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    await asUser.mutation(api.twoFactor.beginSetup);

    // Use incorrect code
    const result = await asUser.mutation(api.twoFactor.completeSetup, { code: "000000" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid verification code");

    const status = await asUser.query(api.twoFactor.getStatus);
    expect(status.enabled).toBe(false);
  });

  it("should verify login code correctly", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    await asUser.mutation(api.twoFactor.completeSetup, { code: setupCode });

    // Verify correct code
    const validCode = await generateTestTOTP(secret, FIXED_TIME);
    const validResult = await asUser.mutation(api.twoFactor.verifyCode, { code: validCode });
    expect(validResult.success).toBe(true);

    // Verify incorrect code
    const invalidResult = await asUser.mutation(api.twoFactor.verifyCode, { code: "000000" });
    expect(invalidResult.success).toBe(false);
  });

  it("should verify and consume backup codes", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    const { backupCodes } = await asUser.mutation(api.twoFactor.completeSetup, { code: setupCode });

    // biome-ignore lint/style/noNonNullAssertion: testing convenience
    const codeToUse = backupCodes![0];

    // Verify valid backup code
    const result1 = await asUser.mutation(api.twoFactor.verifyBackupCode, { code: codeToUse });
    expect(result1.success).toBe(true);
    expect(result1.remainingCodes).toBe(7);

    // Verify consumed backup code (should fail)
    const result2 = await asUser.mutation(api.twoFactor.verifyBackupCode, { code: codeToUse });
    expect(result2.success).toBe(false);
    expect(result2.error).toBe("Invalid backup code");
  });

  it("should regenerate backup codes", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    const { backupCodes: oldCodes } = await asUser.mutation(api.twoFactor.completeSetup, {
      code: setupCode,
    });

    // Regenerate
    const validCode = await generateTestTOTP(secret, FIXED_TIME);
    const result = await asUser.mutation(api.twoFactor.regenerateBackupCodes, {
      totpCode: validCode,
    });

    expect(result.success).toBe(true);
    expect(result.backupCodes).toHaveLength(8);
    expect(result.backupCodes).not.toEqual(oldCodes);
  });

  it("should disable 2FA", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    await asUser.mutation(api.twoFactor.completeSetup, { code: setupCode });

    // Disable
    const validCode = await generateTestTOTP(secret, FIXED_TIME);
    const result = await asUser.mutation(api.twoFactor.disable, { code: validCode });
    expect(result.success).toBe(true);

    const status = await asUser.query(api.twoFactor.getStatus);
    expect(status.enabled).toBe(false);
  });

  it("should disable 2FA with backup code", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    const { backupCodes } = await asUser.mutation(api.twoFactor.completeSetup, { code: setupCode });

    // biome-ignore lint/style/noNonNullAssertion: testing convenience
    const codeToUse = backupCodes![0];

    // Disable with backup code
    const result = await asUser.mutation(api.twoFactor.disable, {
      code: codeToUse,
      isBackupCode: true,
    });
    expect(result.success).toBe(true);

    const status = await asUser.query(api.twoFactor.getStatus);
    expect(status.enabled).toBe(false);
  });

  it("should fail to disable 2FA with invalid code", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    await asUser.mutation(api.twoFactor.completeSetup, { code: setupCode });

    // Try to disable with invalid code
    const result = await asUser.mutation(api.twoFactor.disable, { code: "000000" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid verification code");

    const status = await asUser.query(api.twoFactor.getStatus);
    expect(status.enabled).toBe(true);
  });

  it("should enforce rate limiting and lockout", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // Setup 2FA
    const { secret } = await asUser.mutation(api.twoFactor.beginSetup);
    const setupCode = await generateTestTOTP(secret, FIXED_TIME);
    await asUser.mutation(api.twoFactor.completeSetup, { code: setupCode });

    // Attempt 5 failures
    for (let i = 0; i < 5; i++) {
      const result = await asUser.mutation(api.twoFactor.verifyCode, { code: "000000" });
      if (i < 4) {
        expect(result.success).toBe(false);
        expect(result.error).toBe("Invalid verification code");
      } else {
        // 5th attempt triggers lockout
        expect(result.success).toBe(false);
        expect(result.error).toContain("Account temporarily locked");
        expect(result.lockedUntil).toBeGreaterThan(FIXED_TIME);
      }
    }

    // Attempt immediately (should still be locked)
    const lockedResult = await asUser.mutation(api.twoFactor.verifyCode, {
      code: await generateTestTOTP(secret, FIXED_TIME),
    });
    expect(lockedResult.success).toBe(false);
    expect(lockedResult.error).toContain("Too many failed attempts");

    // Advance time by 15 mins + 1s (900000ms + 1000ms)
    vi.setSystemTime(FIXED_TIME + 901000);

    // Attempt with valid code (should succeed)
    const unlockedResult = await asUser.mutation(api.twoFactor.verifyCode, {
      code: await generateTestTOTP(secret, FIXED_TIME + 901000),
    });
    expect(unlockedResult.success).toBe(true);
  });
});
