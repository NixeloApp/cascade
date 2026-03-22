import { describe, expect, it } from "vitest";
import { extractBearerToken } from "./intake";

describe("extractBearerToken", () => {
  it("returns null for missing header", () => {
    expect(extractBearerToken(null)).toBeNull();
  });

  it("extracts a valid Bearer token", () => {
    const result = extractBearerToken("Bearer intake_abc123");
    expect(result).toEqual({ token: "intake_abc123" });
  });

  it("is case-insensitive per RFC 6750", () => {
    expect(extractBearerToken("bearer my_token")).toEqual({ token: "my_token" });
    expect(extractBearerToken("BEARER my_token")).toEqual({ token: "my_token" });
    expect(extractBearerToken("bEaReR my_token")).toEqual({ token: "my_token" });
  });

  it("rejects Basic auth scheme", () => {
    const result = extractBearerToken("Basic dXNlcjpwYXNz");
    expect(result).toEqual({ error: "Unsupported authorization scheme — use Bearer token" });
  });

  it("rejects Digest auth scheme", () => {
    const result = extractBearerToken('Digest username="admin"');
    expect(result).toEqual({ error: "Unsupported authorization scheme — use Bearer token" });
  });

  it("rejects empty Bearer value", () => {
    const result = extractBearerToken("Bearer ");
    expect(result).toEqual({ error: "Bearer token value is missing" });
  });

  it("rejects Bearer with no space", () => {
    const result = extractBearerToken("Bearer");
    expect(result).toEqual({ error: "Bearer token value is missing" });
  });

  it("rejects arbitrary strings without a scheme", () => {
    const result = extractBearerToken("just-a-raw-token");
    expect(result).toEqual({ error: "Unsupported authorization scheme — use Bearer token" });
  });

  it("rejects Bearer with multiple tokens (extra spaces in value)", () => {
    // "Bearer token1 token2" — the token itself shouldn't contain spaces
    const result = extractBearerToken("Bearer token1 token2");
    expect(result).toEqual({ error: "Unsupported authorization scheme — use Bearer token" });
  });

  it("handles tokens with special characters", () => {
    const result = extractBearerToken("Bearer intake_a1b2c3d4e5f6g7h8i9j0");
    expect(result).toEqual({ token: "intake_a1b2c3d4e5f6g7h8i9j0" });
  });
});
