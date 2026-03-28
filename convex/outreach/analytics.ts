/**
 * Outreach Analytics — Dashboard queries for sequence performance
 */

import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { authenticatedQuery } from "../customFunctions";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { notFound } from "../lib/errors";
import { getMailboxRateLimitSnapshot } from "./mailboxRateLimits";

const MAX_SEQUENCE_FUNNEL_EVENTS = 2000;
const CONTACT_ANALYTICS_CONTACT_LIMIT = 250;
const CONTACT_ANALYTICS_ENROLLMENT_LIMIT = 750;
const CONTACT_ANALYTICS_EVENT_LIMIT = 500;
const CONTACT_ANALYTICS_ROW_LIMIT = 25;

type OutreachStats = {
  bounced: number;
  enrolled: number;
  opened: number;
  replied: number;
  sent: number;
  unsubscribed: number;
};

type ContactPerformanceRow = {
  bounced: number;
  clicked: number;
  company?: string;
  contactId: Id<"outreachContacts">;
  email: string;
  lastActivityAt?: number;
  lastActivityType?: Doc<"outreachEvents">["type"];
  latestEnrollmentId?: Id<"outreachEnrollments">;
  latestSequenceId?: Id<"outreachSequences">;
  latestSequenceName?: string;
  latestStatus: Doc<"outreachEnrollments">["status"];
  liveEnrollmentCount: number;
  name: string;
  openRate: number;
  opened: number;
  replied: number;
  replyRate: number;
  sent: number;
  totalEnrollmentCount: number;
  unsubscribed: number;
};

type ContactPerformanceSnapshot = {
  coverage: {
    contactLimit: number;
    enrollmentLimit: number;
    isPartial: boolean;
    recentEventLimit: number;
  };
  rows: ContactPerformanceRow[];
};

type RecentContactActivity = {
  bounced: number;
  clicked: number;
  lastActivityAt?: number;
  lastActivityType?: Doc<"outreachEvents">["type"];
  latestEnrollmentId?: Id<"outreachEnrollments">;
  latestSequenceId?: Id<"outreachSequences">;
  opened: number;
  replied: number;
  sent: number;
  unsubscribed: number;
};

// =============================================================================
// Sequence-Level Analytics
// =============================================================================

/** Get stats for a single sequence (uses cached stats) */
export const getSequenceStats = authenticatedQuery({
  args: { sequenceId: v.id("outreachSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    const user = await ctx.db.get(ctx.userId);
    if (sequence.organizationId !== user?.defaultOrganizationId)
      throw notFound("sequence", args.sequenceId);

    return {
      name: sequence.name,
      status: sequence.status,
      stats: sequence.stats ?? {
        enrolled: 0,
        sent: 0,
        opened: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0,
      },
      rates: calculateRates(sequence.stats),
    };
  },
});

/** Get per-step funnel for a sequence (how many contacts reach each step) */
export const getSequenceFunnel = authenticatedQuery({
  args: { sequenceId: v.id("outreachSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw notFound("sequence", args.sequenceId);

    const user = await ctx.db.get(ctx.userId);
    if (sequence.organizationId !== user?.defaultOrganizationId)
      throw notFound("sequence", args.sequenceId);

    const events = await ctx.db
      .query("outreachEvents")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .take(MAX_SEQUENCE_FUNNEL_EVENTS);

    const funnel = sequence.steps.map((step, index) => {
      const stepEvents = events.filter((e) => e.step === index);
      return {
        step: index,
        subject: step.subject,
        delayDays: step.delayDays,
        sent: stepEvents.filter((e) => e.type === "sent").length,
        opened: stepEvents.filter((e) => e.type === "opened").length,
        clicked: stepEvents.filter((e) => e.type === "clicked").length,
        replied: stepEvents.filter((e) => e.type === "replied").length,
        bounced: stepEvents.filter((e) => e.type === "bounced").length,
        unsubscribed: stepEvents.filter((e) => e.type === "unsubscribed").length,
      };
    });

    return funnel;
  },
});

/** Get enrollment timeline for a specific contact (all events in order) */
export const getContactTimeline = authenticatedQuery({
  args: { enrollmentId: v.id("outreachEnrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) throw notFound("enrollment", args.enrollmentId);

    const user = await ctx.db.get(ctx.userId);
    if (enrollment.organizationId !== user?.defaultOrganizationId)
      throw notFound("enrollment", args.enrollmentId);

    const events = await ctx.db
      .query("outreachEvents")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", args.enrollmentId))
      .take(BOUNDED_LIST_LIMIT);

    // Sort chronologically
    events.sort((a, b) => a.createdAt - b.createdAt);

    return {
      enrollment,
      events,
    };
  },
});

// =============================================================================
// Organization-Level Analytics
// =============================================================================

/** Get overview stats across all sequences in the organization */
export const getOrganizationOverview = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    const orgId = user?.defaultOrganizationId;
    if (!orgId) return null;

    const sequences = await ctx.db
      .query("outreachSequences")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .take(BOUNDED_LIST_LIMIT);

    const totals = {
      sequences: sequences.length,
      active: sequences.filter((s) => s.status === "active").length,
      enrolled: 0,
      sent: 0,
      opened: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
    };

    for (const seq of sequences) {
      if (seq.stats) {
        totals.enrolled += seq.stats.enrolled;
        totals.sent += seq.stats.sent;
        totals.opened += seq.stats.opened;
        totals.replied += seq.stats.replied;
        totals.bounced += seq.stats.bounced;
        totals.unsubscribed += seq.stats.unsubscribed;
      }
    }

    return {
      ...totals,
      rates: calculateRates({
        enrolled: totals.enrolled,
        sent: totals.sent,
        opened: totals.opened,
        replied: totals.replied,
        bounced: totals.bounced,
        unsubscribed: totals.unsubscribed,
      }),
    };
  },
});

/** Get top contact-level engagement analytics across the organization. */
export const getContactPerformance = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    const orgId = user?.defaultOrganizationId;
    if (!orgId) {
      return {
        coverage: {
          contactLimit: CONTACT_ANALYTICS_CONTACT_LIMIT,
          enrollmentLimit: CONTACT_ANALYTICS_ENROLLMENT_LIMIT,
          isPartial: false,
          recentEventLimit: CONTACT_ANALYTICS_EVENT_LIMIT,
        },
        rows: [],
      };
    }

    const [contactBatch, enrollmentBatch, recentEventBatch, sequences] = await Promise.all([
      ctx.db
        .query("outreachContacts")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .take(CONTACT_ANALYTICS_CONTACT_LIMIT + 1),
      ctx.db
        .query("outreachEnrollments")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .take(CONTACT_ANALYTICS_ENROLLMENT_LIMIT + 1),
      ctx.db
        .query("outreachEvents")
        .withIndex("by_organization_and_created_at", (q) => q.eq("organizationId", orgId))
        .order("desc")
        .take(CONTACT_ANALYTICS_EVENT_LIMIT + 1),
      ctx.db
        .query("outreachSequences")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .take(BOUNDED_LIST_LIMIT),
    ]);

    return buildContactPerformanceSnapshot({
      contacts: contactBatch.slice(0, CONTACT_ANALYTICS_CONTACT_LIMIT),
      contactWindowTruncated: contactBatch.length > CONTACT_ANALYTICS_CONTACT_LIMIT,
      enrollments: enrollmentBatch.slice(0, CONTACT_ANALYTICS_ENROLLMENT_LIMIT),
      enrollmentWindowTruncated: enrollmentBatch.length > CONTACT_ANALYTICS_ENROLLMENT_LIMIT,
      recentEvents: recentEventBatch.slice(0, CONTACT_ANALYTICS_EVENT_LIMIT),
      recentEventWindowTruncated: recentEventBatch.length > CONTACT_ANALYTICS_EVENT_LIMIT,
      sequences,
    });
  },
});

/** Get mailbox health (send counts and remaining capacity across daily and minute windows) */
export const getMailboxHealth = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const mailboxes = await ctx.db
      .query("outreachMailboxes")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(BOUNDED_LIST_LIMIT);

    return mailboxes.map((m) => {
      const rateLimits = getMailboxRateLimitSnapshot(m);

      return {
        id: m._id,
        email: m.email,
        provider: m.provider,
        isActive: m.isActive,
        dailyLimit: m.dailySendLimit,
        minuteLimit: rateLimits.minuteSendLimit,
        todaySent: rateLimits.todaySendCount,
        minuteSent: rateLimits.minuteSendCount,
        remaining: Math.max(0, m.dailySendLimit - rateLimits.todaySendCount),
        minuteRemaining: Math.max(0, rateLimits.minuteSendLimit - rateLimits.minuteSendCount),
      };
    });
  },
});

// =============================================================================
// Helpers
// =============================================================================

/** Calculate sequence-level percentage rates from aggregate outreach stats. */
export function calculateRates(stats: OutreachStats | null | undefined): {
  bounceRate: number;
  openRate: number;
  replyRate: number;
  unsubscribeRate: number;
} {
  if (!stats || stats.sent === 0) {
    return { openRate: 0, replyRate: 0, bounceRate: 0, unsubscribeRate: 0 };
  }

  return {
    openRate: Math.round((stats.opened / stats.sent) * 1000) / 10,
    replyRate: Math.round((stats.replied / stats.sent) * 1000) / 10,
    bounceRate: Math.round((stats.bounced / stats.sent) * 1000) / 10,
    unsubscribeRate: Math.round((stats.unsubscribed / stats.sent) * 1000) / 10,
  };
}

/**
 * Build a bounded contact-engagement snapshot for the analytics UI.
 *
 * Coverage flags indicate whether the upstream contact, enrollment, or recent-event
 * windows were truncated before aggregation.
 */
export function buildContactPerformanceSnapshot({
  contacts,
  contactWindowTruncated,
  enrollments,
  enrollmentWindowTruncated,
  recentEvents,
  recentEventWindowTruncated,
  sequences,
}: {
  contacts: Doc<"outreachContacts">[];
  contactWindowTruncated: boolean;
  enrollments: Doc<"outreachEnrollments">[];
  enrollmentWindowTruncated: boolean;
  recentEvents: Doc<"outreachEvents">[];
  recentEventWindowTruncated: boolean;
  sequences: Doc<"outreachSequences">[];
}): ContactPerformanceSnapshot {
  const sequencesById = new Map(sequences.map((sequence) => [sequence._id, sequence]));
  const enrollmentsByContact = getEnrollmentsByContact(enrollments);
  const recentActivityByContact = getRecentActivityByContact(recentEvents);

  const rows = contacts
    .flatMap((contact): ContactPerformanceRow[] => {
      const row = buildContactPerformanceRow({
        contact,
        contactEnrollments: enrollmentsByContact.get(contact._id) ?? [],
        recentActivity: recentActivityByContact.get(contact._id),
        sequencesById,
      });
      return row ? [row] : [];
    })
    .sort((left, right) => {
      const scoreDifference = getContactEngagementScore(right) - getContactEngagementScore(left);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const activityDifference = (right.lastActivityAt ?? 0) - (left.lastActivityAt ?? 0);
      if (activityDifference !== 0) {
        return activityDifference;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, CONTACT_ANALYTICS_ROW_LIMIT);

  return {
    coverage: {
      contactLimit: CONTACT_ANALYTICS_CONTACT_LIMIT,
      enrollmentLimit: CONTACT_ANALYTICS_ENROLLMENT_LIMIT,
      isPartial: contactWindowTruncated || enrollmentWindowTruncated || recentEventWindowTruncated,
      recentEventLimit: CONTACT_ANALYTICS_EVENT_LIMIT,
    },
    rows,
  };
}

function getEnrollmentsByContact(
  enrollments: Doc<"outreachEnrollments">[],
): Map<Id<"outreachContacts">, Array<Doc<"outreachEnrollments">>> {
  const enrollmentsByContact = new Map<Id<"outreachContacts">, Array<Doc<"outreachEnrollments">>>();

  for (const enrollment of enrollments) {
    const existing = enrollmentsByContact.get(enrollment.contactId) ?? [];
    existing.push(enrollment);
    enrollmentsByContact.set(enrollment.contactId, existing);
  }

  return enrollmentsByContact;
}

function getRecentActivityByContact(
  recentEvents: Doc<"outreachEvents">[],
): Map<Id<"outreachContacts">, RecentContactActivity> {
  const recentActivityByContact = new Map<Id<"outreachContacts">, RecentContactActivity>();

  for (const event of recentEvents) {
    const current = recentActivityByContact.get(event.contactId) ?? createRecentContactActivity();
    incrementRecentActivityCount(current, event.type);

    if (!current.lastActivityAt || event.createdAt > current.lastActivityAt) {
      current.lastActivityAt = event.createdAt;
      current.lastActivityType = event.type;
      current.latestEnrollmentId = event.enrollmentId;
      current.latestSequenceId = event.sequenceId;
    }

    recentActivityByContact.set(event.contactId, current);
  }

  return recentActivityByContact;
}

function createRecentContactActivity(): RecentContactActivity {
  return {
    bounced: 0,
    clicked: 0,
    opened: 0,
    replied: 0,
    sent: 0,
    unsubscribed: 0,
  };
}

function incrementRecentActivityCount(
  activity: RecentContactActivity,
  eventType: Doc<"outreachEvents">["type"],
): void {
  switch (eventType) {
    case "sent":
      activity.sent += 1;
      return;
    case "opened":
      activity.opened += 1;
      return;
    case "clicked":
      activity.clicked += 1;
      return;
    case "replied":
      activity.replied += 1;
      return;
    case "bounced":
      activity.bounced += 1;
      return;
    case "unsubscribed":
      activity.unsubscribed += 1;
      return;
  }
}

function buildContactPerformanceRow({
  contact,
  contactEnrollments,
  recentActivity,
  sequencesById,
}: {
  contact: Doc<"outreachContacts">;
  contactEnrollments: Doc<"outreachEnrollments">[];
  recentActivity: RecentContactActivity | undefined;
  sequencesById: Map<Id<"outreachSequences">, Doc<"outreachSequences">>;
}): ContactPerformanceRow | null {
  if (contactEnrollments.length === 0 && !recentActivity) {
    return null;
  }

  const latestEnrollment = getLatestEnrollment(contactEnrollments);
  const latestContext = getLatestContactContext(latestEnrollment, recentActivity);
  const metrics = getRecentActivityMetrics(contactEnrollments.length, recentActivity);

  return {
    bounced: metrics.bounced,
    clicked: metrics.clicked,
    company: contact.company,
    contactId: contact._id,
    email: contact.email,
    lastActivityAt: latestContext.lastActivityAt,
    lastActivityType: latestContext.lastActivityType,
    latestEnrollmentId: latestContext.latestEnrollmentId,
    latestSequenceId: latestContext.latestSequenceId,
    latestSequenceName: latestContext.latestSequenceId
      ? sequencesById.get(latestContext.latestSequenceId)?.name
      : undefined,
    latestStatus:
      latestEnrollment?.status ??
      inferEnrollmentStatusFromEventType(latestContext.lastActivityType),
    liveEnrollmentCount: getLiveEnrollmentCount(contactEnrollments),
    name: getContactName(contact),
    openRate: metrics.openRate,
    opened: metrics.opened,
    replied: metrics.replied,
    replyRate: metrics.replyRate,
    sent: metrics.sent,
    totalEnrollmentCount: contactEnrollments.length,
    unsubscribed: metrics.unsubscribed,
  };
}

function getLatestContactContext(
  latestEnrollment: Doc<"outreachEnrollments"> | undefined,
  recentActivity: RecentContactActivity | undefined,
): {
  lastActivityAt?: number;
  lastActivityType?: Doc<"outreachEvents">["type"];
  latestEnrollmentId?: Id<"outreachEnrollments">;
  latestSequenceId?: Id<"outreachSequences">;
} {
  const latestEnrollmentActivityAt = latestEnrollment
    ? getEnrollmentActivityAt(latestEnrollment)
    : undefined;
  const useRecentEventContext =
    recentActivity?.lastActivityAt !== undefined &&
    (latestEnrollmentActivityAt === undefined ||
      recentActivity.lastActivityAt >= latestEnrollmentActivityAt);

  return {
    lastActivityAt: useRecentEventContext
      ? recentActivity?.lastActivityAt
      : latestEnrollmentActivityAt,
    lastActivityType: recentActivity?.lastActivityType,
    latestEnrollmentId: useRecentEventContext
      ? recentActivity?.latestEnrollmentId
      : latestEnrollment?._id,
    latestSequenceId: useRecentEventContext
      ? recentActivity?.latestSequenceId
      : latestEnrollment?.sequenceId,
  };
}

function getRecentActivityMetrics(
  enrollmentCount: number,
  recentActivity: RecentContactActivity | undefined,
): {
  bounced: number;
  clicked: number;
  openRate: number;
  opened: number;
  replied: number;
  replyRate: number;
  sent: number;
  unsubscribed: number;
} {
  const stats = {
    bounced: recentActivity?.bounced ?? 0,
    clicked: recentActivity?.clicked ?? 0,
    opened: recentActivity?.opened ?? 0,
    replied: recentActivity?.replied ?? 0,
    sent: recentActivity?.sent ?? 0,
    unsubscribed: recentActivity?.unsubscribed ?? 0,
  };
  const rates = calculateRates({
    bounced: stats.bounced,
    enrolled: enrollmentCount,
    opened: stats.opened,
    replied: stats.replied,
    sent: stats.sent,
    unsubscribed: stats.unsubscribed,
  });

  return {
    ...stats,
    openRate: rates.openRate,
    replyRate: rates.replyRate,
  };
}

function getContactName(contact: Doc<"outreachContacts">): string {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
  return fullName || contact.email;
}

function getEnrollmentActivityAt(enrollment: Doc<"outreachEnrollments">): number {
  return Math.max(
    enrollment.completedAt ?? 0,
    enrollment.enrolledAt,
    enrollment.lastClickedAt ?? 0,
    enrollment.lastOpenedAt ?? 0,
    enrollment.lastRepliedAt ?? 0,
    enrollment.lastSentAt ?? 0,
  );
}

function getLatestEnrollment(
  enrollments: Array<Doc<"outreachEnrollments">>,
): Doc<"outreachEnrollments"> | undefined {
  return enrollments.reduce<Doc<"outreachEnrollments"> | undefined>((latest, enrollment) => {
    if (!latest) {
      return enrollment;
    }

    return getEnrollmentActivityAt(enrollment) > getEnrollmentActivityAt(latest)
      ? enrollment
      : latest;
  }, undefined);
}

function getLiveEnrollmentCount(enrollments: Array<Doc<"outreachEnrollments">>): number {
  return enrollments.filter(
    (enrollment) => enrollment.status === "active" || enrollment.status === "paused",
  ).length;
}

function inferEnrollmentStatusFromEventType(
  eventType: Doc<"outreachEvents">["type"] | undefined,
): Doc<"outreachEnrollments">["status"] {
  switch (eventType) {
    case "replied":
      return "replied";
    case "bounced":
      return "bounced";
    case "unsubscribed":
      return "unsubscribed";
    default:
      return "active";
  }
}

function getContactEngagementScore(row: ContactPerformanceRow): number {
  return (
    row.replied * 100 +
    row.clicked * 35 +
    row.opened * 10 +
    row.sent * 2 +
    row.liveEnrollmentCount * 5 -
    row.bounced * 40 -
    row.unsubscribed * 50
  );
}
