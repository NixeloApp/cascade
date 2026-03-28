import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import { DAY } from "../lib/timeUtils";
import {
  buildMailboxDeliverabilityMetrics,
  evaluateMailboxDeliverability,
  getMailboxWarmupStage,
} from "./deliverability";

const MAILBOX_ID = "mailbox_1" as Id<"outreachMailboxes">;
const ORGANIZATION_ID = "org_1" as Id<"organizations">;
const SEQUENCE_ID = "sequence_1" as Id<"outreachSequences">;
const ENROLLMENT_ID = "enrollment_1" as Id<"outreachEnrollments">;
const CONTACT_ID = "contact_1" as Id<"outreachContacts">;
const NOW = new Date("2026-03-28T12:00:00.000Z").getTime();

function buildMailbox(createdAtOffsetDays: number, dailySendLimit: number) {
  return {
    _creationTime: NOW - createdAtOffsetDays * DAY,
    _id: MAILBOX_ID,
    dailySendLimit,
  };
}

function buildEvent(
  type: "sent" | "opened" | "clicked" | "replied" | "bounced" | "unsubscribed",
  createdAt: number,
) {
  return {
    _creationTime: createdAt,
    _id: `${type}-${createdAt}` as Id<"outreachEvents">,
    contactId: CONTACT_ID,
    createdAt,
    enrollmentId: ENROLLMENT_ID,
    metadata: {},
    organizationId: ORGANIZATION_ID,
    sequenceId: SEQUENCE_ID,
    step: 0,
    trackingLinkId: undefined,
    type,
  };
}

describe("outreach deliverability", () => {
  it("assigns warmup stages from mailbox age", () => {
    expect(getMailboxWarmupStage(NOW - DAY, NOW)).toMatchObject({
      ageDays: 2,
      label: "Days 1-3",
      recommendedDailyLimit: 15,
    });
    expect(getMailboxWarmupStage(NOW - 20 * DAY, NOW)).toMatchObject({
      ageDays: 21,
      label: "Days 15-30",
      recommendedDailyLimit: 60,
    });
    expect(getMailboxWarmupStage(NOW - 45 * DAY, NOW)).toMatchObject({
      ageDays: 46,
      label: "Day 31+",
      recommendedDailyLimit: 100,
    });
  });

  it("reduces the effective cap for new mailboxes even when the configured ceiling is higher", () => {
    const snapshot = evaluateMailboxDeliverability(
      buildMailbox(0, 80),
      buildMailboxDeliverabilityMetrics([], false),
      NOW,
    );

    expect(snapshot.deliverabilityStatus).toBe("healthy");
    expect(snapshot.effectiveDailyLimit).toBe(15);
    expect(snapshot.hasCapacityOverride).toBe(true);
    expect(snapshot.warmupStage.label).toBe("Days 1-3");
    expect(snapshot.guidance[0]).toMatch(/no outreach sends were recorded/i);
  });

  it("drops to at-risk when recent bounce activity is too high", () => {
    const events = [
      ...Array.from({ length: 20 }, (_, index) => buildEvent("sent", NOW - index * 1_000)),
      buildEvent("bounced", NOW - 100),
      buildEvent("bounced", NOW - 200),
    ];
    const snapshot = evaluateMailboxDeliverability(
      buildMailbox(20, 60),
      buildMailboxDeliverabilityMetrics(events, false),
      NOW,
    );

    expect(snapshot.deliverabilityStatus).toBe("at_risk");
    expect(snapshot.effectiveDailyLimit).toBe(30);
    expect(snapshot.summary).toMatch(/too high for safe volume growth/i);
    expect(snapshot.guidance.join(" ")).toMatch(/bounce rate is 10\.0%/i);
  });

  it("marks the mailbox as watch when reply rate is weak across a real sample", () => {
    const events = Array.from({ length: 12 }, (_, index) =>
      buildEvent("sent", NOW - index * 1_000),
    );
    const snapshot = evaluateMailboxDeliverability(
      buildMailbox(10, 40),
      buildMailboxDeliverabilityMetrics(events, false),
      NOW,
    );

    expect(snapshot.deliverabilityStatus).toBe("watch");
    expect(snapshot.effectiveDailyLimit).toBe(30);
    expect(snapshot.guidance.join(" ")).toMatch(/reply rate is 0\.0%/i);
  });
});
