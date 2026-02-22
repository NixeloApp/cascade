import { getFunctionName } from "convex/server";
import { describe, expect, test, vi } from "vitest";
import { internal } from "../_generated/api";
import { forbidden, notFound } from "../lib/errors";
import { issuesApiHandler } from "./issues";

describe("issuesApiHandler", () => {
  test("returns 400 for validation error (Validator failed)", async () => {
    const mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
    } as any;

    const mockRequest = new Request("https://api.example.com/api/issues?projectId=invalid", {
      method: "GET",
      headers: {
        Authorization: "Bearer test-key",
      },
    });

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const queryName = getFunctionName(query);
      const validateApiKeyName = getFunctionName(internal.apiKeys.validateApiKey);
      const checkProjectIpAllowedName = getFunctionName(
        internal.ipRestrictions.checkProjectIpAllowed,
      );

      if (queryName === validateApiKeyName) {
        return {
          userId: "user123",
          keyId: "key123",
          scopes: ["issues:read"],
          rateLimit: 100,
        };
      }
      if (queryName === checkProjectIpAllowedName) {
        throw new Error('Validator failed for argument "projectId": Invalid ID "invalid"');
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => {
      return { ok: true };
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid request parameters");
  });

  test("returns 404 for NOT_FOUND error", async () => {
    const mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
    } as any;

    const mockRequest = new Request("https://api.example.com/api/issues?projectId=jx76ss...", {
      method: "GET",
      headers: {
        Authorization: "Bearer test-key",
      },
    });

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const queryName = getFunctionName(query);
      const validateApiKeyName = getFunctionName(internal.apiKeys.validateApiKey);
      const listIssuesInternalName = getFunctionName(internal.issues.queries.listIssuesInternal);

      if (queryName === validateApiKeyName) {
        return {
          userId: "user123",
          keyId: "key123",
          scopes: ["issues:read"],
          rateLimit: 100,
        };
      }

      if (queryName === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        return true; // IP allowed
      }

      if (queryName === listIssuesInternalName) {
        throw notFound("project", "jx76ss...");
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => {
      return { ok: true };
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.message).toContain("Project not found");
  });

  test("returns 403 for FORBIDDEN error", async () => {
    const mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
    } as any;

    const mockRequest = new Request("https://api.example.com/api/issues?projectId=jx76ss...", {
      method: "GET",
      headers: {
        Authorization: "Bearer test-key",
      },
    });

    mockCtx.runQuery.mockImplementation(async (query: any) => {
      const queryName = getFunctionName(query);

      if (queryName === getFunctionName(internal.apiKeys.validateApiKey)) {
        return {
          userId: "user123",
          keyId: "key123",
          scopes: ["issues:read"],
          rateLimit: 100,
        };
      }

      if (queryName === getFunctionName(internal.ipRestrictions.checkProjectIpAllowed)) {
        return true;
      }

      if (queryName === getFunctionName(internal.issues.queries.listIssuesInternal)) {
        throw forbidden("viewer", "You do not have access");
      }
      return null;
    });

    mockCtx.runMutation.mockImplementation(async () => {
      return { ok: true };
    });

    const response = await issuesApiHandler(mockCtx, mockRequest);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toContain("You do not have access");
  });
});
