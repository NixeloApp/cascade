
import { createTestUserEndpoint } from "./e2e";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getConvexSiteUrl } from "./lib/env";

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
    async hash(password: string) { return "hashed_password"; }
  },
}));

// Mock env utils
vi.mock("./lib/env", () => ({
  getConvexSiteUrl: vi.fn(),
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

  it("should allow request when CONVEX_SITE_URL is localhost", async () => {
    // Mock getConvexSiteUrl to return localhost
    (getConvexSiteUrl as any).mockReturnValue("http://localhost:5173");

    // Request can be anything
    const request = new Request("http://localhost:5173/e2e/create-test-user", {
      method: "POST",
      body: JSON.stringify({ email: "test@inbox.mailtrap.io", password: "password" }),
    });

    const ctx = {
      runMutation: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    const response = await createTestUserEndpoint(ctx, request);
    expect(response.status).toBe(200);
  });

  it("should block request when CONVEX_SITE_URL is production, even if request.url is localhost (spoofed)", async () => {
    // Mock getConvexSiteUrl to return production URL
    (getConvexSiteUrl as any).mockReturnValue("https://prod.convex.site");

    // Attacker spoofs request to look like localhost (e.g. Host: localhost)
    // In this test, we construct the request with localhost URL
    const request = new Request("http://localhost:5173/e2e/create-test-user", {
      method: "POST",
      body: JSON.stringify({ email: "test@inbox.mailtrap.io", password: "password" }),
    });

    const ctx = {
      runMutation: vi.fn(),
    } as any;

    const response = await createTestUserEndpoint(ctx, request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("E2E endpoints disabled (missing API key)");
  });
});
