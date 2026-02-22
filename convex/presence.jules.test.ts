
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

// Mock the Presence class before importing the module
const { mockPresenceList, mockPresenceHeartbeat } = vi.hoisted(() => ({
  mockPresenceList: vi.fn(),
  mockPresenceHeartbeat: vi.fn(),
}));

vi.mock("@convex-dev/presence", () => {
  return {
    Presence: class MockPresence {
      constructor() {}
      async list(...args: any[]) {
        return mockPresenceList(...args);
      }
      async heartbeat(...args: any[]) {
        return mockPresenceHeartbeat(...args);
      }
    },
  };
});

// Mock getAuthUserId to work with convex-test's auth mock
vi.mock("@convex-dev/auth/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@convex-dev/auth/server")>();
  return {
    ...actual,
    getAuthUserId: async (ctx: any) => {
      const identity = await ctx.auth.getUserIdentity();
      return identity?.subject;
    },
  };
});

describe("presence", () => {
  it("should list active users with enriched data", async () => {
    const t = convexTest(schema, modules);

    // Create a user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.png",
      });
    });

    // Mock presence list to return this user
    mockPresenceList.mockResolvedValue([
      {
        userId,
        updated: Date.now(),
        data: { status: "online" },
      },
    ]);

    // Call list
    const result = await t.run(async (ctx) => {
      return await ctx.runQuery(api.presence.list, { roomToken: "room1" });
    });

    // Verify result
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      userId,
      name: "Test User",
      email: "test@example.com",
      image: "https://example.com/avatar.png",
      data: { status: "online" },
    });

    // Verify mock called
    expect(mockPresenceList).toHaveBeenCalled();
  });

  it("should return nulls for missing users when enriching data", async () => {
    const t = convexTest(schema, modules);

    // Mock presence list to return a non-existent user
    mockPresenceList.mockResolvedValue([
      {
        userId: "non-existent-user-id",
        updated: Date.now(),
        data: { status: "online" },
      },
    ]);

    // Call list
    const result = await t.run(async (ctx) => {
      return await ctx.runQuery(api.presence.list, { roomToken: "room1" });
    });

    // Verify result
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      userId: "non-existent-user-id",
      // Enriched fields should be undefined
    });
    expect(result[0].name).toBeUndefined();
    expect(result[0].email).toBeUndefined();
  });

  it("should handle heartbeat when authenticated", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", { name: "User" });
    });

    const args = {
      roomId: "room1",
      sessionId: "session1",
      interval: 1000,
    };

    await t.withIdentity({ subject: userId }).mutation(api.presence.heartbeat, args);

    expect(mockPresenceHeartbeat).toHaveBeenCalledWith(
      expect.anything(), // ctx
      args.roomId,
      userId,
      args.sessionId,
      args.interval
    );
  });

  it("should throw unauthenticated error for heartbeat when not logged in", async () => {
    const t = convexTest(schema, modules);

    const args = {
        roomId: "room1",
        sessionId: "session1",
        interval: 1000,
    };

    // We expect the error message to contain "Not authenticated" or the code "UNAUTHENTICATED"
    // The exact error propagation in convex-test might vary, so we catch generally first.
    await expect(t.mutation(api.presence.heartbeat, args)).rejects.toThrow(
      /Not authenticated|UNAUTHENTICATED/,
    );
  });
});
