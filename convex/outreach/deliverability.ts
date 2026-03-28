import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { DAY } from "../lib/timeUtils";

export const OUTREACH_DELIVERABILITY_LOOKBACK_DAYS = 14;
export const OUTREACH_DELIVERABILITY_LOOKBACK_MS = OUTREACH_DELIVERABILITY_LOOKBACK_DAYS * DAY;
export const OUTREACH_DELIVERABILITY_EVENT_LIMIT = 1_000;

const MIN_SAMPLES_FOR_DELIVERABILITY_SCORING = 10;
const LOW_RISK_REPLY_RATE = 2;
const MEDIUM_RISK_REPLY_RATE = 1;
const HIGH_RISK_BOUNCE_RATE = 5;
const MEDIUM_RISK_BOUNCE_RATE = 3;
const HIGH_RISK_UNSUBSCRIBE_RATE = 2;
const MEDIUM_RISK_UNSUBSCRIBE_RATE = 1;

type DeliverabilityReadCtx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

export type MailboxDeliverabilityStatus = "healthy" | "watch" | "at_risk";

export type MailboxWarmupStage = {
  description: string;
  key: "days_1_3" | "days_4_7" | "days_8_14" | "days_15_30" | "days_31_plus";
  label: string;
  maxAgeDays: number;
  recommendedDailyLimit: number;
};

export type MailboxDeliverabilityMetrics = {
  bounced: number;
  bounceRate: number;
  clicked: number;
  isPartial: boolean;
  lastBounceAt?: number;
  lastReplyAt?: number;
  lastSentAt?: number;
  opened: number;
  openRate: number;
  replied: number;
  replyRate: number;
  sent: number;
  unsubscribed: number;
  unsubscribeRate: number;
};

export type MailboxDeliverabilitySnapshot = {
  configuredDailyLimit: number;
  deliverabilityStatus: MailboxDeliverabilityStatus;
  effectiveDailyLimit: number;
  guidance: string[];
  hasCapacityOverride: boolean;
  metrics: MailboxDeliverabilityMetrics;
  summary: string;
  warmupAgeDays: number;
  warmupStage: MailboxWarmupStage;
};

const MAILBOX_WARMUP_STAGES: MailboxWarmupStage[] = [
  {
    description:
      "Keep volume low while mailbox authentication, inbox placement, and first replies stabilize.",
    key: "days_1_3",
    label: "Days 1-3",
    maxAgeDays: 3,
    recommendedDailyLimit: 15,
  },
  {
    description: "Increase slowly once the mailbox has a few days of clean traffic.",
    key: "days_4_7",
    label: "Days 4-7",
    maxAgeDays: 7,
    recommendedDailyLimit: 25,
  },
  {
    description: "Start testing modest sequence volume, but keep list quality tight.",
    key: "days_8_14",
    label: "Days 8-14",
    maxAgeDays: 14,
    recommendedDailyLimit: 40,
  },
  {
    description:
      "Mailbox is warm enough for steady outbound traffic if bounce and unsubscribe rates stay low.",
    key: "days_15_30",
    label: "Days 15-30",
    maxAgeDays: 30,
    recommendedDailyLimit: 60,
  },
  {
    description:
      "Established mailbox. Capacity is mostly governed by recent deliverability, not age alone.",
    key: "days_31_plus",
    label: "Day 31+",
    maxAgeDays: Number.POSITIVE_INFINITY,
    recommendedDailyLimit: 100,
  },
];

function clampRate(value: number): number {
  return Math.round(value * 10) / 10;
}

function getRate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return clampRate((numerator / denominator) * 100);
}

function getWarmupAgeDays(createdAt: number, now: number): number {
  return Math.max(1, Math.floor((now - createdAt) / DAY) + 1);
}

/** Resolve the current mailbox warmup stage from mailbox age. */
export function getMailboxWarmupStage(
  createdAt: number,
  now: number = Date.now(),
): MailboxWarmupStage & { ageDays: number } {
  const ageDays = getWarmupAgeDays(createdAt, now);
  const stage =
    MAILBOX_WARMUP_STAGES.find((candidate) => ageDays <= candidate.maxAgeDays) ??
    MAILBOX_WARMUP_STAGES[MAILBOX_WARMUP_STAGES.length - 1];

  return { ...stage, ageDays };
}

/** Aggregate recent outreach events into deliverability metrics for a single mailbox. */
export function buildMailboxDeliverabilityMetrics(
  events: Doc<"outreachEvents">[],
  isPartial: boolean,
): MailboxDeliverabilityMetrics {
  let bounced = 0;
  let clicked = 0;
  let opened = 0;
  let replied = 0;
  let sent = 0;
  let unsubscribed = 0;
  let lastBounceAt: number | undefined;
  let lastReplyAt: number | undefined;
  let lastSentAt: number | undefined;

  for (const event of events) {
    switch (event.type) {
      case "sent":
        sent += 1;
        lastSentAt = Math.max(lastSentAt ?? 0, event.createdAt);
        break;
      case "opened":
        opened += 1;
        break;
      case "clicked":
        clicked += 1;
        break;
      case "replied":
        replied += 1;
        lastReplyAt = Math.max(lastReplyAt ?? 0, event.createdAt);
        break;
      case "bounced":
        bounced += 1;
        lastBounceAt = Math.max(lastBounceAt ?? 0, event.createdAt);
        break;
      case "unsubscribed":
        unsubscribed += 1;
        break;
    }
  }

  return {
    bounced,
    bounceRate: getRate(bounced, sent),
    clicked,
    isPartial,
    lastBounceAt,
    lastReplyAt,
    lastSentAt,
    opened,
    openRate: getRate(opened, sent),
    replied,
    replyRate: getRate(replied, sent),
    sent,
    unsubscribed,
    unsubscribeRate: getRate(unsubscribed, sent),
  };
}

function getRiskAdjustedLimit(
  warmupLimit: number,
  metrics: MailboxDeliverabilityMetrics,
  warmupAgeDays: number,
): {
  guidance: string[];
  recommendedDailyLimit: number;
  status: MailboxDeliverabilityStatus;
  summary: string;
} {
  if (metrics.sent === 0) {
    return buildNoRecentSendAssessment(warmupLimit);
  }

  if (metrics.sent < MIN_SAMPLES_FOR_DELIVERABILITY_SCORING) {
    return buildLowSampleAssessment(warmupLimit, metrics.sent, warmupAgeDays);
  }

  if (hasHighRiskSignals(metrics)) {
    return buildHighRiskAssessment(warmupLimit, metrics);
  }

  if (hasMediumRiskSignals(metrics)) {
    return buildMediumRiskAssessment(warmupLimit, metrics);
  }

  return buildHealthyAssessment(warmupLimit, metrics);
}

function buildNoRecentSendAssessment(warmupLimit: number) {
  return {
    guidance: [
      `No outreach sends were recorded in the last ${OUTREACH_DELIVERABILITY_LOOKBACK_DAYS} days. Keep warmup volume flat until new traffic starts landing cleanly.`,
    ],
    recommendedDailyLimit: warmupLimit,
    status: "healthy" as const,
    summary: "Warmup guidance is age-based until this mailbox starts sending.",
  };
}

function buildLowSampleAssessment(warmupLimit: number, sentCount: number, warmupAgeDays: number) {
  const guidance = [
    `Only ${sentCount} recent send${sentCount === 1 ? "" : "s"} recorded. Hold the current pace until you have a larger sample.`,
  ];

  if (warmupAgeDays <= 14) {
    guidance.push("Avoid jumping stages early just because the mailbox is underused.");
  }

  return {
    guidance,
    recommendedDailyLimit: warmupLimit,
    status: "healthy" as const,
    summary: "Recent bounce and unsubscribe activity look healthy for the current warmup stage.",
  };
}

function hasHighRiskSignals(metrics: MailboxDeliverabilityMetrics): boolean {
  return (
    metrics.bounceRate >= HIGH_RISK_BOUNCE_RATE ||
    metrics.unsubscribeRate >= HIGH_RISK_UNSUBSCRIBE_RATE
  );
}

function hasMediumRiskSignals(metrics: MailboxDeliverabilityMetrics): boolean {
  return (
    metrics.bounceRate >= MEDIUM_RISK_BOUNCE_RATE ||
    metrics.unsubscribeRate >= MEDIUM_RISK_UNSUBSCRIBE_RATE ||
    metrics.replyRate < MEDIUM_RISK_REPLY_RATE
  );
}

function buildHighRiskAssessment(warmupLimit: number, metrics: MailboxDeliverabilityMetrics) {
  return {
    guidance: [
      `Bounce rate is ${metrics.bounceRate.toFixed(1)}% and unsubscribe rate is ${metrics.unsubscribeRate.toFixed(1)}% over the last ${OUTREACH_DELIVERABILITY_LOOKBACK_DAYS} days.`,
      "Reduce list growth, verify addresses, and keep the mailbox at a lower daily ceiling until signals recover.",
    ],
    recommendedDailyLimit: Math.max(10, Math.floor(warmupLimit * 0.5)),
    status: "at_risk" as const,
    summary: "Recent bounce or unsubscribe activity is too high for safe volume growth.",
  };
}

function buildMediumRiskAssessment(warmupLimit: number, metrics: MailboxDeliverabilityMetrics) {
  const guidance: string[] = [];

  if (metrics.bounceRate >= MEDIUM_RISK_BOUNCE_RATE) {
    guidance.push(
      `Bounce rate is ${metrics.bounceRate.toFixed(1)}%. Clean the audience before raising daily volume.`,
    );
  }
  if (metrics.unsubscribeRate >= MEDIUM_RISK_UNSUBSCRIBE_RATE) {
    guidance.push(
      `Unsubscribe rate is ${metrics.unsubscribeRate.toFixed(1)}%. Tighten targeting or message fit before pushing harder.`,
    );
  }
  if (metrics.replyRate < MEDIUM_RISK_REPLY_RATE) {
    guidance.push(
      `Reply rate is ${metrics.replyRate.toFixed(1)}%. Keep warmup steady until positive engagement improves.`,
    );
  }

  return {
    guidance,
    recommendedDailyLimit: Math.max(10, Math.floor(warmupLimit * 0.75)),
    status: "watch" as const,
    summary:
      "Deliverability is usable, but the mailbox needs steadier quality before increasing volume.",
  };
}

function buildHealthyAssessment(warmupLimit: number, metrics: MailboxDeliverabilityMetrics) {
  const guidance: string[] = [];

  if (metrics.replyRate >= LOW_RISK_REPLY_RATE) {
    guidance.push(
      `Reply rate is ${metrics.replyRate.toFixed(1)}%, which is strong enough to keep progressing through warmup.`,
    );
  }

  if (metrics.isPartial) {
    guidance.push(
      `Recent event analysis hit the ${OUTREACH_DELIVERABILITY_EVENT_LIMIT.toLocaleString()}-event safety window, so recommendations are based on a bounded sample.`,
    );
  }

  return {
    guidance,
    recommendedDailyLimit: warmupLimit,
    status: "healthy" as const,
    summary: "Recent bounce and unsubscribe activity look healthy for the current warmup stage.",
  };
}

/** Combine warmup stage and recent event health into the effective daily mailbox cap. */
export function evaluateMailboxDeliverability(
  mailbox: Pick<Doc<"outreachMailboxes">, "_creationTime" | "dailySendLimit">,
  metrics: MailboxDeliverabilityMetrics,
  now: number = Date.now(),
): MailboxDeliverabilitySnapshot {
  const warmupStage = getMailboxWarmupStage(mailbox._creationTime, now);
  const riskAssessment = getRiskAdjustedLimit(
    warmupStage.recommendedDailyLimit,
    metrics,
    warmupStage.ageDays,
  );
  const effectiveDailyLimit = Math.max(
    1,
    Math.min(mailbox.dailySendLimit, riskAssessment.recommendedDailyLimit),
  );

  return {
    configuredDailyLimit: mailbox.dailySendLimit,
    deliverabilityStatus: riskAssessment.status,
    effectiveDailyLimit,
    guidance: riskAssessment.guidance,
    hasCapacityOverride: effectiveDailyLimit < mailbox.dailySendLimit,
    metrics,
    summary: riskAssessment.summary,
    warmupAgeDays: warmupStage.ageDays,
    warmupStage: {
      description: warmupStage.description,
      key: warmupStage.key,
      label: warmupStage.label,
      maxAgeDays: warmupStage.maxAgeDays,
      recommendedDailyLimit: riskAssessment.recommendedDailyLimit,
    },
  };
}

/** Build deliverability snapshots for a set of mailboxes from preloaded sequence and event windows. */
export function buildMailboxDeliverabilitySnapshots({
  mailboxes,
  recentEvents,
  recentEventWindowTruncated,
  sequences,
  now = Date.now(),
}: {
  mailboxes: Doc<"outreachMailboxes">[];
  recentEvents: Doc<"outreachEvents">[];
  recentEventWindowTruncated: boolean;
  sequences: Doc<"outreachSequences">[];
  now?: number;
}): Map<Id<"outreachMailboxes">, MailboxDeliverabilitySnapshot> {
  const mailboxIds = new Set(mailboxes.map((mailbox) => mailbox._id));
  const mailboxMetrics = new Map<Id<"outreachMailboxes">, Doc<"outreachEvents">[]>();
  const mailboxIdBySequenceId = new Map<Id<"outreachSequences">, Id<"outreachMailboxes">>();

  for (const sequence of sequences) {
    if (mailboxIds.has(sequence.mailboxId)) {
      mailboxIdBySequenceId.set(sequence._id, sequence.mailboxId);
    }
  }

  for (const event of recentEvents) {
    const mailboxId = mailboxIdBySequenceId.get(event.sequenceId);
    if (!mailboxId) {
      continue;
    }
    const current = mailboxMetrics.get(mailboxId) ?? [];
    current.push(event);
    mailboxMetrics.set(mailboxId, current);
  }

  return new Map(
    mailboxes.map((mailbox) => [
      mailbox._id,
      evaluateMailboxDeliverability(
        mailbox,
        buildMailboxDeliverabilityMetrics(
          mailboxMetrics.get(mailbox._id) ?? [],
          recentEventWindowTruncated,
        ),
        now,
      ),
    ]),
  );
}

/** Load recent sequence and event context and evaluate deliverability for the provided mailboxes. */
export async function loadMailboxDeliverabilitySnapshots(
  ctx: DeliverabilityReadCtx,
  mailboxes: Doc<"outreachMailboxes">[],
  now: number = Date.now(),
): Promise<Map<Id<"outreachMailboxes">, MailboxDeliverabilitySnapshot>> {
  const mailboxesByOrganization = new Map<Id<"organizations">, Array<Doc<"outreachMailboxes">>>();

  for (const mailbox of mailboxes) {
    const current = mailboxesByOrganization.get(mailbox.organizationId) ?? [];
    current.push(mailbox);
    mailboxesByOrganization.set(mailbox.organizationId, current);
  }

  const snapshots = new Map<Id<"outreachMailboxes">, MailboxDeliverabilitySnapshot>();

  for (const [organizationId, organizationMailboxes] of mailboxesByOrganization) {
    const [sequencesByMailbox, recentEventBatch] = await Promise.all([
      Promise.all(
        organizationMailboxes.map((mailbox) =>
          ctx.db
            .query("outreachSequences")
            .withIndex("by_mailbox", (q) => q.eq("mailboxId", mailbox._id))
            .take(BOUNDED_LIST_LIMIT),
        ),
      ),
      ctx.db
        .query("outreachEvents")
        .withIndex("by_organization_and_created_at", (q) =>
          q
            .eq("organizationId", organizationId)
            .gte("createdAt", now - OUTREACH_DELIVERABILITY_LOOKBACK_MS),
        )
        .order("desc")
        .take(OUTREACH_DELIVERABILITY_EVENT_LIMIT + 1),
    ]);

    const sequences = sequencesByMailbox.flat();

    const organizationSnapshots = buildMailboxDeliverabilitySnapshots({
      mailboxes: organizationMailboxes,
      recentEvents: recentEventBatch.slice(0, OUTREACH_DELIVERABILITY_EVENT_LIMIT),
      recentEventWindowTruncated: recentEventBatch.length > OUTREACH_DELIVERABILITY_EVENT_LIMIT,
      sequences,
      now,
    });

    for (const [mailboxId, snapshot] of organizationSnapshots) {
      snapshots.set(mailboxId, snapshot);
    }
  }

  return snapshots;
}
