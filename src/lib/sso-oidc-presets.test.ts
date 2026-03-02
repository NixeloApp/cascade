import { describe, expect, it } from "vitest";
import { getOidcPresetConfig } from "./sso-oidc-presets";

describe("getOidcPresetConfig", () => {
  it("returns Google Workspace OIDC defaults", () => {
    const config = getOidcPresetConfig("google-workspace");
    expect(config.issuer).toBe("https://accounts.google.com");
    expect(config.authorizationUrl).toContain("accounts.google.com");
    expect(config.scopes).toEqual(["openid", "email", "profile"]);
  });

  it("returns Microsoft Entra defaults", () => {
    const config = getOidcPresetConfig("microsoft-entra");
    expect(config.issuer).toContain("microsoftonline.com");
    expect(config.tokenUrl).toContain("oauth2/v2.0/token");
    expect(config.scopes).toContain("User.Read");
  });

  it("returns Okta defaults", () => {
    const config = getOidcPresetConfig("okta");
    expect(config.issuer).toContain("okta.com/oauth2/default");
    expect(config.userInfoUrl).toContain("/v1/userinfo");
  });
});
