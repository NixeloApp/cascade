import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import { DAY, MINUTE } from "../lib/timeUtils";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createOrganizationAdmin, createTestUser } from "../testUtils";

const originalFetch = global.fetch;

async function createMailboxFixture(expiresAt: number) {
  const t = convexTest(schema, modules);
  const userId = await createTestUser(t);
  const { organizationId } = await createOrganizationAdmin(t, userId);

  const mailboxId = await t.mutation(internal.outreach.mailboxes.createMailboxFromOAuth, {
    userId,
    organizationId,
    provider: "microsoft",
    email: "sender@example.com",
    displayName: "Sender",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt,
  });

  const contactId = await t.run(async (ctx) =>
    ctx.db.insert("outreachContacts", {
      organizationId,
      email: "lead@example.com",
      source: "manual",
      createdBy: userId,
      createdAt: Date.now(),
    }),
  );

  const sequenceId = await t.run(async (ctx) =>
    ctx.db.insert("outreachSequences", {
      organizationId,
      createdBy: userId,
      name: "Microsoft Sequence",
      status: "active",
      mailboxId,
      steps: [
        {
          order: 0,
          subject: "Hello",
          body: "<p>Hello</p>",
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
      nextSendAt: Date.now(),
      enrolledAt: Date.now(),
    }),
  );

  return { enrollmentId, mailboxId, t };
}

describe("outreach microsoft", () => {
  beforeEach(() => {
    process.env.AUTH_MICROSOFT_ID = "microsoft-client-id";
    process.env.AUTH_MICROSOFT_SECRET = "microsoft-client-secret";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.AUTH_MICROSOFT_ID;
    delete process.env.AUTH_MICROSOFT_SECRET;
    vi.restoreAllMocks();
  });

  it("sends via Microsoft Graph for an active mailbox", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    global.fetch = fetchMock;
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));

    const { t, mailboxId, enrollmentId } = await createMailboxFixture(Date.now() + DAY);

    const result = await t.action(internal.outreach.microsoft.sendViaMicrosoftAction, {
      mailboxId,
      enrollmentId,
      to: "lead@example.com",
      subject: "Hello there",
      body: "<p>Hello</p>",
      fromEmail: "sender@example.com",
      fromName: "Sender",
      trackingDomain: "track.nixelo.test",
    });

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/me/sendMail");

    const body =
      typeof fetchMock.mock.calls[0]?.[1]?.body === "string"
        ? JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
        : null;

    expect(body).toMatchObject({
      message: {
        subject: "Hello there",
        toRecipients: [{ emailAddress: { address: "lead@example.com" } }],
      },
      saveToSentItems: true,
    });
  });

  it("refreshes an expired Microsoft access token before sending", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    global.fetch = fetchMock;
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "refreshed-access-token",
            expires_in: 3600,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 202 }));

    const { t, mailboxId, enrollmentId } = await createMailboxFixture(Date.now() + 2 * MINUTE);

    const result = await t.action(internal.outreach.microsoft.sendViaMicrosoftAction, {
      mailboxId,
      enrollmentId,
      to: "lead@example.com",
      subject: "Refreshed send",
      body: "<p>Hello again</p>",
      fromEmail: "sender@example.com",
      fromName: "Sender",
      trackingDomain: "track.nixelo.test",
    });

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/oauth2/v2.0/token");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/me/sendMail");
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer refreshed-access-token",
    });

    const rawMailbox = await t.run(async (ctx) => ctx.db.get(mailboxId));
    expect(rawMailbox).not.toBeNull();
    if (rawMailbox === null) throw new Error("rawMailbox is null");
    expect(rawMailbox.accessToken).not.toBe("refreshed-access-token");
    expect(rawMailbox.expiresAt).toBeGreaterThan(Date.now());
  });
});
