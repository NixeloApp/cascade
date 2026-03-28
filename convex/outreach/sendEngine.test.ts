import { convexTest, type TestConvex } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { DAY } from "../lib/timeUtils";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";
import { MAILBOX_SEND_WINDOW_MS } from "./mailboxRateLimits";

type ConvexTestInstance = TestConvex<typeof schema>;

type SendFixture = {
  userId: Id<"users">;
  organizationId: Id<"organizations">;
  mailboxId: Id<"outreachMailboxes">;
  sequenceId: Id<"outreachSequences">;
  contactId: Id<"outreachContacts">;
  enrollmentId: Id<"outreachEnrollments">;
};

type SendFixtureOptions = {
  contactEmail?: string;
  firstName?: string;
  company?: string;
  customFields?: Record<string, string>;
  provider?: "google" | "microsoft";
  subject?: string;
  body?: string;
};

const originalFetch = global.fetch;

function decodeBase64UrlUtf8(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4 || 4)) % 4;
  return Buffer.from(normalized + "=".repeat(padding), "base64").toString("utf8");
}

function extractSentRawMessage(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>): string {
  const sendCall = fetchMock.mock.calls.find(([input]) => String(input).includes("/messages/send"));
  if (!sendCall) throw new Error("No Gmail send request recorded");

  const [, init] = sendCall;
  if (typeof init?.body !== "string") throw new Error("Expected JSON request body");

  const parsed = JSON.parse(init.body) as { raw?: string };
  if (!parsed.raw) throw new Error("Expected Gmail raw message payload");

  return decodeBase64UrlUtf8(parsed.raw);
}

async function createSendFixture(
  options: SendFixtureOptions = {},
): Promise<{ t: ConvexTestInstance; fixture: SendFixture }> {
  const t = convexTest(schema, modules);
  const userId = await createTestUser(t);
  const { organizationId } = await createOrganizationAdmin(t, userId);

  const mailboxId = await t.mutation(internal.outreach.mailboxes.createMailboxFromOAuth, {
    userId,
    organizationId,
    provider: options.provider ?? "google",
    email: "sender@example.com",
    displayName: "Sender",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + DAY,
  });

  const contactId = await t.run(async (ctx) =>
    ctx.db.insert("outreachContacts", {
      organizationId,
      email: options.contactEmail ?? "lead@example.com",
      firstName: options.firstName ?? "Jamie",
      company: options.company ?? "Acme",
      customFields: options.customFields,
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
          subject: options.subject ?? "Hi {{firstName}}",
          body: options.body ?? "<p>Hello {{firstName}}</p>",
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
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T15:00:00.000Z"));
    fetchMock = vi.fn<typeof fetch>();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
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

  it("resets expired mailbox rate-limit windows before reserving the next send", async () => {
    const { t, fixture } = await createSendFixture();
    const staleDay = Date.now() - 2 * DAY;

    await t.run(async (ctx) => {
      await ctx.db.patch(fixture.mailboxId, {
        todaySendCount: 9,
        todayResetAt: staleDay,
        minuteSendLimit: 4,
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
    expect(mailboxAfterReservation.minuteSendLimit).toBe(4);
    expect(mailboxAfterReservation.minuteSendCount).toBe(1);
    expect(mailboxAfterReservation.minuteWindowStartedAt).toBe(Date.now());
  });

  it("renders templates, rewrites tracking links, injects compliance markup, and advances the enrollment on a successful send", async () => {
    const { t, fixture } = await createSendFixture({
      subject: "Hi {{firstName}} from {{company}}",
      body: [
        "<p>Hello {{firstName}} from {{company}} as {{role}}.</p>",
        '<a href="https://acme.test/demo">Book demo</a>',
        '<a href="mailto:jamie@example.com">Email me</a>',
        '<a href="https://acme.test/pricing">View pricing</a>',
      ].join(""),
      customFields: { role: "Founder" },
    });

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "gmail-message-1", threadId: "thread-123" }), {
        status: 200,
      }),
    );

    const result = await t.action(internal.outreach.sendEngine.processDueEnrollments, {});
    expect(result).toEqual({ processed: 1, skipped: 0 });

    const sentRawMessage = extractSentRawMessage(fetchMock);
    expect(sentRawMessage).toContain("Subject: Hi Jamie from Acme");
    expect(sentRawMessage).toContain("Hello Jamie from Acme as Founder.");
    expect(sentRawMessage).not.toContain("{{role}}");
    expect(sentRawMessage).toContain('href="mailto:jamie@example.com"');
    expect(sentRawMessage).toContain(
      `List-Unsubscribe: <https://track.nixelo.test/t/u/${fixture.enrollmentId}>`,
    );

    const trackingLinks = await t.run(async (ctx) =>
      ctx.db
        .query("outreachTrackingLinks")
        .withIndex("by_enrollment", (q) => q.eq("enrollmentId", fixture.enrollmentId))
        .collect(),
    );
    expect(trackingLinks).toHaveLength(2);
    expect(trackingLinks.map((link) => link.originalUrl).sort()).toEqual([
      "https://acme.test/demo",
      "https://acme.test/pricing",
    ]);

    const demoLink = trackingLinks.find((link) => link.originalUrl === "https://acme.test/demo");
    const pricingLink = trackingLinks.find(
      (link) => link.originalUrl === "https://acme.test/pricing",
    );
    if (!demoLink || !pricingLink) throw new Error("tracking links missing");

    expect(sentRawMessage).toContain(`href="https://track.nixelo.test/t/c/${demoLink._id}"`);
    expect(sentRawMessage).toContain(`href="https://track.nixelo.test/t/c/${pricingLink._id}"`);
    expect(sentRawMessage).toContain(`https://track.nixelo.test/t/u/${fixture.enrollmentId}`);
    expect(sentRawMessage).toContain(`https://track.nixelo.test/t/o/${fixture.enrollmentId}`);
    expect(sentRawMessage.indexOf(`/t/u/${fixture.enrollmentId}`)).toBeLessThan(
      sentRawMessage.indexOf(`/t/o/${fixture.enrollmentId}`),
    );

    const mailboxAfterSuccess = await t.run(async (ctx) => ctx.db.get(fixture.mailboxId));
    expect(mailboxAfterSuccess).not.toBeNull();
    if (mailboxAfterSuccess === null) throw new Error("mailboxAfterSuccess is null");
    expect(mailboxAfterSuccess.todaySendCount).toBe(1);
    expect(mailboxAfterSuccess.minuteSendCount).toBe(1);

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

  it("routes Microsoft-connected sequences through Graph sendMail and still advances the enrollment", async () => {
    const { t, fixture } = await createSendFixture({
      provider: "microsoft",
      subject: "Hello {{firstName}}",
      body: "<p>Hi {{firstName}}</p>",
    });

    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));

    const result = await t.action(internal.outreach.sendEngine.processDueEnrollments, {});
    expect(result).toEqual({ processed: 1, skipped: 0 });

    const sendCall = fetchMock.mock.calls.find(([input]) => String(input).includes("/me/sendMail"));
    if (!sendCall) throw new Error("Expected Microsoft Graph sendMail request");

    const [, init] = sendCall;
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer access-token",
      "Content-Type": "application/json",
    });

    const parsedBody =
      typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
    expect(parsedBody).not.toBeNull();
    expect(parsedBody).toMatchObject({
      message: {
        body: {
          contentType: "HTML",
        },
        subject: "Hello Jamie",
      },
      saveToSentItems: true,
    });
    expect(JSON.stringify(parsedBody)).toContain(`track.nixelo.test/t/u/${fixture.enrollmentId}`);

    const enrollmentAfterSuccess = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(enrollmentAfterSuccess).not.toBeNull();
    if (enrollmentAfterSuccess === null) throw new Error("enrollmentAfterSuccess is null");
    expect(enrollmentAfterSuccess.status).toBe("completed");
    expect(enrollmentAfterSuccess.gmailThreadIds).toBeUndefined();
  });

  it("auto-stops suppressed contacts during pre-send validation without attempting a mailbox send", async () => {
    const { t, fixture } = await createSendFixture();

    await t.run(async (ctx) => {
      await ctx.db.insert("outreachSuppressions", {
        organizationId: fixture.organizationId,
        email: "lead@example.com",
        reason: "manual",
        suppressedAt: Date.now(),
      });
    });

    fetchMock.mockImplementation(async () => {
      throw new Error("send should not be attempted for suppressed contacts");
    });

    const result = await t.action(internal.outreach.sendEngine.processDueEnrollments, {});
    expect(result).toEqual({ processed: 0, skipped: 1 });
    expect(fetchMock).not.toHaveBeenCalled();

    const enrollmentAfterSuppression = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(enrollmentAfterSuppression).not.toBeNull();
    if (enrollmentAfterSuppression === null) {
      throw new Error("enrollmentAfterSuppression is null");
    }
    expect(enrollmentAfterSuppression.status).toBe("unsubscribed");
    expect(enrollmentAfterSuppression.completedAt).toBe(Date.now());
    expect(enrollmentAfterSuppression.nextSendAt).toBeUndefined();

    const trackingLinks = await t.run(async (ctx) =>
      ctx.db
        .query("outreachTrackingLinks")
        .withIndex("by_enrollment", (q) => q.eq("enrollmentId", fixture.enrollmentId))
        .collect(),
    );
    expect(trackingLinks).toHaveLength(0);
  });

  it("suppresses contacts and records bounce metadata when Gmail rejects a send as a hard bounce", async () => {
    const { t, fixture } = await createSendFixture();
    const staleDay = Date.now() - DAY;

    await t.run(async (ctx) => {
      await ctx.db.patch(fixture.mailboxId, {
        todaySendCount: 5,
        todayResetAt: staleDay,
      });
    });

    fetchMock.mockResolvedValue(new Response("550 5.1.1 User not found", { status: 400 }));

    const result = await t.action(internal.outreach.sendEngine.processDueEnrollments, {});
    expect(result).toEqual({ processed: 0, skipped: 1 });

    const mailboxAfterFailure = await t.run(async (ctx) => ctx.db.get(fixture.mailboxId));
    expect(mailboxAfterFailure).not.toBeNull();
    if (mailboxAfterFailure === null) throw new Error("mailboxAfterFailure is null");
    expect(mailboxAfterFailure.todaySendCount).toBe(0);
    expect(mailboxAfterFailure.minuteSendCount).toBe(1);

    const enrollmentAfterFailure = await t.run(async (ctx) => ctx.db.get(fixture.enrollmentId));
    expect(enrollmentAfterFailure).not.toBeNull();
    if (enrollmentAfterFailure === null) throw new Error("enrollmentAfterFailure is null");
    expect(enrollmentAfterFailure.status).toBe("bounced");
    expect(enrollmentAfterFailure.completedAt).toBe(Date.now());
    expect(enrollmentAfterFailure.nextSendAt).toBeUndefined();

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

    const sequenceAfterFailure = await t.run(async (ctx) => ctx.db.get(fixture.sequenceId));
    expect(sequenceAfterFailure).not.toBeNull();
    if (sequenceAfterFailure === null) throw new Error("sequenceAfterFailure is null");
    expect(sequenceAfterFailure.stats?.bounced).toBe(1);

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
    });
    expect(events[0].metadata?.replyContent).toContain("550 5.1.1 User not found");
  });
});
