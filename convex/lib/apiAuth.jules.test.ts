import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import {
  type ApiAuthContext,
  extractApiKey,
  hashApiKey,
  hasScope,
  verifyProjectAccess,
} from "./apiAuth";

describe("apiAuth", () => {
  describe("hashApiKey", () => {
    it("should return a SHA-256 hex string", async () => {
      const key = "sk_casc_1234567890abcdef";
      const hash = await hashApiKey(key);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should be deterministic", async () => {
      const key = "sk_casc_1234567890abcdef";
      const hash1 = await hashApiKey(key);
      const hash2 = await hashApiKey(key);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different keys", async () => {
      const hash1 = await hashApiKey("key1");
      const hash2 = await hashApiKey("key2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("extractApiKey", () => {
    it("should extract Bearer token", () => {
      const headers = new Headers();
      headers.set("Authorization", "Bearer sk_casc_123");
      expect(extractApiKey(headers)).toBe("sk_casc_123");
    });

    it("should extract Bearer token (case insensitive)", () => {
      const headers = new Headers();
      headers.set("Authorization", "bearer sk_casc_123");
      expect(extractApiKey(headers)).toBe("sk_casc_123");
    });

    it("should extract raw token", () => {
      const headers = new Headers();
      headers.set("Authorization", "sk_casc_123");
      expect(extractApiKey(headers)).toBe("sk_casc_123");
    });

    it("should return null if Authorization header is missing", () => {
      const headers = new Headers();
      expect(extractApiKey(headers)).toBeNull();
    });

    it("should return null if Authorization header is empty", () => {
      const headers = new Headers();
      headers.set("Authorization", "");
      expect(extractApiKey(headers)).toBeNull();
    });
  });

  describe("hasScope", () => {
    const mockAuth: ApiAuthContext = {
      userId: "user1" as Id<"users">,
      keyId: "key1" as Id<"apiKeys">,
      scopes: ["issues:read", "projects:*"],
      rateLimit: 100,
    };

    it("should return true for exact match", () => {
      expect(hasScope(mockAuth, "issues:read")).toBe(true);
    });

    it("should return false for missing scope", () => {
      expect(hasScope(mockAuth, "issues:write")).toBe(false);
    });

    it("should return true for resource wildcard match", () => {
      expect(hasScope(mockAuth, "projects:read")).toBe(true);
      expect(hasScope(mockAuth, "projects:write")).toBe(true);
      expect(hasScope(mockAuth, "projects:delete")).toBe(true);
    });

    it("should return true for global wildcard", () => {
      const adminAuth: ApiAuthContext = { ...mockAuth, scopes: ["*"] };
      expect(hasScope(adminAuth, "anything:action")).toBe(true);
    });
  });

  describe("verifyProjectAccess", () => {
    const project1 = "project1" as Id<"projects">;
    const project2 = "project2" as Id<"projects">;

    it("should allow access if key is not project-scoped", () => {
      const auth: ApiAuthContext = {
        userId: "user1" as Id<"users">,
        keyId: "key1" as Id<"apiKeys">,
        scopes: ["*"],
        rateLimit: 100,
        // projectId is undefined
      };
      expect(verifyProjectAccess(auth, project1)).toBe(true);
    });

    it("should allow access if key is scoped to the requested project", () => {
      const auth: ApiAuthContext = {
        userId: "user1" as Id<"users">,
        keyId: "key1" as Id<"apiKeys">,
        scopes: ["*"],
        rateLimit: 100,
        projectId: project1,
      };
      expect(verifyProjectAccess(auth, project1)).toBe(true);
    });

    it("should deny access if key is scoped to a different project", () => {
      const auth: ApiAuthContext = {
        userId: "user1" as Id<"users">,
        keyId: "key1" as Id<"apiKeys">,
        scopes: ["*"],
        rateLimit: 100,
        projectId: project1,
      };
      expect(verifyProjectAccess(auth, project2)).toBe(false);
    });
  });
});
