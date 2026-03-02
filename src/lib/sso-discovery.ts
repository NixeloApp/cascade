type SsoConnectionSummary =
  | {
      type: "saml" | "oidc";
      name: string;
      oidcProvider?: "google-workspace" | "microsoft-entra" | "okta";
    }
  | null
  | undefined;

export function getEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0 || atIndex >= trimmed.length - 1) {
    return null;
  }

  const domain = trimmed.slice(atIndex + 1);
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    return null;
  }

  return domain;
}

export function isGoogleWorkspaceSsoConnection(connection: SsoConnectionSummary): boolean {
  if (!connection || connection.type !== "oidc") {
    return false;
  }

  if (connection.oidcProvider === "google-workspace") {
    return true;
  }

  return connection.name.toLowerCase().includes("google");
}
