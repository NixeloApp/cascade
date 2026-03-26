import type { Doc } from "../_generated/dataModel";
import { decryptIfNeeded, encryptIfNeeded, isEncrypted } from "../lib/encryption";
import { validation } from "../lib/errors";

type MailboxTokenFields = Pick<Doc<"outreachMailboxes">, "accessToken" | "refreshToken">;

export interface EncryptedMailboxTokenFields {
  accessToken: string;
  refreshToken?: string;
}

export interface DecryptedMailboxTokenSnapshot extends EncryptedMailboxTokenFields {
  decryptedAccessToken: string;
  decryptedRefreshToken?: string;
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

function assertEncryptedMailboxToken(
  field: "accessToken" | "refreshToken",
  token: string | undefined,
) {
  if (token && !isEncrypted(token)) {
    throw validation(
      field,
      `Mailbox ${field} must be encrypted at rest before runtime use. Run the mailbox token repair mutation first.`,
    );
  }
}

/** Read outreach mailbox tokens for runtime use. */
export async function getDecryptedMailboxTokenSnapshot(
  tokens: MailboxTokenFields,
): Promise<DecryptedMailboxTokenSnapshot> {
  const refreshToken = tokens.refreshToken;
  const hasAccessToken = tokens.accessToken.length > 0;
  const hasRefreshToken = refreshToken !== undefined;
  assertEncryptedMailboxToken("accessToken", hasAccessToken ? tokens.accessToken : undefined);
  assertEncryptedMailboxToken("refreshToken", refreshToken);

  return {
    accessToken: tokens.accessToken,
    refreshToken,
    decryptedAccessToken: hasAccessToken
      ? await decryptIfNeeded(tokens.accessToken)
      : tokens.accessToken,
    decryptedRefreshToken: hasRefreshToken ? await decryptIfNeeded(refreshToken) : refreshToken,
  };
}
