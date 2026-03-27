/**
 * E2E Testing Helpers
 *
 * Provides utilities for E2E tests:
 * - Create test users (bypassing email verification for speed)
 * - Delete test users
 * - Reset onboarding state
 * - Garbage collection for old test users
 *
 * Only works for emails ending in @inbox.mailtrap.io (test emails).
 * Real email verification is tested separately using Mailtrap API.
 */

import { v } from "convex/values";
import { Scrypt } from "lucia";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  type ActionCtx,
  httpAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { constantTimeEqual } from "./lib/apiAuth";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { decryptE2EData, encryptE2EData } from "./lib/e2eCrypto";
import { fetchWithTimeout } from "./lib/fetchWithTimeout";
import { logger } from "./lib/logger";
import { syncProjectIssueStats } from "./lib/projectIssueStats";
import { notDeleted, restoreFields, softDeleteFields } from "./lib/softDeleteHelpers";
import { DAY, HOUR, MINUTE, MONTH, SECOND, WEEK } from "./lib/timeUtils";
import { encryptMailboxTokensForStorage } from "./outreach/mailboxTokens";
import { type CalendarEventColor, otpCodeTypes, workflowCategories } from "./validators";

// Test user expiration (1 hour - for garbage collection)
const TEST_USER_EXPIRATION_MS = HOUR;

import { api } from "./_generated/api";

type ScreenshotDocumentNode = Record<string, unknown>;
type SeededInboxActorKey = "owner" | "alex" | "sarah";
type SeededProjectInboxMode = "default" | "openEmpty" | "closedEmpty";
type SeededProjectAnalyticsMode = "default" | "sparseData" | "noActivity";
type SeededNotificationsMode = "default" | "inboxEmpty" | "archivedEmpty" | "unreadOverflow";
type SeededRoadmapMode = "default" | "empty" | "milestone";
type SeededTimeTrackingMode = "default" | "entriesEmpty" | "ratesPopulated" | "summaryTruncated";
type SeededAssistantMode = "default" | "empty";
type SeededInvoiceClient = "portal" | "none";
type E2EReadCtx = Pick<MutationCtx, "db"> | Pick<QueryCtx, "db">;

function getIssueNumberFromKey(issueKey: string, projectKey: string): number | null {
  const prefix = `${projectKey}-`;
  if (!issueKey.startsWith(prefix)) {
    return null;
  }

  const suffix = issueKey.slice(prefix.length);
  if (!/^\d+$/.test(suffix)) {
    return null;
  }

  return Number.parseInt(suffix, 10);
}

async function getHighestExistingProjectIssueNumber(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  projectKey: string,
): Promise<number> {
  const existingIssues = ctx.db
    .query("issues")
    .withIndex("by_project_status", (q) => q.eq("projectId", projectId))
    .filter(notDeleted);

  let highestIssueNumber = 0;
  for await (const issue of existingIssues) {
    const issueNumber = getIssueNumberFromKey(issue.key, projectKey);
    if (issueNumber !== null) {
      highestIssueNumber = Math.max(highestIssueNumber, issueNumber);
    }
  }

  return highestIssueNumber;
}

async function getProjectIssueCounterFloor(
  ctx: MutationCtx,
  project: Doc<"projects">,
): Promise<number> {
  const highestExistingIssueNumber = await getHighestExistingProjectIssueNumber(
    ctx,
    project._id,
    project.key,
  );
  return Math.max(project.nextIssueNumber, highestExistingIssueNumber);
}

async function findLatestUserByEmail(ctx: E2EReadCtx, email: string): Promise<Doc<"users"> | null> {
  const users = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .collect();
  if (users.length === 0) {
    return null;
  }
  return users.sort((a, b) => b._creationTime - a._creationTime)[0];
}

async function resolveSeedOrganizationForUser(
  ctx: E2EReadCtx,
  user: Doc<"users">,
  requestedOrgSlug?: string,
): Promise<{ error?: string; organization?: Doc<"organizations"> }> {
  let organizationId: Id<"organizations"> | null = null;

  if (requestedOrgSlug) {
    const organizationBySlug = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", requestedOrgSlug))
      .filter(notDeleted)
      .first();

    if (!organizationBySlug) {
      return { error: `Organization not found: ${requestedOrgSlug}` };
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", organizationBySlug._id).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      return { error: `User is not a member of organization: ${requestedOrgSlug}` };
    }

    organizationId = organizationBySlug._id;
  } else {
    const defaultOrgId = user.defaultOrganizationId;
    if (defaultOrgId) {
      const defaultOrg = await ctx.db.get(defaultOrgId);
      if (defaultOrg) {
        const defaultMembership = await ctx.db
          .query("organizationMembers")
          .withIndex("by_organization_user", (q) =>
            q.eq("organizationId", defaultOrgId).eq("userId", user._id),
          )
          .first();
        if (defaultMembership) {
          organizationId = defaultOrgId;
        }
      }
    }

    if (!organizationId) {
      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!membership) {
        return { error: "User has no organization membership" };
      }

      organizationId = membership.organizationId;
    }
  }

  const organization = organizationId ? await ctx.db.get(organizationId) : null;
  if (!organization) {
    return { error: "Organization not found" };
  }

  const isE2EOrg =
    organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
  if (!isE2EOrg) {
    return {
      error: `Refusing to target non-E2E organization: ${organization.slug}. Use an org with 'nixelo-e2e' prefix.`,
    };
  }

  return { organization };
}

interface SeededInvoiceLineItemDefinition {
  description: string;
  quantity: number;
  rate: number;
}

interface SeededInvoiceDefinition {
  client: SeededInvoiceClient;
  dueOffsetDays: number;
  issueOffsetDays: number;
  lineItems: SeededInvoiceLineItemDefinition[];
  notes?: string;
  number: string;
  paidOffsetDays?: number;
  sentOffsetDays?: number;
  status: Doc<"invoices">["status"];
}

interface SeededInboxDefinition {
  createdBy: SeededInboxActorKey;
  createdOffsetMs: number;
  declineReason?: string;
  duplicateOfKey?: string;
  issueKey: string;
  snoozedUntil?: number;
  source: Doc<"inboxIssues">["source"];
  sourceEmail?: string;
  status: Doc<"inboxIssues">["status"];
  triagedOffsetMs?: number;
}

interface SeededNotificationDefinition {
  actor: SeededInboxActorKey;
  hoursAgo: number;
  isArchived?: boolean;
  isRead: boolean;
  issueKey?: string;
  message: string;
  title: string;
  type: string;
}

interface SeededAnalyticsSprintDefinition {
  endDate: number;
  goal: string;
  name: string;
  startDate: number;
  status: Doc<"sprints">["status"];
}

interface SeededAnalyticsIssueDefinition {
  assignedTo: SeededInboxActorKey | null;
  dueDate?: number;
  key: string;
  priority: Doc<"issues">["priority"];
  sprintName?: string;
  status: string;
  storyPoints?: number;
  title: string;
  type: Doc<"issues">["type"];
}

interface SeededAnalyticsActivityDefinition {
  action: Doc<"issueActivity">["action"];
  actor: SeededInboxActorKey;
  field?: string;
  issueKey: string;
  newValue?: string;
  oldValue?: string;
  timestamp: number;
}

interface SeededTimeTrackingEntryDefinition {
  activity: string;
  billable: boolean;
  dayOffset: number;
  description: string;
  durationHours: number;
  hourlyRate?: number;
}

interface SeededTimeTrackingRateDefinition {
  currency: string;
  hourlyRate: number;
  notes?: string;
  projectScoped: boolean;
  rateType: Doc<"userRates">["rateType"];
}

interface SeededAssistantUsageDefinition {
  completionTokens: number;
  estimatedCost: number;
  model: string;
  operation: Doc<"aiUsage">["operation"];
  projectKey?: "DEMO" | "OPS";
  promptTokens: number;
  provider: Doc<"aiUsage">["provider"];
  responseTime: number;
  success: boolean;
}

interface SeededAssistantChatDefinition {
  messagePairs: Array<{
    assistant: string;
    user: string;
  }>;
  projectKey?: "DEMO" | "OPS";
  title: string;
  updatedOffsetMs: number;
}

interface SeededRoadmapIssueDefinition {
  dueOffsetDays?: number;
  key: string;
  startOffsetDays?: number;
}

interface SeededRoadmapLinkDefinition {
  fromKey: string;
  toKey: string;
}

type SeededProjectsRouteMode = "default" | "single" | "empty";

const SCREENSHOT_INVOICE_DEFINITIONS: SeededInvoiceDefinition[] = [
  {
    client: "portal",
    dueOffsetDays: 9,
    issueOffsetDays: -5,
    lineItems: [
      {
        description: "Discovery sprint and kickoff workshop",
        quantity: 1,
        rate: 2400,
      },
    ],
    notes: "Pending approval before delivery handoff.",
    number: "INV-2026-901",
    status: "draft",
  },
  {
    client: "portal",
    dueOffsetDays: 14,
    issueOffsetDays: -12,
    lineItems: [
      {
        description: "Implementation week 1",
        quantity: 18,
        rate: 185,
      },
    ],
    notes: "Sent with project recap and milestone notes.",
    number: "INV-2026-902",
    sentOffsetDays: -6,
    status: "sent",
  },
  {
    client: "none",
    dueOffsetDays: 3,
    issueOffsetDays: -10,
    lineItems: [
      {
        description: "Strategy review retainer",
        quantity: 8,
        rate: 150,
      },
    ],
    number: "INV-2026-903",
    paidOffsetDays: -2,
    sentOffsetDays: -7,
    status: "paid",
  },
];

const SCREENSHOT_TIME_TRACKING_BASE_ENTRIES: SeededTimeTrackingEntryDefinition[] = [
  {
    activity: "Development",
    billable: true,
    dayOffset: -2,
    description: "CI/CD pipeline setup and configuration",
    durationHours: 4,
    hourlyRate: 150,
  },
  {
    activity: "Development",
    billable: true,
    dayOffset: -1,
    description: "Bug investigation: login timeout on mobile",
    durationHours: 3,
    hourlyRate: 150,
  },
  {
    activity: "Code Review",
    billable: true,
    dayOffset: -1,
    description: "Dashboard design review with team",
    durationHours: 1.5,
    hourlyRate: 150,
  },
  {
    activity: "Meeting",
    billable: false,
    dayOffset: 0,
    description: "Sprint planning meeting",
    durationHours: 1,
  },
  {
    activity: "Development",
    billable: true,
    dayOffset: 0,
    description: "Mobile login fix implementation",
    durationHours: 2.5,
    hourlyRate: 150,
  },
];

const SCREENSHOT_TIME_TRACKING_REVIEW_RATES: SeededTimeTrackingRateDefinition[] = [
  {
    currency: "USD",
    hourlyRate: 125,
    notes: "Default internal delivery cost",
    projectScoped: false,
    rateType: "internal",
  },
  {
    currency: "USD",
    hourlyRate: 180,
    notes: "Client-facing override for screenshot review",
    projectScoped: true,
    rateType: "billable",
  },
];

const SCREENSHOT_ROADMAP_BASE_ISSUES: SeededRoadmapIssueDefinition[] = [
  { key: "DEMO-1", startOffsetDays: -5, dueOffsetDays: -2 },
  { key: "DEMO-2", startOffsetDays: -1, dueOffsetDays: 1 },
  { key: "DEMO-3", startOffsetDays: 0, dueOffsetDays: 3 },
  { key: "DEMO-4", startOffsetDays: 4, dueOffsetDays: 7 },
  { key: "DEMO-7", startOffsetDays: 1, dueOffsetDays: 2 },
];

const SCREENSHOT_ROADMAP_LINKS: SeededRoadmapLinkDefinition[] = [
  { fromKey: "DEMO-2", toKey: "DEMO-3" },
  { fromKey: "DEMO-7", toKey: "DEMO-4" },
];

const SCREENSHOT_ASSISTANT_USAGE_DEFAULT: SeededAssistantUsageDefinition[] = [
  {
    completionTokens: 920,
    estimatedCost: 164,
    model: "claude-3-5-sonnet",
    operation: "chat",
    projectKey: "DEMO",
    promptTokens: 1480,
    provider: "anthropic",
    responseTime: 382,
    success: true,
  },
  {
    completionTokens: 410,
    estimatedCost: 96,
    model: "claude-3-5-haiku",
    operation: "suggestion",
    projectKey: "DEMO",
    promptTokens: 680,
    provider: "anthropic",
    responseTime: 244,
    success: true,
  },
  {
    completionTokens: 590,
    estimatedCost: 128,
    model: "gpt-4.1-mini",
    operation: "analysis",
    projectKey: "OPS",
    promptTokens: 980,
    provider: "openai",
    responseTime: 466,
    success: true,
  },
  {
    completionTokens: 360,
    estimatedCost: 74,
    model: "gpt-4.1-mini",
    operation: "automation",
    projectKey: "OPS",
    promptTokens: 520,
    provider: "openai",
    responseTime: 311,
    success: true,
  },
  {
    completionTokens: 720,
    estimatedCost: 138,
    model: "claude-3-5-sonnet",
    operation: "chat",
    promptTokens: 1120,
    provider: "anthropic",
    responseTime: 401,
    success: true,
  },
];

const SCREENSHOT_ASSISTANT_CHATS_DEFAULT: SeededAssistantChatDefinition[] = [
  {
    messagePairs: [
      {
        user: "What are the top launch blockers for the demo project?",
        assistant:
          "Pricing approval and onboarding copy polish remain the top blockers before launch.",
      },
      {
        user: "Turn that into a leadership-ready summary.",
        assistant:
          "Leadership summary: only two blockers remain, both owned, and neither changes the Thursday review checkpoint.",
      },
    ],
    projectKey: "DEMO",
    title: "Launch blockers summary",
    updatedOffsetMs: 30 * MINUTE,
  },
  {
    messagePairs: [
      {
        user: "Draft a client handoff checklist for OPS.",
        assistant:
          "Created a handoff checklist covering kickoff notes, support routing, and approval sign-off.",
      },
      {
        user: "What still needs confirmation?",
        assistant:
          "Weekend support coverage and final portal permissions still need confirmation before go-live.",
      },
    ],
    projectKey: "OPS",
    title: "Client handoff checklist",
    updatedOffsetMs: 90 * MINUTE,
  },
  {
    messagePairs: [
      {
        user: "Summarize recent AI usage across the workspace.",
        assistant:
          "Usage is split between chat, analysis, and automation, with Anthropic handling most token volume.",
      },
    ],
    title: "Workspace usage snapshot",
    updatedOffsetMs: 3 * HOUR,
  },
];

function buildSeededRoadmapIssueDefinitions(
  mode: SeededRoadmapMode,
): SeededRoadmapIssueDefinition[] {
  if (mode === "empty") {
    return [];
  }

  if (mode === "milestone") {
    return SCREENSHOT_ROADMAP_BASE_ISSUES.map((definition) =>
      definition.key === "DEMO-7"
        ? { ...definition, startOffsetDays: undefined, dueOffsetDays: 2 }
        : definition,
    );
  }

  return SCREENSHOT_ROADMAP_BASE_ISSUES;
}

function getDayStartMs(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function buildSeededTimeTrackingEntryDefinitions(
  mode: SeededTimeTrackingMode,
): SeededTimeTrackingEntryDefinition[] {
  if (mode === "entriesEmpty") {
    return [];
  }

  const baseEntries = [...SCREENSHOT_TIME_TRACKING_BASE_ENTRIES];
  if (mode !== "summaryTruncated") {
    return baseEntries;
  }

  const targetEntryCount = 501;
  const overflowEntryCount = Math.max(targetEntryCount - baseEntries.length, 0);

  for (let index = 0; index < overflowEntryCount; index += 1) {
    baseEntries.push({
      activity: index % 5 === 0 ? "Review" : "Development",
      billable: true,
      dayOffset: -(index % 7),
      description: `Screenshot overflow entry ${String(index + 1).padStart(3, "0")}`,
      durationHours: 0.5,
      hourlyRate: 120,
    });
  }

  return baseEntries;
}

function screenshotText(text: string): ScreenshotDocumentNode {
  return { type: "text", text };
}

function screenshotHeading(level: 1 | 2 | 3, text: string): ScreenshotDocumentNode {
  return {
    type: "heading",
    attrs: { level },
    content: [screenshotText(text)],
  };
}

function screenshotParagraph(text: string): ScreenshotDocumentNode {
  return {
    type: "paragraph",
    content: [screenshotText(text)],
  };
}

function screenshotList(
  type: "bulletList" | "orderedList",
  items: string[],
): ScreenshotDocumentNode {
  return {
    type,
    content: items.map((item) => ({
      type: "listItem",
      content: [screenshotParagraph(item)],
    })),
  };
}

function screenshotBulletList(items: string[]): ScreenshotDocumentNode {
  return screenshotList("bulletList", items);
}

function screenshotOrderedList(items: string[]): ScreenshotDocumentNode {
  return screenshotList("orderedList", items);
}

function screenshotBlockquote(text: string): ScreenshotDocumentNode {
  return {
    type: "blockquote",
    content: [screenshotParagraph(text)],
  };
}

const SCREENSHOT_DOCUMENT_SNAPSHOTS: Record<
  "Project Requirements" | "Sprint Retrospective Notes",
  { type: "doc"; content: ScreenshotDocumentNode[] }
> = {
  "Project Requirements": {
    type: "doc",
    content: [
      screenshotParagraph(
        "Cascade should unify board planning, client delivery, and documentation in one calmer workspace where the document carries the operating story, not just a detached brief.",
      ),
      screenshotBlockquote(
        "Write the intent, risks, and launch handshake here so the team can move from document to board without losing the thread.",
      ),
      screenshotHeading(2, "Success criteria"),
      screenshotBulletList([
        "Teams can move from specs to execution without losing linked context, approvals, or delivery timing.",
        "Project, board, calendar, and document surfaces should read like one product instead of stitched demos.",
        "Leads should be able to review readiness in one pass without chasing status across tabs and chats.",
      ]),
      screenshotHeading(2, "Working agreement"),
      screenshotOrderedList([
        "Capture the handoff summary first, then turn decisions into linked follow-up items.",
        "Keep launch blockers, owners, and review dates in the document while the board tracks execution state.",
        "Avoid separate side docs unless they introduce a genuinely different workflow or audience.",
      ]),
      screenshotBlockquote(
        "The document should behave like the narrative layer for the workspace, not a detached notes island.",
      ),
      screenshotHeading(2, "Launch checklist"),
      screenshotBulletList([
        "Review the final delivery scope with the project lead and client contact.",
        "Confirm linked issues, roadmap milestones, and calendar events still reflect the agreed timeline.",
        "Publish the summary once risks and owners are visible without opening extra panels.",
      ]),
    ],
  },
  "Sprint Retrospective Notes": {
    type: "doc",
    content: [
      screenshotParagraph(
        "The team closed the auth refresh, improved mobile board density, and stabilized screenshot capture across configs without losing seeded-product credibility or workspace continuity.",
      ),
      screenshotBlockquote(
        "The retro should read like the handoff layer for the sprint, not a thin placeholder note hiding behind a toolbar.",
      ),
      screenshotHeading(2, "Sprint health"),
      screenshotParagraph(
        "Delivery felt calmer because documents, issues, and rollout notes finally lined up around one clear operating story instead of three parallel status surfaces.",
      ),
      screenshotHeading(2, "Wins"),
      screenshotBulletList([
        "Landing light mode feels more intentional and the settings suite now compresses cleanly on mobile.",
        "Project and analytics screenshots use deterministic product data, so visual regressions point at real composition drift instead of flaky routes.",
        "Issue detail, dashboard, and admin surfaces now share stronger section anatomy instead of nested-card sprawl.",
      ]),
      screenshotHeading(2, "Decisions"),
      screenshotOrderedList([
        "Keep Tailwind for static layout and reserve cva() for shared primitive semantics only.",
        "Use screenshots as the review surface for weird UI before accepting any new baseline.",
        "Treat documents as workspace evidence, not a toolbar demo or a thin placeholder note.",
      ]),
      screenshotHeading(2, "Risks to watch"),
      screenshotBulletList([
        "The editor still feels thinner than the rest of the product if seeded notes collapse back to one short paragraph.",
        "Header actions can still regain noise if owner-only affordances leak back into the always-visible row.",
        "Docs lose authority quickly when follow-ups move to side channels instead of staying linked in the note.",
      ]),
      screenshotBlockquote(
        "We should keep making document states look like a real workspace instead of a barely-filled demo shell whenever screenshots expose empty or over-controlled compositions.",
      ),
      screenshotHeading(2, "Next steps"),
      screenshotBulletList([
        "Hydrate the editor from saved document versions and keep pushing page-level polish where screenshots still feel thin.",
        "Turn the retrospective decisions into linked issue follow-ups once the notes are reviewed with the team.",
        "Keep trimming document-header action sprawl so the route reads like writing software instead of a toolbar demo.",
      ]),
    ],
  },
};

const SCREENSHOT_INBOX_SYNTHETIC_EMAILS = {
  alex: "alex-rivera-screenshots@inbox.mailtrap.io",
  sarah: "sarah-kim-screenshots@inbox.mailtrap.io",
} as const;

function buildSeededProjectAnalyticsSprintDefinitions(
  mode: SeededProjectAnalyticsMode,
  now: number,
): SeededAnalyticsSprintDefinition[] {
  if (mode === "sparseData") {
    return [
      {
        endDate: now + 4 * DAY,
        goal: "Tighten the launch checklist before the next release review.",
        name: "Sprint 1",
        startDate: now - 3 * DAY,
        status: "active",
      },
    ];
  }

  return [
    {
      endDate: now + WEEK,
      goal: "Launch MVP features",
      name: "Sprint 1",
      startDate: now - WEEK,
      status: "active",
    },
    {
      endDate: now - 2 * WEEK,
      goal: "Close delivery blockers before rollout week.",
      name: "Launch Prep",
      startDate: now - 3 * WEEK,
      status: "completed",
    },
    {
      endDate: now - 4 * WEEK,
      goal: "Stabilize the project shell and baseline workflows.",
      name: "Foundation",
      startDate: now - 5 * WEEK,
      status: "completed",
    },
  ];
}

function buildSeededProjectAnalyticsIssueDefinitions(
  mode: SeededProjectAnalyticsMode,
  now: number,
): SeededAnalyticsIssueDefinition[] {
  if (mode === "sparseData") {
    return [
      {
        assignedTo: null,
        dueDate: now + DAY,
        key: "DEMO-2",
        priority: "highest",
        sprintName: "Sprint 1",
        status: "in-progress",
        title: "Fix login timeout on mobile",
        type: "bug",
      },
      {
        assignedTo: null,
        dueDate: now + 4 * DAY,
        key: "DEMO-4",
        priority: "medium",
        sprintName: "Sprint 1",
        status: "todo",
        title: "Add dark mode support",
        type: "story",
      },
      {
        assignedTo: null,
        dueDate: now + 6 * DAY,
        key: "DEMO-7",
        priority: "high",
        status: "todo",
        title: "Improve release checklist",
        type: "task",
      },
    ];
  }

  return [
    {
      assignedTo: "owner",
      dueDate: now - 2 * DAY,
      key: "DEMO-1",
      priority: "high",
      sprintName: "Launch Prep",
      status: "done",
      storyPoints: 8,
      title: "Set up CI/CD pipeline",
      type: "task",
    },
    {
      assignedTo: "alex",
      dueDate: now + DAY,
      key: "DEMO-2",
      priority: "highest",
      sprintName: "Sprint 1",
      status: "in-progress",
      title: "Fix login timeout on mobile",
      type: "bug",
    },
    {
      assignedTo: "sarah",
      dueDate: now + 3 * DAY,
      key: "DEMO-3",
      priority: "medium",
      sprintName: "Sprint 1",
      status: "in-review",
      title: "Design new dashboard layout",
      type: "story",
    },
    {
      assignedTo: null,
      dueDate: now + 7 * DAY,
      key: "DEMO-4",
      priority: "medium",
      sprintName: "Sprint 1",
      status: "todo",
      title: "Add dark mode support",
      type: "story",
    },
    {
      assignedTo: "owner",
      key: "DEMO-5",
      priority: "high",
      sprintName: "Foundation",
      status: "done",
      storyPoints: 5,
      title: "Database query optimization",
      type: "task",
    },
    {
      assignedTo: null,
      key: "DEMO-6",
      priority: "low",
      status: "todo",
      title: "User onboarding flow",
      type: "epic",
    },
    {
      assignedTo: "owner",
      dueDate: now + 2 * DAY,
      key: "DEMO-7",
      priority: "high",
      sprintName: "Sprint 1",
      status: "todo",
      title: "Improve release checklist",
      type: "task",
    },
  ];
}

function buildSeededProjectAnalyticsActivityDefinitions(
  mode: SeededProjectAnalyticsMode,
  now: number,
): SeededAnalyticsActivityDefinition[] {
  if (mode !== "default") {
    return [];
  }

  return [
    {
      action: "updated",
      actor: "alex",
      field: "status",
      issueKey: "DEMO-2",
      newValue: "In Progress",
      oldValue: "Todo",
      timestamp: now - 45 * MINUTE,
    },
    {
      action: "commented",
      actor: "sarah",
      issueKey: "DEMO-3",
      timestamp: now - 2 * HOUR,
    },
    {
      action: "updated",
      actor: "owner",
      field: "priority",
      issueKey: "DEMO-7",
      newValue: "High",
      oldValue: "Medium",
      timestamp: now - 5 * HOUR,
    },
  ];
}

function buildSeededProjectInboxDefinitions(
  mode: SeededProjectInboxMode,
  now: number,
): SeededInboxDefinition[] {
  if (mode === "openEmpty") {
    return [
      {
        createdBy: "owner",
        createdOffsetMs: 5 * HOUR,
        issueKey: "DEMO-7",
        source: "in_app",
        status: "accepted",
        triagedOffsetMs: 2 * HOUR,
      },
      {
        createdBy: "alex",
        createdOffsetMs: 20 * HOUR,
        declineReason: "Queued for a later release instead of the current triage lane",
        issueKey: "DEMO-2",
        source: "email",
        sourceEmail: "alerts@northstarlabs.example",
        status: "declined",
        triagedOffsetMs: 4 * HOUR,
      },
      {
        createdBy: "sarah",
        createdOffsetMs: 30 * HOUR,
        issueKey: "DEMO-1",
        source: "in_app",
        status: "accepted",
        triagedOffsetMs: 26 * HOUR,
      },
      {
        createdBy: "alex",
        createdOffsetMs: 34 * HOUR,
        declineReason: "Outside current launch scope",
        issueKey: "DEMO-4",
        source: "api",
        sourceEmail: "feedback-hooks@nixelo.test",
        status: "declined",
        triagedOffsetMs: 22 * HOUR,
      },
      {
        createdBy: "owner",
        createdOffsetMs: 40 * HOUR,
        duplicateOfKey: "DEMO-3",
        issueKey: "DEMO-6",
        source: "form",
        sourceEmail: "intake@nixelo.test",
        status: "duplicate",
        triagedOffsetMs: 21 * HOUR,
      },
    ];
  }

  if (mode === "closedEmpty") {
    return [
      {
        createdBy: "owner",
        createdOffsetMs: 5 * HOUR,
        issueKey: "DEMO-7",
        source: "in_app",
        status: "pending",
      },
      {
        createdBy: "alex",
        createdOffsetMs: 20 * HOUR,
        issueKey: "DEMO-2",
        snoozedUntil: now + 2 * DAY,
        source: "email",
        sourceEmail: "alerts@northstarlabs.example",
        status: "snoozed",
        triagedOffsetMs: 4 * HOUR,
      },
      {
        createdBy: "sarah",
        createdOffsetMs: 30 * HOUR,
        issueKey: "DEMO-1",
        source: "in_app",
        status: "pending",
      },
      {
        createdBy: "alex",
        createdOffsetMs: 34 * HOUR,
        issueKey: "DEMO-4",
        snoozedUntil: now + 5 * DAY,
        source: "api",
        sourceEmail: "feedback-hooks@nixelo.test",
        status: "snoozed",
        triagedOffsetMs: 6 * HOUR,
      },
      {
        createdBy: "owner",
        createdOffsetMs: 40 * HOUR,
        issueKey: "DEMO-6",
        source: "form",
        sourceEmail: "intake@nixelo.test",
        status: "pending",
      },
    ];
  }

  return [
    {
      createdBy: "owner",
      createdOffsetMs: 5 * HOUR,
      issueKey: "DEMO-7",
      source: "in_app",
      status: "pending",
    },
    {
      createdBy: "alex",
      createdOffsetMs: 20 * HOUR,
      issueKey: "DEMO-2",
      snoozedUntil: now + 2 * DAY,
      source: "email",
      sourceEmail: "alerts@northstarlabs.example",
      status: "snoozed",
      triagedOffsetMs: 4 * HOUR,
    },
    {
      createdBy: "sarah",
      createdOffsetMs: 30 * HOUR,
      issueKey: "DEMO-1",
      source: "in_app",
      status: "accepted",
      triagedOffsetMs: 26 * HOUR,
    },
    {
      createdBy: "alex",
      createdOffsetMs: 34 * HOUR,
      declineReason: "Outside current launch scope",
      issueKey: "DEMO-4",
      source: "api",
      sourceEmail: "feedback-hooks@nixelo.test",
      status: "declined",
      triagedOffsetMs: 22 * HOUR,
    },
    {
      createdBy: "owner",
      createdOffsetMs: 40 * HOUR,
      duplicateOfKey: "DEMO-3",
      issueKey: "DEMO-6",
      source: "form",
      sourceEmail: "intake@nixelo.test",
      status: "duplicate",
      triagedOffsetMs: 21 * HOUR,
    },
  ];
}

function countSeededInboxIssues(definitions: SeededInboxDefinition[]) {
  let openCount = 0;
  let closedCount = 0;

  for (const definition of definitions) {
    if (definition.status === "pending" || definition.status === "snoozed") {
      openCount += 1;
    } else {
      closedCount += 1;
    }
  }

  return { closedCount, openCount };
}

function buildSeededNotificationDefinitions(
  mode: SeededNotificationsMode,
): SeededNotificationDefinition[] {
  if (mode === "inboxEmpty") {
    return [
      {
        actor: "alex",
        hoursAgo: 4,
        isArchived: true,
        isRead: true,
        issueKey: "DEMO-1",
        message:
          "Alex archived the DEMO-1 handoff once the checklist was captured in the sprint note.",
        title: "Checklist handoff archived",
        type: "issue_status_changed",
      },
      {
        actor: "sarah",
        hoursAgo: 12,
        isArchived: true,
        isRead: true,
        issueKey: "DEMO-3",
        message: "Sarah archived the DEMO-3 comment thread after the launch note was finalized.",
        title: "Comment thread archived",
        type: "issue_commented",
      },
      {
        actor: "owner",
        hoursAgo: 28,
        isArchived: true,
        isRead: true,
        issueKey: "DEMO-7",
        message:
          "The release checklist reminder moved into the archive after the owner reviewed it.",
        title: "Release reminder archived",
        type: "issue_assigned",
      },
    ];
  }

  if (mode === "archivedEmpty") {
    return [
      {
        actor: "owner",
        hoursAgo: 1,
        isRead: false,
        issueKey: "DEMO-1",
        message: "DEMO-1 needs a final owner confirmation before the rollout checklist closes.",
        title: "Owner confirmation requested",
        type: "issue_assigned",
      },
      {
        actor: "alex",
        hoursAgo: 3,
        isRead: false,
        issueKey: "DEMO-3",
        message:
          'Alex left a new launch comment: "Please recheck the acceptance copy before we ship."',
        title: "Launch copy comment",
        type: "issue_commented",
      },
      {
        actor: "sarah",
        hoursAgo: 9,
        isRead: true,
        issueKey: "DEMO-5",
        message: "Sarah mentioned you in the database optimization thread for one final review.",
        title: "Review mention from Sarah",
        type: "issue_mentioned",
      },
    ];
  }

  if (mode === "unreadOverflow") {
    const overflowTypes = [
      "issue_assigned",
      "issue_commented",
      "issue_mentioned",
      "issue_status_changed",
    ] as const;

    return Array.from({ length: 100 }, (_, index) => {
      const issueKey = `DEMO-${(index % 7) + 1}`;
      const ordinal = index + 1;
      return {
        actor: index % 3 === 0 ? "owner" : index % 3 === 1 ? "alex" : "sarah",
        hoursAgo: (index % 48) + 1,
        isRead: false,
        issueKey,
        message: `Overflow notification ${ordinal} keeps the unread badge pinned above ninety-nine for screenshot review.`,
        title: `Overflow notification ${ordinal}`,
        type: overflowTypes[index % overflowTypes.length],
      };
    });
  }

  return [
    {
      actor: "owner",
      hoursAgo: 1,
      isRead: false,
      issueKey: "DEMO-1",
      message: "DEMO-1: Set up CI/CD pipeline was assigned to you",
      title: "Issue assigned to you",
      type: "issue_assigned",
    },
    {
      actor: "alex",
      hoursAgo: 3,
      isRead: false,
      issueKey: "DEMO-3",
      message: 'Alex Rivera commented: "Dashboard layout looks great, merging now."',
      title: "New comment on DEMO-3",
      type: "issue_commented",
    },
    {
      actor: "sarah",
      hoursAgo: 8,
      isRead: false,
      issueKey: "DEMO-5",
      message: "Sarah Kim mentioned you in DEMO-5: Database query optimization",
      title: "You were mentioned",
      type: "issue_mentioned",
    },
    {
      actor: "owner",
      hoursAgo: 24,
      isRead: true,
      issueKey: "DEMO-2",
      message: "DEMO-2: Fix login timeout moved from In Progress to In Review",
      title: "Issue status updated",
      type: "issue_status_changed",
    },
    {
      actor: "alex",
      hoursAgo: 48,
      isRead: true,
      issueKey: "DEMO-7",
      message: "Sprint 1 has started with 5 issues assigned",
      title: "Sprint started",
      type: "sprint_started",
    },
  ];
}

function countSeededNotifications(definitions: SeededNotificationDefinition[]) {
  let archivedCount = 0;
  let unreadCount = 0;
  let visibleCount = 0;

  for (const definition of definitions) {
    if (definition.isArchived) {
      archivedCount += 1;
      continue;
    }

    visibleCount += 1;
    if (!definition.isRead) {
      unreadCount += 1;
    }
  }

  return { archivedCount, unreadCount, visibleCount };
}

async function resolveSeededInboxUserId(
  ctx: MutationCtx,
  email: string,
): Promise<Id<"users"> | null> {
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .first();
  return user?._id ?? null;
}

async function resolveSeededScreenshotActors(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    projectId: Id<"projects">;
    issueIdsByKey?: ReadonlyMap<string, Id<"issues">>;
  },
): Promise<
  | {
      success: true;
      actorIds: Record<SeededInboxActorKey, Id<"users">>;
      ownerUserId: Id<"users">;
    }
  | {
      success: false;
      error: string;
    }
> {
  const issueIdsByKey = new Map<string, Id<"issues">>(args.issueIdsByKey ?? []);
  const project = await ctx.db.get(args.projectId);

  if (!project || project.organizationId !== args.organizationId) {
    return {
      success: false,
      error: "Unable to resolve seeded screenshot project owner",
    };
  }

  if (!issueIdsByKey.has("DEMO-7")) {
    const projectIssues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);

    for (const issue of projectIssues) {
      if (!issueIdsByKey.has(issue.key)) {
        issueIdsByKey.set(issue.key, issue._id);
      }
    }
  }

  const ownerIssueId = issueIdsByKey.get("DEMO-7");
  const ownerIssue = ownerIssueId ? await ctx.db.get(ownerIssueId) : null;
  const fallbackMember = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    .take(1);
  const ownerUserId = project.ownerId ?? ownerIssue?.reporterId ?? fallbackMember[0]?.userId;

  if (!ownerUserId) {
    return { success: false, error: "Unable to resolve screenshot owner user" };
  }

  return {
    success: true,
    ownerUserId,
    actorIds: {
      owner: ownerUserId,
      alex:
        (await resolveSeededInboxUserId(ctx, SCREENSHOT_INBOX_SYNTHETIC_EMAILS.alex)) ??
        ownerUserId,
      sarah:
        (await resolveSeededInboxUserId(ctx, SCREENSHOT_INBOX_SYNTHETIC_EMAILS.sarah)) ??
        ownerUserId,
    },
  };
}

async function resetSeededProjectInboxIssues(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    projectId: Id<"projects">;
    mode: SeededProjectInboxMode;
    issueIdsByKey?: ReadonlyMap<string, Id<"issues">>;
  },
): Promise<{ success: boolean; openCount?: number; closedCount?: number; error?: string }> {
  const now = Date.now();
  const definitions = buildSeededProjectInboxDefinitions(args.mode, now);
  const requiredIssueKeys = new Set<string>();

  for (const definition of definitions) {
    requiredIssueKeys.add(definition.issueKey);
    if (definition.duplicateOfKey) {
      requiredIssueKeys.add(definition.duplicateOfKey);
    }
  }

  const issueIdsByKey = new Map<string, Id<"issues">>(args.issueIdsByKey ?? []);
  if (issueIdsByKey.size < requiredIssueKeys.size) {
    const projectIssues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);

    for (const issue of projectIssues) {
      if (requiredIssueKeys.has(issue.key)) {
        issueIdsByKey.set(issue.key, issue._id);
      }
    }
  }

  const missingIssueKey = [...requiredIssueKeys].find((issueKey) => !issueIdsByKey.has(issueKey));
  if (missingIssueKey) {
    return {
      success: false,
      error: `seeded inbox issue not found for screenshot state: ${missingIssueKey}`,
    };
  }

  const screenshotActors = await resolveSeededScreenshotActors(ctx, {
    organizationId: args.organizationId,
    projectId: args.projectId,
    issueIdsByKey,
  });
  if (!screenshotActors.success) {
    return { success: false, error: screenshotActors.error };
  }
  const { actorIds, ownerUserId } = screenshotActors;

  const existingInboxIssues = await ctx.db
    .query("inboxIssues")
    .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
    .take(BOUNDED_LIST_LIMIT);

  for (const inboxIssue of existingInboxIssues) {
    await ctx.db.delete(inboxIssue._id);
  }

  for (const definition of definitions) {
    const issueId = issueIdsByKey.get(definition.issueKey);
    if (!issueId) {
      return {
        success: false,
        error: `seeded inbox issue not found after validation: ${definition.issueKey}`,
      };
    }

    const duplicateOfId = definition.duplicateOfKey
      ? issueIdsByKey.get(definition.duplicateOfKey)
      : undefined;

    await ctx.db.insert("inboxIssues", {
      projectId: args.projectId,
      issueId,
      status: definition.status,
      source: definition.source,
      sourceEmail: definition.sourceEmail,
      snoozedUntil: definition.snoozedUntil,
      duplicateOfId,
      declineReason: definition.declineReason,
      createdBy: actorIds[definition.createdBy],
      createdAt: now - definition.createdOffsetMs,
      triagedAt: definition.triagedOffsetMs ? now - definition.triagedOffsetMs : undefined,
      triagedBy: definition.triagedOffsetMs ? ownerUserId : undefined,
      updatedAt: now - (definition.triagedOffsetMs ?? definition.createdOffsetMs),
    });
  }

  return {
    success: true,
    ...countSeededInboxIssues(definitions),
  };
}

function buildSeededAssistantUsageDefinitions(
  mode: SeededAssistantMode,
): SeededAssistantUsageDefinition[] {
  return mode === "empty" ? [] : SCREENSHOT_ASSISTANT_USAGE_DEFAULT;
}

function buildSeededAssistantChatDefinitions(
  mode: SeededAssistantMode,
): SeededAssistantChatDefinition[] {
  return mode === "empty" ? [] : SCREENSHOT_ASSISTANT_CHATS_DEFAULT;
}

async function resetSeededAssistantState(
  ctx: MutationCtx,
  args: {
    mode: SeededAssistantMode;
    now: number;
    primaryProjectId: Id<"projects">;
    secondaryProjectId: Id<"projects">;
    userId: Id<"users">;
  },
): Promise<{
  success: boolean;
  chatCount?: number;
  requestCount?: number;
  error?: string;
}> {
  const usageRecords = await ctx.db
    .query("aiUsage")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .take(BOUNDED_LIST_LIMIT);

  for (const usage of usageRecords) {
    await ctx.db.delete(usage._id);
  }

  while (true) {
    const chats = await ctx.db
      .query("aiChats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(BOUNDED_LIST_LIMIT);

    if (chats.length === 0) {
      break;
    }

    for (const chat of chats) {
      const messages = await ctx.db
        .query("aiMessages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .take(BOUNDED_LIST_LIMIT);

      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      await ctx.db.delete(chat._id);
    }
  }

  const projectIdsByKey = {
    DEMO: args.primaryProjectId,
    OPS: args.secondaryProjectId,
  } as const;

  const usageDefinitions = buildSeededAssistantUsageDefinitions(args.mode);
  for (const definition of usageDefinitions) {
    await ctx.db.insert("aiUsage", {
      completionTokens: definition.completionTokens,
      errorMessage: definition.success ? undefined : "Seeded assistant request failed",
      estimatedCost: definition.estimatedCost,
      model: definition.model,
      operation: definition.operation,
      projectId: definition.projectKey ? projectIdsByKey[definition.projectKey] : undefined,
      promptTokens: definition.promptTokens,
      provider: definition.provider,
      responseTime: definition.responseTime,
      success: definition.success,
      totalTokens: definition.promptTokens + definition.completionTokens,
      userId: args.userId,
    });
  }

  const chatDefinitions = buildSeededAssistantChatDefinitions(args.mode);
  for (const definition of chatDefinitions) {
    const chatId = await ctx.db.insert("aiChats", {
      projectId: definition.projectKey ? projectIdsByKey[definition.projectKey] : undefined,
      title: definition.title,
      updatedAt: args.now - definition.updatedOffsetMs,
      userId: args.userId,
    });

    for (const pair of definition.messagePairs) {
      await ctx.db.insert("aiMessages", {
        chatId,
        content: pair.user,
        role: "user",
      });
      await ctx.db.insert("aiMessages", {
        chatId,
        content: pair.assistant,
        modelUsed: definition.projectKey ? "claude-3-5-sonnet" : "gpt-4.1-mini",
        responseTime: 380,
        role: "assistant",
        tokensUsed: 480,
      });
    }
  }

  return {
    success: true,
    chatCount: chatDefinitions.length,
    requestCount: usageDefinitions.length,
  };
}

async function syncSeededProjectMembershipForRouteState(
  ctx: MutationCtx,
  args: {
    actorId: Id<"users">;
    projectId: Id<"projects">;
    shouldBeVisible: boolean;
    userId: Id<"users">;
  },
): Promise<void> {
  const memberships = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", args.projectId).eq("userId", args.userId),
    )
    .take(BOUNDED_LIST_LIMIT);

  const sortedMemberships = [...memberships].sort((a, b) => b._creationTime - a._creationTime);

  if (!args.shouldBeVisible) {
    for (const membership of sortedMemberships) {
      if (!membership.isDeleted) {
        await ctx.db.patch(membership._id, softDeleteFields(args.actorId));
      }
    }
    return;
  }

  const [primaryMembership, ...duplicateMemberships] = sortedMemberships;
  if (!primaryMembership) {
    await ctx.db.insert("projectMembers", {
      addedBy: args.actorId,
      projectId: args.projectId,
      role: "admin",
      userId: args.userId,
    });
    return;
  }

  await ctx.db.patch(primaryMembership._id, {
    addedBy: args.actorId,
    deletedAt: undefined,
    deletedBy: undefined,
    isDeleted: undefined,
    role: "admin",
  });

  for (const membership of duplicateMemberships) {
    if (!membership.isDeleted) {
      await ctx.db.patch(membership._id, softDeleteFields(args.actorId));
    }
  }
}

async function resetSeededProjectsRouteState(
  ctx: MutationCtx,
  args: {
    mode: SeededProjectsRouteMode;
    ownerUserId: Id<"users">;
    primaryProjectId: Id<"projects">;
    secondaryProjectId: Id<"projects">;
  },
): Promise<{ success: boolean; visibleProjectCount?: number; error?: string }> {
  const showPrimaryProject = args.mode !== "empty";
  const showSecondaryProject = args.mode === "default";

  await syncSeededProjectMembershipForRouteState(ctx, {
    actorId: args.ownerUserId,
    projectId: args.primaryProjectId,
    shouldBeVisible: showPrimaryProject,
    userId: args.ownerUserId,
  });
  await syncSeededProjectMembershipForRouteState(ctx, {
    actorId: args.ownerUserId,
    projectId: args.secondaryProjectId,
    shouldBeVisible: showSecondaryProject,
    userId: args.ownerUserId,
  });

  return {
    success: true,
    visibleProjectCount: Number(showPrimaryProject) + Number(showSecondaryProject),
  };
}

async function resetSeededNotificationsForUser(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    projectId: Id<"projects">;
    mode: SeededNotificationsMode;
    issueIdsByKey?: ReadonlyMap<string, Id<"issues">>;
    userId?: Id<"users">;
  },
): Promise<{
  success: boolean;
  archivedCount?: number;
  unreadCount?: number;
  visibleCount?: number;
  error?: string;
}> {
  const definitions = buildSeededNotificationDefinitions(args.mode);
  const screenshotActors = await resolveSeededScreenshotActors(ctx, {
    organizationId: args.organizationId,
    projectId: args.projectId,
    issueIdsByKey: args.issueIdsByKey,
  });
  if (!screenshotActors.success) {
    return { success: false, error: screenshotActors.error };
  }
  const targetUserId = args.userId ?? screenshotActors.ownerUserId;

  const requiredIssueKeys = new Set(
    definitions
      .map((definition) => definition.issueKey)
      .filter((issueKey): issueKey is string => issueKey !== undefined),
  );
  const issueIdsByKey = new Map<string, Id<"issues">>(args.issueIdsByKey ?? []);

  if (issueIdsByKey.size < requiredIssueKeys.size) {
    const projectIssues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);

    for (const issue of projectIssues) {
      if (requiredIssueKeys.has(issue.key)) {
        issueIdsByKey.set(issue.key, issue._id);
      }
    }
  }

  const missingIssueKey = [...requiredIssueKeys].find((issueKey) => !issueIdsByKey.has(issueKey));
  if (missingIssueKey) {
    return {
      success: false,
      error: `seeded notification issue not found for screenshot state: ${missingIssueKey}`,
    };
  }

  const existingNotifications = await ctx.db
    .query("notifications")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .take(BOUNDED_LIST_LIMIT);

  for (const notification of existingNotifications) {
    if (notification.projectId === args.projectId) {
      await ctx.db.delete(notification._id);
    }
  }

  const now = Date.now();
  for (const definition of definitions) {
    await ctx.db.insert("notifications", {
      userId: targetUserId,
      type: definition.type,
      title: definition.title,
      message: definition.message,
      issueId: definition.issueKey ? issueIdsByKey.get(definition.issueKey) : undefined,
      projectId: args.projectId,
      actorId: screenshotActors.actorIds[definition.actor],
      isRead: definition.isRead,
      isArchived: definition.isArchived,
      archivedAt: definition.isArchived ? now - definition.hoursAgo * HOUR : undefined,
    });
  }

  return {
    success: true,
    ...countSeededNotifications(definitions),
  };
}

async function resetSeededRoadmapState(
  ctx: MutationCtx,
  args: {
    mode: SeededRoadmapMode;
    organizationId: Id<"organizations">;
    projectId: Id<"projects">;
  },
): Promise<{
  success: boolean;
  issueCount?: number;
  linkCount?: number;
  projectId?: Id<"projects">;
  error?: string;
}> {
  const screenshotActors = await resolveSeededScreenshotActors(ctx, {
    organizationId: args.organizationId,
    projectId: args.projectId,
  });
  if (!screenshotActors.success) {
    return { success: false, error: screenshotActors.error };
  }

  const projectIssues = await ctx.db
    .query("issues")
    .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
    .filter(notDeleted)
    .take(BOUNDED_LIST_LIMIT);

  if (projectIssues.length === 0) {
    return { success: false, error: `No project issues found for roadmap mode ${args.mode}` };
  }

  const issueIdsByKey = new Map(projectIssues.map((issue) => [issue.key, issue._id]));
  const roadmapDefinitions = buildSeededRoadmapIssueDefinitions(args.mode);
  const roadmapDefinitionsByKey = new Map(
    roadmapDefinitions.map((definition) => [definition.key, definition]),
  );
  const now = Date.now();
  const dayStartMs = getDayStartMs(now);

  for (const issue of projectIssues) {
    const definition = roadmapDefinitionsByKey.get(issue.key);
    const startDate =
      definition?.startOffsetDays !== undefined
        ? dayStartMs + definition.startOffsetDays * DAY
        : undefined;
    const dueDate =
      definition?.dueOffsetDays !== undefined
        ? dayStartMs + definition.dueOffsetDays * DAY
        : undefined;

    await ctx.db.patch(issue._id, {
      dueDate,
      startDate,
      updatedAt: now,
    });
  }

  const projectIssueIds = new Set(projectIssues.map((issue) => issue._id.toString()));
  const deletedLinkIds = new Set<string>();
  for (const issue of projectIssues) {
    const outgoingLinks = await ctx.db
      .query("issueLinks")
      .withIndex("by_from_issue", (q) => q.eq("fromIssueId", issue._id))
      .take(BOUNDED_LIST_LIMIT);
    const incomingLinks = await ctx.db
      .query("issueLinks")
      .withIndex("by_to_issue", (q) => q.eq("toIssueId", issue._id))
      .take(BOUNDED_LIST_LIMIT);

    for (const link of [...outgoingLinks, ...incomingLinks]) {
      if (deletedLinkIds.has(link._id.toString())) {
        continue;
      }

      if (
        projectIssueIds.has(link.fromIssueId.toString()) &&
        projectIssueIds.has(link.toIssueId.toString())
      ) {
        deletedLinkIds.add(link._id.toString());
        await ctx.db.delete(link._id);
      }
    }
  }

  if (args.mode !== "empty") {
    for (const link of SCREENSHOT_ROADMAP_LINKS) {
      const fromIssueId = issueIdsByKey.get(link.fromKey);
      const toIssueId = issueIdsByKey.get(link.toKey);
      if (!(fromIssueId && toIssueId)) {
        return {
          success: false,
          error: `Missing seeded issue for roadmap link ${link.fromKey} -> ${link.toKey}`,
        };
      }

      await ctx.db.insert("issueLinks", {
        createdBy: screenshotActors.ownerUserId,
        fromIssueId,
        isDeleted: false,
        linkType: "blocks",
        toIssueId,
      });
    }
  }

  return {
    success: true,
    issueCount: roadmapDefinitions.length,
    linkCount: args.mode === "empty" ? 0 : SCREENSHOT_ROADMAP_LINKS.length,
    projectId: args.projectId,
  };
}

async function resetSeededTimeTrackingState(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    projectId: Id<"projects">;
    mode: SeededTimeTrackingMode;
  },
): Promise<{
  success: boolean;
  entryCount?: number;
  projectId?: Id<"projects">;
  rateCount?: number;
  error?: string;
}> {
  const screenshotActors = await resolveSeededScreenshotActors(ctx, {
    organizationId: args.organizationId,
    projectId: args.projectId,
  });
  if (!screenshotActors.success) {
    return { success: false, error: screenshotActors.error };
  }

  const { ownerUserId } = screenshotActors;
  const now = Date.now();
  const dayStartMs = getDayStartMs(now);

  while (true) {
    const existingEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", ownerUserId).eq("projectId", args.projectId),
      )
      .take(BOUNDED_LIST_LIMIT);

    if (existingEntries.length === 0) {
      break;
    }

    for (const entry of existingEntries) {
      await ctx.db.delete(entry._id);
    }
  }

  const existingRates = await ctx.db
    .query("userRates")
    .withIndex("by_user", (q) => q.eq("userId", ownerUserId))
    .take(BOUNDED_LIST_LIMIT);

  for (const rate of existingRates) {
    if (rate.projectId === undefined || rate.projectId === args.projectId) {
      await ctx.db.delete(rate._id);
    }
  }

  const entryDefinitions = buildSeededTimeTrackingEntryDefinitions(args.mode);
  for (let index = 0; index < entryDefinitions.length; index += 1) {
    const entry = entryDefinitions[index];
    const entryDate = dayStartMs + entry.dayOffset * DAY;
    const durationSeconds = entry.durationHours * 3600;
    const minuteOffset = index % 120;
    const startTime = entryDate + 9 * HOUR + minuteOffset * MINUTE;
    const endTime = startTime + durationSeconds * SECOND;
    const totalCost =
      entry.billable && entry.hourlyRate ? entry.durationHours * entry.hourlyRate : undefined;

    await ctx.db.insert("timeEntries", {
      billable: entry.billable,
      billed: false,
      currency: "USD",
      date: entryDate,
      description: entry.description,
      duration: durationSeconds,
      endTime,
      hourlyRate: entry.hourlyRate,
      isApproved: false,
      isEquityHour: false,
      isLocked: false,
      projectId: args.projectId,
      startTime,
      tags: [],
      totalCost,
      updatedAt: now,
      userId: ownerUserId,
      activity: entry.activity,
    });
  }

  const rateDefinitions =
    args.mode === "ratesPopulated" ? SCREENSHOT_TIME_TRACKING_REVIEW_RATES : [];
  for (let index = 0; index < rateDefinitions.length; index += 1) {
    const rate = rateDefinitions[index];
    await ctx.db.insert("userRates", {
      currency: rate.currency,
      effectiveFrom: now - index * MINUTE,
      effectiveTo: undefined,
      hourlyRate: rate.hourlyRate,
      notes: rate.notes,
      projectId: rate.projectScoped ? args.projectId : undefined,
      rateType: rate.rateType,
      setBy: ownerUserId,
      updatedAt: now,
      userId: ownerUserId,
    });
  }

  return {
    success: true,
    entryCount: entryDefinitions.length,
    projectId: args.projectId,
    rateCount: rateDefinitions.length,
  };
}

async function resetSeededProjectAnalyticsState(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    projectId: Id<"projects">;
    mode: SeededProjectAnalyticsMode;
  },
): Promise<{
  success: boolean;
  activityCount?: number;
  issueCount?: number;
  projectId?: Id<"projects">;
  sprintCount?: number;
  error?: string;
}> {
  const now = Date.now();
  const project = await ctx.db.get(args.projectId);
  if (!project) {
    return { success: false, error: `project not found: ${args.projectId}` };
  }

  const screenshotActors = await resolveSeededScreenshotActors(ctx, {
    organizationId: args.organizationId,
    projectId: args.projectId,
  });
  if (!screenshotActors.success) {
    return { success: false, error: screenshotActors.error };
  }

  const { actorIds, ownerUserId } = screenshotActors;
  const sprintDefinitions = buildSeededProjectAnalyticsSprintDefinitions(args.mode, now);
  const issueDefinitions = buildSeededProjectAnalyticsIssueDefinitions(args.mode, now);
  const activityDefinitions = buildSeededProjectAnalyticsActivityDefinitions(args.mode, now);
  const desiredSprintNames = new Set(sprintDefinitions.map((definition) => definition.name));
  const desiredIssueKeys = new Set(issueDefinitions.map((definition) => definition.key));

  const existingSprints = await ctx.db
    .query("sprints")
    .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
    .take(BOUNDED_LIST_LIMIT);
  const existingSprintsByName = new Map(existingSprints.map((sprint) => [sprint.name, sprint]));
  const sprintIdsByName = new Map<string, Id<"sprints">>();

  for (const definition of sprintDefinitions) {
    const existingSprint = existingSprintsByName.get(definition.name);

    if (existingSprint) {
      await ctx.db.patch(existingSprint._id, {
        ...restoreFields(),
        endDate: definition.endDate,
        goal: definition.goal,
        name: definition.name,
        projectId: args.projectId,
        startDate: definition.startDate,
        status: definition.status,
        updatedAt: now,
      });
      sprintIdsByName.set(definition.name, existingSprint._id);
      continue;
    }

    const sprintId = await ctx.db.insert("sprints", {
      createdBy: ownerUserId,
      endDate: definition.endDate,
      goal: definition.goal,
      name: definition.name,
      projectId: args.projectId,
      startDate: definition.startDate,
      status: definition.status,
      updatedAt: now,
    });
    sprintIdsByName.set(definition.name, sprintId);
  }

  for (const sprint of existingSprints) {
    if (desiredSprintNames.has(sprint.name)) {
      continue;
    }

    await ctx.db.delete(sprint._id);
  }

  const existingIssues = await ctx.db
    .query("issues")
    .withIndex("by_project_deleted", (q) => q.eq("projectId", args.projectId))
    .take(BOUNDED_LIST_LIMIT);
  const existingIssuesByKey = new Map(existingIssues.map((issue) => [issue.key, issue]));
  const issueIdsByKey = new Map<string, Id<"issues">>();

  for (let index = 0; index < issueDefinitions.length; index += 1) {
    const definition = issueDefinitions[index];
    const existingIssue = existingIssuesByKey.get(definition.key);
    const assigneeId = definition.assignedTo === null ? undefined : actorIds[definition.assignedTo];
    const sprintId = definition.sprintName ? sprintIdsByName.get(definition.sprintName) : undefined;
    const updatedAt =
      activityDefinitions.find((activity) => activity.issueKey === definition.key)?.timestamp ??
      now;

    if (definition.sprintName && !sprintId) {
      return {
        success: false,
        error: `missing sprint "${definition.sprintName}" for analytics state ${args.mode}`,
      };
    }

    if (existingIssue) {
      await ctx.db.patch(existingIssue._id, {
        ...restoreFields(),
        assigneeId,
        attachments: [],
        dueDate: definition.dueDate,
        labels: [],
        linkedDocuments: [],
        order: index,
        organizationId: args.organizationId,
        priority: definition.priority,
        projectId: args.projectId,
        reporterId: ownerUserId,
        searchContent: definition.title,
        sprintId,
        status: definition.status,
        storyPoints: definition.storyPoints,
        teamId: project.teamId,
        title: definition.title,
        type: definition.type,
        updatedAt,
        version: existingIssue.version ?? 1,
        workspaceId: project.workspaceId,
      });
      issueIdsByKey.set(definition.key, existingIssue._id);
      continue;
    }

    const issueId = await ctx.db.insert("issues", {
      assigneeId,
      attachments: [],
      dueDate: definition.dueDate,
      key: definition.key,
      labels: [],
      linkedDocuments: [],
      order: index,
      organizationId: args.organizationId,
      priority: definition.priority,
      projectId: args.projectId,
      reporterId: ownerUserId,
      searchContent: definition.title,
      sprintId,
      status: definition.status,
      storyPoints: definition.storyPoints,
      teamId: project.teamId,
      title: definition.title,
      type: definition.type,
      updatedAt,
      version: 1,
      workspaceId: project.workspaceId,
    });
    issueIdsByKey.set(definition.key, issueId);
  }

  for (const issue of existingIssues) {
    if (desiredIssueKeys.has(issue.key)) {
      continue;
    }

    await ctx.db.patch(issue._id, {
      ...softDeleteFields(ownerUserId),
      updatedAt: now,
    });
  }

  for (const issue of existingIssues) {
    const activities = await ctx.db
      .query("issueActivity")
      .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
      .take(BOUNDED_LIST_LIMIT);

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }
  }

  for (const activity of activityDefinitions) {
    const issueId = issueIdsByKey.get(activity.issueKey);
    if (!issueId) {
      return {
        success: false,
        error: `missing issue "${activity.issueKey}" for analytics activity state ${args.mode}`,
      };
    }

    await ctx.db.insert("issueActivity", {
      action: activity.action,
      field: activity.field,
      issueId,
      newValue: activity.newValue,
      oldValue: activity.oldValue,
      userId: actorIds[activity.actor],
    });
  }

  await syncProjectIssueStats(ctx, args.projectId);

  return {
    success: true,
    activityCount: activityDefinitions.length,
    issueCount: issueDefinitions.length,
    projectId: args.projectId,
    sprintCount: sprintDefinitions.length,
  };
}

async function clearSeededProjectAnalyticsState(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    projectId: Id<"projects">;
  },
): Promise<{
  success: boolean;
  activityCount?: number;
  issueCount?: number;
  projectId?: Id<"projects">;
  sprintCount?: number;
  error?: string;
}> {
  const now = Date.now();
  const project = await ctx.db.get(args.projectId);
  if (!project) {
    return { success: false, error: `project not found: ${args.projectId}` };
  }

  const screenshotActors = await resolveSeededScreenshotActors(ctx, {
    organizationId: args.organizationId,
    projectId: args.projectId,
  });
  if (!screenshotActors.success) {
    return { success: false, error: screenshotActors.error };
  }

  const { ownerUserId } = screenshotActors;
  const existingSprints = await ctx.db
    .query("sprints")
    .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
    .take(BOUNDED_LIST_LIMIT);

  for (const sprint of existingSprints) {
    await ctx.db.delete(sprint._id);
  }

  const existingIssues = await ctx.db
    .query("issues")
    .withIndex("by_project_deleted", (q) => q.eq("projectId", args.projectId))
    .take(BOUNDED_LIST_LIMIT);

  let activityCount = 0;
  for (const issue of existingIssues) {
    const activities = await ctx.db
      .query("issueActivity")
      .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
      .take(BOUNDED_LIST_LIMIT);
    activityCount += activities.length;

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    await ctx.db.patch(issue._id, {
      ...softDeleteFields(ownerUserId),
      updatedAt: now,
    });
  }

  await syncProjectIssueStats(ctx, args.projectId);

  return {
    success: true,
    activityCount,
    issueCount: 0,
    projectId: args.projectId,
    sprintCount: 0,
  };
}

const SCREENSHOT_OUTREACH_MAILBOX = {
  dailySendLimit: 40,
  displayName: "Alex Sender",
  email: "alex.sender.screenshots@nixelo.test",
  minuteSendCount: 2,
  minuteSendLimit: 5,
  todaySendCount: 14,
} as const;

const SCREENSHOT_OUTREACH_CONTACTS = [
  {
    company: "Northstar Labs",
    customFields: { persona: "Founder", segment: "Expansion" },
    email: "jamie.rivera.screenshots@nixelo.test",
    firstName: "Jamie",
    lastName: "Rivera",
    tags: ["vip", "saas"],
    timezone: "America/Chicago",
  },
  {
    company: "Orbit Health",
    customFields: { persona: "RevOps", segment: "Pipeline" },
    email: "taylor.north.screenshots@nixelo.test",
    firstName: "Taylor",
    lastName: "North",
    tags: ["revops", "pilot"],
    timezone: "America/New_York",
  },
  {
    company: "Summit Grid",
    customFields: { persona: "Operations", segment: "Activation" },
    email: "casey.lee.screenshots@nixelo.test",
    firstName: "Casey",
    lastName: "Lee",
    tags: ["ops", "expansion"],
    timezone: "America/Denver",
  },
  {
    company: "Lumen Works",
    customFields: { persona: "CEO", segment: "Warm" },
    email: "morgan.hale.screenshots@nixelo.test",
    firstName: "Morgan",
    lastName: "Hale",
    tags: ["warm", "founder"],
    timezone: "America/Los_Angeles",
  },
  {
    company: "Beacon Point",
    customFields: { persona: "Marketing", segment: "Paused" },
    email: "avery.shah.screenshots@nixelo.test",
    firstName: "Avery",
    lastName: "Shah",
    tags: ["marketing", "nurture"],
    timezone: "Europe/London",
  },
] as const;

const SCREENSHOT_OUTREACH_SEQUENCE_NAMES = [
  "Launch Expansion Sequence",
  "Founder Follow-up Pilot",
] as const;

/**
 * Check if email is a test email
 */
function isTestEmail(email: string): boolean {
  return email.endsWith("@inbox.mailtrap.io");
}

function generateUnsubscribePreviewToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function generateInvitePreviewToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomUUID().replace(/-/g, "");
  return `invite_${timestamp}_${randomPart}`;
}

async function deleteOutreachEnrollmentGraph(
  ctx: MutationCtx,
  enrollmentId: Id<"outreachEnrollments">,
): Promise<void> {
  const [events, trackingLinks] = await Promise.all([
    ctx.db
      .query("outreachEvents")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", enrollmentId))
      .collect(),
    ctx.db
      .query("outreachTrackingLinks")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", enrollmentId))
      .collect(),
  ]);

  for (const event of events) {
    await ctx.db.delete(event._id);
  }

  for (const trackingLink of trackingLinks) {
    await ctx.db.delete(trackingLink._id);
  }

  await ctx.db.delete(enrollmentId);
}

async function deleteOutreachSequenceGraph(
  ctx: MutationCtx,
  sequenceId: Id<"outreachSequences">,
): Promise<void> {
  const enrollments = await ctx.db
    .query("outreachEnrollments")
    .withIndex("by_sequence", (q) => q.eq("sequenceId", sequenceId))
    .collect();

  for (const enrollment of enrollments) {
    await deleteOutreachEnrollmentGraph(ctx, enrollment._id);
  }

  await ctx.db.delete(sequenceId);
}

async function seedScreenshotOutreachData(
  ctx: MutationCtx,
  args: {
    now: number;
    organizationId: Id<"organizations">;
    userId: Id<"users">;
  },
): Promise<void> {
  const { now, organizationId, userId } = args;
  const seededContactEmails = new Set<string>(
    SCREENSHOT_OUTREACH_CONTACTS.map((contact) => contact.email),
  );
  const seededSequenceNames = new Set<string>(SCREENSHOT_OUTREACH_SEQUENCE_NAMES);

  const existingSequences = await ctx.db
    .query("outreachSequences")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .take(BOUNDED_LIST_LIMIT);

  for (const sequence of existingSequences) {
    if (seededSequenceNames.has(sequence.name)) {
      await deleteOutreachSequenceGraph(ctx, sequence._id);
    }
  }

  for (const email of seededContactEmails) {
    const existingContacts = await ctx.db
      .query("outreachContacts")
      .withIndex("by_organization_email", (q) =>
        q.eq("organizationId", organizationId).eq("email", email),
      )
      .take(BOUNDED_LIST_LIMIT);

    for (const contact of existingContacts) {
      await ctx.db.delete(contact._id);
    }

    const suppressions = await ctx.db
      .query("outreachSuppressions")
      .withIndex("by_organization_email", (q) =>
        q.eq("organizationId", organizationId).eq("email", email),
      )
      .take(BOUNDED_LIST_LIMIT);

    for (const suppression of suppressions) {
      await ctx.db.delete(suppression._id);
    }
  }

  const existingMailboxes = await ctx.db
    .query("outreachMailboxes")
    .withIndex("by_user_provider", (q) => q.eq("userId", userId).eq("provider", "google"))
    .take(BOUNDED_LIST_LIMIT);

  for (const mailbox of existingMailboxes) {
    if (mailbox.email === SCREENSHOT_OUTREACH_MAILBOX.email) {
      await ctx.db.delete(mailbox._id);
    }
  }

  const encryptedMailboxTokens = await encryptMailboxTokensForStorage({
    accessToken: "screenshot-google-access-token",
    refreshToken: "screenshot-google-refresh-token",
  });

  const mailboxId = await ctx.db.insert("outreachMailboxes", {
    userId,
    organizationId,
    provider: "google",
    email: SCREENSHOT_OUTREACH_MAILBOX.email,
    displayName: SCREENSHOT_OUTREACH_MAILBOX.displayName,
    accessToken: encryptedMailboxTokens.accessToken,
    refreshToken: encryptedMailboxTokens.refreshToken,
    expiresAt: now + DAY,
    dailySendLimit: SCREENSHOT_OUTREACH_MAILBOX.dailySendLimit,
    todaySendCount: SCREENSHOT_OUTREACH_MAILBOX.todaySendCount,
    todayResetAt: now,
    minuteSendLimit: SCREENSHOT_OUTREACH_MAILBOX.minuteSendLimit,
    minuteSendCount: SCREENSHOT_OUTREACH_MAILBOX.minuteSendCount,
    minuteWindowStartedAt: now,
    isActive: true,
    lastHealthCheckAt: now - 10 * MINUTE,
    updatedAt: now - 5 * MINUTE,
  });

  const contactIds = new Map<string, Id<"outreachContacts">>();
  for (const [index, contact] of SCREENSHOT_OUTREACH_CONTACTS.entries()) {
    const contactId = await ctx.db.insert("outreachContacts", {
      organizationId,
      email: contact.email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company,
      timezone: contact.timezone,
      customFields: contact.customFields,
      tags: [...contact.tags],
      source: "manual",
      createdBy: userId,
      createdAt: now - (index + 1) * HOUR,
    });
    contactIds.set(contact.email, contactId);
  }

  const getContactId = (email: string): Id<"outreachContacts"> => {
    const contactId = contactIds.get(email);
    if (!contactId) {
      throw new Error(`Missing seeded outreach contact: ${email}`);
    }
    return contactId;
  };

  const launchSequenceId = await ctx.db.insert("outreachSequences", {
    organizationId,
    createdBy: userId,
    name: "Launch Expansion Sequence",
    status: "active",
    mailboxId,
    steps: [
      {
        order: 0,
        subject: "Launch notes for {{company}}",
        body: "Hi {{firstName}}, I pulled together a concise launch brief for {{company}} and thought it might help your rollout team.",
        delayDays: 0,
      },
      {
        order: 1,
        subject: "Customer rollout story for {{company}}",
        body: "Following up with a rollout example that matches the activation work you mentioned for {{company}}.",
        delayDays: 3,
      },
      {
        order: 2,
        subject: "Should I close the loop?",
        body: "If the timing is off I can close the loop for now, otherwise I can send the implementation checklist.",
        delayDays: 5,
      },
    ],
    physicalAddress: "500 Market Street, Austin, TX 78701",
    trackingDomain: "links.nixelo.test",
    stats: {
      enrolled: 3,
      sent: 4,
      opened: 4,
      replied: 1,
      bounced: 0,
      unsubscribed: 0,
    },
    createdAt: now - 3 * DAY,
    updatedAt: now - 30 * MINUTE,
  });

  const founderSequenceId = await ctx.db.insert("outreachSequences", {
    organizationId,
    createdBy: userId,
    name: "Founder Follow-up Pilot",
    status: "paused",
    mailboxId,
    steps: [
      {
        order: 0,
        subject: "Founder follow-up for {{company}}",
        body: "Hi {{firstName}}, sending a concise follow-up on the founder workflow we discussed.",
        delayDays: 0,
      },
      {
        order: 1,
        subject: "Still relevant for {{company}}?",
        body: "Wanted to check whether the founder workflow is still a priority this quarter.",
        delayDays: 4,
      },
    ],
    physicalAddress: "500 Market Street, Austin, TX 78701",
    trackingDomain: "pilot-links.nixelo.test",
    stats: {
      enrolled: 2,
      sent: 2,
      opened: 1,
      replied: 0,
      bounced: 1,
      unsubscribed: 0,
    },
    createdAt: now - 2 * DAY,
    updatedAt: now - 2 * HOUR,
  });

  const launchEnrollmentOneId = await ctx.db.insert("outreachEnrollments", {
    sequenceId: launchSequenceId,
    contactId: getContactId("jamie.rivera.screenshots@nixelo.test"),
    organizationId,
    currentStep: 2,
    status: "active",
    nextSendAt: now + 2 * DAY,
    enrolledAt: now - 36 * HOUR,
    completedAt: undefined,
    lastSentAt: now - 6 * HOUR,
    lastOpenedAt: now - 4 * HOUR,
    lastClickedAt: now - 4 * HOUR,
    lastRepliedAt: undefined,
    gmailThreadIds: ["thread-launch-expansion-1"],
  });

  const launchTrackingLinkRealId = await ctx.db.insert("outreachTrackingLinks", {
    enrollmentId: launchEnrollmentOneId,
    step: 0,
    originalUrl: "https://nixelo.test/customer-story",
    createdAt: now - 28 * HOUR,
  });

  const launchEnrollmentTwoId = await ctx.db.insert("outreachEnrollments", {
    sequenceId: launchSequenceId,
    contactId: getContactId("taylor.north.screenshots@nixelo.test"),
    organizationId,
    currentStep: 0,
    status: "replied",
    nextSendAt: undefined,
    enrolledAt: now - 30 * HOUR,
    completedAt: now - 22 * HOUR,
    lastSentAt: now - 26 * HOUR,
    lastOpenedAt: now - 24 * HOUR,
    lastClickedAt: undefined,
    lastRepliedAt: now - 22 * HOUR,
    gmailThreadIds: ["thread-launch-expansion-2"],
  });

  const launchEnrollmentThreeId = await ctx.db.insert("outreachEnrollments", {
    sequenceId: launchSequenceId,
    contactId: getContactId("casey.lee.screenshots@nixelo.test"),
    organizationId,
    currentStep: 1,
    status: "active",
    nextSendAt: now + DAY,
    enrolledAt: now - 14 * HOUR,
    completedAt: undefined,
    lastSentAt: now - 10 * HOUR,
    lastOpenedAt: now - 8 * HOUR,
    lastClickedAt: undefined,
    lastRepliedAt: undefined,
    gmailThreadIds: ["thread-launch-expansion-3"],
  });

  const founderEnrollmentOneId = await ctx.db.insert("outreachEnrollments", {
    sequenceId: founderSequenceId,
    contactId: getContactId("morgan.hale.screenshots@nixelo.test"),
    organizationId,
    currentStep: 0,
    status: "bounced",
    nextSendAt: undefined,
    enrolledAt: now - 18 * HOUR,
    completedAt: now - 17 * HOUR,
    lastSentAt: now - 17 * HOUR,
    lastOpenedAt: undefined,
    lastClickedAt: undefined,
    lastRepliedAt: undefined,
    gmailThreadIds: ["thread-founder-pilot-1"],
  });

  const founderEnrollmentTwoId = await ctx.db.insert("outreachEnrollments", {
    sequenceId: founderSequenceId,
    contactId: getContactId("avery.shah.screenshots@nixelo.test"),
    organizationId,
    currentStep: 1,
    status: "paused",
    nextSendAt: now + 3 * DAY,
    enrolledAt: now - 12 * HOUR,
    completedAt: undefined,
    lastSentAt: now - 9 * HOUR,
    lastOpenedAt: now - 8 * HOUR,
    lastClickedAt: undefined,
    lastRepliedAt: undefined,
    gmailThreadIds: ["thread-founder-pilot-2"],
  });

  const outreachEvents: Array<{
    enrollmentId: Id<"outreachEnrollments">;
    sequenceId: Id<"outreachSequences">;
    contactId: Id<"outreachContacts">;
    organizationId: Id<"organizations">;
    type: "sent" | "opened" | "clicked" | "replied" | "bounced";
    step: number;
    trackingLinkId?: Id<"outreachTrackingLinks">;
    metadata?: {
      bounceType?: string;
      diagnosticCode?: string;
      failedRecipient?: string;
      linkUrl?: string;
      replyContent?: string;
      userAgent?: string;
    };
    createdAt: number;
  }> = [
    {
      enrollmentId: launchEnrollmentOneId,
      sequenceId: launchSequenceId,
      contactId: getContactId("jamie.rivera.screenshots@nixelo.test"),
      organizationId,
      type: "sent",
      step: 0,
      trackingLinkId: undefined,
      metadata: undefined,
      createdAt: now - 28 * HOUR,
    },
    {
      enrollmentId: launchEnrollmentOneId,
      sequenceId: launchSequenceId,
      contactId: getContactId("jamie.rivera.screenshots@nixelo.test"),
      organizationId,
      type: "opened",
      step: 0,
      trackingLinkId: undefined,
      metadata: { userAgent: "Mozilla/5.0" },
      createdAt: now - 27 * HOUR,
    },
    {
      enrollmentId: launchEnrollmentOneId,
      sequenceId: launchSequenceId,
      contactId: getContactId("jamie.rivera.screenshots@nixelo.test"),
      organizationId,
      type: "clicked",
      step: 0,
      trackingLinkId: launchTrackingLinkRealId,
      metadata: { linkUrl: "https://nixelo.test/customer-story" },
      createdAt: now - 26 * HOUR,
    },
    {
      enrollmentId: launchEnrollmentOneId,
      sequenceId: launchSequenceId,
      contactId: getContactId("jamie.rivera.screenshots@nixelo.test"),
      organizationId,
      type: "sent",
      step: 1,
      trackingLinkId: undefined,
      metadata: undefined,
      createdAt: now - 6 * HOUR,
    },
    {
      enrollmentId: launchEnrollmentOneId,
      sequenceId: launchSequenceId,
      contactId: getContactId("jamie.rivera.screenshots@nixelo.test"),
      organizationId,
      type: "opened",
      step: 1,
      trackingLinkId: undefined,
      metadata: { userAgent: "Mozilla/5.0" },
      createdAt: now - 4 * HOUR,
    },
    {
      enrollmentId: launchEnrollmentTwoId,
      sequenceId: launchSequenceId,
      contactId: getContactId("taylor.north.screenshots@nixelo.test"),
      organizationId,
      type: "sent",
      step: 0,
      trackingLinkId: undefined,
      metadata: undefined,
      createdAt: now - 26 * HOUR,
    },
    {
      enrollmentId: launchEnrollmentTwoId,
      sequenceId: launchSequenceId,
      contactId: getContactId("taylor.north.screenshots@nixelo.test"),
      organizationId,
      type: "opened",
      step: 0,
      trackingLinkId: undefined,
      metadata: { userAgent: "Mozilla/5.0" },
      createdAt: now - 24 * HOUR,
    },
    {
      enrollmentId: launchEnrollmentTwoId,
      sequenceId: launchSequenceId,
      contactId: getContactId("taylor.north.screenshots@nixelo.test"),
      organizationId,
      type: "replied",
      step: 0,
      trackingLinkId: undefined,
      metadata: { replyContent: "This is timely. Send the implementation checklist." },
      createdAt: now - 22 * HOUR,
    },
    {
      enrollmentId: launchEnrollmentThreeId,
      sequenceId: launchSequenceId,
      contactId: getContactId("casey.lee.screenshots@nixelo.test"),
      organizationId,
      type: "sent",
      step: 0,
      trackingLinkId: undefined,
      metadata: undefined,
      createdAt: now - 10 * HOUR,
    },
    {
      enrollmentId: launchEnrollmentThreeId,
      sequenceId: launchSequenceId,
      contactId: getContactId("casey.lee.screenshots@nixelo.test"),
      organizationId,
      type: "opened",
      step: 0,
      trackingLinkId: undefined,
      metadata: { userAgent: "Mozilla/5.0" },
      createdAt: now - 8 * HOUR,
    },
    {
      enrollmentId: founderEnrollmentOneId,
      sequenceId: founderSequenceId,
      contactId: getContactId("morgan.hale.screenshots@nixelo.test"),
      organizationId,
      type: "sent",
      step: 0,
      trackingLinkId: undefined,
      metadata: undefined,
      createdAt: now - 17 * HOUR,
    },
    {
      enrollmentId: founderEnrollmentOneId,
      sequenceId: founderSequenceId,
      contactId: getContactId("morgan.hale.screenshots@nixelo.test"),
      organizationId,
      type: "bounced",
      step: 0,
      trackingLinkId: undefined,
      metadata: {
        bounceType: "hard",
        diagnosticCode: "550 5.1.1 mailbox unavailable",
        failedRecipient: "morgan.hale.screenshots@nixelo.test",
      },
      createdAt: now - 16 * HOUR,
    },
    {
      enrollmentId: founderEnrollmentTwoId,
      sequenceId: founderSequenceId,
      contactId: getContactId("avery.shah.screenshots@nixelo.test"),
      organizationId,
      type: "sent",
      step: 0,
      trackingLinkId: undefined,
      metadata: undefined,
      createdAt: now - 9 * HOUR,
    },
    {
      enrollmentId: founderEnrollmentTwoId,
      sequenceId: founderSequenceId,
      contactId: getContactId("avery.shah.screenshots@nixelo.test"),
      organizationId,
      type: "opened",
      step: 0,
      trackingLinkId: undefined,
      metadata: { userAgent: "Mozilla/5.0" },
      createdAt: now - 8 * HOUR,
    },
  ];

  for (const event of outreachEvents) {
    await ctx.db.insert("outreachEvents", event);
  }
}

async function deleteMeetingRecordingGraph(
  ctx: MutationCtx,
  recordingId: Id<"meetingRecordings">,
): Promise<void> {
  const [transcripts, summaries, participants, jobs] = await Promise.all([
    ctx.db
      .query("meetingTranscripts")
      .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
      .collect(),
    ctx.db
      .query("meetingSummaries")
      .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
      .collect(),
    ctx.db
      .query("meetingParticipants")
      .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
      .collect(),
    ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
      .collect(),
  ]);

  for (const transcript of transcripts) {
    await ctx.db.delete(transcript._id);
  }

  for (const summary of summaries) {
    await ctx.db.delete(summary._id);
  }

  for (const participant of participants) {
    await ctx.db.delete(participant._id);
  }

  for (const job of jobs) {
    await ctx.db.delete(job._id);
  }

  await ctx.db.delete(recordingId);
}

async function resetMeetingSeedDataForUser(ctx: MutationCtx, userId: Id<"users">): Promise<number> {
  const recordings = await ctx.db
    .query("meetingRecordings")
    .withIndex("by_creator", (q) => q.eq("createdBy", userId))
    .collect();

  for (const recording of recordings) {
    await deleteMeetingRecordingGraph(ctx, recording._id);
  }

  return recordings.length;
}

/**
 * Validate E2E API key from request headers
 * Returns error Response if invalid, null if valid
 */
function validateE2EApiKey(request: Request): Response | null {
  const apiKey = process.env.E2E_API_KEY;

  // If no API key is configured, disable endpoints completely.
  // We do NOT allow "localhost" bypass because environment detection is fragile
  // and can be spoofed in some configurations (e.g. reverse proxies).
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "E2E endpoints disabled (missing E2E_API_KEY)" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const providedKey = request.headers.get("x-e2e-api-key");
  if (!providedKey || !constantTimeEqual(providedKey, apiKey)) {
    return new Response(JSON.stringify({ error: "Invalid or missing E2E API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null; // Valid
}

/**
 * Create a test user (bypassing email verification)
 * POST /e2e/create-test-user
 * Body: { email: string, password: string, skipOnboarding?: boolean }
 *
 * This creates a user with email already verified, optionally completing onboarding.
 * Only works for test emails (@inbox.mailtrap.io).
 */
export const createTestUserHandler = async (ctx: ActionCtx, request: Request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, password, skipOnboarding = false } = body;

    if (!(email && password)) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Only test emails allowed (@inbox.mailtrap.io)" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Hash the password using Scrypt (same as Convex Auth)
    const scrypt = new Scrypt();
    const passwordHash = await scrypt.hash(password);

    const result = await ctx.runMutation(internal.e2e.createTestUserInternal, {
      email,
      passwordHash,
      skipOnboarding,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const createTestUserEndpoint = httpAction(createTestUserHandler);

/**
 * Log in a test user via API and return tokens
 * POST /e2e/login-test-user
 * Body: { email: string, password: string }
 */
export const loginTestUserEndpoint = httpAction(async (ctx: ActionCtx, request: Request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!(email && password)) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Only test emails allowed (@inbox.mailtrap.io)" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Call the signIn action directly
    // The Password provider expects 'flow: "signIn"' in params
    const result = await ctx.runAction(api.auth.signIn, {
      provider: "password",
      params: {
        email,
        password,
        flow: "signIn",
      },
    });

    if (!result.tokens) {
      return new Response(JSON.stringify({ error: "No tokens returned from signIn", result }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result.tokens), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Trigger password reset OTP dispatch for a test user
 * POST /e2e/request-password-reset
 * Body: { email: string }
 */
export const requestPasswordResetEndpoint = httpAction(async (ctx: ActionCtx, request: Request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Only test emails allowed (@inbox.mailtrap.io)" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await ctx.runAction(api.auth.signIn, {
      provider: "password",
      params: {
        email,
        flow: "reset",
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to create test user with full auth credentials
 */
export const createTestUserInternal = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    skipOnboarding: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.id("users"),
    existing: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Canonicalize to the newest user row for this test email. Older duplicates
    // can linger after interrupted runs, and the screenshot seeding paths already
    // treat the latest row as the source of truth.
    const existingUsers = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect();
    const existingUser = [...existingUsers].sort((a, b) => b._creationTime - a._creationTime)[0];

    if (existingUser) {
      const now = Date.now();
      const existingAccounts = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", args.email),
        )
        .collect();

      const canonicalAccount = [...existingAccounts]
        .filter((account) => account.userId === existingUser._id)
        .sort((a, b) => b._creationTime - a._creationTime)[0];

      for (const account of existingAccounts) {
        if (account._id !== canonicalAccount?._id) {
          await ctx.db.delete(account._id);
        }
      }

      if (!canonicalAccount) {
        await ctx.db.insert("authAccounts", {
          userId: existingUser._id,
          provider: "password",
          providerAccountId: args.email,
          secret: args.passwordHash,
          emailVerified: new Date().toISOString(),
        });
      } else {
        await ctx.db.patch(canonicalAccount._id, {
          emailVerified: new Date().toISOString(),
          secret: args.passwordHash,
        });
      }

      await ctx.db.patch(existingUser._id, {
        emailVerificationTime: existingUser.emailVerificationTime ?? now,
        isTestUser: true,
        testUserCreatedAt: existingUser.testUserCreatedAt ?? now,
      });

      // Ensure existing user has organization and onboarding set up when skipOnboarding is true
      if (args.skipOnboarding) {
        // Check if user has onboarding record
        const existingOnboarding = await ctx.db
          .query("userOnboarding")
          .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
          .first();

        if (!existingOnboarding) {
          await ctx.db.insert("userOnboarding", {
            userId: existingUser._id,
            onboardingCompleted: true,
            onboardingStep: 5,
            sampleWorkspaceCreated: false,
            tourShown: true,
            wizardCompleted: true,
            checklistDismissed: true,
            updatedAt: now,
          });
        } else if (!existingOnboarding.onboardingCompleted) {
          // Mark existing onboarding as complete
          await ctx.db.patch(existingOnboarding._id, {
            onboardingCompleted: true,
            onboardingStep: 5,
          });
        }

        // Check if user has organization membership
        const existingMembership = await ctx.db
          .query("organizationMembers")
          .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
          .first();

        if (!existingMembership) {
          // Use isolated organization per worker to avoid interference in parallel tests
          const workerMatch = args.email.match(/-w(\d+)@/);
          const workerSuffix = workerMatch ? `w${workerMatch[1]}` : "";
          const organizationName = workerSuffix ? `Nixelo E2E ${workerSuffix}` : "Nixelo E2E";
          const slug = workerSuffix ? `nixelo-e2e-${workerSuffix}` : "nixelo-e2e";

          const existingOrganization = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();

          let organizationId: Id<"organizations">;

          if (existingOrganization) {
            // organization exists - just add this user as a member
            organizationId = existingOrganization._id;
          } else {
            // Create the organization
            organizationId = await ctx.db.insert("organizations", {
              name: organizationName,
              slug,
              timezone: "UTC",
              settings: {
                defaultMaxHoursPerWeek: 40,
                defaultMaxHoursPerDay: 8,
                requiresTimeApproval: false,
                billingEnabled: true,
              },
              createdBy: existingUser._id,
              updatedAt: now,
            });
          }

          await ctx.db.insert("organizationMembers", {
            organizationId,
            userId: existingUser._id,
            role: "admin",
            addedBy: existingUser._id,
          });

          await ctx.db.patch(existingUser._id, { defaultOrganizationId: organizationId });
        }
      }

      return { success: true, userId: existingUser._id, existing: true };
    }

    // Create the user with email verified
    const userId = await ctx.db.insert("users", {
      email: args.email,
      emailVerificationTime: Date.now(),
      isTestUser: true,
      testUserCreatedAt: Date.now(),
    });

    // Create auth account with password hash and email verified
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: args.email,
      secret: args.passwordHash,
      emailVerified: new Date().toISOString(), // Password provider checks this field
    });

    // If skipOnboarding is true, create completed onboarding record AND add to shared organization
    if (args.skipOnboarding) {
      const now = Date.now();

      // Create onboarding record
      await ctx.db.insert("userOnboarding", {
        userId,
        onboardingCompleted: true,
        onboardingStep: 5,
        sampleWorkspaceCreated: false,
        tourShown: true,
        wizardCompleted: true,
        checklistDismissed: true,
        updatedAt: now,
      });

      // Use isolated organization per worker to avoid interference in parallel tests
      const workerMatch = args.email.match(/-w(\d+)@/);
      const workerSuffix = workerMatch ? `w${workerMatch[1]}` : "";
      const organizationName = workerSuffix ? `Nixelo E2E ${workerSuffix}` : "Nixelo E2E";
      const slug = workerSuffix ? `nixelo-e2e-${workerSuffix}` : "nixelo-e2e";

      const existingOrganization = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      let organizationId: Id<"organizations">;

      if (existingOrganization) {
        // organization exists - just add this user as a member
        organizationId = existingOrganization._id;
      } else {
        // Create the organization (first user creates it)
        organizationId = await ctx.db.insert("organizations", {
          name: organizationName,
          slug,
          timezone: "UTC",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: true,
          },
          createdBy: userId,
          updatedAt: now,
        });
      }

      // Add user as admin of the organization if not already a member
      const existingMember = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", organizationId).eq("userId", userId),
        )
        .first();

      if (!existingMember) {
        await ctx.db.insert("organizationMembers", {
          organizationId,
          userId,
          role: "admin",
          addedBy: userId,
        });
      }

      // Set as user's default organization
      await ctx.db.patch(userId, { defaultOrganizationId: organizationId });
    }

    return { success: true, userId, existing: false };
  },
});

/**
 * Delete a test user
 * POST /e2e/delete-test-user
 * Body: { email: string }
 */
export const deleteTestUserEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.deleteTestUserInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to delete test user and all related data
 */
export const deleteTestUserInternal = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.boolean(),
    deletedAccounts: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    let deletedUserData = false;
    let deletedAccountsCount = 0;

    // First, delete any authAccounts by email (providerAccountId) - this catches orphaned accounts
    // For password provider, providerAccountId is the email address
    // Optimization: Use providerAndAccountId index instead of filter-based table scan
    // For password provider, providerAccountId is the email address
    const accountsByEmail = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", args.email),
      )
      .collect();
    for (const account of accountsByEmail) {
      await ctx.db.delete(account._id);
      deletedAccountsCount++;
    }

    // Note: authVerificationCodes doesn't have an identifier field we can filter on
    // Orphaned verification codes will be garbage collected by the auth system

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();

    for (const user of users) {
      // Delete user's onboarding record
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (onboarding) {
        await ctx.db.delete(onboarding._id);
      }

      // Delete user's auth sessions (if any)
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const session of sessions) {
        await ctx.db.delete(session._id);
      }

      // Delete user's auth accounts by userId (might be duplicates from above)
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
        .collect();
      for (const account of accounts) {
        await ctx.db.delete(account._id);
        deletedAccountsCount++;
      }

      // Note: authRefreshTokens are tied to sessions, which we've already deleted
      // The auth system will clean up orphaned refresh tokens

      // Delete user's organization memberships and any organizations they created
      const memberships = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const membership of memberships) {
        // Check if user is the organization creator - if so, delete the organization
        const organization = await ctx.db.get(membership.organizationId);
        if (organization?.createdBy === user._id) {
          // Delete all members of this organization first
          const organizationMembers = await ctx.db
            .query("organizationMembers")
            .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
            .collect();
          for (const member of organizationMembers) {
            // Check if this organization is the user's default
            const memberUser = await ctx.db.get(member.userId);
            if (memberUser?.defaultOrganizationId === organization._id) {
              await ctx.db.patch(member.userId, { defaultOrganizationId: undefined });
            }
            await ctx.db.delete(member._id);
          }
          // Delete the organization
          await ctx.db.delete(organization._id);
        } else {
          // Just delete the membership
          await ctx.db.delete(membership._id);
        }
      }

      // Delete the user
      await ctx.db.delete(user._id);
      deletedUserData = true;
    }

    return {
      success: true,
      deleted: deletedUserData || deletedAccountsCount > 0,
      deletedAccounts: deletedAccountsCount,
    };
  },
});

/**
 * Reset onboarding for a specific user (by email)
 * POST /e2e/reset-onboarding
 * Body: { email?: string } - if not provided, resets ALL test users' onboarding
 */
export const resetOnboardingEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body as { email?: string };

    if (email && !isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.resetOnboardingInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to reset onboarding
 */
export const resetOnboardingInternal = internalMutation({
  args: {
    email: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    reset: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    if (args.email) {
      // Reset specific user's onboarding
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (!user) {
        return { success: false, error: "User not found" };
      }

      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (onboarding) {
        await ctx.db.delete(onboarding._id);
      }

      return { success: true, reset: 1 };
    }

    // Reset ALL test users' onboarding (for cleanup)
    const testUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isTestUser"), true))
      .collect();

    let resetCount = 0;
    for (const user of testUsers) {
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (onboarding) {
        await ctx.db.delete(onboarding._id);
        resetCount++;
      }
    }

    return { success: true, reset: resetCount };
  },
});

/**
 * Force delete ALL test users and their associated data
 * POST /e2e/nuke-test-users
 */
export const nukeAllTestUsersEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(internal.e2e.nukeAllTestUsersInternal, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Garbage collection - delete old test users
 * POST /e2e/cleanup
 * Deletes test users older than 1 hour
 */
export const cleanupTestUsersEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(internal.e2e.cleanupTestUsersInternal, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Reset all meetings data created by a test user.
 * POST /e2e/reset-meetings-data
 * Body: { email: string }
 */
export const resetMeetingsDataEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.resetMeetingsDataInternal, { email });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const resetMeetingsDataInternal = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deletedRecordings: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    const users = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect();
    const user = users.sort((a, b) => b._creationTime - a._creationTime)[0];

    if (!user) {
      return {
        success: false,
        deletedRecordings: 0,
        error: `User not found: ${args.email}`,
      };
    }

    const deletedRecordings = await resetMeetingSeedDataForUser(ctx, user._id);

    return {
      success: true,
      deletedRecordings,
    };
  },
});

/**
 * Garbage collection - delete old test users
 *
 * Internal mutation for garbage collection
 */
export const cleanupTestUsersInternal = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    const cutoffTime = Date.now() - TEST_USER_EXPIRATION_MS;

    // Find test users older than cutoff
    // Optimization: Use isTestUser index instead of filter-based table scan,
    // then filter by cutoff time in memory (much cheaper than scanning ALL users)
    const allTestUsers = await ctx.db
      .query("users")
      .withIndex("isTestUser", (q) => q.eq("isTestUser", true))
      .collect();
    const oldTestUsers = allTestUsers.filter(
      (u) => u.testUserCreatedAt && u.testUserCreatedAt < cutoffTime,
    );

    let deletedCount = 0;
    for (const user of oldTestUsers) {
      // Delete onboarding
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (onboarding) {
        await ctx.db.delete(onboarding._id);
      }

      // Delete sessions
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const session of sessions) {
        await ctx.db.delete(session._id);
      }

      // Delete accounts
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
        .collect();
      for (const account of accounts) {
        await ctx.db.delete(account._id);
      }

      // Delete user's organization memberships and any organizations they created
      const memberships = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const membership of memberships) {
        // Check if user is the organization creator - if so, delete the organization
        const organization = await ctx.db.get(membership.organizationId);
        if (organization?.createdBy === user._id) {
          // Delete all members of this organization first
          const organizationMembers = await ctx.db
            .query("organizationMembers")
            .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
            .collect();
          for (const member of organizationMembers) {
            // Check if this organization is the user's default
            const memberUser = await ctx.db.get(member.userId);
            if (memberUser?.defaultOrganizationId === organization._id) {
              await ctx.db.patch(member.userId, { defaultOrganizationId: undefined });
            }
            await ctx.db.delete(member._id);
          }
          // Delete the organization
          await ctx.db.delete(organization._id);
        } else {
          // Just delete the membership
          await ctx.db.delete(membership._id);
        }
      }

      // Delete user
      await ctx.db.delete(user._id);
      deletedCount++;
    }

    return { success: true, deleted: deletedCount };
  },
});

/**
 * Set up RBAC test project with users assigned to specific roles
 * POST /e2e/setup-rbac-project
 * Body: {
 *   projectKey: string;
 *   projectName: string;
 *   adminEmail: string;
 *   editorEmail: string;
 *   viewerEmail: string
 * }
 *
 * Creates a project and assigns users with their respective roles.
 * Returns the project ID for use in tests.
 */
export const setupRbacProjectEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { projectKey, projectName, adminEmail, editorEmail, viewerEmail } = body;

    if (!(projectKey && projectName && adminEmail && editorEmail && viewerEmail)) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: projectKey, projectName, adminEmail, editorEmail, viewerEmail",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate all emails are test emails
    for (const email of [adminEmail, editorEmail, viewerEmail]) {
      if (!isTestEmail(email)) {
        return new Response(JSON.stringify({ error: `Only test emails allowed: ${email}` }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const result = await ctx.runMutation(internal.e2e.setupRbacProjectInternal, {
      projectKey,
      projectName,
      adminEmail,
      editorEmail,
      viewerEmail,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Seed built-in project templates
 * POST /e2e/seed-templates
 */
export const seedTemplatesEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(api.projectTemplates.initializeBuiltInTemplates, {});
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to set up RBAC test project
 * Uses the admin user's existing organization instead of creating a new one
 */
export const setupRbacProjectInternal = internalMutation({
  args: {
    projectKey: v.string(),
    projectName: v.string(),
    adminEmail: v.string(),
    editorEmail: v.string(),
    viewerEmail: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    projectId: v.optional(v.id("projects")),
    projectKey: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    orgSlug: v.optional(v.string()),
    // New hierarchy fields
    workspaceId: v.optional(v.id("workspaces")),
    teamId: v.optional(v.id("teams")),
    workspaceProjectId: v.optional(v.id("projects")),
    workspaceProjectKey: v.optional(v.string()),
    teamProjectId: v.optional(v.id("projects")),
    teamProjectKey: v.optional(v.string()),
    error: v.optional(v.string()),
    users: v.optional(
      v.object({
        admin: v.optional(v.id("users")),
        editor: v.optional(v.id("users")),
        viewer: v.optional(v.id("users")),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Find latest users (in case of duplicates)
    const findLatestUser = async (email: string) => {
      const users = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), email))
        .collect();
      if (users.length === 0) return null;
      // Sort by creation time descending and take the first one
      return users.sort((a, b) => b._creationTime - a._creationTime)[0];
    };

    const adminUser = await findLatestUser(args.adminEmail);
    const editorUser = await findLatestUser(args.editorEmail);
    const viewerUser = await findLatestUser(args.viewerEmail);

    logger.info(`[RBAC-SETUP] Admin resolved to: ${adminUser?._id} (${args.adminEmail})`);
    logger.info(`[RBAC-SETUP] Editor resolved to: ${editorUser?._id} (${args.editorEmail})`);
    logger.info(`[RBAC-SETUP] Viewer resolved to: ${viewerUser?._id} (${args.viewerEmail})`);

    if (!adminUser) {
      return { success: false, error: `Admin user not found: ${args.adminEmail}` };
    }
    if (!editorUser) {
      return { success: false, error: `Editor user not found: ${args.editorEmail}` };
    }
    if (!viewerUser) {
      return { success: false, error: `Viewer user not found: ${args.viewerEmail}` };
    }

    const now = Date.now();

    // =========================================================================
    // Step 1: Find the admin user's existing organization (created during login)
    // =========================================================================
    let adminMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", adminUser._id))
      .first();

    // FALLBACK: If admin has no organization, create/link it now
    if (!adminMembership) {
      logger.info(`[RBAC-SETUP] Admin ${adminUser._id} has no organization. Attempting repair...`);

      const workerMatch = args.adminEmail.match(/-w(\d+)@/);
      const workerSuffix = workerMatch ? `w${workerMatch[1]}` : "";
      const organizationName = workerSuffix ? `Nixelo E2E ${workerSuffix}` : "Nixelo E2E";
      const slug = workerSuffix ? `nixelo-e2e-${workerSuffix}` : "nixelo-e2e";

      let organization = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (!organization) {
        logger.info(`[RBAC-SETUP] creating organization ${slug}`);
        const orgId = await ctx.db.insert("organizations", {
          name: organizationName,
          slug,
          timezone: "UTC",
          settings: {
            defaultMaxHoursPerWeek: 40,
            defaultMaxHoursPerDay: 8,
            requiresTimeApproval: false,
            billingEnabled: true,
          },
          createdBy: adminUser._id,
          updatedAt: now,
        });
        organization = await ctx.db.get(orgId);
      }

      if (organization) {
        await ctx.db.insert("organizationMembers", {
          organizationId: organization._id,
          userId: adminUser._id,
          role: "admin",
          addedBy: adminUser._id, // Self-add
        });

        // Refresh membership query
        adminMembership = await ctx.db
          .query("organizationMembers")
          .withIndex("by_user", (q) => q.eq("userId", adminUser._id))
          .first();

        // Correct default org
        await ctx.db.patch(adminUser._id, { defaultOrganizationId: organization._id });
      }
    }

    if (!adminMembership) {
      return { success: false, error: "Admin user has no organization membership (repair failed)" };
    }

    const organization = (await ctx.db.get(
      adminMembership.organizationId,
    )) as Doc<"organizations"> | null;
    if (!organization) {
      return { success: false, error: "Admin's organization not found" };
    }

    // =========================================================================
    // Step 2: Add editor and viewer as organization members (if not already)
    // =========================================================================
    const usersToAddToOrganization = [
      { userId: editorUser._id, role: "member" as const },
      { userId: viewerUser._id, role: "member" as const },
    ];

    for (const config of usersToAddToOrganization) {
      const existingMember = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", organization._id).eq("userId", config.userId),
        )
        .first();

      if (!existingMember) {
        await ctx.db.insert("organizationMembers", {
          organizationId: organization._id,
          userId: config.userId,
          role: config.role,
          addedBy: adminUser._id,
        });
      } else if (existingMember.role !== config.role) {
        // Enforce the correct role (downgrade from admin if necessary)
        await ctx.db.patch(existingMember._id, { role: config.role });
      }

      // Set as user's default organization
      await ctx.db.patch(config.userId, { defaultOrganizationId: organization._id });
    }

    // =========================================================================
    // Step 3: Create workspace and team for hierarchical testing
    // =========================================================================

    // Create a workspace (department) for the organization
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "E2E Testing Workspace",
      slug: "e2e-testing",
      description: "Workspace for E2E RBAC testing",
      icon: "🧪",
      organizationId: organization._id,
      createdBy: adminUser._id,
      updatedAt: now,
    });

    // Create a team within the workspace
    const teamId = await ctx.db.insert("teams", {
      name: "E2E Test Team",
      slug: "e2e-test-team",
      description: "Team for E2E RBAC testing",
      workspaceId,
      organizationId: organization._id,
      createdBy: adminUser._id,
      updatedAt: now,
      isPrivate: false, // Public team for testing
    });

    // Add all users to the team with appropriate roles
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: adminUser._id,
      role: "admin",
      addedBy: adminUser._id,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: editorUser._id,
      role: "member",
      addedBy: adminUser._id,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: viewerUser._id,
      role: "member",
      addedBy: adminUser._id,
    });

    // =========================================================================
    // Step 4: Create RBAC test projects at different hierarchy levels
    // =========================================================================

    // 4a. organization-scoped project (no team owner)
    const organizationProjectKey = `${args.projectKey}-ORG`;
    let project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", organizationProjectKey))
      .filter(notDeleted)
      .first();

    if (!project) {
      // Create a default workspace for the organization-level project
      const workspaceId = await ctx.db.insert("workspaces", {
        organizationId: organization._id,
        name: "Organization Workspace",
        slug: "org-workspace",
        createdBy: adminUser._id,
        updatedAt: now,
      });

      const projectId = await ctx.db.insert("projects", {
        name: args.projectName,
        key: organizationProjectKey,
        description: "E2E test project for RBAC permission testing - organization level",
        organizationId: organization._id,
        workspaceId,
        ownerId: adminUser._id,
        createdBy: adminUser._id,
        updatedAt: now,
        boardType: "kanban",
        nextIssueNumber: 0,
        workflowStates: [
          { id: "backlog", name: "Backlog", category: "todo", order: 0 },
          { id: "todo", name: "To Do", category: "todo", order: 1 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
          { id: "review", name: "Review", category: "inprogress", order: 3 },
          { id: "done", name: "Done", category: "done", order: 4 },
        ],
        teamId: undefined, // Workspace-level project, no specific team
      });

      project = await ctx.db.get(projectId);
    } else {
      // Always update project metadata to match current test config
      const nextIssueNumber = await getProjectIssueCounterFloor(ctx, project);
      await ctx.db.patch(project._id, {
        name: args.projectName,
        organizationId: organization._id,
        description: "E2E test project for RBAC permission testing - organization level",
        nextIssueNumber,
      });
    }

    if (!project) {
      return { success: false, error: "Failed to create organization-level project" };
    }

    // 4b. Workspace-level project
    const workspaceProjectKey = `${args.projectKey}-WS`;
    let workspaceProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", workspaceProjectKey))
      .filter(notDeleted)
      .first();

    if (!workspaceProject) {
      const wsProjectId = await ctx.db.insert("projects", {
        name: `RBAC Workspace Project (${workspaceProjectKey})`,
        key: workspaceProjectKey,
        description: "E2E test project for RBAC - Workspace level",
        organizationId: organization._id,
        workspaceId,
        teamId, // Workspace level
        ownerId: adminUser._id,
        createdBy: adminUser._id,
        updatedAt: now,
        boardType: "kanban",
        nextIssueNumber: 0,
        workflowStates: [
          { id: "backlog", name: "Backlog", category: "todo", order: 0 },
          { id: "todo", name: "To Do", category: "todo", order: 1 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
          { id: "review", name: "Review", category: "inprogress", order: 3 },
          { id: "done", name: "Done", category: "done", order: 4 },
        ],
      });

      workspaceProject = await ctx.db.get(wsProjectId);
    } else {
      const nextIssueNumber = await getProjectIssueCounterFloor(ctx, workspaceProject);
      await ctx.db.patch(workspaceProject._id, {
        name: `RBAC Workspace Project (${workspaceProjectKey})`,
        organizationId: organization._id,
        workspaceId,
        teamId,
        description: "E2E test project for RBAC - Workspace level",
        ownerId: adminUser._id, // Ensure ownership is updated
        nextIssueNumber,
        updatedAt: now,
      });
    }

    // 4c. Team-level project
    const teamProjectKey = `${args.projectKey}-TM`;
    let teamProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", teamProjectKey))
      .filter(notDeleted)
      .first();

    if (!teamProject) {
      const tmProjectId = await ctx.db.insert("projects", {
        name: `RBAC Team Project (${teamProjectKey})`,
        key: teamProjectKey,
        description: "E2E test project for RBAC - Team level",
        organizationId: organization._id,
        workspaceId,
        teamId,
        ownerId: adminUser._id,
        createdBy: adminUser._id,
        updatedAt: now,
        boardType: "kanban",
        nextIssueNumber: 0,
        workflowStates: [
          { id: "backlog", name: "Backlog", category: "todo", order: 0 },
          { id: "todo", name: "To Do", category: "todo", order: 1 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
          { id: "review", name: "Review", category: "inprogress", order: 3 },
          { id: "done", name: "Done", category: "done", order: 4 },
        ],
      });

      teamProject = await ctx.db.get(tmProjectId);
    } else {
      const nextIssueNumber = await getProjectIssueCounterFloor(ctx, teamProject);
      await ctx.db.patch(teamProject._id, {
        name: `RBAC Team Project (${teamProjectKey})`,
        organizationId: organization._id,
        workspaceId,
        teamId,
        description: "E2E test project for RBAC - Team level",
        ownerId: adminUser._id, // Ensure ownership is updated
        nextIssueNumber,
        updatedAt: now,
      });
    }

    // =========================================================================
    // Step 5: Add/update project members with roles for all projects
    // =========================================================================
    const memberConfigs = [
      { userId: adminUser._id, role: "admin" as const },
      { userId: editorUser._id, role: "editor" as const },
      { userId: viewerUser._id, role: "viewer" as const },
    ];

    // Add members to all three projects
    const allProjects = [project, workspaceProject, teamProject].filter(
      (p): p is NonNullable<typeof p> => p !== null && p !== undefined,
    );

    for (const proj of allProjects) {
      for (const config of memberConfigs) {
        const existingMember = await ctx.db
          .query("projectMembers")
          .withIndex("by_project_user", (q) =>
            q.eq("projectId", proj._id).eq("userId", config.userId),
          )
          .filter(notDeleted)
          .first();

        if (existingMember) {
          // Update role if different
          if (existingMember.role !== config.role) {
            await ctx.db.patch(existingMember._id, { role: config.role });
          }
        } else {
          // Add new member
          await ctx.db.insert("projectMembers", {
            projectId: proj._id,
            userId: config.userId,
            role: config.role,
            addedBy: adminUser._id,
          });
        }
      }
    }

    return {
      success: true,
      projectId: project._id,
      projectKey: project.key,
      organizationId: organization._id,
      orgSlug: organization.slug,
      // Return all project info for comprehensive testing
      workspaceId,
      teamId,
      workspaceProjectId: workspaceProject?._id,
      workspaceProjectKey: workspaceProject?.key,
      teamProjectId: teamProject?._id,
      teamProjectKey: teamProject?.key,
      users: {
        admin: adminUser._id,
        editor: editorUser._id,
        viewer: viewerUser._id,
      },
    };
  },
});

/**
 * Clean up RBAC test project and its data
 * POST /e2e/cleanup-rbac-project
 * Body: { projectKey: string }
 */
export const cleanupRbacProjectEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { projectKey } = body;

    if (!projectKey) {
      return new Response(JSON.stringify({ error: "Missing projectKey" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.cleanupRbacProjectInternal, { projectKey });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to clean up RBAC test project
 */
export const cleanupRbacProjectInternal = internalMutation({
  args: {
    projectKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.object({
      project: v.boolean(),
      members: v.number(),
      issues: v.number(),
      sprints: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.projectKey))
      .filter(notDeleted)
      .first();

    if (!project) {
      return {
        success: true,
        deleted: { project: false, members: 0, issues: 0, sprints: 0 },
      };
    }

    // Capture workspace ID before deleting project
    const workspaceId = project.workspaceId;
    // Delete all project members
    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)
      .collect();
    for (const issue of issues) {
      // Delete issue comments
      const comments = await ctx.db
        .query("issueComments")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .filter(notDeleted)
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }
      // Delete issue activity
      const activities = await ctx.db
        .query("issueActivity")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();
      for (const activity of activities) {
        await ctx.db.delete(activity._id);
      }
      await ctx.db.delete(issue._id);
    }

    // Delete all sprints
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)
      .collect();
    for (const sprint of sprints) {
      await ctx.db.delete(sprint._id);
    }

    // Delete the project
    await ctx.db.delete(project._id);

    // Verify and clean up workspace/team if they were created for E2E
    // We check if the workspace name matches our E2E pattern to avoid deleting user data
    if (workspaceId) {
      const workspace = await ctx.db.get(workspaceId);
      if (workspace && workspace.name === "E2E Testing Workspace") {
        // Delete all teams in this workspace
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
          .collect();
        for (const team of teams) {
          // Delete team members
          const members = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", team._id))
            .collect();
          for (const member of members) {
            await ctx.db.delete(member._id);
          }
          await ctx.db.delete(team._id);
        }
        await ctx.db.delete(workspace._id);
      }
    }

    return {
      success: true,
      deleted: {
        project: true,
        members: members.length,
        issues: issues.length,
        sprints: sprints.length,
      },
    };
  },
});

/**
 * Update organization settings for E2E testing
 * POST /e2e/update-organization-settings
 * Body: {
 *   orgSlug: string,
 *   settings: {
 *     defaultMaxHoursPerWeek?: number,
 *     defaultMaxHoursPerDay?: number,
 *     requiresTimeApproval?: boolean,
 *     billingEnabled?: boolean,
 *   }
 * }
 *
 * Allows tests to change settings profiles (e.g., enable/disable billing).
 */
export const updateOrganizationSettingsEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, settings } = body;

    if (!orgSlug) {
      return new Response(JSON.stringify({ error: "Missing orgSlug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!settings || typeof settings !== "object") {
      return new Response(JSON.stringify({ error: "Missing or invalid settings" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateOrganizationSettingsInternal, {
      orgSlug,
      settings,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to update organization settings
 */
export const updateOrganizationSettingsInternal = internalMutation({
  args: {
    orgSlug: v.string(),
    settings: v.object({
      defaultMaxHoursPerWeek: v.optional(v.number()),
      defaultMaxHoursPerDay: v.optional(v.number()),
      requiresTimeApproval: v.optional(v.boolean()),
      billingEnabled: v.optional(v.boolean()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    updatedSettings: v.optional(
      v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Find organization by slug
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    // Get current settings or use defaults
    const currentSettings = organization.settings ?? {
      defaultMaxHoursPerWeek: 40,
      defaultMaxHoursPerDay: 8,
      requiresTimeApproval: false,
      billingEnabled: true,
    };

    // Merge with provided settings
    const newSettings = {
      defaultMaxHoursPerWeek:
        args.settings.defaultMaxHoursPerWeek ?? currentSettings.defaultMaxHoursPerWeek,
      defaultMaxHoursPerDay:
        args.settings.defaultMaxHoursPerDay ?? currentSettings.defaultMaxHoursPerDay,
      requiresTimeApproval:
        args.settings.requiresTimeApproval ?? currentSettings.requiresTimeApproval,
      billingEnabled: args.settings.billingEnabled ?? currentSettings.billingEnabled,
    };

    // Update organization settings
    await ctx.db.patch(organization._id, {
      settings: newSettings,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      organizationId: organization._id,
      updatedSettings: newSettings,
    };
  },
});

/**
 * Update a seeded project's workflow state for interactive screenshot capture.
 * POST /e2e/update-project-workflow-state
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   stateId: string,
 *   wipLimit: number | null,
 * }
 */
export const updateProjectWorkflowStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, stateId, wipLimit } = body;

    if (!(orgSlug && projectKey && stateId)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or stateId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (wipLimit !== null && typeof wipLimit !== "number") {
      return new Response(JSON.stringify({ error: "wipLimit must be a number or null" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateProjectWorkflowStateInternal, {
      orgSlug,
      projectKey,
      stateId,
      wipLimit,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateProjectWorkflowStateInternal = internalMutation({
  args: {
    orgSlug: v.string(),
    projectKey: v.string(),
    stateId: v.string(),
    wipLimit: v.union(v.number(), v.null()),
  },
  returns: v.object({
    success: v.boolean(),
    projectId: v.optional(v.id("projects")),
    workflowStates: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          category: workflowCategories,
          order: v.number(),
          wipLimit: v.optional(v.number()),
        }),
      ),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    const workflowStates = project.workflowStates ?? [];
    let stateFound = false;
    const updatedWorkflowStates = workflowStates.map((state) => {
      if (state.id !== args.stateId) {
        return state;
      }

      stateFound = true;
      return {
        ...state,
        wipLimit: args.wipLimit ?? undefined,
      };
    });

    if (!stateFound) {
      return {
        success: false,
        error: `workflow state not found: ${args.stateId}`,
      };
    }

    await ctx.db.patch(project._id, {
      workflowStates: updatedWorkflowStates,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      projectId: project._id,
      workflowStates: updatedWorkflowStates,
    };
  },
});

/**
 * Replace a seeded project's workflow states for interactive screenshot capture.
 * POST /e2e/replace-project-workflow-states
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   workflowStates: WorkflowState[],
 * }
 */
export const replaceProjectWorkflowStatesEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, workflowStates } = body;

    if (!(orgSlug && projectKey)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug or projectKey" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(workflowStates) || workflowStates.length === 0) {
      return new Response(JSON.stringify({ error: "workflowStates must be a non-empty array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateProjectWorkflowStatesInternal, {
      orgSlug,
      projectKey,
      workflowStates,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Check whether duplicate-detection issue search is ready for a seeded project.
 * POST /e2e/check-project-issue-duplicates
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   query: string,
 * }
 */
export const checkProjectIssueDuplicatesEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, query } = body;

    if (!(orgSlug && projectKey && query)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or query" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runQuery(internal.e2e.checkProjectIssueDuplicatesInternal, {
      orgSlug,
      projectKey,
      query,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const checkProjectIssueDuplicatesInternal = internalQuery({
  args: {
    orgSlug: v.string(),
    projectKey: v.string(),
    query: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    matchCount: v.optional(v.number()),
    issueKeys: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to query non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    const matchingIssues = await ctx.db
      .query("issues")
      .withSearchIndex("search_title", (q) =>
        q.search("searchContent", args.query).eq("projectId", project._id),
      )
      .filter(notDeleted)
      .take(5);

    const normalizedQueryTokens = args.query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 0);

    const fallbackIssues =
      matchingIssues.length === 0 && normalizedQueryTokens.length > 0
        ? (
            await ctx.db
              .query("issues")
              .withIndex("by_project_updated", (q) => q.eq("projectId", project._id))
              .order("desc")
              .filter(notDeleted)
              .take(50)
          )
            .filter((issue) => {
              const normalizedTitle = issue.title.trim().toLowerCase();
              return normalizedQueryTokens.every((token) => normalizedTitle.includes(token));
            })
            .slice(0, 5)
        : matchingIssues;

    return {
      success: true,
      matchCount: fallbackIssues.length,
      issueKeys: fallbackIssues.map((issue) => issue.key),
    };
  },
});

/**
 * Delete a screenshot-created issue so later captures stay deterministic.
 * POST /e2e/delete-seeded-project-issue
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   issueTitle: string,
 * }
 */
export const deleteSeededProjectIssueEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, issueTitle } = body;

    if (!(orgSlug && projectKey && issueTitle)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or issueTitle" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.deleteSeededProjectIssueInternal, {
      orgSlug,
      projectKey,
      issueTitle,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const deleteSeededProjectIssueInternal = internalMutation({
  args: {
    orgSlug: v.string(),
    projectKey: v.string(),
    issueTitle: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    const candidateIssues = await ctx.db
      .query("issues")
      .withIndex("by_project_deleted", (q) => q.eq("projectId", project._id).eq("isDeleted", false))
      .order("desc")
      .take(50);

    const issuesToDelete = candidateIssues.filter((issue) => issue.title === args.issueTitle);
    if (issuesToDelete.length === 0) {
      return {
        success: false,
        error: `issue not found: ${args.issueTitle} in ${args.projectKey}`,
      };
    }

    await Promise.all(
      issuesToDelete.map((issue) =>
        ctx.db.patch(issue._id, {
          ...softDeleteFields(issue.reporterId),
          updatedAt: Date.now(),
        }),
      ),
    );

    await syncProjectIssueStats(ctx, project._id);

    return {
      success: true,
      deleted: issuesToDelete.length,
    };
  },
});

/**
 * Reconfigure seeded roadmap data for screenshot capture.
 * POST /e2e/configure-roadmap-state
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   mode: "default" | "empty" | "milestone",
 * }
 */
export const configureRoadmapStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, mode } = body;

    if (!(orgSlug && projectKey && mode)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["default", "empty", "milestone"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid roadmap mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateRoadmapStateInternal, {
      mode,
      orgSlug,
      projectKey,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateRoadmapStateInternal = internalMutation({
  args: {
    mode: v.union(v.literal("default"), v.literal("empty"), v.literal("milestone")),
    orgSlug: v.string(),
    projectKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    issueCount: v.optional(v.number()),
    linkCount: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    return await resetSeededRoadmapState(ctx, {
      mode: args.mode,
      organizationId: organization._id,
      projectId: project._id,
    });
  },
});

/**
 * Reconfigure seeded time tracking data for screenshot capture.
 * POST /e2e/configure-time-tracking-state
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   mode: "default" | "entriesEmpty" | "ratesPopulated" | "summaryTruncated",
 * }
 */
export const configureTimeTrackingStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, mode } = body;

    if (!(orgSlug && projectKey && mode)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["default", "entriesEmpty", "ratesPopulated", "summaryTruncated"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid time tracking mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateTimeTrackingStateInternal, {
      mode,
      orgSlug,
      projectKey,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateTimeTrackingStateInternal = internalMutation({
  args: {
    mode: v.union(
      v.literal("default"),
      v.literal("entriesEmpty"),
      v.literal("ratesPopulated"),
      v.literal("summaryTruncated"),
    ),
    orgSlug: v.string(),
    projectKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    entryCount: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    rateCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    const timeTrackingReset = await resetSeededTimeTrackingState(ctx, {
      mode: args.mode,
      organizationId: organization._id,
      projectId: project._id,
    });

    if (!timeTrackingReset.success) {
      return {
        success: false,
        error: timeTrackingReset.error ?? `Failed to configure time tracking state: ${args.mode}`,
      };
    }

    return timeTrackingReset;
  },
});

/**
 * Reconfigure a seeded project's inbox data for screenshot capture.
 * POST /e2e/configure-project-inbox-state
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   mode: "default" | "openEmpty" | "closedEmpty",
 * }
 */
export const configureProjectInboxStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, mode } = body;

    if (!(orgSlug && projectKey && mode)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["default", "openEmpty", "closedEmpty"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid project inbox mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateProjectInboxStateInternal, {
      orgSlug,
      projectKey,
      mode,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateProjectInboxStateInternal = internalMutation({
  args: {
    orgSlug: v.string(),
    projectKey: v.string(),
    mode: v.union(v.literal("default"), v.literal("openEmpty"), v.literal("closedEmpty")),
  },
  returns: v.object({
    success: v.boolean(),
    closedCount: v.optional(v.number()),
    openCount: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    const inboxReset = await resetSeededProjectInboxIssues(ctx, {
      organizationId: organization._id,
      projectId: project._id,
      mode: args.mode,
    });

    if (!inboxReset.success) {
      return {
        success: false,
        error: inboxReset.error ?? `Failed to configure project inbox state: ${args.mode}`,
      };
    }

    return {
      success: true,
      projectId: project._id,
      openCount: inboxReset.openCount,
      closedCount: inboxReset.closedCount,
    };
  },
});

/**
 * Reconfigure seeded projects-list membership data for screenshot capture.
 * POST /e2e/configure-projects-state
 * Body: {
 *   orgSlug: string,
 *   mode: "default" | "single" | "empty",
 * }
 */
export const configureProjectsStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, mode } = body;

    if (!(orgSlug && mode)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug or mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["default", "single", "empty"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid projects mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateProjectsStateInternal, {
      mode,
      orgSlug,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateProjectsStateInternal = internalMutation({
  args: {
    mode: v.union(v.literal("default"), v.literal("single"), v.literal("empty")),
    orgSlug: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    visibleProjectCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const primaryProject = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), "DEMO")))
      .first();
    const secondaryProject = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), "OPS")))
      .first();

    if (!(primaryProject && secondaryProject)) {
      return {
        success: false,
        error: `seeded projects not found in ${args.orgSlug}`,
      };
    }

    const screenshotActors = await resolveSeededScreenshotActors(ctx, {
      organizationId: organization._id,
      projectId: primaryProject._id,
    });
    if (!screenshotActors.success) {
      return {
        success: false,
        error: screenshotActors.error,
      };
    }

    return await resetSeededProjectsRouteState(ctx, {
      mode: args.mode,
      ownerUserId: screenshotActors.ownerUserId,
      primaryProjectId: primaryProject._id,
      secondaryProjectId: secondaryProject._id,
    });
  },
});

/**
 * Reconfigure a seeded project's analytics data for screenshot capture.
 * POST /e2e/configure-project-analytics-state
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   mode: "default" | "sparseData" | "noActivity",
 * }
 */
export const configureProjectAnalyticsStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, mode } = body;

    if (!(orgSlug && projectKey && mode)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["default", "sparseData", "noActivity"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid project analytics mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateProjectAnalyticsStateInternal, {
      mode,
      orgSlug,
      projectKey,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateProjectAnalyticsStateInternal = internalMutation({
  args: {
    mode: v.union(v.literal("default"), v.literal("sparseData"), v.literal("noActivity")),
    orgSlug: v.string(),
    projectKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    activityCount: v.optional(v.number()),
    issueCount: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    sprintCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    const analyticsReset = await resetSeededProjectAnalyticsState(ctx, {
      mode: args.mode,
      organizationId: organization._id,
      projectId: project._id,
    });

    if (!analyticsReset.success) {
      return {
        success: false,
        error: analyticsReset.error ?? `Failed to configure project analytics state: ${args.mode}`,
      };
    }

    return analyticsReset;
  },
});

/**
 * Reconfigure seeded org analytics data for screenshot capture.
 * POST /e2e/configure-org-analytics-state
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   mode: "default" | "sparseData" | "noActivity",
 * }
 *
 * Org analytics in screenshot runs is driven by the seeded demo project, so this
 * reuses the same underlying issue/sprint/activity reset path as project analytics.
 */
export const configureOrgAnalyticsStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, projectKey, mode } = body;

    if (!(orgSlug && projectKey && mode)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["default", "sparseData", "noActivity"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid org analytics mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateOrgAnalyticsStateInternal, {
      mode,
      orgSlug,
      projectKey,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateOrgAnalyticsStateInternal = internalMutation({
  args: {
    mode: v.union(v.literal("default"), v.literal("sparseData"), v.literal("noActivity")),
    orgSlug: v.string(),
    projectKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    activityCount: v.optional(v.number()),
    issueCount: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    sprintCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    const orgProjects = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);

    let targetAnalyticsReset: {
      success: boolean;
      activityCount?: number;
      issueCount?: number;
      projectId?: Id<"projects">;
      sprintCount?: number;
      error?: string;
    } | null = null;

    for (const orgProject of orgProjects) {
      const shouldClearProject = orgProject._id !== project._id || args.mode === "noActivity";
      const analyticsReset = shouldClearProject
        ? await clearSeededProjectAnalyticsState(ctx, {
            organizationId: organization._id,
            projectId: orgProject._id,
          })
        : await resetSeededProjectAnalyticsState(ctx, {
            mode: args.mode,
            organizationId: organization._id,
            projectId: orgProject._id,
          });

      if (!analyticsReset.success) {
        return {
          success: false,
          error:
            analyticsReset.error ??
            `Failed to configure org analytics state: ${args.mode} for ${orgProject.key}`,
        };
      }

      if (orgProject._id === project._id) {
        targetAnalyticsReset = analyticsReset;
      }
    }

    if (!targetAnalyticsReset) {
      return {
        success: false,
        error: `Failed to configure org analytics state: ${args.mode}`,
      };
    }

    return targetAnalyticsReset;
  },
});

/**
 * Reconfigure seeded notifications data for screenshot capture.
 * POST /e2e/configure-notifications-state
 * Body: {
 *   orgSlug: string,
 *   projectKey: string,
 *   mode: "default" | "inboxEmpty" | "archivedEmpty" | "unreadOverflow",
 * }
 */
export const configureNotificationsStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, orgSlug, projectKey, mode } = body;

    if (!(orgSlug && projectKey && mode)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug, projectKey, or mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["default", "inboxEmpty", "archivedEmpty", "unreadOverflow"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid notifications mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateNotificationsStateInternal, {
      email,
      orgSlug,
      projectKey,
      mode,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateNotificationsStateInternal = internalMutation({
  args: {
    email: v.optional(v.string()),
    orgSlug: v.string(),
    projectKey: v.string(),
    mode: v.union(
      v.literal("default"),
      v.literal("inboxEmpty"),
      v.literal("archivedEmpty"),
      v.literal("unreadOverflow"),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    archivedCount: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    unreadCount: v.optional(v.number()),
    visibleCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    let targetUserId: Id<"users"> | undefined;
    if (args.email) {
      if (!isTestEmail(args.email)) {
        return {
          success: false,
          error: `Refusing to modify notifications for non-test email: ${args.email}`,
        };
      }

      const matchingUsers = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .collect();
      const targetUser = [...matchingUsers].sort((a, b) => b._creationTime - a._creationTime)[0];

      if (!targetUser) {
        return {
          success: false,
          error: `test user not found: ${args.email}`,
        };
      }

      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", organization._id).eq("userId", targetUser._id),
        )
        .first();

      if (!membership) {
        return {
          success: false,
          error: `test user ${args.email} is not a member of ${args.orgSlug}`,
        };
      }

      targetUserId = targetUser._id;
    }

    const notificationReset = await resetSeededNotificationsForUser(ctx, {
      organizationId: organization._id,
      projectId: project._id,
      mode: args.mode,
      userId: targetUserId,
    });

    if (!notificationReset.success) {
      return {
        success: false,
        error: notificationReset.error ?? `Failed to configure notifications state: ${args.mode}`,
      };
    }

    return {
      success: true,
      projectId: project._id,
      visibleCount: notificationReset.visibleCount,
      archivedCount: notificationReset.archivedCount,
      unreadCount: notificationReset.unreadCount,
    };
  },
});

/**
 * Reconfigure seeded assistant data for screenshot capture.
 * POST /e2e/configure-assistant-state
 * Body: {
 *   orgSlug: string,
 *   mode: "default" | "empty",
 * }
 */
export const configureAssistantStateEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { orgSlug, mode } = body;

    if (!(orgSlug && mode)) {
      return new Response(JSON.stringify({ error: "Missing orgSlug or mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["default", "empty"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid assistant mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.updateAssistantStateInternal, {
      mode,
      orgSlug,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const updateAssistantStateInternal = internalMutation({
  args: {
    mode: v.union(v.literal("default"), v.literal("empty")),
    orgSlug: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    chatCount: v.optional(v.number()),
    requestCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const primaryProject = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), "DEMO")))
      .first();
    const secondaryProject = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), "OPS")))
      .first();

    if (!(primaryProject && secondaryProject)) {
      return {
        success: false,
        error: `seeded assistant projects not found in ${args.orgSlug}`,
      };
    }

    const screenshotActors = await resolveSeededScreenshotActors(ctx, {
      organizationId: organization._id,
      projectId: primaryProject._id,
    });
    if (!screenshotActors.success) {
      return {
        success: false,
        error: screenshotActors.error,
      };
    }

    const assistantReset = await resetSeededAssistantState(ctx, {
      mode: args.mode,
      now: Date.now(),
      primaryProjectId: primaryProject._id,
      secondaryProjectId: secondaryProject._id,
      userId: screenshotActors.ownerUserId,
    });

    if (!assistantReset.success) {
      return {
        success: false,
        error: assistantReset.error ?? `Failed to configure assistant state: ${args.mode}`,
      };
    }

    return assistantReset;
  },
});

export const updateProjectWorkflowStatesInternal = internalMutation({
  args: {
    orgSlug: v.string(),
    projectKey: v.string(),
    workflowStates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        category: workflowCategories,
        order: v.number(),
        wipLimit: v.optional(v.number()),
      }),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    projectId: v.optional(v.id("projects")),
    workflowStates: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          category: workflowCategories,
          order: v.number(),
          wipLimit: v.optional(v.number()),
        }),
      ),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .filter(notDeleted)
      .first();

    if (!organization) {
      return { success: false, error: `organization not found: ${args.orgSlug}` };
    }

    const isE2EOrg =
      organization.slug.startsWith("nixelo-e2e") || organization.slug.includes("-e2e-");
    if (!isE2EOrg) {
      return {
        success: false,
        error: `Refusing to modify non-E2E organization: ${organization.slug}`,
      };
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), args.projectKey)))
      .first();

    if (!project) {
      return {
        success: false,
        error: `project not found: ${args.projectKey} in ${args.orgSlug}`,
      };
    }

    await ctx.db.patch(project._id, {
      workflowStates: args.workflowStates,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      projectId: project._id,
      workflowStates: args.workflowStates,
    };
  },
});

/**
 * Verify a test user's email directly (bypassing email verification flow)
 * POST /e2e/verify-test-user
 * Body: { email: string }
 */
export const verifyTestUserEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.verifyTestUserInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to verify a test user's email
 */
export const verifyTestUserInternal = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    verified: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Find the authAccount by email
    const account = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("providerAccountId"), args.email))
      .filter(notDeleted)
      .first();

    if (!account) {
      return { success: false, verified: false, error: "Account not found" };
    }

    // Find the user
    const user = await ctx.db.get(account.userId);
    if (!user) {
      return { success: false, verified: false, error: "User not found" };
    }

    // Update both verification fields:
    // 1. authAccount.emailVerified - Used by Password provider to check verification
    // 2. user.emailVerificationTime - Our custom field for app logic
    await ctx.db.patch(account._id, {
      emailVerified: new Date().toISOString(),
    });

    // Update the user with emailVerificationTime
    await ctx.db.patch(user._id, {
      emailVerificationTime: Date.now(),
    });

    return { success: true, verified: true };
  },
});

/** Stores plaintext OTP codes for test users with 15-minute expiration, used by E2E tests to bypass verification hashing. */
export const storeTestOtp = internalMutation({
  args: {
    email: v.string(),
    code: v.string(),
    type: otpCodeTypes,
  },
  handler: async (ctx, args) => {
    // Only allow test emails
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Delete any existing OTP for this email AND type
    const existingOtp = await ctx.db
      .query("testOtpCodes")
      .withIndex("by_email_type", (q) => q.eq("email", args.email).eq("type", args.type))
      .first();

    if (existingOtp) {
      await ctx.db.delete(existingOtp._id);
    }

    // Encrypt if API key is present
    let codeToStore = args.code;
    const apiKey = process.env.E2E_API_KEY;

    if (apiKey) {
      const encrypted = await encryptE2EData(args.code, apiKey);
      codeToStore = `enc:${encrypted}`;
    }

    // Store new OTP with 15-minute expiration
    await ctx.db.insert("testOtpCodes", {
      email: args.email,
      code: codeToStore,
      type: args.type,
      expiresAt: Date.now() + 15 * MINUTE,
    });
  },
});

/**
 * Get the latest OTP code for a test user (email)
 * Reads from testOtpCodes table which stores plaintext codes for E2E testing.
 */
export const getLatestOTP = internalQuery({
  args: { email: v.string(), type: otpCodeTypes },
  handler: async (ctx, args) => {
    // Only allow test emails
    if (!isTestEmail(args.email)) {
      return null;
    }

    // Get from testOtpCodes table (plaintext for E2E)
    const otpRecord = await ctx.db
      .query("testOtpCodes")
      .withIndex("by_email_type", (q) => q.eq("email", args.email).eq("type", args.type))
      .first();

    if (!otpRecord) return null;

    // Check if expired
    if (otpRecord.expiresAt < Date.now()) {
      return null;
    }

    // Decrypt if necessary
    if (otpRecord.code.startsWith("enc:")) {
      const apiKey = process.env.E2E_API_KEY;
      if (!apiKey) {
        throw new Error("Cannot decrypt E2E data: E2E_API_KEY missing");
      }
      return await decryptE2EData(otpRecord.code.slice(4), apiKey);
    }

    return otpRecord.code;
  },
});

/**
 * Debug endpoint: Verify password against stored hash
 * POST /e2e/debug-verify-password
 * Body: { email: string, password: string }
 *
 * Returns whether the password matches the stored hash.
 * Useful for debugging auth issues.
 */
export const debugVerifyPasswordEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!(email && password)) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.debugVerifyPasswordInternal, {
      email,
      password,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to verify password against stored hash
 */
export const debugVerifyPasswordInternal = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    accountFound: v.boolean(),
    hasStoredHash: v.boolean(),
    passwordMatches: v.optional(v.boolean()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // Find the authAccount by email (providerAccountId)
    const account = await ctx.db
      .query("authAccounts")
      .filter((q) =>
        q.and(
          q.eq(q.field("provider"), "password"),
          q.eq(q.field("providerAccountId"), args.email),
        ),
      )
      .filter(notDeleted)
      .first();

    if (!account) {
      return {
        success: false,
        accountFound: false,
        hasStoredHash: false,
        error: "No password account found for this email",
      };
    }

    const storedHash = account.secret;
    if (!storedHash) {
      return {
        success: false,
        accountFound: true,
        hasStoredHash: false,
        error: "Account exists but has no password hash",
      };
    }

    // Verify the password using Scrypt (same as Convex Auth)
    const scrypt = new Scrypt();
    const passwordMatches = await scrypt.verify(storedHash, args.password);

    return {
      success: true,
      accountFound: true,
      hasStoredHash: true,
      passwordMatches,
    };
  },
});

/**
 * Cleanup ALL E2E workspaces for a user (garbage collection)
 * POST /e2e/cleanup-workspaces
 * Body: { email: string }
 */
export const cleanupE2EWorkspacesEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = body;
    if (!email) return new Response("Missing email", { status: 400 });

    const result = await ctx.runMutation(internal.e2e.cleanupE2EWorkspacesInternal, { email });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

/** Deletes E2E testing workspaces created by a specific user, including teams and team members. */
export const cleanupE2EWorkspacesInternal = internalMutation({
  args: { email: v.string() },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (!user) return { deleted: 0 };

    const workspaces = await ctx.db
      .query("workspaces")
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .collect();

    let deleted = 0;
    for (const ws of workspaces) {
      if (ws.name === "E2E Testing Workspace") {
        // Delete teams
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
          .collect();
        for (const team of teams) {
          const tMembers = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", team._id))
            .collect();
          for (const m of tMembers) await ctx.db.delete(m._id);
          await ctx.db.delete(team._id);
        }
        await ctx.db.delete(ws._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

/**
 * Nuke ALL E2E workspaces (Global Cleanup)
 * POST /e2e/nuke-workspaces
 * Param: { confirm: true }
 */
export const nukeAllE2EWorkspacesEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    if (!body.confirm) return new Response("Missing confirm: true", { status: 400 });

    const result = await ctx.runMutation(internal.e2e.nukeAllE2EWorkspacesInternal, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

/** Deletes all workspaces in the shared E2E organization, including teams and members. */
export const nukeAllE2EWorkspacesInternal = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    // 1. Find the shared E2E organization
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", "nixelo-e2e"))
      .first();

    if (!organization) return { deleted: 0 };

    // 2. Find all workspaces in this organization
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .collect();

    let deleted = 0;
    for (const ws of workspaces) {
      // 3. Delete everything in the workspace
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
        .collect();

      for (const team of teams) {
        // Delete team members
        const tMembers = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();
        for (const m of tMembers) await ctx.db.delete(m._id);

        // Delete projects within the team
        const projects = await ctx.db
          .query("projects")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .filter(notDeleted)
          .collect();
        for (const p of projects) await ctx.db.delete(p._id);

        await ctx.db.delete(team._id);
      }

      // Delete projects in workspace (if any direct children)
      const wsProjects = await ctx.db
        .query("projects")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
        .filter(notDeleted)
        .collect();

      for (const p of wsProjects) await ctx.db.delete(p._id);

      await ctx.db.delete(ws._id);
      deleted++;
    }

    return { deleted };
  },
});

/**
 * Nuke timers for E2E testing
 * POST /e2e/nuke-timers
 * Body: { email?: string }
 */
export const nukeTimersEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body as { email?: string };

    const result = await ctx.runMutation(internal.e2e.nukeTimersInternal, { email });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to nuke timers
 */
export const nukeTimersInternal = internalMutation({
  args: {
    email: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx, args) => {
    let usersToCheck: Doc<"users">[] = [];

    if (args.email) {
      if (!isTestEmail(args.email)) {
        throw new Error("Only test emails allowed");
      }
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .filter(notDeleted)
        .first();
      if (user) usersToCheck.push(user);
    } else {
      // All test users
      usersToCheck = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("isTestUser"), true))
        .collect();
    }

    let deletedCount = 0;
    for (const user of usersToCheck) {
      const timers = await ctx.db
        .query("timeEntries")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      for (const timer of timers) {
        await ctx.db.delete(timer._id);
        deletedCount++;
      }
    }

    return { success: true, deleted: deletedCount };
  },
});

/**
 * Nuke workspaces for E2E testing
 * POST /e2e/nuke-workspaces
 */
export const nukeWorkspacesEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(internal.e2e.nukeWorkspacesInternal, {});

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to nuke workspaces created by test users
 */
export const nukeWorkspacesInternal = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    // Find all test users
    const testUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isTestUser"), true))
      .collect();

    let deletedCount = 0;

    // 2. Orphan Cleanup: Delete organizations/workspaces matching E2E patterns
    // This catches data where the creator user was already deleted

    // Delete orphan organizations by slug/name pattern
    await ctx.db
      .query("organizations")
      .withIndex("by_slug")
      .filter((q) => q.or(q.eq(q.field("slug"), "nixelo-e2e"), q.eq(q.field("name"), "Nixelo E2E")))
      .collect();

    // Also check for organizations wrapping E2E workspaces if possible?
    // Usually workspaces are children of organizations.
    // In the schema, `workspaces` have `organizationId`.
    // We should look for `workspaces` named "E2E Testing Workspace" and delete them + their parent organization if it's test-only?
    // Actually, just deleting the workspaces might be enough for the test selector?
    // The test selector looks for "E2E Testing Workspace".

    // Scan all workspaces to find "Engineering *" and other dynamic patterns
    // We fetch all because we can't filter by "startsWith" in DB query easily without specific index
    const allWorkspaces = await ctx.db.query("workspaces").collect();

    const spamWorkspaces = allWorkspaces.filter(
      (ws) =>
        ws.name === "E2E Testing Workspace" ||
        ws.name === "🧪 E2E Testing Workspace" ||
        // REMOVED "New Workspace" to prevent accidental data loss of user created workspaces
        ws.name.startsWith("Engineering ") ||
        ws.name.startsWith("Project-"), // Also clean up project leftovers if they leaked into workspaces table?
    );
    // Note: This full table scan is inefficient.
    // Ideally, we should add a `search_name` index or a `by_name_prefix` index
    // to filter these on the DB side. For now, in a test environment, this is acceptable.

    for (const ws of spamWorkspaces) {
      // Delete workspace artifacts?
      // Just delete the workspace for now to clear the UI list
      await ctx.db.delete(ws._id);
      deletedCount++;
    }

    // Continue with standard cleanup...
    for (const user of testUsers) {
      const organizations = await ctx.db
        .query("organizations")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();

      for (const organization of organizations) {
        // Delete organization members
        const members = await ctx.db
          .query("organizationMembers")
          .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
          .collect();
        for (const member of members) {
          await ctx.db.delete(member._id);
        }

        // Delete teams
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
          .collect();
        for (const team of teams) {
          await ctx.db.delete(team._id);
        }

        // Delete projects
        const projects = await ctx.db
          .query("projects")
          .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
          .filter(notDeleted)
          .collect();
        for (const project of projects) {
          await ctx.db.delete(project._id);
        }

        // Delete workspaces (departments)
        const workspaces = await ctx.db
          .query("workspaces")
          .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
          .collect();
        for (const workspace of workspaces) {
          await ctx.db.delete(workspace._id);
        }

        // Delete the organization (workspace container)
        await ctx.db.delete(organization._id);
        deletedCount++;
      }
    }

    // Also cleaning up "E2E Testing Workspace" specifically if created by admin but somehow left over?
    // The above loop covers it if created by a test user.

    return { success: true, deleted: deletedCount };
  },
});

/**
 * Reset a specific test workspace by name (Autonuke if exists)
 * POST /e2e/reset-workspace
 * Body: { name: string }
 */
export const resetTestWorkspaceEndpoint = httpAction(async (ctx, request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "Missing workspace name" }), { status: 400 });
    }

    const result = await ctx.runMutation(internal.e2e.resetTestWorkspaceInternal, { name });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to delete a workspace by name
 */
export const resetTestWorkspaceInternal = internalMutation({
  args: {
    name: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx, args) => {
    // Find workspaces with the exact name
    const workspaces = await ctx.db
      .query("workspaces")
      .filter((q) => q.eq(q.field("name"), args.name))
      .collect();

    let deletedCount = 0;

    for (const ws of workspaces) {
      // Delete Projects
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
        .filter(notDeleted)
        .collect();
      for (const p of projects) await ctx.db.delete(p._id);

      // Delete Teams
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
        .collect();
      for (const t of teams) await ctx.db.delete(t._id);

      // Delete the workspace itself
      await ctx.db.delete(ws._id);
      deletedCount++;
    }

    // Also try to find organizations with this name
    const orgsWithName = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), args.name))
      .collect();

    for (const organization of orgsWithName) {
      // Delete children logic similar to nuke
      // ... abbreviated for safety, assume nuke handles big cleanup, this handles targeted test iterations
      // If we are strictly creating a workspace (department), the above workspace deletion is sufficient.
      // If we are creating a organization, we need organization deletion.
      // The test "User can create a workspace" likely creates a organization (multi-tenant root) or a WORKSPACE (project group)?
      // Based on UI text "Add new workspace", it usually maps to the top-level entity.
      // Let's delete the organization too.

      // Delete organization members
      const members = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
        .collect();
      for (const member of members) await ctx.db.delete(member._id);

      // Delete teams
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
        .collect();
      for (const team of teams) await ctx.db.delete(team._id);

      // Delete projects
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
        .filter(notDeleted)
        .collect();
      for (const project of projects) await ctx.db.delete(project._id);

      // Delete workspaces (departments)
      const workspaces = await ctx.db
        .query("workspaces")
        .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
        .collect();
      for (const workspace of workspaces) await ctx.db.delete(workspace._id);

      await ctx.db.delete(organization._id);
      deletedCount++;
    }

    return { success: true, deleted: deletedCount };
  },
});

/** Lists duplicate test users by email address for debugging purposes. */
export const listDuplicateTestUsersInternal = internalMutation({
  args: {},
  returns: v.object({
    testUsers: v.number(),
    duplicates: v.array(v.object({ email: v.string(), ids: v.array(v.id("users")) })),
  }),
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const testUsers = allUsers.filter((u) => u.email?.includes("@inbox.mailtrap.io"));

    const emailMap = new Map<string, Id<"users">[]>();
    for (const user of testUsers) {
      const email = user.email;
      if (!email) continue;
      const ids = emailMap.get(email) || [];
      ids.push(user._id);
      emailMap.set(email, ids);
    }

    const duplicates = Array.from(emailMap.entries())
      .filter(([_, ids]) => ids.length > 1)
      .map(([email, ids]) => ({ email, ids }));

    logger.info(`[STALE] Found ${testUsers.length} total test users.`);
    logger.info(`[STALE] Found ${duplicates.length} duplicate emails.`);
    for (const d of duplicates) {
      logger.info(`[STALE] Email ${d.email} has IDs: ${d.ids.join(", ")}`);
    }

    return { testUsers: testUsers.length, duplicates };
  },
});

/**
 * Get latest OTP for a user
 * POST /e2e/get-latest-otp
 * Body: { email: string }
 */
export const getLatestOTPEndpoint = httpAction(async (ctx: ActionCtx, request: Request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, type } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const code = await ctx.runQuery(internal.e2e.getLatestOTP, { email, type });

    return new Response(JSON.stringify({ code }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/** Deletes all test users and their associated data including organizations, projects, and memberships. */
export const nukeAllTestUsersInternal = internalMutation({
  args: {},
  returns: v.object({ success: v.boolean(), deleted: v.number() }),
  handler: async (ctx) => {
    // Optimization: Use isTestUser index instead of full users table scan
    const testUsers = await ctx.db
      .query("users")
      .withIndex("isTestUser", (q) => q.eq("isTestUser", true))
      .collect();

    let deletedCount = 0;
    for (const user of testUsers) {
      // Delete accounts
      const accounts = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
      for (const acc of accounts) await ctx.db.delete(acc._id);

      // Delete organization memberships
      const memberships = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const m of memberships) await ctx.db.delete(m._id);

      // Delete project memberships
      const projMemberships = await ctx.db
        .query("projectMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const pm of projMemberships) await ctx.db.delete(pm._id);

      // Delete projects owned by test users
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect();
      for (const p of projects) await ctx.db.delete(p._id);

      // Delete auth sessions
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const s of sessions) await ctx.db.delete(s._id);

      const createdProjects = await ctx.db
        .query("projects")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();
      for (const p of createdProjects) await ctx.db.delete(p._id);

      // Delete organizations created by test users
      const organizations = await ctx.db
        .query("organizations")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();

      for (const org of organizations) {
        // Delete all members of this organization
        const members = await ctx.db
          .query("organizationMembers")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const m of members) await ctx.db.delete(m._id);

        // Delete all workspaces in this organization
        const workspaces = await ctx.db
          .query("workspaces")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const w of workspaces) await ctx.db.delete(w._id);

        // Delete all teams in this organization
        const teams = await ctx.db
          .query("teams")
          .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const t of teams) await ctx.db.delete(t._id);

        await ctx.db.delete(org._id);
      }

      await ctx.db.delete(user._id);
      deletedCount++;
    }
    return { success: true, deleted: deletedCount };
  },
});

/**
 * Internal mutation to cleanup expired test OTP codes
 * Called by cron job to prevent testOtpCodes table from growing indefinitely
 */
function getUtcDayBoundaries(
  baseTimestamp: number,
  offsetDays: number,
): { end: number; start: number } {
  const baseDate = new Date(baseTimestamp);
  const start = Date.UTC(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    baseDate.getUTCDate() + offsetDays,
  );
  return {
    end: start + DAY - 1,
    start,
  };
}

async function resetSeededInvoicesForScreenshot(
  ctx: MutationCtx,
  args: {
    createdBy: Id<"users">;
    now: number;
    organizationId: Id<"organizations">;
    portalClientId: Id<"clients">;
  },
) {
  while (true) {
    const existingInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(BOUNDED_LIST_LIMIT);

    if (existingInvoices.length === 0) {
      break;
    }

    for (const invoice of existingInvoices) {
      await ctx.db.delete(invoice._id);
    }
  }

  for (const definition of SCREENSHOT_INVOICE_DEFINITIONS) {
    const issueDate = getUtcDayBoundaries(args.now, definition.issueOffsetDays).start;
    const dueDate = getUtcDayBoundaries(args.now, definition.dueOffsetDays).end;
    const lineItems = definition.lineItems.map((lineItem) => ({
      amount: lineItem.quantity * lineItem.rate,
      description: lineItem.description,
      quantity: lineItem.quantity,
      rate: lineItem.rate,
    }));
    const subtotal = lineItems.reduce((sum, lineItem) => sum + lineItem.amount, 0);

    await ctx.db.insert("invoices", {
      clientId: definition.client === "portal" ? args.portalClientId : undefined,
      createdBy: args.createdBy,
      dueDate,
      issueDate,
      lineItems,
      notes: definition.notes,
      number: definition.number,
      organizationId: args.organizationId,
      paidAt:
        definition.status === "paid" && definition.paidOffsetDays !== undefined
          ? getUtcDayBoundaries(args.now, definition.paidOffsetDays).start
          : undefined,
      pdfUrl: undefined,
      sentAt:
        definition.status !== "draft" && definition.sentOffsetDays !== undefined
          ? getUtcDayBoundaries(args.now, definition.sentOffsetDays).start
          : undefined,
      status: definition.status,
      subtotal,
      tax: undefined,
      total: subtotal,
      updatedAt: args.now,
    });
  }
}

/**
 * Seed screenshot data for visual regression testing
 * POST /e2e/seed-screenshot-data
 * Body: { email: string }
 *
 * Creates workspace, team, project, sprint, issues, and documents
 * so screenshot pages show filled states.
 */
export const seedScreenshotDataEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, orgSlug } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runMutation(internal.e2e.seedScreenshotDataInternal, {
      email,
      orgSlug,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Resolve the screenshot org slug for a test user without seeding data.
 * POST /e2e/resolve-screenshot-org-slug
 * Body: { email: string, orgSlug?: string }
 */
export const getScreenshotOrgSlugEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, orgSlug } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isTestEmail(email)) {
      return new Response(JSON.stringify({ error: "Only test emails allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runQuery(internal.e2e.getScreenshotOrgSlugInternal, {
      email,
      orgSlug,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const getScreenshotOrgSlugInternal = internalQuery({
  args: {
    email: v.string(),
    orgSlug: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    orgSlug: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      return { success: false, error: "Only test emails allowed" };
    }

    const user = await findLatestUserByEmail(ctx, args.email);
    if (!user) {
      return { success: false, error: `User not found: ${args.email}` };
    }

    const { error, organization } = await resolveSeedOrganizationForUser(ctx, user, args.orgSlug);
    if (error || !organization) {
      return { success: false, error: error ?? "Organization not found" };
    }

    return {
      success: true,
      orgSlug: organization.slug,
    };
  },
});

/**
 * Internal mutation to seed screenshot data
 */
export const seedScreenshotDataInternal = internalMutation({
  args: {
    email: v.string(),
    orgSlug: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    orgSlug: v.optional(v.string()),
    projectId: v.optional(v.string()),
    projectKey: v.optional(v.string()),
    issueKeys: v.optional(v.array(v.string())),
    documentIds: v.optional(
      v.object({
        projectRequirements: v.optional(v.id("documents")),
        sprintRetrospectiveNotes: v.optional(v.id("documents")),
      }),
    ),
    workspaceSlug: v.optional(v.string()),
    teamSlug: v.optional(v.string()),
    inviteToken: v.optional(v.string()),
    portalToken: v.optional(v.string()),
    portalProjectId: v.optional(v.string()),
    unsubscribeTokens: v.optional(
      v.object({
        desktopDark: v.string(),
        desktopLight: v.string(),
        tabletLight: v.string(),
        mobileLight: v.string(),
      }),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!isTestEmail(args.email)) {
      throw new Error("Only test emails allowed");
    }

    // 1. Find user by email (latest if duplicates)
    const user = await findLatestUserByEmail(ctx, args.email);
    if (!user) {
      return { success: false, error: `User not found: ${args.email}` };
    }
    const userId = user._id;

    // 1b. Set display name if missing
    if (!user.name) {
      await ctx.db.patch(userId, { name: "Emily Chen" });
    }

    // 2. Resolve the organization to seed against.
    const { error, organization } = await resolveSeedOrganizationForUser(ctx, user, args.orgSlug);
    if (error || !organization) {
      return { success: false, error: error ?? "Organization not found" };
    }

    const orgId = organization._id;
    const orgSlug = organization.slug;
    const now = Date.now();

    // 2b. Create additional named team members (for project settings, etc.)
    const syntheticMembers: Array<{ name: string; email: string }> = [
      { name: "Alex Rivera", email: "alex-rivera-screenshots@inbox.mailtrap.io" },
      { name: "Sarah Kim", email: "sarah-kim-screenshots@inbox.mailtrap.io" },
    ];
    const syntheticUserIds: Array<typeof userId> = [];

    for (const member of syntheticMembers) {
      let existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), member.email))
        .first();

      if (!existingUser) {
        const newUserId = await ctx.db.insert("users", {
          name: member.name,
          email: member.email,
        });
        existingUser = await ctx.db.get(newUserId);
      } else if (!existingUser.name) {
        await ctx.db.patch(existingUser._id, { name: member.name });
      }

      if (!existingUser) continue;
      syntheticUserIds.push(existingUser._id);

      // Add to organization as member
      const orgMember = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) =>
          q.eq("organizationId", orgId).eq("userId", existingUser._id),
        )
        .first();
      if (!orgMember) {
        await ctx.db.insert("organizationMembers", {
          organizationId: orgId,
          userId: existingUser._id,
          role: "member",
          addedBy: userId,
        });
      }
    }

    // 3. Create workspace (idempotent)
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) => q.eq(q.field("slug"), "product"))
      .first();

    if (!workspace) {
      const wsId = await ctx.db.insert("workspaces", {
        name: "Product",
        slug: "product",
        icon: "📱",
        organizationId: orgId,
        createdBy: userId,
        updatedAt: now,
      });
      workspace = await ctx.db.get(wsId);
    }

    if (!workspace) {
      return { success: false, error: "Failed to create workspace" };
    }
    const workspaceId = workspace._id;

    // Ensure current user is a workspace member so workspace-scoped queries,
    // including calendar views, can actually see the seeded data.
    const existingWorkspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", workspaceId).eq("userId", userId))
      .first();
    if (!existingWorkspaceMember) {
      await ctx.db.insert("workspaceMembers", {
        workspaceId,
        userId,
        role: "admin",
        addedBy: userId,
      });
    }

    // Keep synthetic members aligned with the seeded workspace so team/workspace
    // scoped views operate on consistent membership data.
    for (const memberId of syntheticUserIds) {
      const existingWorkspaceSyntheticMember = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", workspaceId).eq("userId", memberId),
        )
        .first();
      if (!existingWorkspaceSyntheticMember) {
        await ctx.db.insert("workspaceMembers", {
          workspaceId,
          userId: memberId,
          role: "member",
          addedBy: userId,
        });
      }
    }

    // 4. Create team (idempotent)
    let team = await ctx.db
      .query("teams")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("slug"), "engineering"))
      .first();

    if (!team) {
      const newTeamId = await ctx.db.insert("teams", {
        name: "Engineering",
        slug: "engineering",
        organizationId: orgId,
        workspaceId,
        createdBy: userId,
        updatedAt: now,
        isPrivate: false,
      });
      team = await ctx.db.get(newTeamId);
    }

    if (!team) {
      return { success: false, error: "Failed to create team" };
    }
    const teamId = team._id;

    // Ensure current user is a team member (handles user re-creation between runs)
    const existingTeamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (!existingTeamMember) {
      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "admin",
        addedBy: userId,
      });
    }

    // 4b. Add synthetic members to team
    for (const memberId of syntheticUserIds) {
      const existingTm = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .filter((q) => q.eq(q.field("userId"), memberId))
        .first();
      if (!existingTm) {
        await ctx.db.insert("teamMembers", {
          teamId,
          userId: memberId,
          role: "member",
          addedBy: userId,
        });
      }
    }

    // 5. Create project (idempotent)
    // Only re-use projects that were created by this seeding process (identified by
    // the specific description), to avoid hijacking legitimate DEMO projects in shared orgs
    const projectKey = "DEMO";
    const screenshotProjectDescription = "Demo project for screenshot visual review";
    let project = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) =>
        q.and(
          notDeleted(q),
          q.eq(q.field("key"), projectKey),
          q.eq(q.field("description"), screenshotProjectDescription),
        ),
      )
      .first();

    if (!project) {
      const projId = await ctx.db.insert("projects", {
        name: "Demo Project",
        key: projectKey,
        description: screenshotProjectDescription,
        organizationId: orgId,
        workspaceId,
        teamId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: now,
        boardType: "kanban",
        nextIssueNumber: 7,
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 1 },
          { id: "in-review", name: "In Review", category: "inprogress", order: 2 },
          { id: "done", name: "Done", category: "done", order: 3 },
        ],
      });
      project = await ctx.db.get(projId);
    } else {
      // Re-home the seeded project so list/detail queries all target the same org/workspace.
      const nextIssueNumber = await getProjectIssueCounterFloor(ctx, project);
      await ctx.db.patch(project._id, {
        name: "Demo Project",
        description: screenshotProjectDescription,
        organizationId: orgId,
        workspaceId,
        teamId,
        ownerId: userId,
        updatedAt: now,
        boardType: "kanban",
        nextIssueNumber: Math.max(nextIssueNumber, 7),
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 1 },
          { id: "in-review", name: "In Review", category: "inprogress", order: 2 },
          { id: "done", name: "Done", category: "done", order: 3 },
        ],
      });
      project = await ctx.db.get(project._id);
    }

    if (!project) {
      return { success: false, error: "Failed to create project" };
    }
    const projectId = project._id;

    // Ensure current user is a project member (handles user re-creation between runs)
    const existingProjectMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
      .filter(notDeleted)
      .first();
    if (!existingProjectMember) {
      await ctx.db.insert("projectMembers", {
        projectId,
        userId,
        role: "admin",
        addedBy: userId,
      });
    }

    // 5b. Add synthetic members to project
    for (const memberId of syntheticUserIds) {
      const existingPm = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", memberId))
        .filter(notDeleted)
        .first();
      if (!existingPm) {
        await ctx.db.insert("projectMembers", {
          projectId,
          userId: memberId,
          role: "editor",
          addedBy: userId,
        });
      }
    }

    // Normalize screenshot project membership so stale test users don't accumulate
    // across repeated runs against the shared DEMO project.
    const intendedProjectMembers = new Map<Id<"users">, "admin" | "editor">([[userId, "admin"]]);
    for (const memberId of syntheticUserIds) {
      intendedProjectMembers.set(memberId, "editor");
    }
    const keptProjectMembershipIds = new Set<string>();
    const seenProjectMemberIds = new Set<Id<"users">>();
    while (true) {
      const activeProjectMemberships = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .filter(notDeleted)
        .take(BOUNDED_LIST_LIMIT);

      // Exit if we've processed all memberships (no more to fetch)
      if (activeProjectMemberships.length === 0) {
        break;
      }

      let deletedThisPass = 0;
      let newRecordsThisPass = 0;

      for (const membership of activeProjectMemberships) {
        if (keptProjectMembershipIds.has(membership._id)) {
          continue;
        }

        newRecordsThisPass += 1;
        const intendedRole = intendedProjectMembers.get(membership.userId);

        if (!intendedRole) {
          await ctx.db.patch(membership._id, softDeleteFields(userId));
          deletedThisPass += 1;
          continue;
        }

        if (seenProjectMemberIds.has(membership.userId)) {
          await ctx.db.patch(membership._id, softDeleteFields(userId));
          deletedThisPass += 1;
          continue;
        }

        seenProjectMemberIds.add(membership.userId);
        keptProjectMembershipIds.add(membership._id);

        await ctx.db.patch(membership._id, {
          role: intendedRole,
          addedBy: userId,
          isDeleted: undefined,
          deletedAt: undefined,
          deletedBy: undefined,
        });
      }

      // Exit only if no deletions AND no new records were processed
      // (meaning we've seen all remaining records before)
      if (deletedThisPass === 0 && newRecordsThisPass === 0) {
        break;
      }
    }

    for (const [memberId, intendedRole] of intendedProjectMembers) {
      if (seenProjectMemberIds.has(memberId)) {
        continue;
      }

      await ctx.db.insert("projectMembers", {
        projectId,
        userId: memberId,
        role: intendedRole,
        addedBy: userId,
      });
    }

    // Add a second seeded project so the projects index reflects a real workspace instead
    // of stretching a single demo project across a list page.
    const secondaryProjectKey = "OPS";
    // Only look for projects in our org to avoid hijacking projects from other orgs
    let secondaryProject = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), secondaryProjectKey)))
      .first();

    if (!secondaryProject) {
      const secondaryProjectId = await ctx.db.insert("projects", {
        name: "Client Operations Hub",
        key: secondaryProjectKey,
        description: "Launch checklists, client handoffs, and delivery follow-through.",
        organizationId: orgId,
        workspaceId,
        teamId,
        ownerId: userId,
        createdBy: userId,
        updatedAt: now,
        boardType: "scrum",
        nextIssueNumber: 3,
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 1 },
          { id: "in-review", name: "In Review", category: "inprogress", order: 2 },
          { id: "done", name: "Done", category: "done", order: 3 },
        ],
      });
      secondaryProject = await ctx.db.get(secondaryProjectId);
    } else {
      const nextIssueNumber = await getProjectIssueCounterFloor(ctx, secondaryProject);
      await ctx.db.patch(secondaryProject._id, {
        name: "Client Operations Hub",
        description: "Launch checklists, client handoffs, and delivery follow-through.",
        organizationId: orgId,
        workspaceId,
        teamId,
        ownerId: userId,
        updatedAt: now,
        boardType: "scrum",
        nextIssueNumber: Math.max(nextIssueNumber, 3),
        workflowStates: [
          { id: "todo", name: "To Do", category: "todo", order: 0 },
          { id: "in-progress", name: "In Progress", category: "inprogress", order: 1 },
          { id: "in-review", name: "In Review", category: "inprogress", order: 2 },
          { id: "done", name: "Done", category: "done", order: 3 },
        ],
      });
      secondaryProject = await ctx.db.get(secondaryProject._id);
    }

    if (!secondaryProject) {
      return { success: false, error: "Failed to create secondary project" };
    }

    const secondaryProjectId = secondaryProject._id;

    const screenshotInviteEmail = "invite-screenshots@nixelo.test";
    const existingScreenshotInvites = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", screenshotInviteEmail))
      .filter((q) => q.eq(q.field("organizationId"), orgId))
      .collect();

    for (const invite of existingScreenshotInvites) {
      await ctx.db.delete(invite._id);
    }

    const inviteToken = generateInvitePreviewToken();
    await ctx.db.insert("invites", {
      email: screenshotInviteEmail,
      role: "user",
      organizationId: orgId,
      projectId,
      projectRole: "editor",
      invitedBy: userId,
      token: inviteToken,
      expiresAt: now + WEEK,
      status: "pending",
      updatedAt: now,
    });

    const existingUnsubscribeTokens = await ctx.db
      .query("unsubscribeTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const token of existingUnsubscribeTokens) {
      await ctx.db.delete(token._id);
    }

    const unsubscribeTokens = {
      desktopDark: generateUnsubscribePreviewToken(),
      desktopLight: generateUnsubscribePreviewToken(),
      tabletLight: generateUnsubscribePreviewToken(),
      mobileLight: generateUnsubscribePreviewToken(),
    };

    for (const token of Object.values(unsubscribeTokens)) {
      await ctx.db.insert("unsubscribeTokens", {
        userId,
        token,
        usedAt: undefined,
      });
    }

    let portalClient = await ctx.db
      .query("clients")
      .withIndex("by_organization_email", (q) =>
        q.eq("organizationId", orgId).eq("email", "portal-screenshots@nixelo.test"),
      )
      .first();

    if (!portalClient) {
      const portalClientId = await ctx.db.insert("clients", {
        organizationId: orgId,
        name: "Northstar Labs",
        email: "portal-screenshots@nixelo.test",
        company: "Northstar Labs",
        address: "18 Market Street, Chicago, IL",
        hourlyRate: 185,
        createdBy: userId,
        updatedAt: now,
      });
      portalClient = await ctx.db.get(portalClientId);
    } else {
      await ctx.db.patch(portalClient._id, {
        name: "Northstar Labs",
        company: "Northstar Labs",
        address: "18 Market Street, Chicago, IL",
        hourlyRate: 185,
        updatedAt: now,
      });
      portalClient = await ctx.db.get(portalClient._id);
    }

    if (!portalClient) {
      return { success: false, error: "Failed to create portal client" };
    }

    const existingPortalTokens = await ctx.db
      .query("clientPortalTokens")
      .withIndex("by_client", (q) => q.eq("clientId", portalClient._id))
      .collect();

    for (const token of existingPortalTokens) {
      await ctx.db.delete(token._id);
    }

    const portalToken = `${crypto.randomUUID().replace(/-/g, "")}${crypto
      .randomUUID()
      .replace(/-/g, "")}`;

    await ctx.db.insert("clientPortalTokens", {
      organizationId: orgId,
      clientId: portalClient._id,
      token: portalToken,
      projectIds: [projectId, secondaryProjectId],
      permissions: {
        viewIssues: true,
        viewDocuments: true,
        viewTimeline: true,
        addComments: false,
      },
      expiresAt: now + 30 * DAY,
      lastAccessedAt: undefined,
      isRevoked: false,
      revokedAt: undefined,
      createdBy: userId,
      updatedAt: now,
    });

    await resetSeededInvoicesForScreenshot(ctx, {
      createdBy: userId,
      now,
      organizationId: orgId,
      portalClientId: portalClient._id,
    });

    // Normalize OPS project membership: remove stale members from previous runs
    // (autoLogin recreates the screenshot user, so old membership rows accumulate)
    const opsMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", secondaryProjectId))
      .filter(notDeleted)
      .collect();
    for (const member of opsMembers) {
      if (member.userId !== userId) {
        await ctx.db.delete(member._id);
      }
    }

    // Ensure current user is an OPS project member
    const secondaryProjectMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", secondaryProjectId).eq("userId", userId),
      )
      .filter(notDeleted)
      .first();
    if (!secondaryProjectMember) {
      await ctx.db.insert("projectMembers", {
        projectId: secondaryProjectId,
        userId,
        role: "admin",
        addedBy: userId,
      });
    }

    const secondaryIssueDefinitions: Array<{
      key: string;
      title: string;
      priority: "lowest" | "low" | "medium" | "high" | "highest";
      status: string;
      type: "task" | "bug" | "story" | "epic";
    }> = [
      {
        key: "OPS-1",
        title: "Prepare customer launch checklist",
        priority: "high",
        status: "in-progress",
        type: "task",
      },
      {
        key: "OPS-2",
        title: "Collect approval notes for handoff packet",
        priority: "medium",
        status: "todo",
        type: "story",
      },
      {
        key: "OPS-3",
        title: "Confirm support rotation for go-live week",
        priority: "high",
        status: "in-review",
        type: "task",
      },
    ];

    for (let i = 0; i < secondaryIssueDefinitions.length; i++) {
      const def = secondaryIssueDefinitions[i];
      // Only look for issues in our secondary project to avoid hijacking issues from other orgs
      const existing = await ctx.db
        .query("issues")
        .withIndex("by_project_status", (q) => q.eq("projectId", secondaryProjectId))
        .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), def.key)))
        .first();

      if (!existing) {
        await ctx.db.insert("issues", {
          projectId: secondaryProjectId,
          organizationId: orgId,
          workspaceId,
          teamId,
          key: def.key,
          title: def.title,
          type: def.type,
          status: def.status,
          priority: def.priority,
          reporterId: userId,
          assigneeId: userId,
          updatedAt: now,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: i,
          version: 1,
        });
      } else {
        await ctx.db.patch(existing._id, {
          projectId: secondaryProjectId,
          organizationId: orgId,
          workspaceId,
          teamId,
          title: def.title,
          type: def.type,
          status: def.status,
          priority: def.priority,
          reporterId: userId,
          assigneeId: userId,
          order: i,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          version: existing.version ?? 1,
          updatedAt: now,
        });
      }
    }

    // 6. Create sprint (idempotent - check by project + name)
    let sprint = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("name"), "Sprint 1"))
      .filter(notDeleted)
      .first();

    if (!sprint) {
      const sprintId = await ctx.db.insert("sprints", {
        projectId,
        name: "Sprint 1",
        goal: "Launch MVP features",
        status: "active",
        startDate: now - WEEK,
        endDate: now + WEEK,
        createdBy: userId,
        updatedAt: now,
      });
      sprint = await ctx.db.get(sprintId);
    }

    const sprintId = sprint?._id;

    // 7. Create issues (idempotent by key)
    const issueDefinitions: Array<{
      key: string;
      title: string;
      type: "task" | "bug" | "story" | "epic";
      status: string;
      priority: "lowest" | "low" | "medium" | "high" | "highest";
      assigned: boolean;
      inSprint: boolean;
      dueDate?: number;
    }> = [
      {
        key: "DEMO-1",
        title: "Set up CI/CD pipeline",
        type: "task",
        status: "done",
        priority: "high",
        assigned: true,
        inSprint: true,
        dueDate: now - 2 * DAY,
      },
      {
        key: "DEMO-2",
        title: "Fix login timeout on mobile",
        type: "bug",
        status: "in-progress",
        priority: "highest",
        assigned: true,
        inSprint: true,
        dueDate: now + 1 * DAY,
      },
      {
        key: "DEMO-3",
        title: "Design new dashboard layout",
        type: "story",
        status: "in-review",
        priority: "medium",
        assigned: true,
        inSprint: true,
        dueDate: now + 3 * DAY,
      },
      {
        key: "DEMO-4",
        title: "Add dark mode support",
        type: "story",
        status: "todo",
        priority: "medium",
        assigned: false,
        inSprint: true,
        dueDate: now + 7 * DAY,
      },
      {
        key: "DEMO-5",
        title: "Database query optimization",
        type: "task",
        status: "in-progress",
        priority: "high",
        assigned: true,
        inSprint: false,
      },
      {
        key: "DEMO-6",
        title: "User onboarding flow",
        type: "epic",
        status: "todo",
        priority: "low",
        assigned: false,
        inSprint: false,
      },
      {
        key: "DEMO-7",
        title: "Improve release checklist",
        type: "task",
        status: "todo",
        priority: "high",
        assigned: true,
        inSprint: true,
        dueDate: now + 2 * DAY,
      },
    ];

    const createdIssueKeys: string[] = [];
    const createdIssueIdsByKey = new Map<string, Id<"issues">>();

    for (let i = 0; i < issueDefinitions.length; i++) {
      const def = issueDefinitions[i];
      // Only look for issues in our screenshot project to avoid hijacking issues from other orgs
      const existing = await ctx.db
        .query("issues")
        .withIndex("by_project_status", (q) => q.eq("projectId", projectId))
        .filter((q) => q.and(notDeleted(q), q.eq(q.field("key"), def.key)))
        .first();

      let issueId: Id<"issues">;

      if (!existing) {
        issueId = await ctx.db.insert("issues", {
          projectId,
          organizationId: orgId,
          workspaceId,
          teamId,
          key: def.key,
          title: def.title,
          type: def.type,
          status: def.status,
          priority: def.priority,
          reporterId: userId,
          assigneeId: def.assigned ? userId : undefined,
          sprintId: def.inSprint && sprintId ? sprintId : undefined,
          dueDate: def.dueDate,
          updatedAt: now,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          order: i,
          version: 1,
        });
      } else {
        // Keep seeded issues attached to the current screenshot project instead of stale globals.
        await ctx.db.patch(existing._id, {
          projectId,
          organizationId: orgId,
          workspaceId,
          teamId,
          title: def.title,
          type: def.type,
          status: def.status,
          priority: def.priority,
          reporterId: userId,
          assigneeId: def.assigned ? userId : undefined,
          sprintId: def.inSprint && sprintId ? sprintId : undefined,
          dueDate: def.dueDate,
          order: i,
          labels: [],
          linkedDocuments: [],
          attachments: [],
          version: existing.version ?? 1,
          updatedAt: now,
        });
        issueId = existing._id;
      }
      createdIssueKeys.push(def.key);
      createdIssueIdsByKey.set(def.key, issueId);
    }

    const inboxReset = await resetSeededProjectInboxIssues(ctx, {
      organizationId: orgId,
      projectId,
      mode: "default",
      issueIdsByKey: createdIssueIdsByKey,
    });

    if (!inboxReset.success) {
      return {
        success: false,
        error: inboxReset.error ?? "Failed to seed project inbox screenshot state",
      };
    }

    // 8. Create documents (idempotent by title + project)
    // Only look for documents in our screenshot project to avoid overwriting real docs
    const docTitles = ["Project Requirements", "Sprint Retrospective Notes"] as const;
    const documentIds: {
      projectRequirements?: Id<"documents">;
      sprintRetrospectiveNotes?: Id<"documents">;
    } = {};
    for (const title of docTitles) {
      let existingDoc = await ctx.db
        .query("documents")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .filter((q) => q.and(notDeleted(q), q.eq(q.field("title"), title)))
        .first();

      if (!existingDoc) {
        const insertedId = await ctx.db.insert("documents", {
          title,
          isPublic: false,
          createdBy: userId,
          updatedAt: now,
          organizationId: orgId,
          workspaceId,
          projectId,
        });

        existingDoc = await ctx.db.get(insertedId);
      }

      if (!existingDoc) {
        continue;
      }

      if (title === "Project Requirements") {
        documentIds.projectRequirements = existingDoc._id;
      } else if (title === "Sprint Retrospective Notes") {
        documentIds.sprintRetrospectiveNotes = existingDoc._id;
      }

      const latestVersion = await ctx.db
        .query("documentVersions")
        .withIndex("by_document", (q) => q.eq("documentId", existingDoc._id))
        .order("desc")
        .first();

      const seededSnapshot = SCREENSHOT_DOCUMENT_SNAPSHOTS[title];
      // Insert a new version if no version exists OR if the snapshot has changed
      // (allows re-seeding to update stale document content across runs)
      if (
        seededSnapshot &&
        JSON.stringify(latestVersion?.snapshot ?? null) !== JSON.stringify(seededSnapshot)
      ) {
        await ctx.db.insert("documentVersions", {
          documentId: existingDoc._id,
          version: (latestVersion?.version ?? 0) + 1,
          snapshot: seededSnapshot,
          title,
          createdBy: userId,
        });
      }
    }

    // 9. Create calendar events (idempotent by organizer + title)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const calendarDefs: Array<{
      title: string;
      startHour: number;
      startMin: number;
      endHour: number;
      endMin: number;
      dayOffset: number;
      eventType: "meeting" | "deadline" | "timeblock" | "personal";
      color: CalendarEventColor;
      description?: string;
    }> = [
      // Today (dayOffset: 0) — 4 events to show overlap handling
      {
        title: "Sprint Planning",
        startHour: 9,
        startMin: 0,
        endHour: 10,
        endMin: 0,
        dayOffset: 0,
        eventType: "meeting",
        color: "blue",
        description: "Review sprint goals and assign tasks",
      },
      {
        title: "Design Review",
        startHour: 10,
        startMin: 30,
        endHour: 11,
        endMin: 30,
        dayOffset: 0,
        eventType: "meeting",
        color: "purple",
        description: "Review dashboard mockups with the team",
      },
      {
        title: "Focus Time: Bug Fixes",
        startHour: 14,
        startMin: 0,
        endHour: 16,
        endMin: 0,
        dayOffset: 0,
        eventType: "timeblock",
        color: "green",
        description: "Deep focus on critical bug fixes",
      },
      {
        title: "Standup Check-in",
        startHour: 16,
        startMin: 30,
        endHour: 17,
        endMin: 0,
        dayOffset: 0,
        eventType: "meeting",
        color: "teal",
        description: "Quick daily sync with the team",
      },
      // Tomorrow (dayOffset: 1)
      {
        title: "Client Demo",
        startHour: 11,
        startMin: 0,
        endHour: 12,
        endMin: 0,
        dayOffset: 1,
        eventType: "meeting",
        color: "orange",
        description: "Demo new features to client stakeholders",
      },
      {
        title: "Architecture Discussion",
        startHour: 14,
        startMin: 0,
        endHour: 15,
        endMin: 30,
        dayOffset: 1,
        eventType: "meeting",
        color: "indigo",
        description: "Discuss API v2 migration plan",
      },
      // Day +2
      {
        title: "Code Review Session",
        startHour: 10,
        startMin: 0,
        endHour: 11,
        endMin: 0,
        dayOffset: 2,
        eventType: "meeting",
        color: "amber",
        description: "Review open pull requests for the sprint",
      },
      {
        title: "Deep Work: API Integration",
        startHour: 13,
        startMin: 0,
        endHour: 16,
        endMin: 0,
        dayOffset: 2,
        eventType: "timeblock",
        color: "green",
        description: "Focus block for third-party API integration",
      },
      // Day +3
      {
        title: "Team Retrospective",
        startHour: 15,
        startMin: 0,
        endHour: 16,
        endMin: 0,
        dayOffset: 3,
        eventType: "meeting",
        color: "blue",
        description: "Sprint retrospective and improvement planning",
      },
      {
        title: "Gym & Wellness",
        startHour: 12,
        startMin: 0,
        endHour: 13,
        endMin: 0,
        dayOffset: 3,
        eventType: "personal",
        color: "pink",
        description: "Lunch break workout",
      },
      // Day +4
      {
        title: "QA Testing Window",
        startHour: 9,
        startMin: 0,
        endHour: 12,
        endMin: 0,
        dayOffset: 4,
        eventType: "timeblock",
        color: "green",
        description: "End-to-end testing before release",
      },
      {
        title: "Release Review",
        startHour: 14,
        startMin: 0,
        endHour: 15,
        endMin: 0,
        dayOffset: 4,
        eventType: "meeting",
        color: "red",
        description: "Go/no-go decision for v2.1 release",
      },
      // Day +5
      {
        title: "Sprint Deadline",
        startHour: 17,
        startMin: 0,
        endHour: 17,
        endMin: 30,
        dayOffset: 5,
        eventType: "deadline",
        color: "red",
        description: "All sprint items must be completed",
      },
      {
        title: "Knowledge Sharing",
        startHour: 10,
        startMin: 0,
        endHour: 11,
        endMin: 0,
        dayOffset: 5,
        eventType: "meeting",
        color: "purple",
        description: "Tech talk: React Server Components deep dive",
      },
      // Day +6
      {
        title: "Backlog Grooming",
        startHour: 10,
        startMin: 0,
        endHour: 11,
        endMin: 30,
        dayOffset: 6,
        eventType: "meeting",
        color: "indigo",
        description: "Prioritize and estimate upcoming stories",
      },
    ];

    for (const cal of calendarDefs) {
      const startTime =
        todayMs + cal.dayOffset * DAY + cal.startHour * HOUR + cal.startMin * MINUTE;
      const endTime = todayMs + cal.dayOffset * DAY + cal.endHour * HOUR + cal.endMin * MINUTE;

      const existing = await ctx.db
        .query("calendarEvents")
        .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
        .filter((q) => q.eq(q.field("title"), cal.title))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          organizationId: orgId,
          workspaceId,
          teamId,
          projectId,
          description: cal.description,
          startTime,
          endTime,
          eventType: cal.eventType,
          color: cal.color,
          attendeeIds: [userId, ...syntheticUserIds],
          status: "confirmed",
          isRecurring: false,
          isRequired: cal.eventType === "meeting",
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("calendarEvents", {
          organizationId: orgId,
          workspaceId,
          teamId,
          projectId,
          title: cal.title,
          description: cal.description,
          startTime,
          endTime,
          allDay: false,
          eventType: cal.eventType,
          color: cal.color,
          organizerId: userId,
          attendeeIds: [userId, ...syntheticUserIds],
          status: "confirmed",
          isRecurring: false,
          isRequired: cal.eventType === "meeting",
          updatedAt: now,
        });
      }
    }

    // 10. Create time entries (idempotent by user + description)
    const timeEntryDefs: Array<{
      description: string;
      dayOffset: number;
      durationHours: number;
      activity: string;
      billable: boolean;
      hourlyRate?: number;
    }> = [
      {
        description: "CI/CD pipeline setup and configuration",
        dayOffset: -2,
        durationHours: 4,
        activity: "Development",
        billable: true,
        hourlyRate: 150,
      },
      {
        description: "Bug investigation: login timeout on mobile",
        dayOffset: -1,
        durationHours: 3,
        activity: "Development",
        billable: true,
        hourlyRate: 150,
      },
      {
        description: "Dashboard design review with team",
        dayOffset: -1,
        durationHours: 1.5,
        activity: "Code Review",
        billable: true,
        hourlyRate: 150,
      },
      {
        description: "Sprint planning meeting",
        dayOffset: 0,
        durationHours: 1,
        activity: "Meeting",
        billable: false,
      },
      {
        description: "Mobile login fix implementation",
        dayOffset: 0,
        durationHours: 2.5,
        activity: "Development",
        billable: true,
        hourlyRate: 150,
      },
    ];

    for (const entry of timeEntryDefs) {
      const entryDate = todayMs + entry.dayOffset * DAY;
      const existing = await ctx.db
        .query("timeEntries")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", entryDate))
        .filter((q) => q.eq(q.field("description"), entry.description))
        .first();

      if (!existing) {
        const durationSeconds = entry.durationHours * 3600;
        const startTime = entryDate + 9 * HOUR; // 9 AM
        const endTime = startTime + durationSeconds * SECOND;
        const totalCost =
          entry.billable && entry.hourlyRate ? entry.durationHours * entry.hourlyRate : undefined;

        await ctx.db.insert("timeEntries", {
          userId,
          projectId,
          startTime,
          endTime,
          duration: durationSeconds,
          date: entryDate,
          description: entry.description,
          activity: entry.activity,
          tags: [],
          hourlyRate: entry.hourlyRate,
          totalCost,
          currency: "USD",
          billable: entry.billable,
          billed: false,
          isEquityHour: false,
          isLocked: false,
          isApproved: false,
          updatedAt: now,
        });
      }
    }

    const assistantReset = await resetSeededAssistantState(ctx, {
      mode: "default",
      now,
      primaryProjectId: projectId,
      secondaryProjectId,
      userId,
    });
    if (!assistantReset.success) {
      return {
        success: false,
        error: assistantReset.error ?? "Failed to seed assistant screenshot state",
      };
    }

    const notificationsReset = await resetSeededNotificationsForUser(ctx, {
      organizationId: orgId,
      projectId,
      mode: "default",
      issueIdsByKey: createdIssueIdsByKey,
    });
    if (!notificationsReset.success) {
      return {
        success: false,
        error: notificationsReset.error ?? "Failed to seed notifications screenshot state",
      };
    }

    // 10c. Create meetings workspace data with two completed recordings spanning
    // both seeded projects so transcript and memory filters have deterministic content.
    await resetMeetingSeedDataForUser(ctx, userId);
    const alexUserId = syntheticUserIds[0] ?? userId;
    const sarahUserId = syntheticUserIds[1] ?? userId;

    const meetingSeedDefinitions = [
      {
        title: "Weekly Product Sync",
        meetingUrl: "https://meet.google.com/product-sync-demo",
        meetingPlatform: "google_meet" as const,
        projectId,
        scheduledStartTime: now - 3 * HOUR,
        actualStartTime: now - 3 * HOUR,
        actualEndTime: now - 135 * MINUTE,
        duration: 45 * MINUTE,
        fullText:
          "Release blockers center on pricing approval and onboarding copy polish. Pricing approval still needs legal sign-off before launch.",
        segments: [
          {
            startTime: 0,
            endTime: 34,
            speaker: "Emily Chen",
            speakerUserId: userId,
            text: "We cleared the dashboard bugs, but pricing approval still needs legal sign-off before launch.",
            confidence: 0.98,
          },
          {
            startTime: 35,
            endTime: 67,
            speaker: "Alex Rivera",
            speakerUserId: alexUserId,
            text: "Onboarding copy is the other blocker, and we should turn the release checklist into tracked follow-up work.",
            confidence: 0.97,
          },
        ],
        summary: {
          executiveSummary:
            "The team aligned on launch blockers, confirmed the release checklist owner, and flagged pricing approval as the remaining external dependency.",
          keyPoints: [
            "Pricing approval is still pending legal sign-off.",
            "Onboarding copy needs one more polish pass before launch.",
          ],
          actionItems: [
            {
              description: "Turn the release checklist into tracked follow-up work",
              assignee: "Emily Chen",
              assigneeUserId: userId,
              dueDate: "2026-03-24",
              priority: "high" as const,
            },
          ],
          decisions: ["The release checklist owner stays with Product Ops."],
          openQuestions: ["Will legal clear pricing changes before Friday?"],
          topics: [
            {
              title: "Launch blockers",
              startTime: 0,
              endTime: 67,
              summary: "Pricing approval and onboarding copy were the only remaining blockers.",
            },
          ],
          overallSentiment: "mixed" as const,
          modelUsed: "gpt-4.1-mini",
        },
        participants: [
          {
            displayName: "Emily Chen",
            email: args.email,
            userId,
            joinedAt: now - 3 * HOUR,
            leftAt: now - 135 * MINUTE,
            speakingTime: 18 * MINUTE,
            speakingPercentage: 40,
            isHost: true,
            isExternal: false,
          },
          {
            displayName: "Alex Rivera",
            email: "alex-rivera-screenshots@inbox.mailtrap.io",
            userId: alexUserId,
            joinedAt: now - 3 * HOUR,
            leftAt: now - 135 * MINUTE,
            speakingTime: 15 * MINUTE,
            speakingPercentage: 33,
            isHost: false,
            isExternal: false,
          },
        ],
      },
      {
        title: "Client Launch Review",
        meetingUrl: "https://zoom.us/j/client-launch-review",
        meetingPlatform: "zoom" as const,
        projectId: secondaryProjectId,
        scheduledStartTime: now - 90 * MINUTE,
        actualStartTime: now - 90 * MINUTE,
        actualEndTime: now - 45 * MINUTE,
        duration: 45 * MINUTE,
        fullText:
          "Client launch review covered support rotation, handoff timing, and portal expectations. The team agreed the Thursday go-live review stays on track.",
        segments: [
          {
            startTime: 0,
            endTime: 29,
            speaker: "Emily Chen",
            speakerUserId: userId,
            text: "We agreed the Thursday go-live review stays on track, but support rotation still needs confirmation.",
            confidence: 0.98,
          },
          {
            startTime: 30,
            endTime: 62,
            speaker: "Sarah Kim",
            speakerUserId: sarahUserId,
            text: "The client also asked whether they need weekend coverage and a final handoff packet before launch.",
            confidence: 0.97,
          },
        ],
        summary: {
          executiveSummary:
            "The launch review confirmed the Thursday milestone, captured support coverage follow-ups, and surfaced one remaining handoff question from the client.",
          keyPoints: [
            "The go-live review remains scheduled for Thursday.",
            "Support rotation and weekend coverage still need confirmation.",
          ],
          actionItems: [
            {
              description: "Confirm support rotation for go-live week",
              assignee: "Sarah Kim",
              assigneeUserId: sarahUserId,
              dueDate: "2026-03-25",
              priority: "medium" as const,
            },
          ],
          decisions: ["The Thursday go-live review stays on the launch calendar."],
          openQuestions: ["Does the client need weekend coverage during launch?"],
          topics: [
            {
              title: "Client handoff",
              startTime: 0,
              endTime: 62,
              summary: "The team reviewed support coverage and final handoff expectations.",
            },
          ],
          overallSentiment: "positive" as const,
          modelUsed: "gpt-4.1-mini",
        },
        participants: [
          {
            displayName: "Emily Chen",
            email: args.email,
            userId,
            joinedAt: now - 90 * MINUTE,
            leftAt: now - 45 * MINUTE,
            speakingTime: 19 * MINUTE,
            speakingPercentage: 42,
            isHost: true,
            isExternal: false,
          },
          {
            displayName: "Sarah Kim",
            email: "sarah-kim-screenshots@inbox.mailtrap.io",
            userId: sarahUserId,
            joinedAt: now - 90 * MINUTE,
            leftAt: now - 45 * MINUTE,
            speakingTime: 16 * MINUTE,
            speakingPercentage: 35,
            isHost: false,
            isExternal: false,
          },
        ],
      },
      {
        title: "Go-live Support Runbook",
        meetingUrl: "https://meet.google.com/go-live-support-runbook",
        meetingPlatform: "google_meet" as const,
        projectId: secondaryProjectId,
        scheduledStartTime: now - 30 * MINUTE,
        actualStartTime: now - 25 * MINUTE,
        actualEndTime: undefined,
        duration: undefined,
        status: "processing" as const,
        fullText:
          "The team is still aligning on support coverage, escalation routing, and the final handoff packet before launch.",
        segments: [
          {
            startTime: 0,
            endTime: 26,
            speaker: "Emily Chen",
            speakerUserId: userId,
            text: "Let's confirm the support rotation before launch so escalation routing is clear for the weekend window.",
            confidence: 0.96,
          },
          {
            startTime: 27,
            endTime: 54,
            speaker: "Sarah Kim",
            speakerUserId: sarahUserId,
            text: "I'm still collecting the final handoff packet details, so the summary should stay in progress until the call wraps.",
            confidence: 0.95,
          },
        ],
        summary: null,
        participants: [
          {
            displayName: "Emily Chen",
            email: args.email,
            userId,
            joinedAt: now - 25 * MINUTE,
            leftAt: undefined,
            speakingTime: 8 * MINUTE,
            speakingPercentage: 48,
            isHost: true,
            isExternal: false,
          },
          {
            displayName: "Sarah Kim",
            email: "sarah-kim-screenshots@inbox.mailtrap.io",
            userId: sarahUserId,
            joinedAt: now - 25 * MINUTE,
            leftAt: undefined,
            speakingTime: 7 * MINUTE,
            speakingPercentage: 41,
            isHost: false,
            isExternal: false,
          },
        ],
      },
    ];

    for (const meeting of [...meetingSeedDefinitions].reverse()) {
      const recordingId = await ctx.db.insert("meetingRecordings", {
        meetingUrl: meeting.meetingUrl,
        meetingPlatform: meeting.meetingPlatform,
        title: meeting.title,
        duration: meeting.duration,
        status: meeting.status ?? "completed",
        scheduledStartTime: meeting.scheduledStartTime,
        actualStartTime: meeting.actualStartTime,
        actualEndTime: meeting.actualEndTime,
        botName: "Nixelo Notetaker",
        botJoinedAt: meeting.actualStartTime,
        botLeftAt: meeting.actualEndTime,
        createdBy: userId,
        projectId: meeting.projectId,
        isPublic: true,
        updatedAt: now,
      });

      const transcriptId = await ctx.db.insert("meetingTranscripts", {
        recordingId,
        fullText: meeting.fullText,
        segments: meeting.segments,
        language: "en",
        modelUsed: "whisper-large-v3",
        processingTime: 12 * SECOND,
        wordCount: meeting.fullText.split(/\s+/).length,
        speakerCount: 2,
      });

      if (meeting.summary) {
        await ctx.db.insert("meetingSummaries", {
          recordingId,
          transcriptId,
          executiveSummary: meeting.summary.executiveSummary,
          keyPoints: meeting.summary.keyPoints,
          actionItems: meeting.summary.actionItems,
          decisions: meeting.summary.decisions,
          openQuestions: meeting.summary.openQuestions,
          topics: meeting.summary.topics,
          overallSentiment: meeting.summary.overallSentiment,
          modelUsed: meeting.summary.modelUsed,
          promptTokens: 420,
          completionTokens: 188,
          processingTime: 8 * SECOND,
        });
      }

      for (const participant of meeting.participants) {
        await ctx.db.insert("meetingParticipants", {
          recordingId,
          displayName: participant.displayName,
          email: participant.email,
          userId: participant.userId,
          joinedAt: participant.joinedAt,
          leftAt: participant.leftAt,
          speakingTime: participant.speakingTime,
          speakingPercentage: participant.speakingPercentage,
          isHost: participant.isHost,
          isExternal: participant.isExternal,
        });
      }
    }

    await seedScreenshotOutreachData(ctx, {
      now,
      organizationId: orgId,
      userId,
    });

    // 11. Return result
    return {
      success: true,
      orgSlug,
      projectId,
      projectKey,
      issueKeys: createdIssueKeys,
      documentIds,
      workspaceSlug: "product",
      teamSlug: "engineering",
      inviteToken,
      portalToken,
      portalProjectId: projectId,
      unsubscribeTokens,
    };
  },
});

/** Cleans up expired test OTP codes to prevent table bloat. */
export const cleanupExpiredOtpsInternal = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired OTP codes using the by_expiry index
    const expiredOtps = await ctx.db
      .query("testOtpCodes")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .collect();

    let deletedCount = 0;
    for (const otp of expiredOtps) {
      await ctx.db.delete(otp._id);
      deletedCount++;
    }

    return { success: true, deleted: deletedCount };
  },
});

/**
 * Batch cleanup endpoint - deletes test data in small batches to avoid 32k read limit.
 * Call this repeatedly until it returns { done: true }.
 * POST /e2e/batch-cleanup
 */
export const batchCleanupEndpoint = httpAction(async (ctx, request) => {
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const result = await ctx.runMutation(internal.e2e.batchCleanupInternal, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Programmatic Google OAuth Login for E2E Testing
 * POST /e2e/google-oauth-login
 * Body: { refreshToken: string, skipOnboarding?: boolean }
 *
 * Uses a pre-generated Google refresh token (from OAuth Playground) to:
 * 1. Exchange refresh token for access token
 * 2. Fetch user profile from Google
 * 3. Create or login user via @convex-dev/auth Google provider
 * 4. Return auth tokens for the test to use
 *
 * This bypasses Google's browser OAuth flow (no captchas, no flakiness).
 */
export const googleOAuthLoginEndpoint = httpAction(async (ctx: ActionCtx, request: Request) => {
  // Validate API key
  const authError = validateE2EApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { refreshToken, skipOnboarding = false } = body;

    // Use provided token or fall back to OAUTH_MONITOR token
    const tokenToUse = refreshToken || process.env.OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN;

    if (!tokenToUse) {
      return new Response(
        JSON.stringify({
          error:
            "Missing refresh token. Provide refreshToken in body or set OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get Google OAuth credentials (same as used by @convex-dev/auth)
    const clientId = process.env.AUTH_GOOGLE_ID;
    const clientSecret = process.env.AUTH_GOOGLE_SECRET;

    if (!(clientId && clientSecret)) {
      return new Response(
        JSON.stringify({
          error: "Google OAuth not configured (AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET)",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Step 1: Exchange refresh token for access token
    const tokenResponse = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenToUse,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = (await tokenResponse.json().catch(() => ({}))) as {
        error?: string;
        error_description?: string;
      };
      return new Response(
        JSON.stringify({
          error: `Token refresh failed: ${errorData.error_description || errorData.error || tokenResponse.status}`,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const tokens = (await tokenResponse.json()) as { access_token: string };
    const accessToken = tokens.access_token;

    // Step 2: Fetch user profile from Google
    const userInfoResponse = await fetchWithTimeout(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!userInfoResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch Google user info: ${userInfoResponse.status}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const googleUser = (await userInfoResponse.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    // Step 3: Create or update user in Convex (same as normal Google OAuth flow)
    const result = await ctx.runMutation(internal.e2e.createGoogleOAuthUserInternal, {
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      skipOnboarding,
    });

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Login the user to get auth tokens
    // Use the signIn action with the "password" provider but skip password verification
    // Actually, we need to create a session directly since @convex-dev/auth Google flow
    // requires browser redirects. We'll create auth session manually.
    const authResult = await ctx.runMutation(internal.e2e.createGoogleOAuthSessionInternal, {
      userId: result.userId as Id<"users">,
    });

    return new Response(
      JSON.stringify({
        success: true,
        email: googleUser.email,
        userId: result.userId,
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        redirectUrl: result.redirectUrl,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Internal mutation to create/update user from Google OAuth profile
 */
export const createGoogleOAuthUserInternal = internalMutation({
  args: {
    googleId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    picture: v.optional(v.string()),
    skipOnboarding: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.optional(v.id("users")),
    redirectUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { googleId, email, name, picture, skipOnboarding } = args;

    // Check if user exists by email
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (user) {
      // Update existing user with Google info
      await ctx.db.patch(user._id, {
        name: name || user.name,
        image: picture || user.image,
        emailVerificationTime: user.emailVerificationTime || Date.now(),
      });
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        email,
        name,
        image: picture,
        emailVerificationTime: Date.now(),
      });
      user = await ctx.db.get(userId);
    }

    if (!user) {
      return { success: false, error: "Failed to create/get user" };
    }

    // Check/create Google auth account link
    const existingAccount = await ctx.db
      .query("authAccounts")
      .filter((q) =>
        q.and(q.eq(q.field("provider"), "google"), q.eq(q.field("providerAccountId"), googleId)),
      )
      .first();

    if (!existingAccount) {
      // Link Google account to user
      await ctx.db.insert("authAccounts", {
        userId: user._id,
        provider: "google",
        providerAccountId: googleId,
      });
    } else if (existingAccount.userId !== user._id) {
      // Account linked to different user - this shouldn't happen in E2E
      return { success: false, error: "Google account linked to different user" };
    }

    // Handle onboarding
    let redirectUrl = "/app";
    if (skipOnboarding) {
      // Mark onboarding as complete
      const existingOnboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!existingOnboarding) {
        await ctx.db.insert("userOnboarding", {
          userId: user._id,
          onboardingCompleted: true,
          onboardingStep: 5,
          sampleWorkspaceCreated: false,
          tourShown: true,
          wizardCompleted: true,
          checklistDismissed: true,
          updatedAt: Date.now(),
        });
      } else if (!existingOnboarding.onboardingCompleted) {
        await ctx.db.patch(existingOnboarding._id, {
          onboardingCompleted: true,
          updatedAt: Date.now(),
        });
      }
      redirectUrl = "/app";
    } else {
      // Check if onboarding is needed
      const onboarding = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!onboarding?.onboardingCompleted) {
        redirectUrl = "/onboarding";
      }
    }

    return {
      success: true,
      userId: user._id,
      redirectUrl,
    };
  },
});

/**
 * Internal mutation to create auth session for Google OAuth user
 * This creates a session directly, bypassing the normal @convex-dev/auth flow
 */
export const createGoogleOAuthSessionInternal = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    token: v.string(),
    refreshToken: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId } = args;

    // Generate session tokens (similar to @convex-dev/auth internal flow)
    // Create a new auth session
    const sessionId = await ctx.db.insert("authSessions", {
      userId,
      expirationTime: Date.now() + MONTH,
    });

    // Generate tokens - using a simple but unique format
    // In production @convex-dev/auth uses JWT, but for E2E we just need working tokens
    const token = `e2e_${sessionId}_${Date.now()}`;
    const refreshToken = `e2e_refresh_${sessionId}_${Date.now()}`;

    return { token, refreshToken };
  },
});

/** Batch cleanup - processes up to 500 items per call to stay under limits. */
export const batchCleanupInternal = internalMutation({
  args: {},
  returns: v.object({
    done: v.boolean(),
    deleted: v.number(),
    remaining: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const BATCH_SIZE = 500;
    let deletedCount = 0;

    // 1. Clean up spam workspaces first (these cause UI issues)
    const spamWorkspaces = await ctx.db.query("workspaces").take(BATCH_SIZE * 2); // Take more to filter

    const toDelete = spamWorkspaces.filter(
      (ws) =>
        ws.name === "E2E Testing Workspace" ||
        ws.name === "🧪 E2E Testing Workspace" ||
        // REMOVED "New Workspace" to prevent accidental data loss of user created workspaces
        ws.name === "Organization Workspace" ||
        ws.name.startsWith("Engineering ") ||
        ws.name.startsWith("Project-"),
    );

    if (toDelete.length > 0) {
      for (const ws of toDelete.slice(0, BATCH_SIZE)) {
        await ctx.db.delete(ws._id);
        deletedCount++;
      }
      if (toDelete.length > BATCH_SIZE) {
        return {
          done: false,
          deleted: deletedCount,
          remaining: `${toDelete.length - BATCH_SIZE} workspaces`,
        };
      }
    }

    // 2. Clean up test users and their data
    const testUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isTestUser"), true))
      .take(50);

    for (const user of testUsers) {
      // Delete auth accounts
      const accounts = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .take(100);
      for (const acc of accounts) {
        await ctx.db.delete(acc._id);
        deletedCount++;
      }

      // Delete auth sessions
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", user._id))
        .take(100);
      for (const s of sessions) {
        await ctx.db.delete(s._id);
        deletedCount++;
      }

      // Delete organization memberships
      const memberships = await ctx.db
        .query("organizationMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(100);
      for (const m of memberships) {
        await ctx.db.delete(m._id);
        deletedCount++;
      }

      // Delete the user
      await ctx.db.delete(user._id);
      deletedCount++;
    }

    if (testUsers.length > 0) {
      return { done: false, deleted: deletedCount, remaining: "more test users" };
    }

    // 3. Clean up orphan organizations with E2E patterns
    const orgs = await ctx.db.query("organizations").take(BATCH_SIZE);

    const e2eOrgs = orgs.filter(
      (o) =>
        o.slug?.startsWith("nixelo-e2e") ||
        o.name?.includes("E2E") ||
        o.name?.startsWith("E2E Org"),
    );

    for (const org of e2eOrgs.slice(0, 50)) {
      // Delete org members
      const members = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
        .take(100);
      for (const m of members) {
        await ctx.db.delete(m._id);
        deletedCount++;
      }

      // Delete workspaces in org
      const workspaces = await ctx.db
        .query("workspaces")
        .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
        .take(100);
      for (const w of workspaces) {
        await ctx.db.delete(w._id);
        deletedCount++;
      }

      await ctx.db.delete(org._id);
      deletedCount++;
    }

    if (e2eOrgs.length > 0) {
      return { done: false, deleted: deletedCount, remaining: "more orgs" };
    }

    return { done: true, deleted: deletedCount };
  },
});
