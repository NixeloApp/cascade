export type OidcProviderPreset = "google-workspace" | "microsoft-entra" | "okta";

export interface OidcPresetConfig {
  issuer: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

export function getOidcPresetConfig(preset: OidcProviderPreset): OidcPresetConfig {
  if (preset === "google-workspace") {
    return {
      issuer: "https://accounts.google.com",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scopes: ["openid", "email", "profile"],
    };
  }

  if (preset === "microsoft-entra") {
    return {
      issuer: "https://login.microsoftonline.com/common/v2.0",
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userInfoUrl: "https://graph.microsoft.com/oidc/userinfo",
      scopes: ["openid", "profile", "email", "User.Read"],
    };
  }

  return {
    issuer: "https://your-org.okta.com/oauth2/default",
    authorizationUrl: "https://your-org.okta.com/oauth2/default/v1/authorize",
    tokenUrl: "https://your-org.okta.com/oauth2/default/v1/token",
    userInfoUrl: "https://your-org.okta.com/oauth2/default/v1/userinfo",
    scopes: ["openid", "profile", "email"],
  };
}
