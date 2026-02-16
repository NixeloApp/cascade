import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUserEndpoint } from "./e2e";

// Mock internal dependencies
vi.mock("./_generated/api", () => ({
  internal: {
    e2e: {
      createTestUserInternal: "createTestUserInternal",
    },
  },
}));

vi.mock("lucia", () => ({
  Scrypt: class {
    async hash(_password: string) {
      return "hashed_password";
    }
  },
}));

describe("E2E Security Check", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.E2E_API_KEY; // Ensure no API key
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should allow request when request URL hostname is localhost", async () => {
    // Request from localhost (development/CI)
    const request = new Request("http://localhost:5173/e2e/create-test-user", {
      method: "POST",
      body: JSON.stringify({ email: "test@inbox.mailtrap.io", password: "password" }),
    });

    const ctx = {
      runMutation: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    // createTestUserEndpoint is an httpAction, we need to call its handler
    const handler = (createTestUserEndpoint as any)._handler;
    const response = await handler(ctx, request);
    expect(response.status).toBe(200);
  });

  it("should block request when request URL is production hostname (no API key)", async () => {
    // Request from production hostname without API key
    const request = new Request("https://myapp.convex.cloud/e2e/create-test-user", {
      method: "POST",
      body: JSON.stringify({ email: "test@inbox.mailtrap.io", password: "password" }),
    });

    const ctx = {
      runMutation: vi.fn(),
    } as any;

    const handler = (createTestUserEndpoint as any)._handler;
    const response = await handler(ctx, request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("E2E endpoints disabled (missing API key)");
  });
});
