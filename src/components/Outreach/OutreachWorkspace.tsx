import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ROUTES } from "@convex/shared/routes";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { CardSection } from "@/components/ui/CardSection";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useOrganization } from "@/hooks/useOrgContext";
import { getConvexSiteUrl } from "@/lib/convex";
import { formatDateTime as formatTimestamp } from "@/lib/formatting";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Clock,
  Mail,
  Plus,
  Rocket,
  Send,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
} from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  parseContactCustomFieldsInput,
  parseContactTagsInput,
  parseOutreachContactImportCsv,
  stringifyContactCustomFields,
} from "./outreachParsing";

const outreachApi = api.outreach;
type OutreachTab = "overview" | "sequences" | "contacts" | "mailboxes" | "analytics";
type MailboxListItem = FunctionReturnType<typeof outreachApi.mailboxes.list>[number];
type ContactListItem = FunctionReturnType<typeof outreachApi.contacts.list>[number];
type SequenceListItem = FunctionReturnType<typeof outreachApi.sequences.list>[number];
type EnrollmentListItem = FunctionReturnType<typeof outreachApi.enrollments.listBySequence>[number];
type SequenceStepListItem = SequenceListItem["steps"][number];
type MailboxHealthListItem = FunctionReturnType<
  typeof outreachApi.analytics.getMailboxHealth
>[number];
type SequenceOverview = NonNullable<
  FunctionReturnType<typeof outreachApi.analytics.getOrganizationOverview>
>;
type EnrollmentTimeline = NonNullable<
  FunctionReturnType<typeof outreachApi.analytics.getContactTimeline>
>;
type ContactImportPreview = ReturnType<typeof parseOutreachContactImportCsv>;
type ImportPreviewState = { ok: true; value: ContactImportPreview } | { error: string; ok: false };
type ContactImportBatchResult = FunctionReturnType<typeof outreachApi.contacts.importBatch>;

interface ContactFormState {
  company: string;
  customFields: string;
  email: string;
  firstName: string;
  lastName: string;
  tags: string;
  timezone: string;
}

interface SequenceFormStepState {
  body: string;
  delayDays: string;
  id: string;
  subject: string;
}

interface SequenceFormState {
  mailboxId: string;
  name: string;
  physicalAddress: string;
  steps: SequenceFormStepState[];
  trackingDomain: string;
}

type SequenceFormStepField = Exclude<keyof SequenceFormStepState, "id">;

const DEFAULT_CONTACT_FORM: ContactFormState = {
  company: "",
  customFields: "",
  email: "",
  firstName: "",
  lastName: "",
  tags: "",
  timezone: "",
};

let sequenceDraftStepCounter = 0;

const DEFAULT_SEQUENCE_FORM: SequenceFormState = {
  mailboxId: "",
  name: "",
  physicalAddress: "",
  steps: [createSequenceFormStep({ delayDays: "0" })],
  trackingDomain: "",
};

const MAX_SEQUENCE_STEPS = 5;
const GMAIL_AUTH_ORIGIN = new URL(getConvexSiteUrl()).origin;

function buildGmailAuthUrl(userId: Id<"users">, organizationId: Id<"organizations">): string {
  const authUrl = new URL(ROUTES.outreachGoogleAuth.build(), getConvexSiteUrl());
  authUrl.searchParams.set("userId", userId);
  authUrl.searchParams.set("organizationId", organizationId);
  return authUrl.toString();
}

function createSequenceFormStep(
  values?: Partial<Omit<SequenceFormStepState, "id">>,
  id?: string,
): SequenceFormStepState {
  sequenceDraftStepCounter += 1;

  return {
    body: values?.body ?? "",
    delayDays: values?.delayDays ?? "1",
    id: id ?? `draft-step-${sequenceDraftStepCounter}`,
    subject: values?.subject ?? "",
  };
}

function buildContactFormState(contact?: ContactListItem): ContactFormState {
  if (!contact) {
    return DEFAULT_CONTACT_FORM;
  }

  return {
    company: contact.company ?? "",
    customFields: stringifyContactCustomFields(contact.customFields),
    email: contact.email,
    firstName: contact.firstName ?? "",
    lastName: contact.lastName ?? "",
    tags: contact.tags?.join(", ") ?? "",
    timezone: contact.timezone ?? "",
  };
}

function buildSequenceFormState(sequence?: SequenceListItem): SequenceFormState {
  if (!sequence) {
    return DEFAULT_SEQUENCE_FORM;
  }

  return {
    mailboxId: sequence.mailboxId,
    name: sequence.name,
    physicalAddress: sequence.physicalAddress,
    steps: sequence.steps.map((step) => ({
      body: step.body,
      delayDays: String(step.delayDays),
      id: `existing-step-${sequence._id}-${step.order}`,
      subject: step.subject,
    })),
    trackingDomain: sequence.trackingDomain ?? "",
  };
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatOutreachDateTime(value?: number): string {
  if (!value) {
    return "Not scheduled";
  }

  return formatTimestamp(value);
}

function formatPluralizedCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getProviderLabel(provider: MailboxListItem["provider"]): string {
  return provider === "google" ? "Gmail" : "Microsoft 365";
}

function getStatusBadgeVariant(
  status: string,
): "success" | "warning" | "info" | "neutral" | "error" {
  switch (status) {
    case "active":
    case "completed":
      return "success";
    case "paused":
      return "warning";
    case "replied":
      return "info";
    case "bounced":
    case "unsubscribed":
      return "error";
    default:
      return "neutral";
  }
}

function MetricTile({
  description,
  title,
  value,
}: {
  description: string;
  title: string;
  value: string;
}) {
  return (
    <Card padding="md" variant="soft" className="h-full">
      <Stack gap="xs">
        <Typography variant="eyebrowWide">{title}</Typography>
        <Typography variant="dashboardStatValueStrong">{value}</Typography>
        <Typography variant="caption">{description}</Typography>
      </Stack>
    </Card>
  );
}

function SectionTitle({
  action,
  description,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Flex justify="between" align="start" direction="column" directionSm="row" gap="sm">
      <Stack gap="xs">
        <Typography variant="cardTitle" as="h3">
          {title}
        </Typography>
        <Typography variant="caption">{description}</Typography>
      </Stack>
      {action}
    </Flex>
  );
}

/** Organization-level outreach workspace for managing mailboxes, sequences, contacts, and analytics. */
export function OutreachWorkspace() {
  const { organizationId } = useOrganization();
  const { user: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<OutreachTab>("overview");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactListItem | null>(null);
  const [editingSequence, setEditingSequence] = useState<SequenceListItem | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormState>(DEFAULT_CONTACT_FORM);
  const [sequenceForm, setSequenceForm] = useState<SequenceFormState>(DEFAULT_SEQUENCE_FORM);
  const [importText, setImportText] = useState("");
  const [selectedSequenceId, setSelectedSequenceId] = useState<Id<"outreachSequences">>();
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<Id<"outreachEnrollments">>();
  const [selectedContactIds, setSelectedContactIds] = useState<Set<Id<"outreachContacts">>>(
    new Set(),
  );
  const [mailboxLimitInputs, setMailboxLimitInputs] = useState<Record<string, string>>({});
  const [pendingDeleteContact, setPendingDeleteContact] = useState<ContactListItem | null>(null);
  const [pendingDeleteSequence, setPendingDeleteSequence] = useState<SequenceListItem | null>(null);
  const [pendingDisconnectMailbox, setPendingDisconnectMailbox] = useState<MailboxListItem | null>(
    null,
  );

  const contacts = useAuthenticatedQuery(outreachApi.contacts.list, {});
  const sequences = useAuthenticatedQuery(outreachApi.sequences.list, {});
  const mailboxes = useAuthenticatedQuery(outreachApi.mailboxes.list, {});
  const mailboxHealth = useAuthenticatedQuery(outreachApi.analytics.getMailboxHealth, {});
  const organizationOverview = useAuthenticatedQuery(
    outreachApi.analytics.getOrganizationOverview,
    {},
  );
  const enrollments = useAuthenticatedQuery(
    outreachApi.enrollments.listBySequence,
    selectedSequenceId ? { sequenceId: selectedSequenceId } : "skip",
  );
  const sequenceStats = useAuthenticatedQuery(
    outreachApi.analytics.getSequenceStats,
    selectedSequenceId ? { sequenceId: selectedSequenceId } : "skip",
  );
  const sequenceFunnel = useAuthenticatedQuery(
    outreachApi.analytics.getSequenceFunnel,
    selectedSequenceId ? { sequenceId: selectedSequenceId } : "skip",
  );
  const contactTimeline = useAuthenticatedQuery(
    outreachApi.analytics.getContactTimeline,
    selectedEnrollmentId ? { enrollmentId: selectedEnrollmentId } : "skip",
  );

  const { mutate: createContact } = useAuthenticatedMutation(outreachApi.contacts.create);
  const { mutate: updateContact } = useAuthenticatedMutation(outreachApi.contacts.update);
  const { mutate: removeContact } = useAuthenticatedMutation(outreachApi.contacts.remove);
  const { mutate: importContacts } = useAuthenticatedMutation(outreachApi.contacts.importBatch);
  const { mutate: createSequence } = useAuthenticatedMutation(outreachApi.sequences.create);
  const { mutate: updateSequence } = useAuthenticatedMutation(outreachApi.sequences.update);
  const { mutate: activateSequence } = useAuthenticatedMutation(
    outreachApi.sequences.updateSequenceStatus,
  );
  const { mutate: pauseSequence } = useAuthenticatedMutation(outreachApi.sequences.pause);
  const { mutate: removeSequence } = useAuthenticatedMutation(outreachApi.sequences.remove);
  const { mutate: createEnrollments } = useAuthenticatedMutation(
    outreachApi.enrollments.createEnrollments,
  );
  const { mutate: cancelEnrollment } = useAuthenticatedMutation(
    outreachApi.enrollments.cancelEnrollment,
  );
  const { mutate: disconnectMailbox } = useAuthenticatedMutation(outreachApi.mailboxes.disconnect);
  const { mutate: updateMailboxLimit } = useAuthenticatedMutation(
    outreachApi.mailboxes.updateLimit,
  );

  useMailboxLimitInputs(mailboxes, setMailboxLimitInputs);
  useSelectedSequenceSync(sequences, selectedSequenceId, setSelectedSequenceId);
  useSelectedEnrollmentSync(enrollments, selectedEnrollmentId, setSelectedEnrollmentId);
  useMailboxConnectedListener(setActiveTab);

  if (
    contacts === undefined ||
    sequences === undefined ||
    mailboxes === undefined ||
    mailboxHealth === undefined ||
    organizationOverview === undefined
  ) {
    return (
      <PageLayout>
        <PageContent isLoading>{null}</PageContent>
      </PageLayout>
    );
  }

  const selectedSequence = selectedSequenceId
    ? sequences.find((sequence) => sequence._id === selectedSequenceId)
    : undefined;
  const selectedSequenceEnrollments = enrollments ?? [];

  const selectedSequenceMailbox = selectedSequence
    ? mailboxes.find((mailbox) => mailbox._id === selectedSequence.mailboxId)
    : undefined;
  const selectedTimelineEnrollment = contactTimeline?.enrollment;
  const selectedTimelineContact =
    selectedTimelineEnrollment &&
    contacts.find((contact) => contact._id === selectedTimelineEnrollment.contactId);

  const activeEnrollmentContactIds = getActiveEnrollmentContactIds(selectedSequenceEnrollments);

  const importPreview =
    importText.trim().length > 0 ? safeParseImportPreview(importText) : undefined;
  const overview = getOutreachOverview(organizationOverview);

  const headerActions = getHeaderActions({
    activeTab,
    hasMailboxes: mailboxes.length > 0,
    onConnectMailbox: () => handleConnectMailbox(),
    onCreateContact: () => openContactDialog(),
    onCreateSequence: () => openSequenceDialog(mailboxes),
    onImportContacts: () => setIsImportDialogOpen(true),
  });

  const handleContactSubmit = async () => {
    const email = contactForm.email.trim().toLowerCase();
    if (!email) {
      showError("Email is required");
      return;
    }

    try {
      const customFields = parseContactCustomFieldsInput(contactForm.customFields);
      const payload = {
        company: contactForm.company.trim() || undefined,
        customFields,
        firstName: contactForm.firstName.trim() || undefined,
        lastName: contactForm.lastName.trim() || undefined,
        tags: parseContactTagsInput(contactForm.tags),
        timezone: contactForm.timezone.trim() || undefined,
      };

      if (editingContact) {
        await updateContact({
          contactId: editingContact._id,
          ...payload,
        });
        showSuccess("Contact updated");
      } else {
        await createContact({
          email,
          ...payload,
        });
        showSuccess("Contact created");
      }

      closeContactDialog();
    } catch (error) {
      showError(error, editingContact ? "Failed to update contact" : "Failed to create contact");
    }
  };

  const handleSequenceSubmit = async () => {
    if (mailboxes.length === 0) {
      showError("Connect a mailbox before creating a sequence");
      return;
    }

    try {
      const steps = sequenceForm.steps.map((step, index) => {
        const subject = step.subject.trim();
        const body = step.body.trim();
        const parsedDelayDays = Number.parseInt(step.delayDays, 10);

        if (!subject || !body) {
          throw new Error(`Step ${index + 1} needs both a subject and a body.`);
        }

        if (index === 0) {
          return { body, delayDays: 0, order: 0, subject };
        }

        if (!Number.isFinite(parsedDelayDays) || parsedDelayDays < 1) {
          throw new Error(`Step ${index + 1} must wait at least one business day.`);
        }

        return { body, delayDays: parsedDelayDays, order: index, subject };
      });

      const mailboxId = sequenceForm.mailboxId as Id<"outreachMailboxes"> | "";
      if (!mailboxId) {
        throw new Error("Select a connected mailbox for this sequence.");
      }

      const payload = {
        mailboxId,
        name: sequenceForm.name.trim(),
        physicalAddress: sequenceForm.physicalAddress.trim(),
        steps,
        trackingDomain: sequenceForm.trackingDomain.trim() || undefined,
      };

      if (!payload.name) {
        throw new Error("Sequence name is required.");
      }
      if (!payload.physicalAddress) {
        throw new Error("Physical address is required for compliance.");
      }

      if (editingSequence) {
        await updateSequence({
          sequenceId: editingSequence._id,
          name: payload.name,
          physicalAddress: payload.physicalAddress,
          steps: payload.steps,
          trackingDomain: payload.trackingDomain,
        });
        showSuccess("Sequence updated");
      } else {
        const createdSequenceId = await createSequence(payload);
        setSelectedSequenceId(createdSequenceId);
        showSuccess("Sequence created");
      }

      closeSequenceDialog();
    } catch (error) {
      showError(error, editingSequence ? "Failed to update sequence" : "Failed to create sequence");
    }
  };

  const handleImportContacts = async () => {
    if (!importPreview || !importPreview.ok) {
      showError(importPreview?.error ?? "Provide a valid CSV file before importing.");
      return;
    }

    if (importPreview.value.contacts.length === 0) {
      showError("No importable contacts found. Fix the rows flagged in the preview first.");
      return;
    }

    try {
      const result = await importContacts({ contacts: importPreview.value.contacts });
      showSuccess(formatContactImportResultMessage(result));
      setImportText("");
      setIsImportDialogOpen(false);
      setActiveTab("contacts");
    } catch (error) {
      showError(error, "Failed to import contacts");
    }
  };

  const handleSaveMailboxLimit = async (mailboxId: Id<"outreachMailboxes">) => {
    const rawValue = mailboxLimitInputs[mailboxId] ?? "";
    const parsedValue = Number.parseInt(rawValue, 10);

    if (!Number.isFinite(parsedValue)) {
      showError("Daily limit must be a whole number");
      return;
    }

    try {
      await updateMailboxLimit({
        mailboxId,
        dailySendLimit: parsedValue,
      });
      showSuccess("Mailbox daily limit updated");
    } catch (error) {
      showError(error, "Failed to update mailbox limit");
    }
  };

  const handleToggleEnrollmentContact = (
    contactId: Id<"outreachContacts">,
    checked: boolean | "indeterminate",
  ) => {
    setSelectedContactIds((current) => {
      const next = new Set(current);
      if (checked === true) {
        next.add(contactId);
      } else {
        next.delete(contactId);
      }
      return next;
    });
  };

  const handleCreateEnrollments = async () => {
    if (!selectedSequenceId || selectedContactIds.size === 0) {
      showError("Choose at least one contact to enroll.");
      return;
    }

    try {
      const result = await createEnrollments({
        contactIds: Array.from(selectedContactIds),
        sequenceId: selectedSequenceId,
      });
      showSuccess(`Enrolled ${result.enrolled} contacts and skipped ${result.skipped}.`);
      setSelectedContactIds(new Set());
      setIsEnrollDialogOpen(false);
    } catch (error) {
      showError(error, "Failed to enroll contacts");
    }
  };

  const noMailboxConnected = mailboxes.length === 0;
  const noSequenceCreated = sequences.length === 0;
  const noActiveSequence = !sequences.some((sequence) => sequence.status === "active");

  return (
    <PageLayout maxWidth="full">
      <PageHeader
        title="Outreach"
        description="Run Gmail-first outbound sequences, manage recipients, control mailbox capacity, and inspect engagement without leaving the workspace."
        actions={headerActions}
      />

      <Stack gap="lg" data-testid={TEST_IDS.OUTREACH.ROOT}>
        <OutreachLaunchChecklist
          noActiveSequence={noActiveSequence}
          noMailboxConnected={noMailboxConnected}
          noSequenceCreated={noSequenceCreated}
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OutreachTab)}>
          <TabsList className="w-full justify-start overflow-x-auto" variant="underline">
            <TabsTrigger
              value="overview"
              variant="underline"
              tone="indigo"
              data-testid={TEST_IDS.OUTREACH.TAB_OVERVIEW}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="sequences"
              variant="underline"
              tone="indigo"
              data-testid={TEST_IDS.OUTREACH.TAB_SEQUENCES}
            >
              Sequences
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              variant="underline"
              tone="indigo"
              data-testid={TEST_IDS.OUTREACH.TAB_CONTACTS}
            >
              Contacts
            </TabsTrigger>
            <TabsTrigger
              value="mailboxes"
              variant="underline"
              tone="indigo"
              data-testid={TEST_IDS.OUTREACH.TAB_MAILBOXES}
            >
              Mailboxes
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              variant="underline"
              tone="indigo"
              data-testid={TEST_IDS.OUTREACH.TAB_ANALYTICS}
            >
              Analytics
            </TabsTrigger>
          </TabsList>
          <OverviewTabContent
            contacts={contacts}
            mailboxes={mailboxes}
            mailboxHealth={mailboxHealth}
            overview={overview}
            sequences={sequences}
            onConnectMailbox={handleConnectMailbox}
            onCreateSequence={() => openSequenceDialog(mailboxes)}
          />

          <SequencesTabContent
            contacts={contacts}
            selectedEnrollmentId={selectedEnrollmentId}
            selectedSequence={selectedSequence}
            selectedSequenceEnrollments={selectedSequenceEnrollments}
            selectedSequenceId={selectedSequenceId}
            selectedSequenceMailbox={selectedSequenceMailbox}
            sequences={sequences}
            onActivateSequence={(sequenceId) =>
              void handleActivateSequence(sequenceId, activateSequence)
            }
            onCancelEnrollment={(enrollmentId) =>
              void handleCancelEnrollment(enrollmentId, cancelEnrollment)
            }
            onCreateSequence={() => openSequenceDialog(mailboxes)}
            onDeleteSequence={setPendingDeleteSequence}
            onEditSequence={(sequence) => openSequenceDialog(mailboxes, sequence)}
            onOpenEnrollDialog={() => setIsEnrollDialogOpen(true)}
            onPauseSequence={(sequenceId) => void handlePauseSequence(sequenceId, pauseSequence)}
            onSelectEnrollment={(enrollmentId) => {
              setActiveTab("analytics");
              setSelectedEnrollmentId(enrollmentId);
            }}
            onSelectSequence={setSelectedSequenceId}
          />

          <ContactsTabContent
            contacts={contacts}
            onDeleteContact={setPendingDeleteContact}
            onEditContact={openContactDialog}
            onImportContacts={() => setIsImportDialogOpen(true)}
            onNewContact={() => openContactDialog()}
          />

          <MailboxesTabContent
            mailboxHealth={mailboxHealth}
            mailboxLimitInputs={mailboxLimitInputs}
            mailboxes={mailboxes}
            onConnectMailbox={handleConnectMailbox}
            onDisconnectMailbox={setPendingDisconnectMailbox}
            onLimitInputChange={(mailboxId, value) =>
              setMailboxLimitInputs((current) => ({
                ...current,
                [mailboxId]: value,
              }))
            }
            onSaveMailboxLimit={(mailboxId) => void handleSaveMailboxLimit(mailboxId)}
          />

          <AnalyticsTabContent
            contactTimeline={contactTimeline}
            contacts={contacts}
            selectedEnrollmentId={selectedEnrollmentId}
            selectedSequence={selectedSequence}
            selectedSequenceEnrollments={selectedSequenceEnrollments}
            selectedSequenceId={selectedSequenceId}
            selectedTimelineContact={selectedTimelineContact}
            selectedTimelineEnrollment={selectedTimelineEnrollment}
            sequenceFunnel={sequenceFunnel}
            sequenceStats={sequenceStats}
            sequences={sequences}
            onSelectEnrollment={setSelectedEnrollmentId}
            onSelectSequence={setSelectedSequenceId}
          />
        </Tabs>
      </Stack>
      <ContactDialogContent
        contactForm={contactForm}
        editingContact={editingContact}
        isOpen={isContactDialogOpen}
        onClose={closeContactDialog}
        onFieldChange={(key, value) => setContactForm((current) => ({ ...current, [key]: value }))}
        onOpenChange={(open) => {
          setIsContactDialogOpen(open);
          if (!open) {
            closeContactDialog();
          }
        }}
        onSubmit={() => void handleContactSubmit()}
      />

      <ImportContactsDialogContent
        importPreview={importPreview}
        importText={importText}
        isOpen={isImportDialogOpen}
        onClose={() => {
          setImportText("");
          setIsImportDialogOpen(false);
        }}
        onImportContacts={() => void handleImportContacts()}
        onImportTextChange={setImportText}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) {
            setImportText("");
          }
        }}
      />

      <SequenceDialogContent
        editingSequence={editingSequence}
        isOpen={isSequenceDialogOpen}
        mailboxes={mailboxes}
        sequenceForm={sequenceForm}
        onAddStep={() =>
          setSequenceForm((current) => ({
            ...current,
            steps:
              current.steps.length >= MAX_SEQUENCE_STEPS
                ? current.steps
                : [...current.steps, createSequenceFormStep()],
          }))
        }
        onClose={closeSequenceDialog}
        onFieldChange={(key, value) => setSequenceForm((current) => ({ ...current, [key]: value }))}
        onOpenChange={(open) => {
          setIsSequenceDialogOpen(open);
          if (!open) {
            closeSequenceDialog();
          }
        }}
        onRemoveStep={(index) =>
          setSequenceForm((current) => ({
            ...current,
            steps: current.steps.filter((_, stepIndex) => stepIndex !== index),
          }))
        }
        onStepChange={(index, key, value) =>
          updateSequenceDraftStep(index, key, value, setSequenceForm)
        }
        onSubmit={() => void handleSequenceSubmit()}
      />

      <EnrollContactsDialogContent
        activeEnrollmentContactIds={activeEnrollmentContactIds}
        contacts={contacts}
        isOpen={isEnrollDialogOpen}
        selectedContactIds={selectedContactIds}
        selectedSequence={selectedSequence}
        onClose={() => {
          setSelectedContactIds(new Set());
          setIsEnrollDialogOpen(false);
        }}
        onOpenChange={(open) => {
          setIsEnrollDialogOpen(open);
          if (!open) {
            setSelectedContactIds(new Set());
          }
        }}
        onSubmit={() => void handleCreateEnrollments()}
        onToggleContact={handleToggleEnrollmentContact}
      />

      <ConfirmDialog
        isOpen={pendingDeleteContact !== null}
        onClose={() => setPendingDeleteContact(null)}
        onConfirm={() => void handleDeleteContact(pendingDeleteContact, removeContact)}
        title="Delete contact"
        message="This removes the contact record. Active or paused enrollments still block deletion."
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={pendingDeleteSequence !== null}
        onClose={() => setPendingDeleteSequence(null)}
        onConfirm={() => void handleDeleteSequence(pendingDeleteSequence, removeSequence)}
        title="Delete sequence"
        message="This permanently deletes the sequence. Active sequences must be paused first."
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={pendingDisconnectMailbox !== null}
        onClose={() => setPendingDisconnectMailbox(null)}
        onConfirm={() =>
          void handleDisconnectMailboxConfirm(pendingDisconnectMailbox, disconnectMailbox)
        }
        title="Disconnect mailbox"
        message="Disconnecting clears the stored access tokens and stops future sends from this mailbox."
        confirmLabel="Disconnect"
        variant="danger"
        data-testid={TEST_IDS.OUTREACH.MAILBOX_DISCONNECT_CONFIRM}
      />
    </PageLayout>
  );

  function closeContactDialog() {
    setEditingContact(null);
    setContactForm(DEFAULT_CONTACT_FORM);
    setIsContactDialogOpen(false);
  }

  function closeSequenceDialog() {
    setEditingSequence(null);
    setSequenceForm(DEFAULT_SEQUENCE_FORM);
    setIsSequenceDialogOpen(false);
  }

  function openContactDialog(contact?: ContactListItem) {
    setEditingContact(contact ?? null);
    setContactForm(buildContactFormState(contact));
    setIsContactDialogOpen(true);
  }

  function openSequenceDialog(availableMailboxes: MailboxListItem[], sequence?: SequenceListItem) {
    if (availableMailboxes.length === 0 && !sequence) {
      showError("Connect a mailbox before creating a sequence");
      return;
    }

    setEditingSequence(sequence ?? null);
    const nextState = buildSequenceFormState(sequence);
    if (!sequence && !nextState.mailboxId) {
      nextState.mailboxId = availableMailboxes[0]?._id ?? "";
    }
    setSequenceForm(nextState);
    setIsSequenceDialogOpen(true);
  }

  function handleConnectMailbox() {
    if (!currentUser?._id) {
      showError("We could not verify your account. Refresh and try again.");
      return;
    }

    const width = 620;
    const height = 760;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const gmailAuthUrl = buildGmailAuthUrl(currentUser._id, organizationId);

    const popup = window.open(
      gmailAuthUrl,
      "Outreach Gmail OAuth",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`,
    );

    if (!popup) {
      showError("Please allow popups to connect a Gmail mailbox.");
    }
  }
}

function OverviewTabContent({
  contacts,
  mailboxes,
  mailboxHealth,
  overview,
  sequences,
  onConnectMailbox,
  onCreateSequence,
}: {
  contacts: ContactListItem[];
  mailboxes: MailboxListItem[];
  mailboxHealth: MailboxHealthListItem[];
  overview: SequenceOverview;
  sequences: SequenceListItem[];
  onConnectMailbox: () => void;
  onCreateSequence: () => void;
}) {
  return (
    <TabsContent value="overview" data-testid={TEST_IDS.OUTREACH.OVERVIEW_SECTION}>
      <Stack gap="md">
        <Grid cols={1} colsMd={2} colsLg={4} gap="lg">
          <MetricTile
            title="Sequences"
            value={formatCount(overview.sequences)}
            description={`${overview.active} active right now`}
          />
          <MetricTile
            title="Recipients"
            value={formatCount(overview.enrolled)}
            description={`${formatCount(contacts.length)} contacts in the workspace`}
          />
          <MetricTile
            title="Messages Sent"
            value={formatCount(overview.sent)}
            description={`${formatPercent(overview.rates.openRate)} average open rate`}
          />
          <MetricTile
            title="Replies"
            value={formatCount(overview.replied)}
            description={`${formatPercent(overview.rates.replyRate)} average reply rate`}
          />
        </Grid>

        <Grid cols={1} colsLg={3} gap="lg">
          <Card padding="md" variant="soft" className="lg:col-span-2">
            <Stack gap="md">
              <SectionTitle
                title="Sequence health"
                description="See which campaigns are ready to send and where follow-up capacity is blocked."
              />
              {sequences.length === 0 ? (
                <EmptyState
                  icon={Rocket}
                  title="No outreach sequences yet"
                  description="Create a sequence with a connected mailbox, then enroll contacts to start a campaign."
                  action={{ label: "Create Sequence", onClick: onCreateSequence }}
                  size="compact"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mailbox</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Replies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequences.slice(0, 6).map((sequence) => (
                      <TableRow key={sequence._id}>
                        <TableCell>
                          <Typography variant="label" as="span">
                            {sequence.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(sequence.status)}>
                            {sequence.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {mailboxes.find((mailbox) => mailbox._id === sequence.mailboxId)?.email ??
                            "Missing mailbox"}
                        </TableCell>
                        <TableCell>{formatCount(sequence.stats?.enrolled ?? 0)}</TableCell>
                        <TableCell>{formatCount(sequence.stats?.replied ?? 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Stack>
          </Card>

          <Card padding="md" variant="soft">
            <Stack gap="md">
              <SectionTitle
                title="Mailbox capacity"
                description="Daily and minute-window send headroom from connected mailboxes."
              />
              {mailboxHealth.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No connected mailboxes"
                  description="Connect Gmail to unlock sending."
                  action={{ label: "Connect Gmail", onClick: onConnectMailbox }}
                  size="compact"
                />
              ) : (
                <Stack gap="sm">
                  {mailboxHealth.map((mailbox) => (
                    <CardSection key={mailbox.id} size="compact">
                      <Stack gap="xs">
                        <Flex justify="between" align="center">
                          <Typography variant="label" as="span">
                            {mailbox.email}
                          </Typography>
                          <Badge variant={mailbox.isActive ? "success" : "warning"}>
                            {mailbox.isActive ? "Active" : "Disconnected"}
                          </Badge>
                        </Flex>
                        <Typography variant="caption" as="span">
                          {mailbox.todaySent}/{mailbox.dailyLimit} today and {mailbox.minuteSent}/
                          {mailbox.minuteLimit} in the current minute window
                        </Typography>
                      </Stack>
                    </CardSection>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        </Grid>
      </Stack>
    </TabsContent>
  );
}

function OutreachLaunchChecklist({
  noActiveSequence,
  noMailboxConnected,
  noSequenceCreated,
}: {
  noActiveSequence: boolean;
  noMailboxConnected: boolean;
  noSequenceCreated: boolean;
}) {
  if (!noMailboxConnected && !noSequenceCreated && !noActiveSequence) {
    return null;
  }

  return (
    <Alert
      variant={noMailboxConnected ? "warning" : "info"}
      data-testid={TEST_IDS.OUTREACH.LAUNCH_CHECKLIST}
    >
      <AlertTitle>Launch checklist</AlertTitle>
      <AlertDescription>
        {getLaunchChecklistMessage({
          noActiveSequence,
          noMailboxConnected,
          noSequenceCreated,
        })}
      </AlertDescription>
    </Alert>
  );
}

function SequencesTabContent({
  contacts,
  selectedEnrollmentId,
  selectedSequence,
  selectedSequenceEnrollments,
  selectedSequenceId,
  selectedSequenceMailbox,
  sequences,
  onActivateSequence,
  onCancelEnrollment,
  onCreateSequence,
  onDeleteSequence,
  onEditSequence,
  onOpenEnrollDialog,
  onPauseSequence,
  onSelectEnrollment,
  onSelectSequence,
}: {
  contacts: ContactListItem[];
  selectedEnrollmentId?: Id<"outreachEnrollments">;
  selectedSequence?: SequenceListItem;
  selectedSequenceEnrollments: EnrollmentListItem[];
  selectedSequenceId?: Id<"outreachSequences">;
  selectedSequenceMailbox?: MailboxListItem;
  sequences: SequenceListItem[];
  onActivateSequence: (sequenceId: Id<"outreachSequences">) => void;
  onCancelEnrollment: (enrollmentId: Id<"outreachEnrollments">) => void;
  onCreateSequence: () => void;
  onDeleteSequence: (sequence: SequenceListItem) => void;
  onEditSequence: (sequence: SequenceListItem) => void;
  onOpenEnrollDialog: () => void;
  onPauseSequence: (sequenceId: Id<"outreachSequences">) => void;
  onSelectEnrollment: (enrollmentId: Id<"outreachEnrollments">) => void;
  onSelectSequence: (sequenceId: Id<"outreachSequences">) => void;
}) {
  return (
    <TabsContent value="sequences">
      <Grid cols={1} colsLg={12} gap="lg">
        <SequencesSidebar
          selectedSequenceId={selectedSequenceId}
          sequences={sequences}
          onCreateSequence={onCreateSequence}
          onSelectSequence={onSelectSequence}
        />
        <SelectedSequencePanel
          contacts={contacts}
          selectedEnrollmentId={selectedEnrollmentId}
          selectedSequence={selectedSequence}
          selectedSequenceEnrollments={selectedSequenceEnrollments ?? []}
          selectedSequenceMailbox={selectedSequenceMailbox}
          onActivateSequence={onActivateSequence}
          onCancelEnrollment={onCancelEnrollment}
          onCreateSequence={onCreateSequence}
          onDeleteSequence={onDeleteSequence}
          onEditSequence={onEditSequence}
          onOpenEnrollDialog={onOpenEnrollDialog}
          onPauseSequence={onPauseSequence}
          onSelectEnrollment={onSelectEnrollment}
        />
      </Grid>
    </TabsContent>
  );
}

function SequencesSidebar({
  selectedSequenceId,
  sequences,
  onCreateSequence,
  onSelectSequence,
}: {
  selectedSequenceId?: Id<"outreachSequences">;
  sequences: SequenceListItem[];
  onCreateSequence: () => void;
  onSelectSequence: (sequenceId: Id<"outreachSequences">) => void;
}) {
  return (
    <Card
      padding="md"
      variant="soft"
      className="lg:col-span-4"
      data-testid={TEST_IDS.OUTREACH.SEQUENCES_LIST}
    >
      <Stack gap="md">
        <SectionTitle
          title="Sequences"
          description="Draft, activate, and pause follow-up campaigns."
        />
        {sequences.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No sequences yet"
            description="Create your first sequence to start building outreach."
            action={{ label: "New Sequence", onClick: onCreateSequence }}
            size="compact"
          />
        ) : (
          <Stack gap="sm">
            {sequences.map((sequence) => (
              <Button
                type="button"
                key={sequence._id}
                onClick={() => onSelectSequence(sequence._id)}
                variant="unstyled"
                size="card"
                className={cn(
                  getCardRecipeClassName(
                    selectedSequenceId === sequence._id ? "selectionRowSelected" : "selectionRow",
                  ),
                  "p-4",
                )}
              >
                <Stack gap="xs">
                  <Flex justify="between" align="center">
                    <Typography variant="label" as="span">
                      {sequence.name}
                    </Typography>
                    <Badge variant={getStatusBadgeVariant(sequence.status)}>
                      {sequence.status}
                    </Badge>
                  </Flex>
                  <Typography variant="caption" as="span">
                    {sequence.steps.length} steps • {sequence.stats?.enrolled ?? 0} enrolled
                  </Typography>
                </Stack>
              </Button>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

function SelectedSequencePanel({
  contacts,
  selectedEnrollmentId,
  selectedSequence,
  selectedSequenceEnrollments,
  selectedSequenceMailbox,
  onActivateSequence,
  onCancelEnrollment,
  onCreateSequence,
  onDeleteSequence,
  onEditSequence,
  onOpenEnrollDialog,
  onPauseSequence,
  onSelectEnrollment,
}: {
  contacts: ContactListItem[];
  selectedEnrollmentId?: Id<"outreachEnrollments">;
  selectedSequence?: SequenceListItem;
  selectedSequenceEnrollments: EnrollmentListItem[];
  selectedSequenceMailbox?: MailboxListItem;
  onActivateSequence: (sequenceId: Id<"outreachSequences">) => void;
  onCancelEnrollment: (enrollmentId: Id<"outreachEnrollments">) => void;
  onCreateSequence: () => void;
  onDeleteSequence: (sequence: SequenceListItem) => void;
  onEditSequence: (sequence: SequenceListItem) => void;
  onOpenEnrollDialog: () => void;
  onPauseSequence: (sequenceId: Id<"outreachSequences">) => void;
  onSelectEnrollment: (enrollmentId: Id<"outreachEnrollments">) => void;
}) {
  if (!selectedSequence) {
    return (
      <Card
        padding="md"
        variant="soft"
        className="lg:col-span-8"
        data-testid={TEST_IDS.OUTREACH.SEQUENCE_DETAIL}
      >
        <EmptyState
          icon={Rocket}
          title="No sequence selected"
          description="Choose a sequence from the list or create one to start configuring outreach."
          action={{ label: "New Sequence", onClick: onCreateSequence }}
        />
      </Card>
    );
  }

  return (
    <Card
      padding="md"
      variant="soft"
      className="lg:col-span-8"
      data-testid={TEST_IDS.OUTREACH.SEQUENCE_DETAIL}
    >
      <Stack gap="lg">
        <SectionTitle
          title={selectedSequence.name}
          description="Manage cadence, recipients, and runtime state for the selected sequence."
          action={
            <Flex gap="sm" wrap>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEditSequence(selectedSequence)}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenEnrollDialog}
                disabled={contacts.length === 0}
                data-testid={TEST_IDS.OUTREACH.ACTION_ENROLL_CONTACTS}
              >
                Enroll Contacts
              </Button>
              {selectedSequence.status === "active" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onPauseSequence(selectedSequence._id)}
                >
                  Pause
                </Button>
              ) : (
                <Button size="sm" onClick={() => onActivateSequence(selectedSequence._id)}>
                  Activate
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                onClick={() => onDeleteSequence(selectedSequence)}
                disabled={selectedSequence.status === "active"}
              >
                Delete
              </Button>
            </Flex>
          }
        />

        <Grid cols={1} colsMd={3} gap="md">
          <MetricTile
            title="Enrolled"
            value={formatCount(selectedSequence.stats?.enrolled ?? 0)}
            description="Contacts currently or previously attached to this sequence."
          />
          <MetricTile
            title="Sent"
            value={formatCount(selectedSequence.stats?.sent ?? 0)}
            description={`${formatCount(selectedSequence.steps.length)} sequenced steps`}
          />
          <MetricTile
            title="Replies"
            value={formatCount(selectedSequence.stats?.replied ?? 0)}
            description={`${formatCount(selectedSequence.stats?.bounced ?? 0)} bounces detected`}
          />
        </Grid>

        <SequenceSettingsCard
          selectedSequence={selectedSequence}
          selectedSequenceMailbox={selectedSequenceMailbox}
        />
        <SequenceStepsCard steps={selectedSequence.steps} />
        <SequenceEnrollmentsCard
          contacts={contacts}
          selectedEnrollmentId={selectedEnrollmentId}
          selectedSequenceEnrollments={selectedSequenceEnrollments}
          onCancelEnrollment={onCancelEnrollment}
          onOpenEnrollDialog={onOpenEnrollDialog}
          onSelectEnrollment={onSelectEnrollment}
        />
      </Stack>
    </Card>
  );
}

function SequenceSettingsCard({
  selectedSequence,
  selectedSequenceMailbox,
}: {
  selectedSequence: SequenceListItem;
  selectedSequenceMailbox?: MailboxListItem;
}) {
  return (
    <Card padding="md" variant="subtle">
      <Stack gap="sm">
        <Typography variant="label">Sequence settings</Typography>
        <Grid cols={1} colsMd={2} gap="md">
          <Stack gap="xs">
            <Typography variant="eyebrowWide" as="span">
              Mailbox
            </Typography>
            <Typography variant="caption" as="span">
              {selectedSequenceMailbox?.email ?? "Mailbox missing"}
            </Typography>
          </Stack>
          <Stack gap="xs">
            <Typography variant="eyebrowWide" as="span">
              Tracking Domain
            </Typography>
            <Typography variant="caption" as="span">
              {selectedSequence.trackingDomain ?? "Using default tracking host"}
            </Typography>
          </Stack>
          <Stack gap="xs" className="md:col-span-2">
            <Typography variant="eyebrowWide" as="span">
              Physical Address
            </Typography>
            <Typography variant="caption" as="span">
              {selectedSequence.physicalAddress}
            </Typography>
          </Stack>
        </Grid>
      </Stack>
    </Card>
  );
}

function SequenceStepsCard({ steps }: { steps: SequenceStepListItem[] }) {
  return (
    <Card padding="md" variant="subtle">
      <Stack gap="md">
        <SectionTitle
          title="Steps"
          description="Review message copy and timing across the sequence."
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Step</TableHead>
              <TableHead>Wait</TableHead>
              <TableHead>Subject</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {steps.map((step, index) => (
              <TableRow key={step.order}>
                <TableCell>
                  <Typography variant="label" as="span">
                    Step {index + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  {index === 0 ? "Send immediately" : `${step.delayDays} business days`}
                </TableCell>
                <TableCell>{step.subject}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    </Card>
  );
}

function SequenceEnrollmentsCard({
  contacts,
  selectedEnrollmentId,
  selectedSequenceEnrollments,
  onCancelEnrollment,
  onOpenEnrollDialog,
  onSelectEnrollment,
}: {
  contacts: ContactListItem[];
  selectedEnrollmentId?: Id<"outreachEnrollments">;
  selectedSequenceEnrollments: EnrollmentListItem[];
  onCancelEnrollment: (enrollmentId: Id<"outreachEnrollments">) => void;
  onOpenEnrollDialog: () => void;
  onSelectEnrollment: (enrollmentId: Id<"outreachEnrollments">) => void;
}) {
  return (
    <Card padding="md" variant="subtle">
      <Stack gap="md">
        <SectionTitle
          title="Enrollments"
          description="Monitor recipient state and stop individuals manually when needed."
        />
        {selectedSequenceEnrollments.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No enrollments yet"
            description="Enroll contacts in this sequence to queue the first message."
            action={{ label: "Enroll Contacts", onClick: onOpenEnrollDialog }}
            size="compact"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Step</TableHead>
                <TableHead>Next Send</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedSequenceEnrollments.map((enrollment) => {
                const contact = contacts.find(
                  (candidate) => candidate._id === enrollment.contactId,
                );
                const canStop = enrollment.status === "active" || enrollment.status === "paused";

                return (
                  <TableRow
                    key={enrollment._id}
                    className={
                      selectedEnrollmentId === enrollment._id ? "bg-brand-subtle/30" : undefined
                    }
                  >
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="contentStart"
                        onClick={() => onSelectEnrollment(enrollment._id)}
                      >
                        <Stack gap="xs">
                          <Typography variant="label" as="span">
                            {getContactDisplayName(contact)}
                          </Typography>
                          <Typography variant="meta" as="span">
                            {contact?.email ?? "Missing email"}
                          </Typography>
                        </Stack>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(enrollment.status)}>
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>Step {enrollment.currentStep + 1}</TableCell>
                    <TableCell>{formatOutreachDateTime(enrollment.nextSendAt)}</TableCell>
                    <TableCell className="text-right">
                      {canStop ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onCancelEnrollment(enrollment._id)}
                        >
                          Stop
                        </Button>
                      ) : (
                        <Typography variant="meta" as="span">
                          Terminal state
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Stack>
    </Card>
  );
}

function ContactsTabContent({
  contacts,
  onDeleteContact,
  onEditContact,
  onImportContacts,
  onNewContact,
}: {
  contacts: ContactListItem[];
  onDeleteContact: (contact: ContactListItem) => void;
  onEditContact: (contact: ContactListItem) => void;
  onImportContacts: () => void;
  onNewContact: () => void;
}) {
  return (
    <TabsContent value="contacts" data-testid={TEST_IDS.OUTREACH.CONTACTS_SECTION}>
      <Card padding="md" variant="soft">
        <Stack gap="md">
          <SectionTitle
            title="Contacts"
            description="Store recipient data, tags, and template variables for outreach."
            action={
              <Flex gap="sm" wrap>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onImportContacts}
                  data-testid={TEST_IDS.OUTREACH.ACTION_IMPORT_CONTACTS}
                >
                  <Icon icon={Upload} size="sm" />
                  Import CSV
                </Button>
                <Button
                  size="sm"
                  onClick={onNewContact}
                  data-testid={TEST_IDS.OUTREACH.ACTION_NEW_CONTACT}
                >
                  <Icon icon={UserPlus} size="sm" />
                  New Contact
                </Button>
              </Flex>
            }
          />
          {contacts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No contacts yet"
              description="Add contacts manually or import a CSV to start enrolling people."
              action={{ label: "New Contact", onClick: onNewContact }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell>
                      <Typography variant="label" as="span">
                        {getContactDisplayName(contact)}
                      </Typography>
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.company ?? "—"}</TableCell>
                    <TableCell>
                      <Flex gap="xs" wrap>
                        {contact.tags && contact.tags.length > 0 ? (
                          contact.tags.map((tag) => (
                            <Badge key={`${contact._id}-${tag}`} variant="outline">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <Typography variant="meta" as="span">
                            No tags
                          </Typography>
                        )}
                      </Flex>
                    </TableCell>
                    <TableCell className="text-right">
                      <Flex justify="end" gap="sm">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onEditContact(contact)}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => onDeleteContact(contact)}>
                          Delete
                        </Button>
                      </Flex>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Card>
    </TabsContent>
  );
}

function MailboxesTabContent({
  mailboxHealth,
  mailboxLimitInputs,
  mailboxes,
  onConnectMailbox,
  onDisconnectMailbox,
  onLimitInputChange,
  onSaveMailboxLimit,
}: {
  mailboxHealth: MailboxHealthListItem[];
  mailboxLimitInputs: Record<string, string>;
  mailboxes: MailboxListItem[];
  onConnectMailbox: () => void;
  onDisconnectMailbox: (mailbox: MailboxListItem) => void;
  onLimitInputChange: (mailboxId: Id<"outreachMailboxes">, value: string) => void;
  onSaveMailboxLimit: (mailboxId: Id<"outreachMailboxes">) => void;
}) {
  return (
    <TabsContent value="mailboxes" data-testid={TEST_IDS.OUTREACH.MAILBOXES_SECTION}>
      <Stack gap="md">
        <Alert variant="info">
          <AlertTitle>Gmail-first mailbox connections</AlertTitle>
          <AlertDescription>
            Outlook support exists in the schema, but this product surface intentionally ships the
            Gmail path first so users can connect, throttle, and monitor one provider cleanly.
          </AlertDescription>
        </Alert>

        {mailboxes.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No connected mailboxes"
            description="Connect a Gmail inbox to unlock sending, health checks, and reply tracking."
            action={{ label: "Connect Gmail", onClick: onConnectMailbox }}
          />
        ) : (
          <Grid cols={1} colsLg={2} gap="lg">
            {mailboxes.map((mailbox) => (
              <MailboxCard
                key={mailbox._id}
                health={mailboxHealth.find((entry) => entry.id === mailbox._id)}
                mailbox={mailbox}
                limitValue={mailboxLimitInputs[mailbox._id] ?? String(mailbox.dailySendLimit)}
                onDisconnectMailbox={onDisconnectMailbox}
                onLimitInputChange={onLimitInputChange}
                onSaveMailboxLimit={onSaveMailboxLimit}
              />
            ))}
          </Grid>
        )}
      </Stack>
    </TabsContent>
  );
}

function MailboxCard({
  health,
  mailbox,
  limitValue,
  onDisconnectMailbox,
  onLimitInputChange,
  onSaveMailboxLimit,
}: {
  health?: MailboxHealthListItem;
  mailbox: MailboxListItem;
  limitValue: string;
  onDisconnectMailbox: (mailbox: MailboxListItem) => void;
  onLimitInputChange: (mailboxId: Id<"outreachMailboxes">, value: string) => void;
  onSaveMailboxLimit: (mailboxId: Id<"outreachMailboxes">) => void;
}) {
  const inputId = `mailbox-daily-limit-${mailbox._id}`;

  return (
    <Card padding="md" variant="soft" data-testid={TEST_IDS.OUTREACH.MAILBOX_CARD}>
      <Stack gap="md">
        <Flex justify="between" align="start" gap="sm">
          <Stack gap="xs">
            <Typography variant="large" as="span">
              {mailbox.displayName || mailbox.email}
            </Typography>
            <Typography variant="caption" as="span">
              {mailbox.email} • {getProviderLabel(mailbox.provider)}
            </Typography>
          </Stack>
          <Badge variant={mailbox.isActive ? "success" : "warning"}>
            {mailbox.isActive ? "Connected" : "Disconnected"}
          </Badge>
        </Flex>

        <Grid cols={1} colsMd={2} gap="md">
          <MetricTile
            title="Daily Capacity"
            value={`${health?.todaySent ?? 0}/${health?.dailyLimit ?? mailbox.dailySendLimit}`}
            description={`${health?.remaining ?? 0} sends left today`}
          />
          <MetricTile
            title="Minute Window"
            value={`${health?.minuteSent ?? 0}/${health?.minuteLimit ?? mailbox.minuteSendLimit}`}
            description={`${health?.minuteRemaining ?? 0} sends left in the current minute`}
          />
        </Grid>

        <Stack gap="sm">
          <Typography variant="eyebrowWide" as="label" htmlFor={inputId}>
            Daily send limit
          </Typography>
          <Flex gap="sm" direction="column" directionSm="row">
            <Input
              id={inputId}
              type="number"
              min={1}
              max={100}
              value={limitValue}
              onChange={(event) => onLimitInputChange(mailbox._id, event.target.value)}
            />
            <Button variant="secondary" onClick={() => onSaveMailboxLimit(mailbox._id)}>
              Save limit
            </Button>
          </Flex>
        </Stack>

        <Flex justify="between" align="center" wrap gap="sm">
          <Typography variant="meta" as="span">
            Last refreshed {formatOutreachDateTime(mailbox.updatedAt)}
          </Typography>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDisconnectMailbox(mailbox)}
            data-testid={TEST_IDS.OUTREACH.MAILBOX_DISCONNECT_BUTTON}
          >
            Disconnect
          </Button>
        </Flex>
      </Stack>
    </Card>
  );
}

function AnalyticsTabContent({
  contactTimeline,
  contacts,
  selectedEnrollmentId,
  selectedSequence,
  selectedSequenceEnrollments,
  selectedSequenceId,
  selectedTimelineContact,
  selectedTimelineEnrollment,
  sequenceFunnel,
  sequenceStats,
  sequences,
  onSelectEnrollment,
  onSelectSequence,
}: {
  contactTimeline: FunctionReturnType<typeof outreachApi.analytics.getContactTimeline> | undefined;
  contacts: ContactListItem[];
  selectedEnrollmentId?: Id<"outreachEnrollments">;
  selectedSequence?: SequenceListItem;
  selectedSequenceEnrollments: EnrollmentListItem[];
  selectedSequenceId?: Id<"outreachSequences">;
  selectedTimelineContact?: ContactListItem;
  selectedTimelineEnrollment?: EnrollmentTimeline["enrollment"];
  sequenceFunnel: FunctionReturnType<typeof outreachApi.analytics.getSequenceFunnel> | undefined;
  sequenceStats: FunctionReturnType<typeof outreachApi.analytics.getSequenceStats> | undefined;
  sequences: SequenceListItem[];
  onSelectEnrollment: (enrollmentId: Id<"outreachEnrollments">) => void;
  onSelectSequence: (sequenceId: Id<"outreachSequences">) => void;
}) {
  return (
    <TabsContent value="analytics" data-testid={TEST_IDS.OUTREACH.ANALYTICS_SECTION}>
      <Grid cols={1} colsLg={12} gap="lg">
        <SequenceAnalyticsCard
          selectedSequence={selectedSequence}
          selectedSequenceId={selectedSequenceId}
          sequenceFunnel={sequenceFunnel}
          sequenceStats={sequenceStats}
          sequences={sequences}
          onSelectSequence={onSelectSequence}
        />
        <RecipientTimelineCard
          contactTimeline={contactTimeline}
          contacts={contacts}
          selectedEnrollmentId={selectedEnrollmentId}
          selectedSequenceEnrollments={selectedSequenceEnrollments ?? []}
          selectedTimelineContact={selectedTimelineContact}
          selectedTimelineEnrollment={selectedTimelineEnrollment}
          onSelectEnrollment={onSelectEnrollment}
        />
      </Grid>
    </TabsContent>
  );
}

function SequenceAnalyticsCard({
  selectedSequence,
  selectedSequenceId,
  sequenceFunnel,
  sequenceStats,
  sequences,
  onSelectSequence,
}: {
  selectedSequence?: SequenceListItem;
  selectedSequenceId?: Id<"outreachSequences">;
  sequenceFunnel: FunctionReturnType<typeof outreachApi.analytics.getSequenceFunnel> | undefined;
  sequenceStats: FunctionReturnType<typeof outreachApi.analytics.getSequenceStats> | undefined;
  sequences: SequenceListItem[];
  onSelectSequence: (sequenceId: Id<"outreachSequences">) => void;
}) {
  return (
    <Card padding="md" variant="soft" className="lg:col-span-7">
      <Stack gap="md">
        <SectionTitle
          title="Sequence analytics"
          description="Inspect top-line outcomes and step-level tracking for a selected campaign."
          action={
            <Select
              value={selectedSequenceId ?? ""}
              onValueChange={(value) => onSelectSequence(value as Id<"outreachSequences">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sequence" />
              </SelectTrigger>
              <SelectContent>
                {sequences.map((sequence) => (
                  <SelectItem key={sequence._id} value={sequence._id}>
                    {sequence.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {!selectedSequence || !sequenceStats || !sequenceFunnel ? (
          <EmptyState
            icon={BarChart3}
            title="No sequence selected"
            description="Choose a sequence to inspect opens, clicks, replies, and bounce performance."
            size="compact"
          />
        ) : (
          <>
            <Grid cols={1} colsMd={2} colsLg={4} gap="md">
              <MetricTile
                title="Open Rate"
                value={formatPercent(sequenceStats.rates.openRate)}
                description={`${formatCount(sequenceStats.stats.opened)} opens`}
              />
              <MetricTile
                title="Reply Rate"
                value={formatPercent(sequenceStats.rates.replyRate)}
                description={`${formatCount(sequenceStats.stats.replied)} replies`}
              />
              <MetricTile
                title="Bounce Rate"
                value={formatPercent(sequenceStats.rates.bounceRate)}
                description={`${formatCount(sequenceStats.stats.bounced)} bounces`}
              />
              <MetricTile
                title="Unsubscribes"
                value={formatPercent(sequenceStats.rates.unsubscribeRate)}
                description={`${formatCount(sequenceStats.stats.unsubscribed)} recipients`}
              />
            </Grid>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Replied</TableHead>
                  <TableHead>Bounced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequenceFunnel.map((step) => (
                  <TableRow key={`${selectedSequence._id}-${step.step}`}>
                    <TableCell>
                      <Stack gap="xs">
                        <Typography variant="label" as="span">
                          Step {step.step + 1}
                        </Typography>
                        <Typography variant="meta" as="span">
                          {step.subject}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{formatCount(step.sent)}</TableCell>
                    <TableCell>{formatCount(step.opened)}</TableCell>
                    <TableCell>{formatCount(step.clicked)}</TableCell>
                    <TableCell>{formatCount(step.replied)}</TableCell>
                    <TableCell>{formatCount(step.bounced)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Stack>
    </Card>
  );
}

function RecipientTimelineCard({
  contactTimeline,
  contacts,
  selectedEnrollmentId,
  selectedSequenceEnrollments,
  selectedTimelineContact,
  selectedTimelineEnrollment,
  onSelectEnrollment,
}: {
  contactTimeline: FunctionReturnType<typeof outreachApi.analytics.getContactTimeline> | undefined;
  contacts: ContactListItem[];
  selectedEnrollmentId?: Id<"outreachEnrollments">;
  selectedSequenceEnrollments: EnrollmentListItem[];
  selectedTimelineContact?: ContactListItem;
  selectedTimelineEnrollment?: EnrollmentTimeline["enrollment"];
  onSelectEnrollment: (enrollmentId: Id<"outreachEnrollments">) => void;
}) {
  return (
    <Card padding="md" variant="soft" className="lg:col-span-5">
      <Stack gap="md">
        <SectionTitle
          title="Recipient timeline"
          description="Track sent, opened, clicked, replied, bounced, and unsubscribe events for a single enrollment."
          action={
            <Select
              value={selectedEnrollmentId ?? ""}
              onValueChange={(value) => onSelectEnrollment(value as Id<"outreachEnrollments">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an enrollment" />
              </SelectTrigger>
              <SelectContent>
                {selectedSequenceEnrollments.map((enrollment) => (
                  <SelectItem key={enrollment._id} value={enrollment._id}>
                    {getTimelineEnrollmentLabel(
                      contacts.find((candidate) => candidate._id === enrollment.contactId),
                      enrollment._id,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {!contactTimeline || !selectedTimelineEnrollment ? (
          <EmptyState
            icon={TrendingUp}
            title="No enrollment selected"
            description="Choose an enrollment from the selected sequence to inspect its event history."
            size="compact"
          />
        ) : (
          <>
            <CardSection size="compact">
              <Stack gap="xs">
                <Typography variant="label" as="span">
                  {getContactDisplayName(selectedTimelineContact)}
                </Typography>
                <Typography variant="caption" as="span">
                  {selectedTimelineContact?.email ?? "Contact record no longer exists"}
                </Typography>
                <Badge variant={getStatusBadgeVariant(selectedTimelineEnrollment.status)}>
                  {selectedTimelineEnrollment.status}
                </Badge>
              </Stack>
            </CardSection>

            {contactTimeline.events.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No tracking events yet"
                description="The timeline will populate after the first send or recipient interaction."
                size="compact"
              />
            ) : (
              <Stack gap="sm">
                {contactTimeline.events.map((event) => (
                  <CardSection key={event._id} size="compact">
                    <Stack gap="xs">
                      <Flex justify="between" align="center">
                        <Badge variant={getStatusBadgeVariant(event.type)}>{event.type}</Badge>
                        <Typography variant="meta" as="span">
                          {formatOutreachDateTime(event.createdAt)}
                        </Typography>
                      </Flex>
                      {renderEventMetadata(event)}
                    </Stack>
                  </CardSection>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}

function ContactDialogContent({
  contactForm,
  editingContact,
  isOpen,
  onClose,
  onFieldChange,
  onOpenChange,
  onSubmit,
}: {
  contactForm: ContactFormState;
  editingContact: ContactListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onFieldChange: (key: keyof ContactFormState, value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title={editingContact ? "Edit Contact" : "New Contact"}
      description="Store recipient details, tags, and custom fields used in outreach templates."
      size="lg"
      data-testid={TEST_IDS.OUTREACH.CONTACT_DIALOG}
      footer={
        <Flex justify="end" gap="sm" className="w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{editingContact ? "Save Contact" : "Create Contact"}</Button>
        </Flex>
      }
    >
      <Stack gap="md">
        <Grid cols={1} colsMd={2} gap="md">
          <Input
            value={contactForm.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
            placeholder="lead@example.com"
            disabled={editingContact !== null}
          />
          <Input
            value={contactForm.company}
            onChange={(event) => onFieldChange("company", event.target.value)}
            placeholder="Company"
          />
          <Input
            value={contactForm.firstName}
            onChange={(event) => onFieldChange("firstName", event.target.value)}
            placeholder="First name"
          />
          <Input
            value={contactForm.lastName}
            onChange={(event) => onFieldChange("lastName", event.target.value)}
            placeholder="Last name"
          />
          <Input
            value={contactForm.timezone}
            onChange={(event) => onFieldChange("timezone", event.target.value)}
            placeholder="Timezone"
          />
          <Input
            value={contactForm.tags}
            onChange={(event) => onFieldChange("tags", event.target.value)}
            placeholder="vip, west, beta"
          />
        </Grid>
        <Stack gap="xs">
          <Typography variant="eyebrowWide" as="span">
            Custom fields
          </Typography>
          <Textarea
            value={contactForm.customFields}
            onChange={(event) => onFieldChange("customFields", event.target.value)}
            placeholder={"role=Founder\nfavoriteProduct=Roadmap"}
          />
        </Stack>
      </Stack>
    </Dialog>
  );
}

function ImportContactsDialogContent({
  importPreview,
  importText,
  isOpen,
  onClose,
  onImportContacts,
  onImportTextChange,
  onOpenChange,
}: {
  importPreview: ImportPreviewState | undefined;
  importText: string;
  isOpen: boolean;
  onClose: () => void;
  onImportContacts: () => void;
  onImportTextChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Import Contacts"
      description="Paste or upload a CSV with an email column. Unknown columns become custom fields automatically."
      size="lg"
      data-testid={TEST_IDS.OUTREACH.IMPORT_DIALOG}
      footer={
        <Flex justify="end" gap="sm" className="w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onImportContacts}
            disabled={
              !importPreview || !importPreview.ok || importPreview.value.contacts.length === 0
            }
          >
            Import contacts
          </Button>
        </Flex>
      }
    >
      <Stack gap="md">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void handleImportFile(event.target.files?.[0], onImportTextChange)}
        />
        <Textarea
          value={importText}
          onChange={(event) => onImportTextChange(event.target.value)}
          placeholder={
            "email,first name,last name,company,tags\nalex@example.com,Alex,Stone,Acme,vip;west"
          }
          rows={10}
        />
        <ImportPreviewAlert importPreview={importPreview} />
      </Stack>
    </Dialog>
  );
}

function ImportPreviewAlert({ importPreview }: { importPreview: ImportPreviewState | undefined }) {
  if (!importPreview) {
    return null;
  }

  if (!importPreview.ok) {
    return (
      <Alert variant="error">
        <AlertTitle>CSV needs attention</AlertTitle>
        <AlertDescription>{importPreview.error}</AlertDescription>
      </Alert>
    );
  }

  const issuePreview = importPreview.value.issues.slice(0, 5);
  const hasIssues = importPreview.value.issues.length > 0;
  const hasImportableContacts = importPreview.value.contacts.length > 0;

  return (
    <Alert variant={hasIssues ? "warning" : "success"}>
      <AlertTitle>
        {hasImportableContacts
          ? hasIssues
            ? "Import will skip some rows"
            : "Ready to import"
          : "No importable contacts yet"}
      </AlertTitle>
      <AlertDescription>
        <Stack gap="sm">
          <Typography variant="p">
            {formatPluralizedCount(importPreview.value.contacts.length, "contact")} ready across{" "}
            {formatPluralizedCount(importPreview.value.headers.length, "column")}. Empty rows
            skipped: {importPreview.value.skippedEmptyRows}.
          </Typography>
          {hasIssues ? (
            <>
              <Typography variant="p">
                {formatPluralizedCount(importPreview.value.issues.length, "row")} need attention
                before they can import. Duplicate email rows only keep the first occurrence.
              </Typography>
              <Stack gap="xs">
                {issuePreview.map((issue) => (
                  <Typography
                    key={`${issue.kind}-${issue.rowNumber}-${issue.email ?? "missing-email"}`}
                    variant="caption"
                  >
                    {issue.message}
                  </Typography>
                ))}
                {importPreview.value.issues.length > issuePreview.length ? (
                  <Typography variant="caption">
                    {formatPluralizedCount(
                      importPreview.value.issues.length - issuePreview.length,
                      "additional row",
                    )}{" "}
                    omitted from this preview.
                  </Typography>
                ) : null}
              </Stack>
            </>
          ) : null}
          <Typography variant="caption">
            Existing contacts and suppressed emails are rechecked during import before anything is
            inserted.
          </Typography>
        </Stack>
      </AlertDescription>
    </Alert>
  );
}

function SequenceDialogContent({
  editingSequence,
  isOpen,
  mailboxes,
  sequenceForm,
  onAddStep,
  onClose,
  onFieldChange,
  onOpenChange,
  onRemoveStep,
  onStepChange,
  onSubmit,
}: {
  editingSequence: SequenceListItem | null;
  isOpen: boolean;
  mailboxes: MailboxListItem[];
  sequenceForm: SequenceFormState;
  onAddStep: () => void;
  onClose: () => void;
  onFieldChange: (key: keyof SequenceFormState, value: string) => void;
  onOpenChange: (open: boolean) => void;
  onRemoveStep: (index: number) => void;
  onStepChange: (index: number, key: SequenceFormStepField, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title={editingSequence ? "Edit Sequence" : "New Sequence"}
      description="Define the sender, compliance details, and timed follow-up steps for this outreach campaign."
      size="2xl"
      data-testid={TEST_IDS.OUTREACH.SEQUENCE_DIALOG}
      footer={
        <Flex justify="between" align="center" className="w-full" gap="sm">
          <Button
            variant="secondary"
            onClick={onAddStep}
            disabled={sequenceForm.steps.length >= MAX_SEQUENCE_STEPS}
          >
            Add Step
          </Button>
          <Flex gap="sm">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              {editingSequence ? "Save Sequence" : "Create Sequence"}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Stack gap="md">
        <Grid cols={1} colsMd={2} gap="md">
          <Input
            value={sequenceForm.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
            placeholder="Enterprise follow-up"
          />
          <Select
            value={sequenceForm.mailboxId}
            onValueChange={(value) => onFieldChange("mailboxId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mailbox" />
            </SelectTrigger>
            <SelectContent>
              {mailboxes.map((mailbox) => (
                <SelectItem key={mailbox._id} value={mailbox._id}>
                  {mailbox.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={sequenceForm.trackingDomain}
            onChange={(event) => onFieldChange("trackingDomain", event.target.value)}
            placeholder="tracking.example.com"
          />
          <Input
            value={sequenceForm.physicalAddress}
            onChange={(event) => onFieldChange("physicalAddress", event.target.value)}
            placeholder="123 Main St, Chicago, IL 60601"
          />
        </Grid>

        <Stack gap="md">
          {sequenceForm.steps.map((step, index) => (
            <Card key={step.id} padding="md" variant="subtle">
              <Stack gap="md">
                <Flex justify="between" align="center">
                  <Typography variant="label" as="span">
                    Step {index + 1}
                  </Typography>
                  {index > 0 ? (
                    <Button size="sm" variant="danger" onClick={() => onRemoveStep(index)}>
                      Remove
                    </Button>
                  ) : (
                    <Badge variant="success">Starts sequence</Badge>
                  )}
                </Flex>
                <Grid cols={1} colsMd={4} gap="md">
                  <Stack gap="none" className="md:col-span-3">
                    <Input
                      value={step.subject}
                      onChange={(event) => onStepChange(index, "subject", event.target.value)}
                      placeholder="Subject line"
                    />
                  </Stack>
                  <Input
                    type="number"
                    min={index === 0 ? 0 : 1}
                    disabled={index === 0}
                    value={index === 0 ? "0" : step.delayDays}
                    onChange={(event) => onStepChange(index, "delayDays", event.target.value)}
                    placeholder={index === 0 ? "0" : "2"}
                  />
                </Grid>
                <Textarea
                  value={step.body}
                  onChange={(event) => onStepChange(index, "body", event.target.value)}
                  placeholder="Hi {{firstName}}, ..."
                  rows={6}
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Dialog>
  );
}

function EnrollContactsDialogContent({
  activeEnrollmentContactIds,
  contacts,
  isOpen,
  selectedContactIds,
  selectedSequence,
  onClose,
  onOpenChange,
  onSubmit,
  onToggleContact,
}: {
  activeEnrollmentContactIds: Set<Id<"outreachContacts">>;
  contacts: ContactListItem[];
  isOpen: boolean;
  selectedContactIds: Set<Id<"outreachContacts">>;
  selectedSequence?: SequenceListItem;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onToggleContact: (contactId: Id<"outreachContacts">, checked: boolean | "indeterminate") => void;
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Enroll Contacts"
      description="Pick one or more contacts who should start this sequence."
      size="lg"
      data-testid={TEST_IDS.OUTREACH.ENROLL_DIALOG}
      footer={
        <Flex justify="end" gap="sm" className="w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={selectedContactIds.size === 0}>
            Enroll {selectedContactIds.size > 0 ? selectedContactIds.size : ""}
          </Button>
        </Flex>
      }
    >
      {selectedSequence ? (
        contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts available"
            description="Create contacts before enrolling people into this sequence."
            size="compact"
          />
        ) : (
          <Stack gap="sm">
            {contacts.map((contact) => {
              const isAlreadyEnrolled = activeEnrollmentContactIds.has(contact._id);

              return (
                <Card key={contact._id} padding="sm" variant="subtle">
                  <Checkbox
                    checked={selectedContactIds.has(contact._id)}
                    onCheckedChange={(checked) => onToggleContact(contact._id, checked)}
                    disabled={isAlreadyEnrolled}
                    label={
                      <Typography variant="label" as="span">
                        {getContactDisplayName(contact)}
                      </Typography>
                    }
                    description={
                      isAlreadyEnrolled ? `${contact.email} — already enrolled` : contact.email
                    }
                  />
                </Card>
              );
            })}
          </Stack>
        )
      ) : (
        <EmptyState
          icon={AlertCircle}
          title="Select a sequence first"
          description="Choose a sequence from the Sequences tab before enrolling recipients."
          size="compact"
        />
      )}
    </Dialog>
  );
}

function getContactDisplayName(contact?: ContactListItem) {
  if (!contact) {
    return "Deleted contact";
  }

  return [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email;
}

function getTimelineEnrollmentLabel(
  contact: ContactListItem | undefined,
  enrollmentId: Id<"outreachEnrollments">,
) {
  return (
    [contact?.firstName, contact?.lastName].filter(Boolean).join(" ") ||
    contact?.email ||
    enrollmentId
  );
}

function renderEventMetadata(
  event: NonNullable<
    FunctionReturnType<typeof outreachApi.analytics.getContactTimeline>
  >["events"][number],
) {
  const metadataLines = [event.metadata?.linkUrl, event.metadata?.replyContent].filter(Boolean);

  return (
    <>
      {metadataLines.map((line) => (
        <Typography key={line} variant="caption" as="span">
          {line}
        </Typography>
      ))}
      {event.metadata?.failedRecipient ? (
        <Typography variant="caption" as="span">
          Failed recipient: {event.metadata.failedRecipient}
        </Typography>
      ) : null}
    </>
  );
}

function getActiveEnrollmentContactIds(selectedSequenceEnrollments: EnrollmentListItem[]) {
  return new Set(
    selectedSequenceEnrollments.flatMap((enrollment) =>
      enrollment.status === "active" || enrollment.status === "paused"
        ? [enrollment.contactId]
        : [],
    ),
  );
}

function getOutreachOverview(
  organizationOverview: SequenceOverview | null | undefined,
): SequenceOverview {
  return (
    organizationOverview ?? {
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
    }
  );
}

function getLaunchChecklistMessage({
  noActiveSequence,
  noMailboxConnected,
  noSequenceCreated,
}: {
  noActiveSequence: boolean;
  noMailboxConnected: boolean;
  noSequenceCreated: boolean;
}) {
  if (noMailboxConnected) {
    return "Connect a Gmail mailbox first. Sequences and enrollments stay blocked until a sender is available.";
  }

  if (noSequenceCreated) {
    return "Create your first sequence, then add contacts and enroll them.";
  }

  if (noActiveSequence) {
    return "You have draft or paused sequences. Activate one to start sending.";
  }

  return "";
}

function useMailboxLimitInputs(
  mailboxes: MailboxListItem[] | undefined,
  setMailboxLimitInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>,
) {
  useEffect(() => {
    if (!mailboxes) {
      return;
    }

    setMailboxLimitInputs((currentInputs) => {
      let changed = false;
      const nextInputs = { ...currentInputs };
      for (const mailbox of mailboxes) {
        if (nextInputs[mailbox._id] === undefined) {
          nextInputs[mailbox._id] = String(mailbox.dailySendLimit);
          changed = true;
        }
      }
      return changed ? nextInputs : currentInputs;
    });
  }, [mailboxes, setMailboxLimitInputs]);
}

function useSelectedSequenceSync(
  sequences: SequenceListItem[] | undefined,
  selectedSequenceId: Id<"outreachSequences"> | undefined,
  setSelectedSequenceId: React.Dispatch<React.SetStateAction<Id<"outreachSequences"> | undefined>>,
) {
  useEffect(() => {
    if (!sequences) {
      return;
    }

    const hasSelection = selectedSequenceId
      ? sequences.some((sequence) => sequence._id === selectedSequenceId)
      : false;

    if (!hasSelection) {
      setSelectedSequenceId(sequences[0]?._id);
    }
  }, [selectedSequenceId, sequences, setSelectedSequenceId]);
}

function useSelectedEnrollmentSync(
  enrollments: EnrollmentListItem[] | undefined,
  selectedEnrollmentId: Id<"outreachEnrollments"> | undefined,
  setSelectedEnrollmentId: React.Dispatch<
    React.SetStateAction<Id<"outreachEnrollments"> | undefined>
  >,
) {
  useEffect(() => {
    if (!enrollments) {
      return;
    }

    const hasSelection = selectedEnrollmentId
      ? enrollments.some((enrollment) => enrollment._id === selectedEnrollmentId)
      : false;

    if (!hasSelection) {
      setSelectedEnrollmentId(enrollments[0]?._id);
    }
  }, [enrollments, selectedEnrollmentId, setSelectedEnrollmentId]);
}

function useMailboxConnectedListener(
  setActiveTab: React.Dispatch<React.SetStateAction<OutreachTab>>,
) {
  useEffect(() => {
    const handleMailboxConnected = (event: MessageEvent) => {
      if (event.origin !== GMAIL_AUTH_ORIGIN) {
        return;
      }

      if (event.data?.type !== "outreach-mailbox-connected") {
        return;
      }

      setActiveTab("mailboxes");
      showSuccess("Mailbox connected successfully");
    };

    window.addEventListener("message", handleMailboxConnected);
    return () => window.removeEventListener("message", handleMailboxConnected);
  }, [setActiveTab]);
}

function safeParseImportPreview(
  importText: string,
):
  | { ok: true; value: ReturnType<typeof parseOutreachContactImportCsv> }
  | { error: string; ok: false } {
  try {
    return { ok: true, value: parseOutreachContactImportCsv(importText) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not parse the CSV import.",
      ok: false,
    };
  }
}

function formatContactImportResultMessage(result: ContactImportBatchResult): string {
  const parts = [`Imported ${formatPluralizedCount(result.imported, "contact")}.`];
  const skippedParts: string[] = [];

  if (result.skippedExisting > 0) {
    skippedParts.push(
      `${formatPluralizedCount(result.skippedExisting, "contact")} already existed`,
    );
  }
  if (result.skippedSuppressed > 0) {
    skippedParts.push(
      `${formatPluralizedCount(result.skippedSuppressed, "contact")} were suppressed`,
    );
  }
  if (result.skippedInvalid > 0) {
    skippedParts.push(
      `${formatPluralizedCount(result.skippedInvalid, "contact")} had invalid email addresses`,
    );
  }

  if (skippedParts.length > 0) {
    parts.push(`Skipped ${skippedParts.join(", ")}.`);
  } else if (result.skipped > 0) {
    parts.push(`Skipped ${formatPluralizedCount(result.skipped, "contact")}.`);
  }

  return parts.join(" ");
}

function updateSequenceDraftStep(
  index: number,
  key: SequenceFormStepField,
  value: string,
  setSequenceForm: React.Dispatch<React.SetStateAction<SequenceFormState>>,
) {
  setSequenceForm((current) => ({
    ...current,
    steps: current.steps.map((step, stepIndex) =>
      stepIndex === index ? { ...step, [key]: value } : step,
    ),
  }));
}

function getHeaderActions({
  activeTab,
  hasMailboxes,
  onConnectMailbox,
  onCreateContact,
  onCreateSequence,
  onImportContacts,
}: {
  activeTab: OutreachTab;
  hasMailboxes: boolean;
  onConnectMailbox: () => void;
  onCreateContact: () => void;
  onCreateSequence: () => void;
  onImportContacts: () => void;
}) {
  if (activeTab === "contacts") {
    return (
      <Flex gap="sm" wrap>
        <Button
          variant="secondary"
          size="sm"
          onClick={onImportContacts}
          data-testid={TEST_IDS.OUTREACH.ACTION_IMPORT_CONTACTS}
        >
          <Icon icon={Upload} size="sm" />
          Import CSV
        </Button>
        <Button
          size="sm"
          onClick={onCreateContact}
          data-testid={TEST_IDS.OUTREACH.ACTION_NEW_CONTACT}
        >
          <Icon icon={Plus} size="sm" />
          New Contact
        </Button>
      </Flex>
    );
  }

  if (activeTab === "mailboxes") {
    return (
      <Button size="sm" onClick={onConnectMailbox}>
        <Icon icon={ArrowUpRight} size="sm" />
        Connect Gmail
      </Button>
    );
  }

  if (activeTab === "sequences") {
    return (
      <Flex gap="sm" wrap>
        {!hasMailboxes ? (
          <Button size="sm" onClick={onConnectMailbox}>
            <Icon icon={ArrowUpRight} size="sm" />
            Connect Gmail
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={onCreateSequence}
          data-testid={TEST_IDS.OUTREACH.ACTION_NEW_SEQUENCE}
        >
          <Icon icon={Plus} size="sm" />
          New Sequence
        </Button>
      </Flex>
    );
  }

  return (
    <Flex gap="sm" wrap>
      {!hasMailboxes ? (
        <Button variant="secondary" size="sm" onClick={onConnectMailbox}>
          <Icon icon={ArrowUpRight} size="sm" />
          Connect Gmail
        </Button>
      ) : null}
      <Button
        variant="secondary"
        size="sm"
        onClick={onImportContacts}
        data-testid={TEST_IDS.OUTREACH.ACTION_IMPORT_CONTACTS}
      >
        <Icon icon={Upload} size="sm" />
        Import CSV
      </Button>
      <Button
        size="sm"
        onClick={onCreateSequence}
        data-testid={TEST_IDS.OUTREACH.ACTION_NEW_SEQUENCE}
      >
        <Icon icon={Rocket} size="sm" />
        New Sequence
      </Button>
    </Flex>
  );
}

async function handleImportFile(file: File | undefined, setImportText: (value: string) => void) {
  if (!file) {
    return;
  }

  try {
    setImportText(await file.text());
  } catch (error) {
    showError(error, "Failed to read the selected CSV file");
  }
}

async function handleActivateSequence(
  sequenceId: Id<"outreachSequences">,
  activateSequence: ReturnType<
    typeof useAuthenticatedMutation<typeof outreachApi.sequences.updateSequenceStatus>
  >["mutate"],
) {
  try {
    await activateSequence({ sequenceId });
    showSuccess("Sequence activated");
  } catch (error) {
    showError(error, "Failed to activate sequence");
  }
}

async function handlePauseSequence(
  sequenceId: Id<"outreachSequences">,
  pauseSequence: ReturnType<
    typeof useAuthenticatedMutation<typeof outreachApi.sequences.pause>
  >["mutate"],
) {
  try {
    await pauseSequence({ sequenceId });
    showSuccess("Sequence paused");
  } catch (error) {
    showError(error, "Failed to pause sequence");
  }
}

async function handleCancelEnrollment(
  enrollmentId: Id<"outreachEnrollments">,
  cancelEnrollment: ReturnType<
    typeof useAuthenticatedMutation<typeof outreachApi.enrollments.cancelEnrollment>
  >["mutate"],
) {
  try {
    await cancelEnrollment({ enrollmentId });
    showSuccess("Enrollment stopped");
  } catch (error) {
    showError(error, "Failed to stop enrollment");
  }
}

async function handleDeleteContact(
  contact: ContactListItem | null,
  removeContact: ReturnType<
    typeof useAuthenticatedMutation<typeof outreachApi.contacts.remove>
  >["mutate"],
) {
  if (!contact) {
    return;
  }

  try {
    await removeContact({ contactId: contact._id });
    showSuccess("Contact deleted");
  } catch (error) {
    showError(error, "Failed to delete contact");
  }
}

async function handleDeleteSequence(
  sequence: SequenceListItem | null,
  removeSequence: ReturnType<
    typeof useAuthenticatedMutation<typeof outreachApi.sequences.remove>
  >["mutate"],
) {
  if (!sequence) {
    return;
  }

  try {
    await removeSequence({ sequenceId: sequence._id });
    showSuccess("Sequence deleted");
  } catch (error) {
    showError(error, "Failed to delete sequence");
  }
}

async function handleDisconnectMailboxConfirm(
  mailbox: MailboxListItem | null,
  disconnectMailbox: ReturnType<
    typeof useAuthenticatedMutation<typeof outreachApi.mailboxes.disconnect>
  >["mutate"],
) {
  if (!mailbox) {
    return;
  }

  try {
    await disconnectMailbox({ mailboxId: mailbox._id });
    showSuccess("Mailbox disconnected");
  } catch (error) {
    showError(error, "Failed to disconnect mailbox");
  }
}
