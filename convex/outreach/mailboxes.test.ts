import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "../testUtils";

const MAILBOX_TTL_MS = 60_000;
const MAILBOX_RECONNECT_TTL_MS = 120_000;
const MAILBOX_RECONNECT_TTL_MS_AGAIN = 180_000;
const ACTIVE_MINUTE_WINDOW_OFFSET_MS = 10_000;

describe("outreach mailboxes", () => {
  it("stores OAuth mailbox tokens encrypted and redacts them from authenticated queries", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const asUser = asAuthenticatedUser(t, userId);

    const mailboxId = await t.mutation(internal.outreach.mailboxes.createMailboxFromOAuth, {
      userId,
      organizationId,
      provider: "google",
      email: "founder@example.com",
      displayName: "Founder",
      accessToken: "plain-access-token",
      refreshToken: "plain-refresh-token",
      expiresAt: Date.now() + MAILBOX_TTL_MS,
    });

    const rawMailbox = await t.run(async (ctx) => ctx.db.get(mailboxId));
    expect(rawMailbox).not.toBeNull();
    if (rawMailbox === null) throw new Error("rawMailbox is null");
    expect(rawMailbox.accessToken).not.toBe("plain-access-token");
    expect(rawMailbox.refreshToken).not.toBe("plain-refresh-token");

    const listed = await asUser.query(api.outreach.mailboxes.list, {});
    expect(listed).toHaveLength(1);
    expect(listed[0].accessToken).toBe("[redacted]");
    expect(listed[0].refreshToken).toBe("[redacted]");

    const mailbox = await asUser.query(api.outreach.mailboxes.get, { mailboxId });
    expect(mailbox?.accessToken).toBe("[redacted]");
    expect(mailbox?.refreshToken).toBe("[redacted]");
  });

  it("encrypts tokens when authenticated createMailbox updates an existing mailbox", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const asUser = asAuthenticatedUser(t, userId);

    await t.run(async (ctx) => {
      await ctx.db.patch(userId, { defaultOrganizationId: organizationId });
    });

    const firstMailboxId = await asUser.mutation(api.outreach.mailboxes.createMailbox, {
      provider: "google",
      email: "founder@example.com",
      displayName: "Founder",
      accessToken: "token-one",
      refreshToken: "refresh-one",
      expiresAt: Date.now() + MAILBOX_TTL_MS,
    });

    const secondMailboxId = await asUser.mutation(api.outreach.mailboxes.createMailbox, {
      provider: "google",
      email: "founder@example.com",
      displayName: "Founder Updated",
      accessToken: "token-two",
      refreshToken: "refresh-two",
      expiresAt: Date.now() + MAILBOX_RECONNECT_TTL_MS,
    });

    expect(secondMailboxId).toBe(firstMailboxId);

    await t.run(async (ctx) => {
      await ctx.db.patch(firstMailboxId, {
        minuteSendLimit: 3,
        minuteSendCount: 2,
        minuteWindowStartedAt: Date.now() - ACTIVE_MINUTE_WINDOW_OFFSET_MS,
      });
    });

    await asUser.mutation(api.outreach.mailboxes.createMailbox, {
      provider: "google",
      email: "founder@example.com",
      displayName: "Founder Updated Again",
      accessToken: "token-three",
      refreshToken: "refresh-three",
      expiresAt: Date.now() + MAILBOX_RECONNECT_TTL_MS_AGAIN,
    });

    const mailboxes = await t.run(async (ctx) =>
      ctx.db
        .query("outreachMailboxes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    );

    expect(mailboxes).toHaveLength(1);
    expect(mailboxes[0].accessToken).not.toBe("token-two");
    expect(mailboxes[0].refreshToken).not.toBe("refresh-two");
    expect(mailboxes[0].minuteSendLimit).toBe(3);
    expect(mailboxes[0].minuteSendCount).toBe(2);
  });

  it("returns the effective deliverability cap when a user raises the configured ceiling", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const asUser = asAuthenticatedUser(t, userId);

    await t.run(async (ctx) => {
      await ctx.db.patch(userId, { defaultOrganizationId: organizationId });
    });

    const mailboxId = await asUser.mutation(api.outreach.mailboxes.createMailbox, {
      provider: "google",
      email: "founder@example.com",
      displayName: "Founder",
      accessToken: "token-one",
      refreshToken: "refresh-one",
      expiresAt: Date.now() + MAILBOX_TTL_MS,
    });

    const result = await asUser.mutation(api.outreach.mailboxes.updateLimit, {
      mailboxId,
      dailySendLimit: 90,
    });

    expect(result).toMatchObject({
      configuredDailyLimit: 90,
      deliverabilityStatus: "healthy",
      effectiveDailyLimit: 15,
      hasCapacityOverride: true,
      warmupStageLabel: "Days 1-3",
    });
  });
});
