import type { Doc } from "../_generated/dataModel";
import { decryptIfNeeded, encryptIfNeeded, isEncrypted } from "../lib/encryption";

type MailboxTokenFields = Pick<Doc<"outreachMailboxes">, "accessToken" | "refreshToken">;

export interface EncryptedMailboxTokenFields {
  accessToken: string;
  refreshToken?: string;
}

export interface DecryptedMailboxTokenSnapshot extends EncryptedMailboxTokenFields {
  decryptedAccessToken: string;
  decryptedRefreshToken?: string;
  needsMigration: boolean;
}

/**
 * Normalize outreach mailbox token storage to encrypted-at-rest values.
 * Safe to call on already-encrypted values.
 */
export async function encryptMailboxTokensForStorage(
  tokens: MailboxTokenFields,
): Promise<EncryptedMailboxTokenFields> {
  return {
    accessToken: tokens.accessToken ? await encryptIfNeeded(tokens.accessToken) : "",
    refreshToken: tokens.refreshToken ? await encryptIfNeeded(tokens.refreshToken) : undefined,
  };
}

/**
 * Read outreach mailbox tokens for runtime use while preserving enough
 * metadata to self-heal legacy plaintext rows.
 */
export async function getDecryptedMailboxTokenSnapshot(
  tokens: MailboxTokenFields,
): Promise<DecryptedMailboxTokenSnapshot> {
  const refreshToken = tokens.refreshToken;
  const hasAccessToken = tokens.accessToken.length > 0;
  const hasRefreshToken = refreshToken !== undefined;
  const needsAccessTokenMigration = hasAccessToken && !isEncrypted(tokens.accessToken);
  const needsRefreshTokenMigration = hasRefreshToken && !isEncrypted(refreshToken);

  const encryptedTokens = await encryptMailboxTokensForStorage(tokens);

  return {
    accessToken: encryptedTokens.accessToken,
    refreshToken: encryptedTokens.refreshToken,
    decryptedAccessToken: hasAccessToken
      ? await decryptIfNeeded(tokens.accessToken)
      : tokens.accessToken,
    decryptedRefreshToken: hasRefreshToken ? await decryptIfNeeded(refreshToken) : refreshToken,
    needsMigration: needsAccessTokenMigration || needsRefreshTokenMigration,
  };
}
