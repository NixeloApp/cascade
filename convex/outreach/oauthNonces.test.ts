import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";

describe("outreach oauth nonces", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("issues single-use nonces for valid organization members and consumes them once", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);

    const issued = await t.mutation(internal.outreach.oauthNonces.createNonce, {
      provider: "google",
      userId,
      organizationId,
    });

    const storedNonce = await t.run(async (ctx) =>
      ctx.db
        .query("outreachOAuthNonces")
        .withIndex("by_state_token", (q) => q.eq("stateToken", issued.stateToken))
        .unique(),
    );

    expect(storedNonce).not.toBeNull();
    expect(issued.expiresAt).toBeGreaterThan(Date.now());

    const consumed = await t.mutation(internal.outreach.oauthNonces.getNonceContextAndDelete, {
      provider: "google",
      stateToken: issued.stateToken,
    });

    expect(consumed).toEqual({
      userId,
      organizationId,
    });

    const replayed = await t.mutation(internal.outreach.oauthNonces.getNonceContextAndDelete, {
      provider: "google",
      stateToken: issued.stateToken,
    });
    expect(replayed).toBeNull();
  });

  it("rejects expired nonces and prunes them from storage", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    const issued = await t.mutation(internal.outreach.oauthNonces.createNonce, {
      provider: "google",
      userId,
      organizationId,
    });

    vi.spyOn(Date, "now").mockReturnValue(issued.expiresAt + 1);

    const consumed = await t.mutation(internal.outreach.oauthNonces.getNonceContextAndDelete, {
      provider: "google",
      stateToken: issued.stateToken,
    });

    expect(consumed).toBeNull();

    const storedNonce = await t.run(async (ctx) =>
      ctx.db
        .query("outreachOAuthNonces")
        .withIndex("by_state_token", (q) => q.eq("stateToken", issued.stateToken))
        .unique(),
    );
    expect(storedNonce).toBeNull();
  });
});
