import { api } from "@convex/_generated/api";
import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { OutreachWorkspace } from "./OutreachWorkspace";

vi.mock("@convex/_generated/api", () => ({
  api: {
    outreach: {
      analytics: {
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
  },
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
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
  organizationId: "org_1",
  provider: "google" as const,
  refreshToken: "[redacted]",
  updatedAt: 1_700_000_000_000,
  userId: "user_1",
};

const contact = {
  _creationTime: 1,
  _id: "contact_1",
  company: "Acme",
  createdAt: 1_700_000_000_000,
  createdBy: "user_1",
  customFields: { role: "Founder" },
  email: "alex@example.com",
  firstName: "Alex",
  lastName: "Stone",
  organizationId: "org_1",
  source: "manual" as const,
  tags: ["vip"],
  timezone: "America/Chicago",
};

const sequence = {
  _creationTime: 1,
  _id: "sequence_1",
  createdAt: 1_700_000_000_000,
  createdBy: "user_1",
  mailboxId: "mailbox_1",
  name: "Founder follow-up",
  organizationId: "org_1",
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
  organizationId: "org_1",
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
    [outreachApi.analytics.getMailboxHealth, [mailboxHealth]],
    [outreachApi.analytics.getOrganizationOverview, organizationOverview],
    [outreachApi.enrollments.listBySequence, args === "skip" ? undefined : [enrollment]],
    [outreachApi.analytics.getSequenceStats, args === "skip" ? undefined : sequenceStats],
    [outreachApi.analytics.getSequenceFunnel, args === "skip" ? undefined : sequenceFunnel],
    [outreachApi.analytics.getContactTimeline, args === "skip" ? undefined : timeline],
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

describe("OutreachWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createContactMock.mockResolvedValue("contact_new");
    updateContactMock.mockResolvedValue(undefined);
    removeContactMock.mockResolvedValue(undefined);
    importContactsMock.mockResolvedValue({ imported: 2, skipped: 0 });
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

    mockUseAuthenticatedQuery.mockImplementation((query, args) =>
      getDefaultQueryResult(query, args),
    );

    vi.spyOn(window, "open").mockImplementation(() => window);
  });

  it("opens the Gmail OAuth popup and accepts same-origin mailbox-connected messages", async () => {
    const user = userEvent.setup();
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
      if (query === outreachApi.analytics.getOrganizationOverview) {
        return getEmptyWorkspaceOverview();
      }

      return undefined;
    });

    render(<OutreachWorkspace />);

    await user.click(screen.getAllByRole("button", { name: /connect gmail/i })[0]);

    expect(window.open).toHaveBeenCalledWith(
      "https://demo.convex.site/outreach/google/auth",
      "Outreach Gmail OAuth",
      expect.stringContaining("width=620"),
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { mailboxId: "mailbox_2", type: "outreach-mailbox-connected" },
          origin: window.location.origin,
        }),
      );
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Mailbox connected successfully");
  });

  it("shows a popup error when Gmail OAuth is blocked", async () => {
    const user = userEvent.setup();
    vi.mocked(window.open).mockReturnValueOnce(null);
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
      if (query === outreachApi.analytics.getOrganizationOverview) {
        return getEmptyWorkspaceOverview();
      }

      return undefined;
    });

    render(<OutreachWorkspace />);

    await user.click(screen.getAllByRole("button", { name: /connect gmail/i })[0]);

    expect(mockShowError).toHaveBeenCalledWith("Please allow popups to connect a Gmail mailbox.");
  });

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

      expect(mockShowSuccess).toHaveBeenCalledWith("Imported 2 contacts and skipped 0.");
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
