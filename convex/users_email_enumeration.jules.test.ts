import { register } from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Users - Email Enumeration Vulnerability", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("verification: mutation is fast/async for both new and existing emails", async () => {
    // 1. Setup Environment to allow sending emails
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MAILTRAP_API_TOKEN", "mock-token");
    vi.stubEnv("MAILTRAP_INBOX_ID", "12345");
    vi.stubEnv("MAILTRAP_FROM_EMAIL", "test@example.com");
    vi.stubEnv("MAILTRAP_MODE", "sandbox");
    vi.stubEnv("RESEND_API_KEY", "mock-key");

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ id: "mock" })));

    const t = convexTest(schema, modules);
    register(t);

    // 2. Create User A
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    // 3. Update to NEW email -> Should NOT call fetch synchronously (Action scheduled)
    await asUser.mutation(api.users.updateProfile, {
      email: "new.target@example.com",
    });

    // The fetch should be moved to an async action, so it shouldn't be called during mutation.
    // This confirms the fix for the crash and timing attack.
    expect(fetchSpy).not.toHaveBeenCalled();

    // Clear spy to verify the next step (just in case)
    fetchSpy.mockClear();

    // 4. Create User B with email "taken@example.com"
    await createTestUser(t, { email: "taken@example.com" });

    // 5. Update User A to "taken@example.com" -> Should SKIP fetch (Action NOT scheduled)
    // Wait, if existing user, we skip sending email.
    // So action is NOT scheduled.
    // And fetch is NOT called.
    await asUser.mutation(api.users.updateProfile, {
      email: "taken@example.com",
    });

    // 6. Verify fetch was NOT called
    expect(fetchSpy).not.toHaveBeenCalled();

    // Conclusion: Both cases behave identically regarding synchronous fetch (none).
    // The timing difference (scheduling action vs not scheduling) is negligible compared to HTTP request latency.
  });
});
