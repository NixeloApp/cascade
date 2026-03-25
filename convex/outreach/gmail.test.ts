import { convexTest, type TestConvex } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";

vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

type OutreachFixture = {
  userId: Id<"users">;
  organizationId: Id<"organizations">;
  mailboxId: Id<"outreachMailboxes">;
  contactId: Id<"outreachContacts">;
  sequenceId: Id<"outreachSequences">;
  enrollmentId: Id<"outreachEnrollments">;
};

type ConvexTestInstance = TestConvex<typeof schema>;

function encodeBase64UrlUtf8(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function createMailbox(
  t: ConvexTestInstance,
  userId: Id<"users">,
  organizationId: Id<"organizations">,
  email: string,
  displayName: string,
) {
  return await t.mutation(internal.outreach.mailboxes.createMailboxFromOAuth, {
    userId,
    organizationId,
    provider: "google",
    email,
    displayName,
    accessToken: `access-token-${email}`,
    refreshToken: `refresh-token-${email}`,
    expiresAt: Date.now() + 60_000,
  });
}

async function createContact(
  t: ConvexTestInstance,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
  email: string,
) {
  return await t.run(async (ctx) =>
    ctx.db.insert("outreachContacts", {
      organizationId,
      email,
      firstName: "Jamie",
      company: "Acme",
      source: "manual",
      createdBy: userId,
      createdAt: Date.now(),
    }),
  );
}

async function createSequenceAndEnrollment(
  t: ConvexTestInstance,
  params: {
    userId: Id<"users">;
    organizationId: Id<"organizations">;
    mailboxId: Id<"outreachMailboxes">;
    contactId: Id<"outreachContacts">;
    sequenceName: string;
    gmailThreadIds?: string[];
  },
): Promise<{
  sequenceId: Id<"outreachSequences">;
  enrollmentId: Id<"outreachEnrollments">;
}> {
  const sequenceId = await t.run(async (ctx) =>
    ctx.db.insert("outreachSequences", {
      organizationId: params.organizationId,
      createdBy: params.userId,
      name: params.sequenceName,
      status: "active",
      mailboxId: params.mailboxId,
      steps: [
        {
          order: 0,
          subject: "Hi {{firstName}}",
          body: "<p>Hello {{firstName}}</p>",
          delayDays: 0,
        },
      ],
      physicalAddress: "123 Main St, Chicago, IL",
      trackingDomain: "track.nixelo.test",
      stats: {
        enrolled: 1,
        sent: 0,
        opened: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );

  const enrollmentId = await t.run(async (ctx) =>
    ctx.db.insert("outreachEnrollments", {
      sequenceId,
      contactId: params.contactId,
      organizationId: params.organizationId,
      currentStep: 0,
      status: "active",
      nextSendAt: Date.now(),
      enrolledAt: Date.now(),
      gmailThreadIds: params.gmailThreadIds,
    }),
  );

  return { sequenceId, enrollmentId };
}

async function createOutreachFixture(): Promise<{
  t: ConvexTestInstance;
  fixture: OutreachFixture;
}> {
  const t = convexTest(schema, modules);
  const userId = await createTestUser(t);
  const { organizationId } = await createOrganizationAdmin(t, userId);
  const mailboxId = await createMailbox(
    t,
    userId,
    organizationId,
    "sender@example.com",
    "Primary Sender",
  );
  const contactId = await createContact(t, organizationId, userId, "lead@example.com");
  const { sequenceId, enrollmentId } = await createSequenceAndEnrollment(t, {
    userId,
    organizationId,
    mailboxId,
    contactId,
    sequenceName: "Primary Sequence",
  });

  return {
    t,
    fixture: { userId, organizationId, mailboxId, contactId, sequenceId, enrollmentId },
  };
}

describe("outreach gmail", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T15:00:00.000Z"));
    vi.mocked(fetchWithTimeout).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

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

  it("classifies DSN bounces, suppresses the failed recipient, and stops the enrollment", async () => {
    const { t, fixture } = await createOutreachFixture();

    vi.mocked(fetchWithTimeout).mockImplementation(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/messages?q=")) {
        return new Response(
          JSON.stringify({
            messages: [{ id: "message-1", threadId: "bounce-thread" }],
          }),
          { status: 200 },
        );
      }

      if (requestUrl.includes("/messages/message-1?")) {
        return new Response(
          JSON.stringify({
            snippet: "Delivery Status Notification (Failure)",
            payload: {
              mimeType: "multipart/report",
              headers: [
                {
                  name: "From",
                  value: "Mail Delivery Subsystem <mailer-daemon@googlemail.com>",
                },
                { name: "Subject", value: "Delivery Status Notification (Failure)" },
                { name: "X-Failed-Recipients", value: "lead@example.com" },
              ],
              parts: [
                {
                  mimeType: "message/delivery-status",
                  body: {
                    data: encodeBase64UrlUtf8(
                      [
                        "Final-Recipient: rfc822; lead@example.com",
                        "Action: failed",
                        "Status: 5.1.1",
                        "Diagnostic-Code: smtp; 550 5.1.1 The email account does not exist",
                      ].join("\n"),
                    ),
                  },
                },
              ],
            },
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unexpected fetch URL: ${requestUrl}`);
    });

    const result = await t.action(internal.outreach.gmail.checkReplies, {
      mailboxId: fixture.mailboxId,
    });

    expect(result).toEqual({ checked: 1, replies: 0, bounces: 1 });

    const enrollment = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(enrollment).not.toBeNull();
    if (enrollment === null) throw new Error("enrollment is null");
    expect(enrollment.status).toBe("bounced");
    expect(enrollment.completedAt).toBe(Date.now());
    expect(enrollment.nextSendAt).toBeUndefined();

    const suppressions = await t.run(async (ctx) =>
      ctx.db
        .query("outreachSuppressions")
        .withIndex("by_organization_email", (q) =>
          q.eq("organizationId", fixture.organizationId).eq("email", "lead@example.com"),
        )
        .collect(),
    );
    expect(suppressions).toHaveLength(1);
    expect(suppressions[0].reason).toBe("hard_bounce");
    expect(suppressions[0].sourceEnrollmentId).toBe(fixture.enrollmentId);

    const sequence = await t.run(async (ctx) => ctx.db.get(fixture.sequenceId));
    expect(sequence).not.toBeNull();
    if (sequence === null) throw new Error("sequence is null");
    expect(sequence.stats?.bounced).toBe(1);

    const mailbox = await t.run(async (ctx) => ctx.db.get(fixture.mailboxId));
    expect(mailbox).not.toBeNull();
    if (mailbox === null) throw new Error("mailbox is null");
    expect(mailbox.lastHealthCheckAt).toBe(Date.now());

    const events = await t.run(async (ctx) =>
      ctx.db
        .query("outreachEvents")
        .withIndex("by_enrollment", (q) => q.eq("enrollmentId", fixture.enrollmentId))
        .collect(),
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("bounced");
    expect(events[0].metadata).toMatchObject({
      bounceType: "hard",
      failedRecipient: "lead@example.com",
      diagnosticCode: "550 5.1.1 The email account does not exist",
      replyContent: "Delivery Status Notification (Failure)",
    });
  });

  it("matches replies to the correct mailbox-scoped enrollment", async () => {
    const { t, fixture } = await createOutreachFixture();
    const secondaryMailboxId = await createMailbox(
      t,
      fixture.userId,
      fixture.organizationId,
      "secondary@example.com",
      "Secondary Sender",
    );
    const { sequenceId: secondarySequenceId, enrollmentId: secondaryEnrollmentId } =
      await createSequenceAndEnrollment(t, {
        userId: fixture.userId,
        organizationId: fixture.organizationId,
        mailboxId: secondaryMailboxId,
        contactId: fixture.contactId,
        sequenceName: "Secondary Sequence",
        gmailThreadIds: ["secondary-thread"],
      });

    await t.run(async (ctx) => {
      await ctx.db.patch(fixture.enrollmentId, {
        gmailThreadIds: ["primary-thread"],
      });
    });

    vi.mocked(fetchWithTimeout).mockImplementation(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/messages?q=")) {
        return new Response(
          JSON.stringify({
            messages: [{ id: "message-2", threadId: "primary-thread" }],
          }),
          { status: 200 },
        );
      }

      if (requestUrl.includes("/messages/message-2?")) {
        return new Response(
          JSON.stringify({
            snippet: "Thanks for the note.",
            payload: {
              mimeType: "text/plain",
              headers: [
                { name: "From", value: "Jamie Lead <lead@example.com>" },
                { name: "Subject", value: "Re: Hi Jamie" },
              ],
              body: {
                data: encodeBase64UrlUtf8("Thanks for the note."),
              },
            },
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unexpected fetch URL: ${requestUrl}`);
    });

    const result = await t.action(internal.outreach.gmail.checkReplies, {
      mailboxId: fixture.mailboxId,
    });

    expect(result).toEqual({ checked: 1, replies: 1, bounces: 0 });

    const primaryEnrollment = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(primaryEnrollment).not.toBeNull();
    if (primaryEnrollment === null) throw new Error("primaryEnrollment is null");
    expect(primaryEnrollment.status).toBe("replied");

    const secondaryEnrollment = await t.run(async (ctx) => ctx.db.get(secondaryEnrollmentId));
    expect(secondaryEnrollment).not.toBeNull();
    if (secondaryEnrollment === null) throw new Error("secondaryEnrollment is null");
    expect(secondaryEnrollment.status).toBe("active");

    const primarySequence = await t.run(async (ctx) => ctx.db.get(fixture.sequenceId));
    expect(primarySequence).not.toBeNull();
    if (primarySequence === null) throw new Error("primarySequence is null");
    expect(primarySequence.stats?.replied).toBe(1);

    const secondarySequence = await t.run(async (ctx) => ctx.db.get(secondarySequenceId));
    expect(secondarySequence).not.toBeNull();
    if (secondarySequence === null) throw new Error("secondarySequence is null");
    expect(secondarySequence.stats?.replied).toBe(0);

    const events = await t.run(async (ctx) =>
      ctx.db
        .query("outreachEvents")
        .withIndex("by_enrollment", (q) => q.eq("enrollmentId", fixture.enrollmentId))
        .collect(),
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("replied");
  });

  it("rejects ambiguous bounce matches instead of suppressing the contact", async () => {
    const { t, fixture } = await createOutreachFixture();
    const { enrollmentId: secondEnrollmentId } = await createSequenceAndEnrollment(t, {
      userId: fixture.userId,
      organizationId: fixture.organizationId,
      mailboxId: fixture.mailboxId,
      contactId: fixture.contactId,
      sequenceName: "Second Active Sequence",
    });

    const result = await t.mutation(internal.outreach.gmail.findEnrollmentForBounce, {
      bouncedRecipientEmail: "lead@example.com",
      mailboxId: fixture.mailboxId,
      bounceReason: "Mailbox unavailable",
    });

    expect(result).toEqual({ matched: false });

    const firstEnrollment = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(firstEnrollment).not.toBeNull();
    if (firstEnrollment === null) throw new Error("firstEnrollment is null");
    expect(firstEnrollment.status).toBe("active");

    const secondEnrollment = await t.run(async (ctx) => ctx.db.get(secondEnrollmentId));
    expect(secondEnrollment).not.toBeNull();
    if (secondEnrollment === null) throw new Error("secondEnrollment is null");
    expect(secondEnrollment.status).toBe("active");

    const suppressions = await t.run(async (ctx) =>
      ctx.db
        .query("outreachSuppressions")
        .withIndex("by_organization_email", (q) =>
          q.eq("organizationId", fixture.organizationId).eq("email", "lead@example.com"),
        )
        .collect(),
    );
    expect(suppressions).toHaveLength(0);

    const events = await t.run(async (ctx) =>
      ctx.db
        .query("outreachEvents")
        .withIndex("by_organization_type", (q) =>
          q.eq("organizationId", fixture.organizationId).eq("type", "bounced"),
        )
        .collect(),
    );
    expect(events).toHaveLength(0);
  });

  it("keeps soft bounces active without suppressing the contact", async () => {
    const { t, fixture } = await createOutreachFixture();

    const result = await t.mutation(internal.outreach.gmail.findEnrollmentForBounce, {
      bouncedRecipientEmail: "lead@example.com",
      mailboxId: fixture.mailboxId,
      gmailMessageId: "soft-bounce-1",
      diagnosticCode: "421 4.7.0 Temporary rate limit exceeded",
      bounceReason: "Delivery temporarily delayed",
    });

    expect(result).toEqual({ matched: true });

    const enrollment = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(enrollment).not.toBeNull();
    if (enrollment === null) throw new Error("enrollment is null");
    expect(enrollment.status).toBe("active");

    const suppressions = await t.run(async (ctx) =>
      ctx.db
        .query("outreachSuppressions")
        .withIndex("by_organization_email", (q) =>
          q.eq("organizationId", fixture.organizationId).eq("email", "lead@example.com"),
        )
        .collect(),
    );
    expect(suppressions).toHaveLength(0);

    const events = await t.run(async (ctx) =>
      ctx.db
        .query("outreachEvents")
        .withIndex("by_enrollment", (q) => q.eq("enrollmentId", fixture.enrollmentId))
        .collect(),
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("bounced");
    expect(events[0].metadata).toMatchObject({
      bounceType: "soft",
      failedRecipient: "lead@example.com",
      diagnosticCode: "421 4.7.0 Temporary rate limit exceeded",
      gmailMessageId: "soft-bounce-1",
      replyContent: "Delivery temporarily delayed",
    });
  });

  it("deduplicates repeated soft-bounce polls for the same Gmail message", async () => {
    const { t, fixture } = await createOutreachFixture();

    vi.mocked(fetchWithTimeout).mockImplementation(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes("/messages?q=")) {
        return new Response(
          JSON.stringify({
            messages: [{ id: "soft-bounce-message", threadId: "soft-bounce-thread" }],
          }),
          { status: 200 },
        );
      }

      if (requestUrl.includes("/messages/soft-bounce-message?")) {
        return new Response(
          JSON.stringify({
            snippet: "Delivery temporarily delayed",
            payload: {
              mimeType: "multipart/report",
              headers: [
                {
                  name: "From",
                  value: "Mail Delivery Subsystem <mailer-daemon@googlemail.com>",
                },
                { name: "Subject", value: "Delivery temporarily delayed" },
                { name: "X-Failed-Recipients", value: "lead@example.com" },
              ],
              parts: [
                {
                  mimeType: "message/delivery-status",
                  body: {
                    data: encodeBase64UrlUtf8(
                      [
                        "Final-Recipient: rfc822; lead@example.com",
                        "Action: delayed",
                        "Status: 4.7.0",
                        "Diagnostic-Code: smtp; 421 4.7.0 Temporary rate limit exceeded",
                      ].join("\n"),
                    ),
                  },
                },
              ],
            },
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unexpected fetch URL: ${requestUrl}`);
    });

    const firstResult = await t.action(internal.outreach.gmail.checkReplies, {
      mailboxId: fixture.mailboxId,
    });
    const secondResult = await t.action(internal.outreach.gmail.checkReplies, {
      mailboxId: fixture.mailboxId,
    });

    expect(firstResult).toEqual({ checked: 1, replies: 0, bounces: 1 });
    expect(secondResult).toEqual({ checked: 1, replies: 0, bounces: 0 });

    const enrollment = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(enrollment).not.toBeNull();
    if (enrollment === null) throw new Error("enrollment is null");
    expect(enrollment.status).toBe("active");

    const sequence = await t.run(async (ctx) => ctx.db.get(fixture.sequenceId));
    expect(sequence).not.toBeNull();
    if (sequence === null) throw new Error("sequence is null");
    expect(sequence.stats?.bounced).toBe(1);

    const events = await t.run(async (ctx) =>
      ctx.db
        .query("outreachEvents")
        .withIndex("by_enrollment", (q) => q.eq("enrollmentId", fixture.enrollmentId))
        .collect(),
    );
    expect(events).toHaveLength(1);
    expect(events[0].metadata).toMatchObject({
      bounceType: "soft",
      failedRecipient: "lead@example.com",
      gmailMessageId: "soft-bounce-message",
    });
  });

  it("still finds the active mailbox enrollment when older enrollments exceed the bounded slice", async () => {
    const { t, fixture } = await createOutreachFixture();

    for (let index = 0; index < 100; index += 1) {
      const { sequenceId, enrollmentId } = await createSequenceAndEnrollment(t, {
        userId: fixture.userId,
        organizationId: fixture.organizationId,
        mailboxId: fixture.mailboxId,
        contactId: fixture.contactId,
        sequenceName: `Historical Sequence ${index}`,
      });

      await t.run(async (ctx) => {
        await ctx.db.patch(sequenceId, {
          updatedAt: Date.now() - (index + 1) * 1_000,
        });
        await ctx.db.patch(enrollmentId, {
          completedAt: Date.now() - (index + 1) * 1_000,
          status: "replied",
        });
      });
    }

    const result = await t.mutation(internal.outreach.gmail.findEnrollmentForBounce, {
      bouncedRecipientEmail: "lead@example.com",
      mailboxId: fixture.mailboxId,
      diagnosticCode: "550 5.1.1 User unknown",
      bounceReason: "Mailbox unavailable",
    });

    expect(result).toEqual({ matched: true });

    const enrollment = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(enrollment).not.toBeNull();
    if (enrollment === null) throw new Error("enrollment is null");
    expect(enrollment.status).toBe("bounced");
  });
});
