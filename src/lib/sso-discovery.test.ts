import { describe, expect, it } from "vitest";
import { getEmailDomain, isGoogleWorkspaceSsoConnection } from "./sso-discovery";

describe("getEmailDomain", () => {
  it("extracts normalized domain for valid emails", () => {
    expect(getEmailDomain("User@Example.COM")).toBe("example.com");
  });

  it("returns null for invalid emails", () => {
    expect(getEmailDomain("not-an-email")).toBeNull();
    expect(getEmailDomain("@example.com")).toBeNull();
    expect(getEmailDomain("user@localhost")).toBeNull();
    expect(getEmailDomain("user@.com")).toBeNull();
  });
});

describe("isGoogleWorkspaceSsoConnection", () => {
  it("recognizes explicit provider metadata", () => {
    expect(
      isGoogleWorkspaceSsoConnection({
        type: "oidc",
        name: "Corporate SSO",
        oidcProvider: "google-workspace",
      }),
    ).toBe(true);
  });

  it("falls back to connection name when provider metadata is missing", () => {
    expect(
      isGoogleWorkspaceSsoConnection({
        type: "oidc",
        name: "Google Workspace",
      }),
    ).toBe(true);
  });

  it("rejects non-google and non-oidc connections", () => {
    expect(
      isGoogleWorkspaceSsoConnection({
        type: "oidc",
        name: "Okta Corporate",
        oidcProvider: "okta",
      }),
    ).toBe(false);
    expect(
      isGoogleWorkspaceSsoConnection({
        type: "saml",
        name: "Google SAML",
      }),
    ).toBe(false);
    expect(isGoogleWorkspaceSsoConnection(null)).toBe(false);
  });
});
