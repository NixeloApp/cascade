import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { DAY } from "../lib/timeUtils";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";
import { DEFAULT_MAILBOX_MINUTE_SEND_LIMIT, MAILBOX_SEND_WINDOW_MS } from "./mailboxRateLimits";

type SendFixture = {
  userId: Id<"users">;
  organizationId: Id<"organizations">;
  mailboxId: Id<"outreachMailboxes">;
  sequenceId: Id<"outreachSequences">;
  contactId: Id<"outreachContacts">;
  enrollmentId: Id<"outreachEnrollments">;
};

async function createSendFixture(useLegacyMailbox: boolean = false) {
  const t = convexTest(schema, modules);
  const userId = await createTestUser(t);
  const { organizationId } = await createOrganizationAdmin(t, userId);

  let mailboxId: Id<"outreachMailboxes">;
  if (useLegacyMailbox) {
    mailboxId = await t.run(async (ctx) =>
      ctx.db.insert("outreachMailboxes", {
        userId,
        organizationId,
        provider: "google",
        email: "legacy-mailbox@example.com",
        displayName: "Legacy Mailbox",
        accessToken: "encrypted-token",
        refreshToken: "encrypted-refresh",
        expiresAt: Date.now() + 60_000,
        dailySendLimit: 50,
        todaySendCount: 0,
        todayResetAt: Date.now(),
        isActive: true,
        updatedAt: Date.now(),
      }),
    );
  } else {
    mailboxId = await t.mutation(internal.outreach.mailboxes.createMailboxFromOAuth, {
      userId,
      organizationId,
      provider: "google",
      email: "sender@example.com",
      displayName: "Sender",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60_000,
    });
  }

  const contactId = await t.run(async (ctx) =>
    ctx.db.insert("outreachContacts", {
      organizationId,
      email: "lead@example.com",
      firstName: "Jamie",
      company: "Acme",
      source: "manual",
      createdBy: userId,
      createdAt: Date.now(),
    }),
  );

  const sequenceId = await t.run(async (ctx) =>
    ctx.db.insert("outreachSequences", {
      organizationId,
      createdBy: userId,
      name: "Founder Outreach",
      status: "active",
      mailboxId,
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
      contactId,
      organizationId,
      currentStep: 0,
      status: "active",
      nextSendAt: Date.now() - 60_000,
      enrolledAt: Date.now(),
    }),
  );

  return {
    t,
    fixture: { userId, organizationId, mailboxId, sequenceId, contactId, enrollmentId },
  };
}

describe("outreach sendEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reserves a mailbox minute slot during pre-send and blocks same-window re-entry", async () => {
    const { t, fixture } = await createSendFixture();

    await t.run(async (ctx) => {
      await ctx.db.patch(fixture.mailboxId, {
        minuteSendLimit: 1,
        minuteSendCount: 0,
        minuteWindowStartedAt: Date.now(),
      });
    });

    const firstAttempt = await t.mutation(internal.outreach.sendEngine.checkPreSend, {
      enrollmentId: fixture.enrollmentId,
    });
    expect(firstAttempt.canSend).toBe(true);

    const mailboxAfterReservation = await t.run(async (ctx) => ctx.db.get(fixture.mailboxId));
    expect(mailboxAfterReservation).not.toBeNull();
    if (mailboxAfterReservation === null) throw new Error("mailboxAfterReservation is null");
    expect(mailboxAfterReservation.minuteSendCount).toBe(1);

    const secondAttempt = await t.mutation(internal.outreach.sendEngine.checkPreSend, {
      enrollmentId: fixture.enrollmentId,
    });
    expect(secondAttempt).toEqual({ canSend: false });
  });

  it("backfills legacy mailboxes and resets expired rate-limit windows before reserving the next send", async () => {
    const { t, fixture } = await createSendFixture(true);
    const staleDay = Date.now() - 2 * DAY;

    await t.run(async (ctx) => {
      await ctx.db.patch(fixture.mailboxId, {
        todaySendCount: 9,
        todayResetAt: staleDay,
        minuteSendCount: 7,
        minuteWindowStartedAt: Date.now() - MAILBOX_SEND_WINDOW_MS - 1,
      });
    });

    const preSend = await t.mutation(internal.outreach.sendEngine.checkPreSend, {
      enrollmentId: fixture.enrollmentId,
    });

    expect(preSend.canSend).toBe(true);
    if (preSend.canSend) {
      expect(preSend.renderedSubject).toBe("Hi Jamie");
      expect(preSend.renderedBody).toContain("Hello Jamie");
      expect(preSend.renderedBody).toContain("track.nixelo.test/t/o/");
    }

    const mailboxAfterReservation = await t.run(async (ctx) => ctx.db.get(fixture.mailboxId));
    expect(mailboxAfterReservation).not.toBeNull();
    if (mailboxAfterReservation === null) throw new Error("mailboxAfterReservation is null");
    expect(mailboxAfterReservation.todaySendCount).toBe(0);
    expect(mailboxAfterReservation.todayResetAt).toBe(Date.now());
    expect(mailboxAfterReservation.minuteSendLimit).toBe(DEFAULT_MAILBOX_MINUTE_SEND_LIMIT);
    expect(mailboxAfterReservation.minuteSendCount).toBe(1);
    expect(mailboxAfterReservation.minuteWindowStartedAt).toBe(Date.now());
  });

  it("increments the daily counter on success without double-counting the reserved minute slot", async () => {
    const { t, fixture } = await createSendFixture(true);
    const staleDay = Date.now() - DAY;

    await t.run(async (ctx) => {
      await ctx.db.patch(fixture.mailboxId, {
        todaySendCount: 5,
        todayResetAt: staleDay,
      });
    });

    const preSend = await t.mutation(internal.outreach.sendEngine.checkPreSend, {
      enrollmentId: fixture.enrollmentId,
    });
    expect(preSend.canSend).toBe(true);

    await t.mutation(internal.outreach.sendEngine.recordSendResult, {
      enrollmentId: fixture.enrollmentId,
      sequenceId: fixture.sequenceId,
      contactId: fixture.contactId,
      organizationId: fixture.organizationId,
      step: 0,
      mailboxId: fixture.mailboxId,
      success: true,
      gmailThreadId: "thread-123",
    });

    const mailboxAfterSuccess = await t.run(async (ctx) => ctx.db.get(fixture.mailboxId));
    expect(mailboxAfterSuccess).not.toBeNull();
    if (mailboxAfterSuccess === null) throw new Error("mailboxAfterSuccess is null");
    expect(mailboxAfterSuccess.todaySendCount).toBe(1);
    expect(mailboxAfterSuccess.minuteSendCount).toBe(1);
    expect(mailboxAfterSuccess.minuteSendLimit).toBe(DEFAULT_MAILBOX_MINUTE_SEND_LIMIT);

    const enrollmentAfterSuccess = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(enrollmentAfterSuccess).not.toBeNull();
    if (enrollmentAfterSuccess === null) throw new Error("enrollmentAfterSuccess is null");
    expect(enrollmentAfterSuccess.status).toBe("completed");
    expect(enrollmentAfterSuccess.gmailThreadIds).toEqual(["thread-123"]);
    expect(enrollmentAfterSuccess.currentStep).toBe(1);

    const sequenceAfterSuccess = await t.run(async (ctx) => ctx.db.get(fixture.sequenceId));
    expect(sequenceAfterSuccess).not.toBeNull();
    if (sequenceAfterSuccess === null) throw new Error("sequenceAfterSuccess is null");
    expect(sequenceAfterSuccess.stats?.sent).toBe(1);

    const events = await t.run(async (ctx) =>
      ctx.db
        .query("outreachEvents")
        .withIndex("by_enrollment", (q) => q.eq("enrollmentId", fixture.enrollmentId))
        .collect(),
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("sent");
  });
});
