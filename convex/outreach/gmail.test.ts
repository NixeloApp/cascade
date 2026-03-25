import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";

describe("outreach gmail", () => {
  it("decrypts legacy plaintext mailbox tokens for runtime use and migrates them at rest", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);

    const mailboxId = await t.run(async (ctx) =>
      ctx.db.insert("outreachMailboxes", {
        userId,
        organizationId,
        provider: "google",
        email: "legacy@example.com",
        displayName: "Legacy Mailbox",
        accessToken: "legacy-access-token",
        refreshToken: "legacy-refresh-token",
        expiresAt: Date.now() + 60_000,
        dailySendLimit: 50,
        todaySendCount: 0,
        todayResetAt: Date.now(),
        isActive: true,
        updatedAt: Date.now(),
      }),
    );

    const runtimeTokens = await t.mutation(internal.outreach.gmail.getMailboxTokens, {
      mailboxId,
    });

    expect(runtimeTokens).not.toBeNull();
    if (runtimeTokens === null) throw new Error("runtimeTokens is null");
    expect(runtimeTokens.accessToken).toBe("legacy-access-token");
    expect(runtimeTokens.refreshToken).toBe("legacy-refresh-token");

    const rawMailbox = await t.run(async (ctx) => ctx.db.get(mailboxId));
    expect(rawMailbox).not.toBeNull();
    if (rawMailbox === null) throw new Error("rawMailbox is null");
    expect(rawMailbox.accessToken).not.toBe("legacy-access-token");
    expect(rawMailbox.refreshToken).not.toBe("legacy-refresh-token");
  });

  it("stores refreshed access tokens encrypted while keeping runtime reads decrypted", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);

    const mailboxId = await t.mutation(internal.outreach.mailboxes.createMailboxFromOAuth, {
      userId,
      organizationId,
      provider: "google",
      email: "refresh@example.com",
      displayName: "Refresh Mailbox",
      accessToken: "initial-access-token",
      refreshToken: "initial-refresh-token",
      expiresAt: Date.now() + 60_000,
    });

    await t.mutation(internal.outreach.gmail.updateMailboxTokens, {
      mailboxId,
      accessToken: "refreshed-access-token",
      expiresAt: Date.now() + 120_000,
    });

    const rawMailbox = await t.run(async (ctx) => ctx.db.get(mailboxId));
    expect(rawMailbox).not.toBeNull();
    if (rawMailbox === null) throw new Error("rawMailbox is null");
    expect(rawMailbox.accessToken).not.toBe("refreshed-access-token");

    const runtimeTokens = await t.mutation(internal.outreach.gmail.getMailboxTokens, {
      mailboxId,
    });
    expect(runtimeTokens).not.toBeNull();
    if (runtimeTokens === null) throw new Error("runtimeTokens is null");
    expect(runtimeTokens.accessToken).toBe("refreshed-access-token");
    expect(runtimeTokens.refreshToken).toBe("initial-refresh-token");
  });
});
