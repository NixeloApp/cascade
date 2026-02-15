import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const APP_NAME = "Nixelo";
const TOTP_WINDOW = 1; // Allow 1 step before/after for clock drift
const TOTP_PERIOD = 30; // 30 second periods

// Base32 alphabet for secret generation and decoding
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generate a random Base32 secret for TOTP (20 bytes = 32 chars)
 * Uses crypto.getRandomValues which is available in Convex runtime
 */
function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * Encode bytes to Base32
 */
function base32Encode(data: Uint8Array): string {
  let result = "";
  let bits = 0;
  let value = 0;

  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Decode Base32 to bytes
 */
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

/**
 * HMAC-SHA1 implementation using Web Crypto API
 */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

/**
 * Generate TOTP code from secret and counter
 */
async function generateTOTP(secret: string, counter: number): Promise<string> {
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

/**
 * Verify TOTP code with window tolerance
 */
async function verifyTOTP(secret: string, code: string, window = TOTP_WINDOW): Promise<boolean> {
  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);

  // Check current and adjacent time steps
  for (let i = -window; i <= window; i++) {
    const expectedCode = await generateTOTP(secret, currentCounter + i);
    if (expectedCode === code) {
      return true;
    }
  }

  return false;
}

/**
 * Generate otpauth URL for QR codes
 */
function generateOtpauthUrl(email: string, secret: string): string {
  const encodedIssuer = encodeURIComponent(APP_NAME);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=${TOTP_PERIOD}`;
}

/**
 * Generate backup codes (8 codes, 8 chars each)
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous chars
  for (let i = 0; i < 8; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Hash a backup code for storage (simple hash, not for passwords)
 */
function hashBackupCode(code: string): string {
  // Remove dashes and uppercase for comparison
  const normalized = code.replace(/-/g, "").toUpperCase();
  // Simple hash using btoa - in production, use a proper hash
  return btoa(normalized);
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Check if 2FA is enabled for the current user
 */
export const getStatus = query({
  args: {},
  returns: v.object({
    enabled: v.boolean(),
    hasBackupCodes: v.boolean(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { enabled: false, hasBackupCodes: false };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return { enabled: false, hasBackupCodes: false };
    }

    return {
      enabled: user.twoFactorEnabled ?? false,
      hasBackupCodes: (user.twoFactorBackupCodes?.length ?? 0) > 0,
    };
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Begin 2FA setup - generates secret and returns setup info
 */
export const beginSetup = mutation({
  args: {},
  returns: v.object({
    secret: v.string(),
    otpauthUrl: v.string(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.twoFactorEnabled) {
      throw new Error("2FA is already enabled");
    }

    // Generate new secret
    const secret = generateSecret();

    // Store secret temporarily (not yet enabled)
    await ctx.db.patch(userId, {
      twoFactorSecret: secret,
    });

    // Generate otpauth URL for QR code
    const email = user.email ?? "user";
    const otpauthUrl = generateOtpauthUrl(email, secret);

    return {
      secret,
      otpauthUrl,
    };
  },
});

/**
 * Complete 2FA setup by verifying the first code
 */
export const completeSetup = mutation({
  args: {
    code: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    backupCodes: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorSecret) {
      return { success: false, error: "No 2FA setup in progress" };
    }

    if (user.twoFactorEnabled) {
      return { success: false, error: "2FA is already enabled" };
    }

    // Verify the code
    const isValid = await verifyTOTP(user.twoFactorSecret, args.code);
    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map(hashBackupCode);

    // Enable 2FA
    await ctx.db.patch(userId, {
      twoFactorEnabled: true,
      twoFactorBackupCodes: hashedCodes,
      twoFactorVerifiedAt: Date.now(),
    });

    return {
      success: true,
      backupCodes, // Return plain codes for user to save
    };
  },
});

/**
 * Verify a TOTP code (for sign-in)
 */
export const verifyCode = mutation({
  args: {
    code: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: "2FA is not enabled" };
    }

    // Verify the code
    const isValid = await verifyTOTP(user.twoFactorSecret, args.code);
    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    // Update last verified timestamp
    await ctx.db.patch(userId, {
      twoFactorVerifiedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Verify a backup code (consumes the code)
 */
export const verifyBackupCode = mutation({
  args: {
    code: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    remainingCodes: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorEnabled) {
      return { success: false, error: "2FA is not enabled" };
    }

    const backupCodes = user.twoFactorBackupCodes ?? [];
    if (backupCodes.length === 0) {
      return { success: false, error: "No backup codes available" };
    }

    // Hash the provided code and check against stored hashes
    const hashedInput = hashBackupCode(args.code);
    const codeIndex = backupCodes.indexOf(hashedInput);

    if (codeIndex === -1) {
      return { success: false, error: "Invalid backup code" };
    }

    // Remove the used code
    const newCodes = [...backupCodes];
    newCodes.splice(codeIndex, 1);

    await ctx.db.patch(userId, {
      twoFactorBackupCodes: newCodes,
      twoFactorVerifiedAt: Date.now(),
    });

    return {
      success: true,
      remainingCodes: newCodes.length,
    };
  },
});

/**
 * Regenerate backup codes (requires valid TOTP code)
 */
export const regenerateBackupCodes = mutation({
  args: {
    totpCode: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    backupCodes: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: "2FA is not enabled" };
    }

    // Verify TOTP code first
    const isValid = await verifyTOTP(user.twoFactorSecret, args.totpCode);
    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map(hashBackupCode);

    await ctx.db.patch(userId, {
      twoFactorBackupCodes: hashedCodes,
    });

    return {
      success: true,
      backupCodes,
    };
  },
});

/**
 * Disable 2FA (requires valid TOTP code or backup code)
 */
export const disable = mutation({
  args: {
    code: v.string(),
    isBackupCode: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: "2FA is not enabled" };
    }

    let isValid = false;

    if (args.isBackupCode) {
      // Verify backup code
      const backupCodes = user.twoFactorBackupCodes ?? [];
      const hashedInput = hashBackupCode(args.code);
      isValid = backupCodes.includes(hashedInput);
    } else {
      // Verify TOTP code
      isValid = await verifyTOTP(user.twoFactorSecret, args.code);
    }

    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    // Disable 2FA
    await ctx.db.patch(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorBackupCodes: undefined,
      twoFactorVerifiedAt: undefined,
    });

    return { success: true };
  },
});
