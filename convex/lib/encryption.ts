/**
 * Encryption Utilities
 *
 * Provides AES-GCM encryption for sensitive data like OAuth tokens.
 * Uses Web Crypto API available in Convex runtime.
 *
 * IMPORTANT: Set ENCRYPTION_KEY environment variable in production.
 * Key should be 32 bytes (256 bits) base64-encoded.
 *
 * Generate a key: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96 bits for AES-GCM
const TAG_LENGTH = 128; // 128-bit auth tag

/**
 * Get the encryption key from environment.
 * Falls back to a development-only key if not set.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyBase64 = process.env.ENCRYPTION_KEY;

  if (!keyBase64) {
    // This is a fixed dev key - tokens will be "encrypted" but not secure
    const devKey = new Uint8Array(32).fill(0x42); // Dev-only placeholder
    return await crypto.subtle.importKey("raw", devKey, ALGORITHM, false, ["encrypt", "decrypt"]);
  }

  // Decode base64 key
  let decodedKey: string;
  try {
    decodedKey = atob(keyBase64);
  } catch {
    throw new Error("Invalid ENCRYPTION_KEY: must be a valid base64 string");
  }

  const keyBytes = Uint8Array.from(decodedKey, (c) => c.charCodeAt(0));
  if (keyBytes.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (256 bits) base64-encoded");
  }

  return await crypto.subtle.importKey("raw", keyBytes, ALGORITHM, false, ["encrypt", "decrypt"]);
}

/**
 * Encrypt a plaintext string.
 * Returns base64-encoded ciphertext with IV prepended.
 *
 * Format: base64(IV || ciphertext || authTag)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    data,
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a ciphertext string.
 * Expects base64-encoded data with IV prepended.
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();

  // Decode base64
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const encryptedData = combined.slice(IV_LENGTH);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encryptedData,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Check if a value appears to be encrypted (base64 with expected length).
 * Used for migration - to detect already-encrypted vs plaintext tokens.
 */
export function isEncrypted(value: string): boolean {
  // Encrypted tokens are base64 and have IV + some ciphertext
  // Minimum: 12 bytes IV + 1 byte data + 16 byte tag = 29 bytes = ~40 base64 chars
  if (value.length < 40) return false;

  // Check if it's valid base64
  try {
    const decoded = atob(value);
    // Should be at least IV_LENGTH bytes
    return decoded.length >= IV_LENGTH + 17; // IV + min ciphertext + tag
  } catch {
    return false;
  }
}

/**
 * Encrypt a token if not already encrypted.
 * Safe to call on already-encrypted values.
 */
export async function encryptIfNeeded(token: string): Promise<string> {
  // OAuth tokens typically start with known prefixes or are short
  // Encrypted tokens are longer base64 strings
  if (isEncrypted(token)) {
    return token;
  }
  return await encrypt(token);
}

/**
 * Decrypt a token, handling both encrypted and plaintext.
 * Safe to call on already-plaintext values during migration.
 */
export async function decryptIfNeeded(value: string): Promise<string> {
  if (!isEncrypted(value)) {
    return value; // Already plaintext
  }
  try {
    return await decrypt(value);
  } catch {
    // If decryption fails, assume it's plaintext
    return value;
  }
}
