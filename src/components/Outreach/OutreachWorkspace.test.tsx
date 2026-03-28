import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { OutreachWorkspace } from "./OutreachWorkspace";

vi.mock("@convex/_generated/api", () => ({
  api: {
    outreach: {
      analytics: {
        getContactPerformance: "outreach.analytics.getContactPerformance",
        getContactTimeline: "outreach.analytics.getContactTimeline",
        getMailboxHealth: "outreach.analytics.getMailboxHealth",
        getOrganizationOverview: "outreach.analytics.getOrganizationOverview",
        getSequenceFunnel: "outreach.analytics.getSequenceFunnel",
        getSequenceStats: "outreach.analytics.getSequenceStats",
      },
      contacts: {
        create: "outreach.contacts.create",
        importBatch: "outreach.contacts.importBatch",
        list: "outreach.contacts.list",
        remove: "outreach.contacts.remove",
        update: "outreach.contacts.update",
      },
      enrollments: {
        cancelEnrollment: "outreach.enrollments.cancelEnrollment",
        createEnrollments: "outreach.enrollments.createEnrollments",
        listBySequence: "outreach.enrollments.listBySequence",
      },
      mailboxes: {
        disconnect: "outreach.mailboxes.disconnect",
        list: "outreach.mailboxes.list",
        updateLimit: "outreach.mailboxes.updateLimit",
      },
      sequences: {
        create: "outreach.sequences.create",
        list: "outreach.sequences.list",
        pause: "outreach.sequences.pause",
        remove: "outreach.sequences.remove",
        update: "outreach.sequences.update",
        updateSequenceStatus: "outreach.sequences.updateSequenceStatus",
      },
    },
    users: {
      getCurrent: "users.getCurrent",
    },
  },
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("@/lib/convex", () => ({
  getConvexSiteUrl: () => "https://demo.convex.site",
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const outreachApi = api.outreach;
const OUTREACH_FORM_TEST_TIMEOUT_MS = 15_000;
const TEST_USER_ID = "user_1" as Id<"users">;
const TEST_ORGANIZATION_ID = "org_1" as Id<"organizations">;

type MutationArgs = [] | [Record<string, unknown>?];
type MutationProcedure = (...args: MutationArgs) => Promise<unknown>;
type MutationMock = {
  (...args: MutationArgs): Promise<unknown>;
  withOptimisticUpdate: (optimisticUpdate: unknown) => MutationMock;
};

function createMutationMock(mockProcedure: Mock<MutationProcedure>): MutationMock {
  const mutation: MutationMock = Object.assign((...args: MutationArgs) => mockProcedure(...args), {
    withOptimisticUpdate: () => mutation,
  });
  return mutation;
}

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const createContactMock = vi.fn<MutationProcedure>();
const updateContactMock = vi.fn<MutationProcedure>();
const removeContactMock = vi.fn<MutationProcedure>();
const importContactsMock = vi.fn<MutationProcedure>();
const createSequenceMock = vi.fn<MutationProcedure>();
const updateSequenceMock = vi.fn<MutationProcedure>();
const activateSequenceMock = vi.fn<MutationProcedure>();
const pauseSequenceMock = vi.fn<MutationProcedure>();
const removeSequenceMock = vi.fn<MutationProcedure>();
const createEnrollmentsMock = vi.fn<MutationProcedure>();
const cancelEnrollmentMock = vi.fn<MutationProcedure>();
const disconnectMailboxMock = vi.fn<MutationProcedure>();
const updateMailboxLimitMock = vi.fn<MutationProcedure>();

const mailbox = {
  _creationTime: 1,
  _id: "mailbox_1",
  accessToken: "[redacted]",
  dailySendCount: 0,
  dailySendLimit: 40,
  displayName: "Alex Sender",
  email: "alex@example.com",
  expiresAt: 1_800_000_000_000,
  isActive: true,
  minuteSendCount: 0,
  minuteSendLimit: 5,
  minuteWindowStartedAt: 1_700_000_000_000,
  organizationId: TEST_ORGANIZATION_ID,
  provider: "google" as const,
  refreshToken: "[redacted]",
  updatedAt: 1_700_000_000_000,
  userId: TEST_USER_ID,
};

const contact = {
  _creationTime: 1,
  _id: "contact_1",
  company: "Acme",
  createdAt: 1_700_000_000_000,
  createdBy: TEST_USER_ID,
  customFields: { role: "Founder" },
  email: "alex@example.com",
  firstName: "Alex",
  lastName: "Stone",
  organizationId: TEST_ORGANIZATION_ID,
  source: "manual" as const,
  tags: ["vip"],
  timezone: "America/Chicago",
};

const sequence = {
  _creationTime: 1,
  _id: "sequence_1",
  createdAt: 1_700_000_000_000,
  createdBy: TEST_USER_ID,
  mailboxId: "mailbox_1",
  name: "Founder follow-up",
  organizationId: TEST_ORGANIZATION_ID,
  physicalAddress: "123 Main St, Chicago, IL 60601",
  stats: { bounced: 0, enrolled: 1, opened: 0, replied: 0, sent: 1, unsubscribed: 0 },
  status: "draft" as const,
  steps: [
    { body: "Hi {{firstName}}", delayDays: 0, order: 0, subject: "Quick intro" },
    { body: "Following up", delayDays: 3, order: 1, subject: "Checking in" },
  ],
  trackingDomain: "track.example.com",
  updatedAt: 1_700_000_000_100,
};

const enrollment = {
  _creationTime: 1,
  _id: "enrollment_1",
  completedAt: undefined,
  contactId: "contact_1",
  currentStep: 0,
  enrolledAt: 1_700_000_000_000,
  lastRepliedAt: undefined,
  nextSendAt: 1_700_000_100_000,
  organizationId: TEST_ORGANIZATION_ID,
  sequenceId: "sequence_1",
  status: "active" as const,
};

const mailboxHealth = {
  dailyLimit: 40,
  email: "alex@example.com",
  id: "mailbox_1",
  isActive: true,
  minuteLimit: 5,
  minuteRemaining: 4,
  minuteSent: 1,
  provider: "google" as const,
  remaining: 38,
  todaySent: 2,
};

const sequenceStats = {
  name: "Founder follow-up",
  rates: {
    bounceRate: 0,
    openRate: 30,
    replyRate: 10,
    unsubscribeRate: 0,
  },
  stats: { bounced: 0, enrolled: 1, opened: 3, replied: 1, sent: 10, unsubscribed: 0 },
  status: "draft" as const,
};

const sequenceFunnel = [
  {
    bounced: 0,
    clicked: 1,
    delayDays: 0,
    opened: 3,
    replied: 1,
    sent: 5,
    step: 0,
    subject: "Quick intro",
    unsubscribed: 0,
  },
];

const organizationOverview = {
  active: 1,
  bounced: 0,
  enrolled: 1,
  opened: 3,
  rates: {
    bounceRate: 0,
    openRate: 30,
    replyRate: 10,
    unsubscribeRate: 0,
  },
  replied: 1,
  sent: 10,
  sequences: 1,
  unsubscribed: 0,
};

const timeline = {
  enrollment,
  events: [
    {
      _creationTime: 1,
      _id: "event_1",
      contactId: "contact_1",
      createdAt: 1_700_000_100_000,
      enrollmentId: "enrollment_1",
      metadata: { linkUrl: "https://example.com/demo" },
      sequenceId: "sequence_1",
      step: 0,
      trackingLinkId: undefined,
      type: "clicked" as const,
    },
  ],
};

const contactPerformance = {
  coverage: {
    contactLimit: 250,
    enrollmentLimit: 750,
    isPartial: false,
    recentEventLimit: 500,
  },
  rows: [
    {
      bounced: 0,
      clicked: 1,
      company: "Acme",
      contactId: "contact_1",
      email: "alex@example.com",
      lastActivityAt: 1_700_000_100_000,
      lastActivityType: "clicked" as const,
      latestEnrollmentId: "enrollment_1",
      latestSequenceId: "sequence_1",
      latestSequenceName: "Founder follow-up",
      latestStatus: "active" as const,
      liveEnrollmentCount: 1,
      name: "Alex Stone",
      openRate: 30,
      opened: 3,
      replied: 1,
      replyRate: 10,
      sent: 10,
      totalEnrollmentCount: 1,
      unsubscribed: 0,
    },
  ],
};

type TestContact = typeof contact;
type TestEnrollment = Omit<typeof enrollment, "status"> & {
  status: "active" | "completed" | "paused" | "replied" | "bounced" | "unsubscribed";
};
type TestEvent = Omit<(typeof timeline.events)[number], "metadata" | "type"> & {
  metadata: { linkUrl?: string; replyContent?: string };
  type: "sent" | "opened" | "clicked" | "replied" | "bounced" | "unsubscribed";
};
type TestSequence = typeof sequence;
type TestSequenceFunnel = typeof sequenceFunnel;
type TestSequenceStats = typeof sequenceStats;
type TestTimeline = {
  enrollment: TestEnrollment;
  events: TestEvent[];
};

const typedTimeline: TestTimeline = timeline;

function buildMutationHookResult(mockProcedure: Mock<MutationProcedure>) {
  return {
    mutate: createMutationMock(mockProcedure),
    canAct: true,
    isAuthLoading: false,
  };
}

function getDefaultQueryResult(query: unknown, args: unknown) {
  const queryHandlers = new Map<unknown, unknown>([
    [outreachApi.contacts.list, [contact]],
    [outreachApi.sequences.list, [sequence]],
    [outreachApi.mailboxes.list, [mailbox]],
    [outreachApi.analytics.getContactPerformance, contactPerformance],
    [outreachApi.analytics.getMailboxHealth, [mailboxHealth]],
    [outreachApi.analytics.getOrganizationOverview, organizationOverview],
    [outreachApi.enrollments.listBySequence, args === "skip" ? undefined : [enrollment]],
    [outreachApi.analytics.getSequenceStats, args === "skip" ? undefined : sequenceStats],
    [outreachApi.analytics.getSequenceFunnel, args === "skip" ? undefined : sequenceFunnel],
    [outreachApi.analytics.getContactTimeline, args === "skip" ? undefined : timeline],
    [api.users.getCurrent, { _id: TEST_USER_ID, email: "alex@example.com" }],
  ]);
  const result = queryHandlers.get(query);
  if (result === undefined && !queryHandlers.has(query)) {
    throw new Error(`Unexpected query hook: ${String(query)}`);
  }
  return result;
}

function getEmptyWorkspaceOverview() {
  return {
    active: 0,
    bounced: 0,
    enrolled: 0,
    opened: 0,
    rates: {
      bounceRate: 0,
      openRate: 0,
      replyRate: 0,
      unsubscribeRate: 0,
    },
    replied: 0,
    sent: 0,
    sequences: 0,
    unsubscribed: 0,
  };
}

function mockMailboxConnectionQueryState() {
  mockUseAuthenticatedQuery.mockImplementation((query) => {
    if (query === outreachApi.contacts.list) {
      return [contact];
    }
    if (query === outreachApi.sequences.list) {
      return [];
    }
    if (query === outreachApi.mailboxes.list) {
      return [];
    }
    if (query === outreachApi.analytics.getMailboxHealth) {
      return [];
    }
    if (query === outreachApi.analytics.getContactPerformance) {
      return {
        coverage: {
          contactLimit: 250,
          enrollmentLimit: 750,
          isPartial: false,
          recentEventLimit: 500,
        },
        rows: [],
      };
    }
    if (query === outreachApi.analytics.getOrganizationOverview) {
      return getEmptyWorkspaceOverview();
    }
    if (query === api.users.getCurrent) {
      return { _id: TEST_USER_ID, email: "alex@example.com" };
    }

    return undefined;
  });
}

function getAnalyticsDrilldownQueryResult(
  fixture: {
    secondContact: TestContact;
    secondEnrollment: TestEnrollment;
    secondSequence: TestSequence;
    secondSequenceFunnel: TestSequenceFunnel;
    secondSequenceStats: TestSequenceStats;
    secondTimeline: TestTimeline;
  },
  query: unknown,
  args: unknown,
) {
  const baseResults = new Map<unknown, unknown>([
    [outreachApi.contacts.list, [contact, fixture.secondContact]],
    [outreachApi.sequences.list, [sequence, fixture.secondSequence]],
    [outreachApi.mailboxes.list, [mailbox]],
    [outreachApi.analytics.getMailboxHealth, [mailboxHealth]],
    [outreachApi.analytics.getOrganizationOverview, organizationOverview],
    [
      outreachApi.analytics.getContactPerformance,
      {
        coverage: {
          contactLimit: 250,
          enrollmentLimit: 750,
          isPartial: true,
          recentEventLimit: 500,
        },
        rows: [
          {
            ...contactPerformance.rows[0],
            contactId: "contact_2",
            company: "Orbit",
            email: "taylor@example.com",
            latestEnrollmentId: "enrollment_2",
            latestSequenceId: "sequence_2",
            latestSequenceName: "Expansion follow-up",
            latestStatus: "replied" as const,
            name: "Taylor North",
            replied: 1,
            replyRate: 25,
            sent: 4,
          },
        ],
      },
    ],
    [api.users.getCurrent, { _id: TEST_USER_ID, email: "alex@example.com" }],
  ]);

  if (query === outreachApi.enrollments.listBySequence) {
    return getSequenceScopedQueryResult(
      args,
      [enrollment],
      [fixture.secondEnrollment],
      "sequence_2",
      "sequenceId",
    );
  }
  if (query === outreachApi.analytics.getSequenceStats) {
    return getSequenceScopedQueryResult(
      args,
      sequenceStats,
      fixture.secondSequenceStats,
      "sequence_2",
      "sequenceId",
    );
  }
  if (query === outreachApi.analytics.getSequenceFunnel) {
    return getSequenceScopedQueryResult(
      args,
      sequenceFunnel,
      fixture.secondSequenceFunnel,
      "sequence_2",
      "sequenceId",
    );
  }
  if (query === outreachApi.analytics.getContactTimeline) {
    return getSequenceScopedQueryResult(
      args,
      typedTimeline,
      fixture.secondTimeline,
      "enrollment_2",
      "enrollmentId",
    );
  }

  const result = baseResults.get(query);
  if (result === undefined && !baseResults.has(query)) {
    throw new Error(`Unexpected query hook: ${String(query)}`);
  }
  return result;
}

function getSequenceScopedQueryResult<T>(
  args: unknown,
  defaultValue: T,
  alternateValue: T,
  alternateId: string,
  key: "enrollmentId" | "sequenceId",
): T | undefined {
  if (args === "skip") {
    return undefined;
  }

  if (typeof args === "object" && args !== null && key in args) {
    const queryArgs = args as Record<"enrollmentId" | "sequenceId", unknown>;
    return queryArgs[key] === alternateId ? alternateValue : defaultValue;
  }

  return defaultValue;
}

describe("OutreachWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createContactMock.mockResolvedValue("contact_new");
    updateContactMock.mockResolvedValue(undefined);
    removeContactMock.mockResolvedValue(undefined);
    importContactsMock.mockResolvedValue({
      imported: 2,
      sampleExistingEmails: [],
      sampleInvalidEmails: [],
      sampleSuppressedEmails: [],
      skipped: 0,
      skippedExisting: 0,
      skippedInvalid: 0,
      skippedSuppressed: 0,
    });
    createSequenceMock.mockResolvedValue("sequence_new");
    updateSequenceMock.mockResolvedValue(undefined);
    activateSequenceMock.mockResolvedValue(undefined);
    pauseSequenceMock.mockResolvedValue(undefined);
    removeSequenceMock.mockResolvedValue(undefined);
    createEnrollmentsMock.mockResolvedValue({ enrolled: 1, skipped: 0 });
    cancelEnrollmentMock.mockResolvedValue(undefined);
    disconnectMailboxMock.mockResolvedValue(undefined);
    updateMailboxLimitMock.mockResolvedValue(undefined);

    const mutationHandlers = new Map<unknown, Mock<MutationProcedure>>([
      [outreachApi.contacts.create, createContactMock],
      [outreachApi.contacts.update, updateContactMock],
      [outreachApi.contacts.remove, removeContactMock],
      [outreachApi.contacts.importBatch, importContactsMock],
      [outreachApi.sequences.create, createSequenceMock],
      [outreachApi.sequences.update, updateSequenceMock],
      [outreachApi.sequences.updateSequenceStatus, activateSequenceMock],
      [outreachApi.sequences.pause, pauseSequenceMock],
      [outreachApi.sequences.remove, removeSequenceMock],
      [outreachApi.enrollments.createEnrollments, createEnrollmentsMock],
      [outreachApi.enrollments.cancelEnrollment, cancelEnrollmentMock],
      [outreachApi.mailboxes.disconnect, disconnectMailboxMock],
      [outreachApi.mailboxes.updateLimit, updateMailboxLimitMock],
    ]);

    mockUseAuthenticatedMutation.mockImplementation((mutation) => {
      const mockProcedure = mutationHandlers.get(mutation);
      if (!mockProcedure) {
        throw new Error(`Unexpected mutation hook: ${String(mutation)}`);
      }
      return buildMutationHookResult(mockProcedure);
    });

    mockUseOrganization.mockReturnValue({
      billingEnabled: true,
      orgSlug: "acme",
      organizationId: TEST_ORGANIZATION_ID,
      organizationName: "Acme",
      userRole: "owner",
    });

    mockUseAuthenticatedQuery.mockImplementation((query, args) =>
      getDefaultQueryResult(query, args),
    );

    vi.spyOn(window, "open").mockImplementation(() => window);
  });

  it("opens the Gmail OAuth popup and accepts Convex-origin mailbox-connected messages", async () => {
    const user = userEvent.setup();
    mockMailboxConnectionQueryState();

    render(<OutreachWorkspace />);

    await user.click(screen.getAllByTestId(TEST_IDS.OUTREACH.ACTION_CONNECT_GMAIL)[0]);

    expect(window.open).toHaveBeenCalledWith(
      "https://demo.convex.site/outreach/google/auth?userId=user_1&organizationId=org_1",
      "Outreach Gmail OAuth",
      expect.stringContaining("width=620"),
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { mailboxId: "mailbox_2", type: "outreach-mailbox-connected" },
          origin: "https://demo.convex.site",
        }),
      );
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Mailbox connected successfully");
  });

  it("opens the Microsoft 365 OAuth popup with the provider-specific route", async () => {
    const user = userEvent.setup();
    mockMailboxConnectionQueryState();

    render(<OutreachWorkspace />);

    await user.click(screen.getAllByTestId(TEST_IDS.OUTREACH.ACTION_CONNECT_MICROSOFT)[0]);

    expect(window.open).toHaveBeenCalledWith(
      "https://demo.convex.site/outreach/microsoft/auth?userId=user_1&organizationId=org_1",
      "Outreach Microsoft 365 OAuth",
      expect.stringContaining("width=620"),
    );
  });

  it("ignores mailbox-connected messages from the app origin", async () => {
    const user = userEvent.setup();
    mockMailboxConnectionQueryState();

    render(<OutreachWorkspace />);

    await user.click(screen.getAllByTestId(TEST_IDS.OUTREACH.ACTION_CONNECT_GMAIL)[0]);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { mailboxId: "mailbox_2", type: "outreach-mailbox-connected" },
          origin: window.location.origin,
        }),
      );
    });

    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("shows a popup error when Gmail OAuth is blocked", async () => {
    const user = userEvent.setup();
    vi.mocked(window.open).mockReturnValueOnce(null);
    mockMailboxConnectionQueryState();

    render(<OutreachWorkspace />);

    await user.click(screen.getAllByTestId(TEST_IDS.OUTREACH.ACTION_CONNECT_GMAIL)[0]);

    expect(mockShowError).toHaveBeenCalledWith("Please allow popups to connect a Gmail mailbox.");
  });

  it("shows a popup error when Microsoft OAuth is blocked", async () => {
    const user = userEvent.setup();
    vi.mocked(window.open).mockReturnValueOnce(null);
    mockMailboxConnectionQueryState();

    render(<OutreachWorkspace />);

    await user.click(screen.getAllByTestId(TEST_IDS.OUTREACH.ACTION_CONNECT_MICROSOFT)[0]);

    expect(mockShowError).toHaveBeenCalledWith(
      "Please allow popups to connect a Microsoft 365 mailbox.",
    );
  });

  it("renders stable outreach screenshot hooks across the main tabs", async () => {
    const user = userEvent.setup();

    render(<OutreachWorkspace />);

    expect(screen.getByTestId(TEST_IDS.OUTREACH.ROOT)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.OUTREACH.TAB_OVERVIEW)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.OUTREACH.OVERVIEW_SECTION)).toBeInTheDocument();

    await user.click(screen.getByTestId(TEST_IDS.OUTREACH.TAB_SEQUENCES));
    expect(await screen.findByTestId(TEST_IDS.OUTREACH.SEQUENCES_LIST)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.OUTREACH.SEQUENCE_DETAIL)).toBeInTheDocument();

    await user.click(screen.getByTestId(TEST_IDS.OUTREACH.TAB_CONTACTS));
    expect(await screen.findByTestId(TEST_IDS.OUTREACH.CONTACTS_SECTION)).toBeInTheDocument();

    await user.click(screen.getByTestId(TEST_IDS.OUTREACH.TAB_MAILBOXES));
    expect(await screen.findByTestId(TEST_IDS.OUTREACH.MAILBOXES_SECTION)).toBeInTheDocument();

    await user.click(screen.getByTestId(TEST_IDS.OUTREACH.TAB_ANALYTICS));
    expect(await screen.findByTestId(TEST_IDS.OUTREACH.ANALYTICS_SECTION)).toBeInTheDocument();
  });

  it(
    "renders stable outreach dialog and destructive-state hooks",
    async () => {
      const user = userEvent.setup();

      render(<OutreachWorkspace />);

      await user.click(screen.getByTestId(TEST_IDS.OUTREACH.TAB_CONTACTS));
      expect(screen.getAllByTestId(TEST_IDS.OUTREACH.ACTION_IMPORT_CONTACTS)[0]).toBeVisible();
      expect(screen.getAllByTestId(TEST_IDS.OUTREACH.ACTION_NEW_CONTACT)[0]).toBeVisible();

      await user.click(screen.getAllByTestId(TEST_IDS.OUTREACH.ACTION_NEW_CONTACT)[0]);
      expect(await screen.findByTestId(TEST_IDS.OUTREACH.CONTACT_DIALOG)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await user.click(screen.getAllByTestId(TEST_IDS.OUTREACH.ACTION_IMPORT_CONTACTS)[0]);
      expect(await screen.findByTestId(TEST_IDS.OUTREACH.IMPORT_DIALOG)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await user.click(screen.getByTestId(TEST_IDS.OUTREACH.TAB_SEQUENCES));
      expect(screen.getByTestId(TEST_IDS.OUTREACH.ACTION_NEW_SEQUENCE)).toBeVisible();
      expect(screen.getByTestId(TEST_IDS.OUTREACH.ACTION_ENROLL_CONTACTS)).toBeVisible();

      await user.click(screen.getByTestId(TEST_IDS.OUTREACH.ACTION_NEW_SEQUENCE));
      expect(await screen.findByTestId(TEST_IDS.OUTREACH.SEQUENCE_DIALOG)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await user.click(screen.getByTestId(TEST_IDS.OUTREACH.ACTION_ENROLL_CONTACTS));
      expect(await screen.findByTestId(TEST_IDS.OUTREACH.ENROLL_DIALOG)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await user.click(screen.getByTestId(TEST_IDS.OUTREACH.TAB_MAILBOXES));
      expect(await screen.findByTestId(TEST_IDS.OUTREACH.MAILBOX_CARD)).toBeInTheDocument();
      await user.click(screen.getAllByTestId(TEST_IDS.OUTREACH.MAILBOX_DISCONNECT_BUTTON)[0]);
      expect(
        await screen.findByTestId(TEST_IDS.OUTREACH.MAILBOX_DISCONNECT_CONFIRM),
      ).toBeInTheDocument();
    },
    OUTREACH_FORM_TEST_TIMEOUT_MS,
  );

  it(
    "creates a contact with parsed tags and custom fields",
    async () => {
      const user = userEvent.setup();

      render(<OutreachWorkspace />);

      await user.click(screen.getByRole("tab", { name: "Contacts" }));
      await user.click(screen.getAllByRole("button", { name: /new contact/i })[0]);

      const dialog = await screen.findByRole("dialog", { name: /new contact/i });
      await user.type(within(dialog).getByPlaceholderText("lead@example.com"), "jamie@example.com");
      await user.type(within(dialog).getByPlaceholderText("First name"), "Jamie");
      await user.type(within(dialog).getByPlaceholderText("Last name"), "River");
      await user.type(within(dialog).getByPlaceholderText("Company"), "Northstar");
      await user.type(within(dialog).getByPlaceholderText("vip, west, beta"), "vip; west");
      const textboxes = within(dialog).getAllByRole("textbox");
      await user.type(textboxes[textboxes.length - 1], "role=Founder\nfavoriteProduct=Roadmap");

      await user.click(within(dialog).getByRole("button", { name: /create contact/i }));

      await waitFor(() =>
        expect(createContactMock).toHaveBeenCalledWith({
          company: "Northstar",
          customFields: { favoriteProduct: "Roadmap", role: "Founder" },
          email: "jamie@example.com",
          firstName: "Jamie",
          lastName: "River",
          tags: ["vip", "west"],
          timezone: undefined,
        }),
      );

      expect(mockShowSuccess).toHaveBeenCalledWith("Contact created");
    },
    OUTREACH_FORM_TEST_TIMEOUT_MS,
  );

  it(
    "imports CSV contacts through the shared parser",
    async () => {
      const user = userEvent.setup();

      render(<OutreachWorkspace />);

      await user.click(screen.getByRole("button", { name: /import csv/i }));

      const dialog = await screen.findByRole("dialog", { name: /import contacts/i });
      await user.type(
        within(dialog).getByRole("textbox"),
        [
          "email,first name,last name,company,tags",
          "jamie@example.com,Jamie,River,Northstar,vip;beta",
          "taylor@example.com,Taylor,North,Orbit,west",
        ].join("\n"),
      );

      await user.click(within(dialog).getByRole("button", { name: /import contacts/i }));

      await waitFor(() =>
        expect(importContactsMock).toHaveBeenCalledWith({
          contacts: [
            {
              company: "Northstar",
              email: "jamie@example.com",
              firstName: "Jamie",
              lastName: "River",
              tags: ["vip", "beta"],
            },
            {
              company: "Orbit",
              email: "taylor@example.com",
              firstName: "Taylor",
              lastName: "North",
              tags: ["west"],
            },
          ],
        }),
      );

      expect(mockShowSuccess).toHaveBeenCalledWith("Imported 2 contacts.");
    },
    OUTREACH_FORM_TEST_TIMEOUT_MS,
  );

  it(
    "previews duplicate and invalid rows while still importing the valid subset",
    async () => {
      const user = userEvent.setup();
      importContactsMock.mockResolvedValue({
        imported: 1,
        sampleExistingEmails: [],
        sampleInvalidEmails: [],
        sampleSuppressedEmails: [],
        skipped: 0,
        skippedExisting: 0,
        skippedInvalid: 0,
        skippedSuppressed: 0,
      });

      render(<OutreachWorkspace />);

      await user.click(screen.getByRole("button", { name: /import csv/i }));

      const dialog = await screen.findByRole("dialog", { name: /import contacts/i });
      await user.type(
        within(dialog).getByRole("textbox"),
        [
          "email,first name",
          "jamie@example.com,Jamie",
          "jamie@example.com,Jamie Duplicate",
          "bad-email,Bad",
          ",Missing",
        ].join("\n"),
      );

      expect(await within(dialog).findByText(/1 contact ready across 2 columns/i)).toBeVisible();
      expect(
        within(dialog).getByText(
          /3 rows need attention before they can import\. duplicate email rows only keep the first occurrence\./i,
        ),
      ).toBeVisible();
      expect(
        within(dialog).getByText(
          /row 3 duplicates jamie@example\.com, so only the first occurrence will be imported\./i,
        ),
      ).toBeVisible();
      expect(
        within(dialog).getByText(/row 4 has an invalid email address \(bad-email\)\./i),
      ).toBeVisible();
      expect(within(dialog).getByText(/row 5 is missing an email address\./i)).toBeVisible();

      await user.click(within(dialog).getByRole("button", { name: /import contacts/i }));

      await waitFor(() =>
        expect(importContactsMock).toHaveBeenCalledWith({
          contacts: [{ email: "jamie@example.com", firstName: "Jamie" }],
        }),
      );

      expect(mockShowSuccess).toHaveBeenCalledWith("Imported 1 contact.");
    },
    OUTREACH_FORM_TEST_TIMEOUT_MS,
  );

  it(
    "renders the new analytics surfaces and lets contact engagement jump into drilldowns",
    async () => {
      const user = userEvent.setup();

      const secondContact = {
        ...contact,
        _id: "contact_2",
        company: "Orbit",
        email: "taylor@example.com",
        firstName: "Taylor",
        lastName: "North",
      };
      const secondSequence = {
        ...sequence,
        _id: "sequence_2",
        name: "Expansion follow-up",
        stats: { bounced: 0, enrolled: 1, opened: 1, replied: 1, sent: 4, unsubscribed: 0 },
      };
      const secondEnrollment = {
        ...enrollment,
        _id: "enrollment_2",
        contactId: "contact_2",
        sequenceId: "sequence_2",
        status: "replied" as const,
      };
      const secondSequenceStats = {
        ...sequenceStats,
        name: "Expansion follow-up",
        rates: {
          bounceRate: 0,
          openRate: 25,
          replyRate: 25,
          unsubscribeRate: 0,
        },
        stats: { bounced: 0, enrolled: 1, opened: 1, replied: 1, sent: 4, unsubscribed: 0 },
      };
      const secondSequenceFunnel = [
        {
          bounced: 0,
          clicked: 0,
          delayDays: 0,
          opened: 1,
          replied: 1,
          sent: 4,
          step: 0,
          subject: "Budget follow-up",
          unsubscribed: 0,
        },
      ];
      const secondTimeline = {
        enrollment: secondEnrollment,
        events: [
          {
            ...timeline.events[0],
            _id: "event_2",
            contactId: "contact_2",
            enrollmentId: "enrollment_2",
            metadata: { replyContent: "Let's talk next week" },
            sequenceId: "sequence_2",
            type: "replied" as const,
          },
        ],
      };

      mockUseAuthenticatedQuery.mockImplementation((query, args) =>
        getAnalyticsDrilldownQueryResult(
          {
            secondContact,
            secondEnrollment,
            secondSequence,
            secondSequenceFunnel,
            secondSequenceStats,
            secondTimeline,
          },
          query,
          args,
        ),
      );

      render(<OutreachWorkspace />);

      await user.click(screen.getByTestId(TEST_IDS.OUTREACH.TAB_ANALYTICS));

      expect(
        await screen.findByTestId(TEST_IDS.OUTREACH.ANALYTICS_SEQUENCE_LEADERBOARD),
      ).toBeInTheDocument();
      const contactCard = await screen.findByTestId(TEST_IDS.OUTREACH.ANALYTICS_CONTACT_ENGAGEMENT);
      expect(within(contactCard).getByText(/analytics window is capped/i)).toBeVisible();
      expect(within(contactCard).getByText("Taylor North")).toBeVisible();

      await user.click(within(contactCard).getByRole("button", { name: "Inspect" }));

      expect(await screen.findByText("Budget follow-up")).toBeVisible();
      expect(await screen.findByText("taylor@example.com")).toBeVisible();
      expect(await screen.findByText(/let's talk next week/i)).toBeVisible();
    },
    OUTREACH_FORM_TEST_TIMEOUT_MS,
  );

  it(
    "creates a sequence with mailbox, compliance settings, and step timing",
    async () => {
      const user = userEvent.setup();

      render(<OutreachWorkspace />);

      await user.click(screen.getByRole("button", { name: /new sequence/i }));

      const dialog = await screen.findByRole("dialog", { name: /new sequence/i });
      await user.clear(within(dialog).getByPlaceholderText("Enterprise follow-up"));
      await user.type(within(dialog).getByPlaceholderText("Enterprise follow-up"), "Warm intro");
      await user.clear(within(dialog).getByPlaceholderText("123 Main St, Chicago, IL 60601"));
      await user.type(
        within(dialog).getByPlaceholderText("123 Main St, Chicago, IL 60601"),
        "500 Market St, Austin, TX 78701",
      );
      await user.clear(within(dialog).getByPlaceholderText("tracking.example.com"));
      await user.type(
        within(dialog).getByPlaceholderText("tracking.example.com"),
        "links.example.com",
      );
      await user.clear(within(dialog).getByPlaceholderText("Subject line"));
      await user.type(within(dialog).getByPlaceholderText("Subject line"), "Quick hello");
      await user.clear(within(dialog).getByPlaceholderText("Hi {{firstName}}, ..."));
      await user.type(within(dialog).getByPlaceholderText("Hi {{firstName}}, ..."), "Hi there");
      await user.click(within(dialog).getByRole("button", { name: /add step/i }));

      const subjectFields = within(dialog).getAllByPlaceholderText("Subject line");
      const bodyFields = within(dialog).getAllByPlaceholderText("Hi {{firstName}}, ...");
      const delayFields = within(dialog).getAllByPlaceholderText("2");
      await user.type(subjectFields[1], "Follow-up");
      await user.type(bodyFields[1], "Checking back in");
      await user.clear(delayFields[0]);
      await user.type(delayFields[0], "2");

      await user.click(within(dialog).getByRole("button", { name: /create sequence/i }));

      await waitFor(() =>
        expect(createSequenceMock).toHaveBeenCalledWith({
          mailboxId: "mailbox_1",
          name: "Warm intro",
          physicalAddress: "500 Market St, Austin, TX 78701",
          steps: [
            { body: "Hi there", delayDays: 0, order: 0, subject: "Quick hello" },
            { body: "Checking back in", delayDays: 2, order: 1, subject: "Follow-up" },
          ],
          trackingDomain: "links.example.com",
        }),
      );

      expect(mockShowSuccess).toHaveBeenCalledWith("Sequence created");
    },
    OUTREACH_FORM_TEST_TIMEOUT_MS,
  );
});
