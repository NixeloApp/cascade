import { describe, expect, it, vi } from "vitest";
import type { Id } from "../_generated/dataModel";
import { buildContactPerformanceSnapshot, calculateRates } from "./analytics";

vi.mock("../lib/boundedQueries", () => ({
  BOUNDED_LIST_LIMIT: 100,
}));

describe("outreach analytics", () => {
  describe("module exports", () => {
    it("exports all analytics queries", async () => {
      const mod = await import("./analytics");
      expect(typeof mod.getContactPerformance).toBe("function");
      expect(typeof mod.getSequenceStats).toBe("function");
      expect(typeof mod.getSequenceFunnel).toBe("function");
      expect(typeof mod.getContactTimeline).toBe("function");
      expect(typeof mod.getOrganizationOverview).toBe("function");
      expect(typeof mod.getMailboxHealth).toBe("function");
    });
  });

  describe("calculateRates", () => {
    it("returns zero rates when there are no sends", () => {
      expect(
        calculateRates({
          bounced: 0,
          enrolled: 3,
          opened: 0,
          replied: 0,
          sent: 0,
          unsubscribed: 0,
        }),
      ).toEqual({
        bounceRate: 0,
        openRate: 0,
        replyRate: 0,
        unsubscribeRate: 0,
      });
    });

    it("rounds percentage rates to a single decimal place", () => {
      expect(
        calculateRates({
          bounced: 1,
          enrolled: 4,
          opened: 2,
          replied: 1,
          sent: 3,
          unsubscribed: 0,
        }),
      ).toEqual({
        bounceRate: 33.3,
        openRate: 66.7,
        replyRate: 33.3,
        unsubscribeRate: 0,
      });
    });
  });

  describe("buildContactPerformanceSnapshot", () => {
    const organizationId = "org_1" as Id<"organizations">;
    const createdBy = "user_1" as Id<"users">;
    const sequenceAId = "sequence_a" as Id<"outreachSequences">;
    const sequenceBId = "sequence_b" as Id<"outreachSequences">;
    const contactAId = "contact_a" as Id<"outreachContacts">;
    const contactBId = "contact_b" as Id<"outreachContacts">;
    const enrollmentAId = "enrollment_a" as Id<"outreachEnrollments">;
    const enrollmentBId = "enrollment_b" as Id<"outreachEnrollments">;

    const sequences = [
      {
        _creationTime: 1,
        _id: sequenceAId,
        createdAt: 100,
        createdBy,
        mailboxId: "mailbox_1" as Id<"outreachMailboxes">,
        name: "Founder follow-up",
        organizationId,
        physicalAddress: "123 Main St, Chicago, IL 60601",
        stats: { bounced: 0, enrolled: 1, opened: 2, replied: 1, sent: 3, unsubscribed: 0 },
        status: "active" as const,
        steps: [{ body: "Hi", delayDays: 0, order: 0, subject: "Intro" }],
        trackingDomain: undefined,
        updatedAt: 100,
      },
      {
        _creationTime: 2,
        _id: sequenceBId,
        createdAt: 120,
        createdBy,
        mailboxId: "mailbox_2" as Id<"outreachMailboxes">,
        name: "Reactivation",
        organizationId,
        physicalAddress: "123 Main St, Chicago, IL 60601",
        stats: { bounced: 0, enrolled: 1, opened: 1, replied: 0, sent: 2, unsubscribed: 0 },
        status: "paused" as const,
        steps: [{ body: "Checking in", delayDays: 0, order: 0, subject: "Still interested?" }],
        trackingDomain: undefined,
        updatedAt: 120,
      },
    ];

    const contacts = [
      {
        _creationTime: 1,
        _id: contactAId,
        company: "Acme",
        createdAt: 100,
        createdBy,
        customFields: undefined,
        email: "alex@example.com",
        firstName: "Alex",
        lastName: "Stone",
        organizationId,
        source: "manual" as const,
        tags: ["vip"],
        timezone: undefined,
      },
      {
        _creationTime: 2,
        _id: contactBId,
        company: "Beta",
        createdAt: 101,
        createdBy,
        customFields: undefined,
        email: "jamie@example.com",
        firstName: "Jamie",
        lastName: "Cole",
        organizationId,
        source: "csv_import" as const,
        tags: [],
        timezone: undefined,
      },
    ];

    const enrollments = [
      {
        _creationTime: 1,
        _id: enrollmentAId,
        completedAt: undefined,
        contactId: contactAId,
        currentStep: 0,
        enrolledAt: 1000,
        gmailThreadIds: undefined,
        lastClickedAt: 1310,
        lastOpenedAt: 1300,
        lastRepliedAt: 1320,
        lastSentAt: 1200,
        nextSendAt: undefined,
        organizationId,
        sequenceId: sequenceAId,
        status: "replied" as const,
      },
      {
        _creationTime: 2,
        _id: enrollmentBId,
        completedAt: undefined,
        contactId: contactBId,
        currentStep: 0,
        enrolledAt: 1100,
        gmailThreadIds: undefined,
        lastClickedAt: undefined,
        lastOpenedAt: 1400,
        lastRepliedAt: undefined,
        lastSentAt: 1350,
        nextSendAt: 1500,
        organizationId,
        sequenceId: sequenceBId,
        status: "active" as const,
      },
    ];

    const recentEvents = [
      {
        _creationTime: 1,
        _id: "event_1" as Id<"outreachEvents">,
        contactId: contactAId,
        createdAt: 1200,
        enrollmentId: enrollmentAId,
        metadata: {},
        organizationId,
        sequenceId: sequenceAId,
        step: 0,
        trackingLinkId: undefined,
        type: "sent" as const,
      },
      {
        _creationTime: 2,
        _id: "event_2" as Id<"outreachEvents">,
        contactId: contactAId,
        createdAt: 1300,
        enrollmentId: enrollmentAId,
        metadata: {},
        organizationId,
        sequenceId: sequenceAId,
        step: 0,
        trackingLinkId: undefined,
        type: "opened" as const,
      },
      {
        _creationTime: 3,
        _id: "event_3" as Id<"outreachEvents">,
        contactId: contactAId,
        createdAt: 1320,
        enrollmentId: enrollmentAId,
        metadata: { replyContent: "Sounds good" },
        organizationId,
        sequenceId: sequenceAId,
        step: 0,
        trackingLinkId: undefined,
        type: "replied" as const,
      },
      {
        _creationTime: 4,
        _id: "event_4" as Id<"outreachEvents">,
        contactId: contactBId,
        createdAt: 1350,
        enrollmentId: enrollmentBId,
        metadata: {},
        organizationId,
        sequenceId: sequenceBId,
        step: 0,
        trackingLinkId: undefined,
        type: "sent" as const,
      },
      {
        _creationTime: 5,
        _id: "event_5" as Id<"outreachEvents">,
        contactId: contactBId,
        createdAt: 1400,
        enrollmentId: enrollmentBId,
        metadata: {},
        organizationId,
        sequenceId: sequenceBId,
        step: 0,
        trackingLinkId: undefined,
        type: "opened" as const,
      },
    ];

    it("ranks contacts by engagement and exposes sequence drilldown context", () => {
      const snapshot = buildContactPerformanceSnapshot({
        contacts,
        contactWindowTruncated: false,
        enrollments,
        enrollmentWindowTruncated: false,
        recentEvents,
        recentEventWindowTruncated: false,
        sequences,
      });

      expect(snapshot.coverage.isPartial).toBe(false);
      expect(snapshot.rows).toHaveLength(2);
      expect(snapshot.rows[0]).toMatchObject({
        company: "Acme",
        contactId: contactAId,
        email: "alex@example.com",
        latestEnrollmentId: enrollmentAId,
        latestSequenceId: sequenceAId,
        latestSequenceName: "Founder follow-up",
        latestStatus: "replied",
        liveEnrollmentCount: 0,
        name: "Alex Stone",
        openRate: 100,
        opened: 1,
        replied: 1,
        replyRate: 100,
        sent: 1,
        totalEnrollmentCount: 1,
      });
      expect(snapshot.rows[1]).toMatchObject({
        contactId: contactBId,
        latestStatus: "active",
        latestSequenceName: "Reactivation",
        liveEnrollmentCount: 1,
        opened: 1,
        replyRate: 0,
        sent: 1,
      });
    });

    it("marks coverage as partial when any bounded window truncates", () => {
      const snapshot = buildContactPerformanceSnapshot({
        contacts,
        contactWindowTruncated: true,
        enrollments,
        enrollmentWindowTruncated: false,
        recentEvents,
        recentEventWindowTruncated: true,
        sequences,
      });

      expect(snapshot.coverage).toMatchObject({
        contactLimit: 250,
        enrollmentLimit: 750,
        isPartial: true,
        recentEventLimit: 500,
      });
    });
  });
});
