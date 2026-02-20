import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Users Validation", () => {
  it("should enforce length limits on profile updates", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    const longName = "a".repeat(101);
    const longBio = "a".repeat(501);

    // Test name limit
    await expect(
      asUser.mutation(api.users.updateProfile, {
        name: longName,
      }),
    ).rejects.toThrow("name must be at most 100 characters");

    // Test bio limit
    await expect(
      asUser.mutation(api.users.updateProfile, {
        bio: longBio,
      }),
    ).rejects.toThrow("bio must be at most 500 characters");

    // Test valid inputs
    await asUser.mutation(api.users.updateProfile, {
      name: "Valid Name",
      bio: "Valid Bio",
    });

    const user = await t.run(async (ctx) => ctx.db.get(userId));
    expect(user?.name).toBe("Valid Name");
    expect(user?.bio).toBe("Valid Bio");
  });

  it("should validate avatar URL", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const asUser = asAuthenticatedUser(t, userId);

    await expect(
      asUser.mutation(api.users.updateProfile, {
        avatar: "not-a-url",
      }),
    ).rejects.toThrow("avatar must be a valid URL");

    await asUser.mutation(api.users.updateProfile, {
      avatar: "https://example.com/avatar.png",
    });

    const user = await t.run(async (ctx) => ctx.db.get(userId));
    expect(user?.image).toBe("https://example.com/avatar.png");
  });
});
