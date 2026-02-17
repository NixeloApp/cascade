import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import {
  type ApiAuthContext,
  constantTimeEqual,
  createErrorResponse,
  createSuccessResponse,
  extractApiKey,
  hashApiKey,
  hasScope,
  verifyProjectAccess,
} from "./apiAuth";

describe("constantTimeEqual", () => {
  it("should return true for identical strings", () => {
    expect(constantTimeEqual("secret", "secret")).toBe(true);
    expect(constantTimeEqual("", "")).toBe(true);
    expect(constantTimeEqual("super-secret-key-123", "super-secret-key-123")).toBe(true);
  });

  it("should return false for different strings of same length", () => {
    expect(constantTimeEqual("secret", "s3cret")).toBe(false);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
  });

  it("should return false for strings of different lengths", () => {
    expect(constantTimeEqual("secret", "secret1")).toBe(false);
    expect(constantTimeEqual("secret", "secre")).toBe(false);
    expect(constantTimeEqual("", "a")).toBe(false);
  });

  it("should handle special characters", () => {
    expect(constantTimeEqual("!@#$%", "!@#$%")).toBe(true);
    expect(constantTimeEqual("!@#$%", "!@#$^")).toBe(false);
  });
});

describe("hashApiKey", () => {
  it("should hash a key using SHA-256", async () => {
    const key = "my-secret-key";
    const hash = await hashApiKey(key);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // Consistent hashing
    const hash2 = await hashApiKey(key);
    expect(hash).toBe(hash2);
  });

  it("should produce different hashes for different keys", async () => {
    const hash1 = await hashApiKey("key1");
    const hash2 = await hashApiKey("key2");
    expect(hash1).not.toBe(hash2);
  });
});

describe("extractApiKey", () => {
  it("should extract token from Bearer header", () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer my-token");
    expect(extractApiKey(headers)).toBe("my-token");
  });

  it("should extract token from raw header", () => {
    const headers = new Headers();
    headers.set("authorization", "my-token");
    expect(extractApiKey(headers)).toBe("my-token");
  });

  it("should return null if header is missing", () => {
    const headers = new Headers();
    expect(extractApiKey(headers)).toBeNull();
  });

  it("should be case insensitive for 'Bearer'", () => {
    const headers = new Headers();
    headers.set("authorization", "bearer my-token");
    expect(extractApiKey(headers)).toBe("my-token");
  });

  it("should return null for malformed headers", () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer my token"); // Too many parts
    expect(extractApiKey(headers)).toBeNull();
  });
});

describe("hasScope", () => {
  const mockAuth = (scopes: string[]): ApiAuthContext => ({
    userId: "user123" as Id<"users">,
    keyId: "key123" as Id<"apiKeys">,
    scopes,
    rateLimit: 100,
  });

  it("should return true for wildcard scope", () => {
    expect(hasScope(mockAuth(["*"]), "issues:read")).toBe(true);
  });

  it("should return true for exact match", () => {
    expect(hasScope(mockAuth(["issues:read"]), "issues:read")).toBe(true);
  });

  it("should return true for resource wildcard", () => {
    expect(hasScope(mockAuth(["issues:*"]), "issues:read")).toBe(true);
    expect(hasScope(mockAuth(["issues:*"]), "issues:write")).toBe(true);
  });

  it("should return false for mismatch", () => {
    expect(hasScope(mockAuth(["issues:read"]), "issues:write")).toBe(false);
  });

  it("should return false for different resource", () => {
    expect(hasScope(mockAuth(["projects:*"]), "issues:read")).toBe(false);
  });
});

describe("verifyProjectAccess", () => {
  const mockAuth = (projectId?: Id<"projects">): ApiAuthContext => ({
    userId: "user123" as Id<"users">,
    keyId: "key123" as Id<"apiKeys">,
    scopes: [],
    projectId,
    rateLimit: 100,
  });

  it("should allow if no project ID in auth", () => {
    expect(verifyProjectAccess(mockAuth(), "proj1" as Id<"projects">)).toBe(true);
  });

  it("should allow if project ID matches", () => {
    expect(
      verifyProjectAccess(mockAuth("proj1" as Id<"projects">), "proj1" as Id<"projects">),
    ).toBe(true);
  });

  it("should deny if project ID mismatches", () => {
    expect(
      verifyProjectAccess(mockAuth("proj1" as Id<"projects">), "proj2" as Id<"projects">),
    ).toBe(false);
  });
});

describe("createErrorResponse", () => {
  it("should create a response with correct status and headers", async () => {
    const response = createErrorResponse(400, "Bad Request", { field: "email" });

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 400,
        message: "Bad Request",
        field: "email",
      },
    });
  });
});

describe("createSuccessResponse", () => {
  it("should create a response with correct status and headers", async () => {
    const data = { id: "123", status: "ok" };
    const response = createSuccessResponse(data, 201);

    expect(response.status).toBe(201);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains",
    );

    const body = await response.json();
    expect(body).toEqual(data);
  });

  it("should default to 200 status", () => {
    const response = createSuccessResponse({});
    expect(response.status).toBe(200);
  });
});
