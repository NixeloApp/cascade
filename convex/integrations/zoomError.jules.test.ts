// @vitest-environment node
"use node";

import { afterEach, describe, expect, test, vi } from "vitest";

// Hoist mock function
const mocks = vi.hoisted(() => ({
  fetchWithTimeout: vi.fn(),
  loggerError: vi.fn(),
}));

// Mock convex dependencies
vi.mock("../_generated/server", () => ({
  action: (args: any) => args.handler,
  internalAction: (args: any) => args.handler,
}));

vi.mock("../_generated/api", () => ({
  internal: {},
}));

vi.mock("convex/values", () => ({
  v: {
    string: () => {},
    number: () => {},
    optional: () => {},
    union: () => {},
    array: () => {},
  },
}));

vi.mock("@convex-dev/auth/server", () => ({
  getAuthUserId: vi.fn(),
}));

vi.mock("../lib/logger", () => ({
  logger: {
    error: mocks.loggerError,
  },
}));

vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: mocks.fetchWithTimeout,
}));

// Import the function to test
// Depending on how module resolution works, we might need to use absolute paths or verify relative imports.
// Since we are in the same directory, ./zoom works.
import { exchangeCodeForToken } from "./zoom";

describe("Zoom Integration Error Handling", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("exchangeCodeForToken handles network errors gracefully", async () => {
    // Simulate fetchWithTimeout throwing an error
    mocks.fetchWithTimeout.mockRejectedValue(new Error("Network error"));

    // Set environment variables
    process.env.ZOOM_CLIENT_ID = "test-client-id";
    process.env.ZOOM_CLIENT_SECRET = "test-client-secret";

    // We expect the function to throw the user-friendly error we added
    await expect(() =>
      (exchangeCodeForToken as any)(
        {} as any, // ctx
        { code: "test-code", redirectUri: "test-redirect" }, // args
      ),
    ).rejects.toThrow("Failed to exchange Zoom OAuth code. Please try again.");

    expect(mocks.loggerError).toHaveBeenCalledWith(
      "Zoom OAuth exchange failed",
      expect.objectContaining({
        error: expect.any(Error),
        redirectUri: "test-redirect",
      }),
    );
  });

  test("exchangeCodeForToken handles API errors gracefully", async () => {
    // Simulate API returning 400
    mocks.fetchWithTimeout.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Invalid code",
    } as any);

    // Set environment variables
    process.env.ZOOM_CLIENT_ID = "test-client-id";
    process.env.ZOOM_CLIENT_SECRET = "test-client-secret";

    await expect(() =>
      (exchangeCodeForToken as any)(
        {} as any, // ctx
        { code: "test-code", redirectUri: "test-redirect" }, // args
      ),
    ).rejects.toThrow("Failed to exchange code: Invalid code");

    expect(mocks.loggerError).toHaveBeenCalledWith(
      "Zoom OAuth exchange returned error",
      expect.objectContaining({
        status: 400,
        error: "Invalid code",
      }),
    );
  });
});
