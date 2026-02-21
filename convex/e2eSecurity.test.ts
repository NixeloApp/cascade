import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { createTestUserHandler } from "./e2e";
import { isLocalhost } from "./lib/env";

const mockIsLocalhost = isLocalhost as MockedFunction<typeof isLocalhost>;

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

// Mock env utils
vi.mock("./lib/env", () => ({
  getConvexSiteUrl: vi.fn(),
  isLocalhost: vi.fn(),
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
    mockIsLocalhost.mockReturnValue(true);

    // Request can be anything
    const request = new Request("http://localhost:5173/e2e/create-test-user", {
      method: "POST",
      body: JSON.stringify({ email: "test@inbox.mailtrap.io", password: "password" }),
    });

    const ctx = {
      runMutation: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    const response = await createTestUserHandler(ctx, request);
    expect(response.status).toBe(200);
  });

  it("should block request when CONVEX_SITE_URL is production, even if request.url is localhost (spoofed)", async () => {
    mockIsLocalhost.mockReturnValue(false);

    // Attacker spoofs request to look like localhost (e.g. Host: localhost)
    // In this test, we construct the request with localhost URL
    const request = new Request("http://localhost:5173/e2e/create-test-user", {
      method: "POST",
      body: JSON.stringify({ email: "test@inbox.mailtrap.io", password: "password" }),
    });

    const ctx = {
      runMutation: vi.fn(),
    } as any;

    const response = await createTestUserHandler(ctx, request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("E2E endpoints disabled (missing API key)");
  });
});
