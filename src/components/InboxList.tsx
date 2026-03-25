/**
 * Project inbox triage surface.
 *
 * Keeps incoming issues in one queue with direct accept / decline / snooze / duplicate flows.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Inbox,
  Mail,
  MoreHorizontal,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  buildCustomSnoozeTimestamp,
  formatInboxSourceLabel,
  getDefaultCustomSnoozeDateValue,
  getInboxEmptyStateConfig,
  INBOX_SNOOZE_PRESETS,
} from "./inbox-list-utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, getCardRecipeClassName } from "./ui/Card";
import { CardSection } from "./ui/CardSection";
import { Checkbox } from "./ui/Checkbox";
import { Dialog } from "./ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { EmptyState } from "./ui/EmptyState";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { Input } from "./ui/Input";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { ScrollArea } from "./ui/ScrollArea";
import { Stack } from "./ui/Stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { Textarea } from "./ui/Textarea";
import { Typography } from "./ui/Typography";

interface InboxListProps {
  projectId: Id<"projects">;
}

type InboxIssueStatus = "pending" | "accepted" | "declined" | "snoozed" | "duplicate";

interface InboxIssueWithDetails {
  _id: Id<"inboxIssues">;
  projectId: Id<"projects">;
  issueId: Id<"issues">;
  status: InboxIssueStatus;
  source: "api" | "email" | "form" | "in_app";
  sourceEmail?: string;
  snoozedUntil?: number;
  duplicateOfId?: Id<"issues">;
  declineReason?: string;
  triageNotes?: string;
  triagedAt?: number;
  createdAt: number;
  updatedAt: number;
  issue: Doc<"issues">;
  createdByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  triagedByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  duplicateOfIssue: { _id: Id<"issues">; key: string; title: string } | null;
}

type InboxActionTarget =
  | {
      issueId: Id<"inboxIssues">;
      issueTitle: string;
      kind: "declineOne";
    }
  | {
      issueIds: Id<"inboxIssues">[];
      kind: "declineMany";
      label: string;
    }
  | {
      issueId: Id<"inboxIssues">;
      issueTitle: string;
      kind: "customSnoozeOne";
    }
  | {
      issueIds: Id<"inboxIssues">[];
      kind: "customSnoozeMany";
      label: string;
    }
  | {
      issueId: Id<"inboxIssues">;
      issueTitle: string;
      kind: "markDuplicate";
      sourceIssueId: Id<"issues">;
    }
  | null;

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: AlertTriangle,
    recipe: "statusWarning",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    recipe: "statusSuccess",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    recipe: "statusError",
  },
  snoozed: {
    label: "Snoozed",
    icon: Clock,
    recipe: "statusNeutral",
  },
  duplicate: {
    label: "Duplicate",
    icon: Copy,
    recipe: "statusNeutral",
  },
} as const;

const DUPLICATE_SEARCH_LIMIT = 8;
type ProjectInboxE2EState = "closed-tab" | "decline-dialog" | "duplicate-dialog";
const PROJECT_INBOX_E2E_STATE_STORAGE_KEY = "nixelo:e2e:project-inbox-state";

function isTriageable(issue: Pick<InboxIssueWithDetails, "status">): boolean {
  return issue.status === "pending" || issue.status === "snoozed";
}

function formatCompactDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatRelativeMeta(item: InboxIssueWithDetails): string {
  const sourceLabel = formatInboxSourceLabel({
    createdByUser: item.createdByUser,
    source: item.source,
    sourceEmail: item.sourceEmail,
  });
  return `${sourceLabel} on ${formatCompactDate(item.createdAt)}`;
}

function filterInboxIssues(items: InboxIssueWithDetails[], normalizedQuery: string) {
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const duplicateText = item.duplicateOfIssue
      ? `${item.duplicateOfIssue.key} ${item.duplicateOfIssue.title}`.toLowerCase()
      : "";
    const sourceText = formatInboxSourceLabel({
      createdByUser: item.createdByUser,
      source: item.source,
      sourceEmail: item.sourceEmail,
    }).toLowerCase();

    return (
      item.issue.title.toLowerCase().includes(normalizedQuery) ||
      item.issue.key.toLowerCase().includes(normalizedQuery) ||
      duplicateText.includes(normalizedQuery) ||
      sourceText.includes(normalizedQuery)
    );
  });
}

function useInboxSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<Id<"inboxIssues">>>(new Set());

  const clear = () => {
    setSelectedIds(new Set());
  };

  const toggle = (id: Id<"inboxIssues">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = (items: InboxIssueWithDetails[]) => {
    setSelectedIds(new Set(items.filter(isTriageable).map((item) => item._id)));
  };

  return { clear, selectAll, selectedIds, toggle };
}

function useInboxTriageActions(projectId: Id<"projects">) {
  const { mutate: accept } = useAuthenticatedMutation(api.inbox.accept);
  const { mutate: bulkAccept } = useAuthenticatedMutation(api.inbox.bulkAccept);
  const { mutate: decline } = useAuthenticatedMutation(api.inbox.decline);
  const { mutate: bulkDecline } = useAuthenticatedMutation(api.inbox.bulkDecline);
  const { mutate: snooze } = useAuthenticatedMutation(api.inbox.snooze);
  const { mutate: bulkSnooze } = useAuthenticatedMutation(api.inbox.bulkSnooze);
  const { mutate: unsnooze } = useAuthenticatedMutation(api.inbox.unsnooze);
  const { mutate: reopen } = useAuthenticatedMutation(api.inbox.reopen);
  const { mutate: remove } = useAuthenticatedMutation(api.inbox.remove);
  const { mutate: markDuplicate } = useAuthenticatedMutation(api.inbox.markDuplicate);

  const acceptIssues = async (issueIds: Id<"inboxIssues">[]) => {
    if (issueIds.length === 0) {
      return false;
    }

    try {
      if (issueIds.length === 1) {
        await accept({ id: issueIds[0], projectId });
        showSuccess("Issue accepted");
      } else {
        const result = await bulkAccept({ inboxIssueIds: issueIds, projectId });
        showSuccess(`Accepted ${result.accepted} issue(s)`);
      }
      return true;
    } catch (error) {
      showError(
        error,
        issueIds.length === 1 ? "Failed to accept issue" : "Failed to accept issues",
      );
      return false;
    }
  };

  const declineIssues = async (issueIds: Id<"inboxIssues">[], reason?: string) => {
    if (issueIds.length === 0) {
      return false;
    }

    try {
      if (issueIds.length === 1) {
        await decline({ id: issueIds[0], projectId, reason: reason?.trim() || undefined });
        showSuccess("Issue declined");
      } else {
        const result = await bulkDecline({
          inboxIssueIds: issueIds,
          projectId,
          reason: reason?.trim() || undefined,
        });
        showSuccess(`Declined ${result.declined} issue(s)`);
      }
      return true;
    } catch (error) {
      showError(
        error,
        issueIds.length === 1 ? "Failed to decline issue" : "Failed to decline issues",
      );
      return false;
    }
  };

  const snoozeIssues = async (issueIds: Id<"inboxIssues">[], until: number) => {
    if (issueIds.length === 0) {
      return false;
    }

    try {
      if (issueIds.length === 1) {
        await snooze({ id: issueIds[0], projectId, until });
        showSuccess("Issue snoozed");
      } else {
        const result = await bulkSnooze({ inboxIssueIds: issueIds, projectId, until });
        showSuccess(`Snoozed ${result.snoozed} issue(s)`);
      }
      return true;
    } catch (error) {
      showError(
        error,
        issueIds.length === 1 ? "Failed to snooze issue" : "Failed to snooze issues",
      );
      return false;
    }
  };

  const unsnoozeIssue = async (issueId: Id<"inboxIssues">) => {
    try {
      await unsnooze({ id: issueId, projectId });
      showSuccess("Issue unsnoozed");
      return true;
    } catch (error) {
      showError(error, "Failed to unsnooze issue");
      return false;
    }
  };

  const reopenIssue = async (issueId: Id<"inboxIssues">) => {
    try {
      await reopen({ id: issueId, projectId });
      showSuccess("Issue reopened");
      return true;
    } catch (error) {
      showError(error, "Failed to reopen issue");
      return false;
    }
  };

  const removeIssue = async (issueId: Id<"inboxIssues">) => {
    try {
      await remove({ id: issueId, projectId });
      showSuccess("Issue removed from inbox");
      return true;
    } catch (error) {
      showError(error, "Failed to remove issue");
      return false;
    }
  };

  const markIssueDuplicate = async (issueId: Id<"inboxIssues">, duplicateOfId: Id<"issues">) => {
    try {
      await markDuplicate({ id: issueId, projectId, duplicateOfId });
      showSuccess("Issue marked as duplicate");
      return true;
    } catch (error) {
      showError(error, "Failed to mark issue as duplicate");
      return false;
    }
  };

  return {
    acceptIssues,
    declineIssues,
    markIssueDuplicate,
    removeIssue,
    reopenIssue,
    snoozeIssues,
    unsnoozeIssue,
  };
}

function useInboxDialogState({
  actions,
  selection,
}: {
  actions: ReturnType<typeof useInboxTriageActions>;
  selection: ReturnType<typeof useInboxSelection>;
}) {
  const [actionTarget, setActionTarget] = useState<InboxActionTarget>(null);

  const closeDialog = useCallback(() => {
    setActionTarget(null);
  }, []);

  const openDialog = useCallback((target: InboxActionTarget) => {
    setActionTarget(target);
  }, []);

  const handleDeclineConfirm = async (reason: string) => {
    if (
      !actionTarget ||
      (actionTarget.kind !== "declineOne" && actionTarget.kind !== "declineMany")
    ) {
      return;
    }

    const success =
      actionTarget.kind === "declineOne"
        ? await actions.declineIssues([actionTarget.issueId], reason)
        : await actions.declineIssues(actionTarget.issueIds, reason);

    if (success) {
      selection.clear();
      closeDialog();
    }
  };

  const handleCustomSnoozeConfirm = async (until: number) => {
    if (
      !actionTarget ||
      (actionTarget.kind !== "customSnoozeOne" && actionTarget.kind !== "customSnoozeMany")
    ) {
      return;
    }

    const success =
      actionTarget.kind === "customSnoozeOne"
        ? await actions.snoozeIssues([actionTarget.issueId], until)
        : await actions.snoozeIssues(actionTarget.issueIds, until);

    if (success) {
      selection.clear();
      closeDialog();
    }
  };

  const handleDuplicateConfirm = async (duplicateOfId: Id<"issues">) => {
    if (!actionTarget || actionTarget.kind !== "markDuplicate") {
      return;
    }

    const success = await actions.markIssueDuplicate(actionTarget.issueId, duplicateOfId);
    if (success) {
      closeDialog();
    }
  };

  return {
    actionTarget,
    closeDialog,
    handleCustomSnoozeConfirm,
    handleDeclineConfirm,
    handleDuplicateConfirm,
    openDialog,
  };
}

function SnoozeDropdownButton({
  label,
  onCustomDate,
  onPreset,
}: {
  label: string;
  onCustomDate: () => void;
  onPreset: (until: number) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Icon icon={Clock} size="sm" />}
          rightIcon={<Icon icon={ChevronDown} size="sm" />}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-testid={TEST_IDS.PROJECT_INBOX.SNOOZE_MENU}>
        {INBOX_SNOOZE_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.id}
            onSelect={() => onPreset(Date.now() + preset.durationMs)}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCustomDate}>Pick a date…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeclineDialog({
  description,
  onConfirm,
  onOpenChange,
  open,
  title,
}: {
  description: string;
  onConfirm: (reason: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm(reason);
    setIsSubmitting(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="md"
      data-testid={TEST_IDS.PROJECT_INBOX.DECLINE_DIALOG}
      footer={
        <Flex justify="end" gap="sm" className="w-full">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} isLoading={isSubmitting}>
            Decline
          </Button>
        </Flex>
      }
    >
      <Stack gap="sm">
        <Typography variant="small" color="secondary">
          Add an optional reason so the decision is visible when this item lands in the closed tab.
        </Typography>
        <Textarea
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why this issue should not move forward right now."
        />
      </Stack>
    </Dialog>
  );
}

function CustomSnoozeDialog({
  description,
  onConfirm,
  onOpenChange,
  open,
  title,
}: {
  description: string;
  onConfirm: (until: number) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  const [dateValue, setDateValue] = useState(getDefaultCustomSnoozeDateValue());
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDateValue(getDefaultCustomSnoozeDateValue());
      setError(undefined);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    const until = buildCustomSnoozeTimestamp(dateValue);
    if (!until) {
      setError("Choose a future date.");
      return;
    }

    setIsSubmitting(true);
    await onConfirm(until);
    setIsSubmitting(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      data-testid={TEST_IDS.PROJECT_INBOX.CUSTOM_SNOOZE_DIALOG}
      footer={
        <Flex justify="end" gap="sm" className="w-full">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleConfirm} isLoading={isSubmitting}>
            Snooze
          </Button>
        </Flex>
      }
    >
      <Stack gap="sm">
        <Typography variant="small" color="secondary">
          Hide this issue until the selected date.
        </Typography>
        <Input
          type="date"
          value={dateValue}
          min={getDefaultCustomSnoozeDateValue()}
          onChange={(event) => {
            setDateValue(event.target.value);
            setError(undefined);
          }}
          error={error}
        />
      </Stack>
    </Dialog>
  );
}

function DuplicateIssueDialog({
  issueTitle,
  onConfirm,
  onOpenChange,
  open,
  projectId,
  sourceIssueId,
}: {
  issueTitle: string;
  onConfirm: (duplicateOfId: Id<"issues">) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: Id<"projects">;
  sourceIssueId: Id<"issues">;
}) {
  const [query, setQuery] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState<Id<"issues"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());
  const searchResults = useAuthenticatedQuery(
    api.issues.search,
    open
      ? {
          excludeIssueId: sourceIssueId,
          limit: DUPLICATE_SEARCH_LIMIT,
          projectId,
          query: deferredQuery,
        }
      : "skip",
  );
  const issues = searchResults?.page ?? [];

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIssueId(null);
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (issues.length === 0) {
      setSelectedIssueId(null);
      return;
    }

    setSelectedIssueId((current) => {
      if (current && issues.some((issue) => issue._id === current)) {
        return current;
      }
      return issues[0]?._id ?? null;
    });
  }, [issues]);

  const handleConfirm = async () => {
    if (!selectedIssueId) {
      return;
    }

    setIsSubmitting(true);
    await onConfirm(selectedIssueId);
    setIsSubmitting(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mark as duplicate"
      description={`Choose the existing issue that should absorb "${issueTitle}".`}
      size="lg"
      data-testid={TEST_IDS.PROJECT_INBOX.DUPLICATE_DIALOG}
      footer={
        <Flex justify="end" gap="sm" className="w-full">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            disabled={!selectedIssueId || issues.length === 0}
          >
            Mark duplicate
          </Button>
        </Flex>
      }
    >
      <Stack gap="md">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search project issues..."
          variant="search"
        />

        <Typography variant="small" color="secondary">
          {deferredQuery
            ? "Showing matching project issues."
            : "Showing recent project issues so you can link quickly."}
        </Typography>

        {searchResults === undefined ? (
          <Flex align="center" justify="center" className="py-8">
            <LoadingSpinner size="md" />
          </Flex>
        ) : issues.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching issues"
            description="Try a different search term or clear the query to browse recent project issues."
          />
        ) : (
          <ScrollArea size="contentLg">
            <Stack gap="sm">
              {issues.map((issue) => {
                const isSelected = selectedIssueId === issue._id;
                return (
                  <Card
                    key={issue._id}
                    variant="ghost"
                    padding="sm"
                    onClick={() => setSelectedIssueId(issue._id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedIssueId(issue._id);
                      }
                    }}
                    className={getCardRecipeClassName(
                      isSelected ? "selectionRowSelected" : "selectionRow",
                    )}
                    role="button"
                    tabIndex={0}
                  >
                    <Stack gap="xs">
                      <Flex align="center" gap="sm">
                        <Typography variant="label" className="text-ui-text-secondary">
                          {issue.key}
                        </Typography>
                        <Typography>{issue.title}</Typography>
                      </Flex>
                      <Typography variant="caption" color="tertiary">
                        Status: {issue.status}
                      </Typography>
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </Dialog>
  );
}

function InboxBulkActionsBar({
  filteredIssues,
  onAcceptSelected,
  onOpenCustomSnooze,
  onOpenDeclineSelected,
  onSnoozeSelected,
  selectedCount,
  selection,
  triageableCount,
}: {
  filteredIssues: InboxIssueWithDetails[];
  onAcceptSelected: () => Promise<void>;
  onOpenCustomSnooze: () => void;
  onOpenDeclineSelected: () => void;
  onSnoozeSelected: (until: number) => Promise<void>;
  selectedCount: number;
  selection: ReturnType<typeof useInboxSelection>;
  triageableCount: number;
}) {
  return (
    <CardSection className="bg-ui-bg-soft" data-testid={TEST_IDS.PROJECT_INBOX.BULK_ACTIONS}>
      <Flex align="center" gap="md" wrap>
        <Checkbox
          checked={selectedCount === triageableCount && triageableCount > 0}
          onCheckedChange={(checked) => {
            if (checked) {
              selection.selectAll(filteredIssues);
            } else {
              selection.clear();
            }
          }}
        />
        {selectedCount > 0 ? (
          <>
            <Typography variant="small" color="secondary">
              {selectedCount} selected
            </Typography>
            <FlexItem grow />
            <Button variant="secondary" size="sm" onClick={onAcceptSelected}>
              Accept all
            </Button>
            <SnoozeDropdownButton
              label="Snooze"
              onPreset={(until) => void onSnoozeSelected(until)}
              onCustomDate={onOpenCustomSnooze}
            />
            <Button variant="danger" size="sm" onClick={onOpenDeclineSelected}>
              Decline all
            </Button>
            <Button variant="ghost" size="sm" onClick={selection.clear}>
              Clear
            </Button>
          </>
        ) : (
          <Typography variant="small" color="tertiary">
            Select items for bulk triage.
          </Typography>
        )}
      </Flex>
    </CardSection>
  );
}

function InboxTabContent({
  emptyState,
  items,
  selectedIds,
  testId,
  onAcceptIssue,
  onEmptyAction,
  onOpenDecline,
  onOpenDuplicate,
  onOpenCustomSnooze,
  onRemoveIssue,
  onReopenIssue,
  onSnoozeIssue,
  onToggleSelect,
  onUnsnoozeIssue,
}: {
  emptyState: ReturnType<typeof getInboxEmptyStateConfig>;
  items: InboxIssueWithDetails[];
  selectedIds: Set<Id<"inboxIssues">>;
  testId: string;
  onAcceptIssue: (issueId: Id<"inboxIssues">) => Promise<void>;
  onEmptyAction?: () => void;
  onOpenDecline: (issue: InboxIssueWithDetails) => void;
  onOpenDuplicate: (issue: InboxIssueWithDetails) => void;
  onOpenCustomSnooze: (issue: InboxIssueWithDetails) => void;
  onRemoveIssue: (issueId: Id<"inboxIssues">) => Promise<void>;
  onReopenIssue: (issueId: Id<"inboxIssues">) => Promise<void>;
  onSnoozeIssue: (issueId: Id<"inboxIssues">, until: number) => Promise<void>;
  onToggleSelect: (id: Id<"inboxIssues">) => void;
  onUnsnoozeIssue: (issueId: Id<"inboxIssues">) => Promise<void>;
}) {
  if (items.length === 0) {
    return (
      <div data-testid={testId}>
        <EmptyState
          icon={Inbox}
          title={emptyState.title}
          description={emptyState.description}
          action={
            emptyState.actionLabel && onEmptyAction
              ? {
                  label: emptyState.actionLabel,
                  onClick: onEmptyAction,
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <Stack gap="sm">
      {items.map((item) => (
        <InboxIssueRow
          key={item._id}
          isSelected={selectedIds.has(item._id)}
          item={item}
          onAcceptIssue={onAcceptIssue}
          onOpenDecline={onOpenDecline}
          onOpenDuplicate={onOpenDuplicate}
          onOpenCustomSnooze={onOpenCustomSnooze}
          onRemoveIssue={onRemoveIssue}
          onReopenIssue={onReopenIssue}
          onSnoozeIssue={onSnoozeIssue}
          onToggleSelect={onToggleSelect}
          onUnsnoozeIssue={onUnsnoozeIssue}
        />
      ))}
    </Stack>
  );
}

function InboxIssueRow({
  isSelected,
  item,
  onAcceptIssue,
  onOpenDecline,
  onOpenDuplicate,
  onOpenCustomSnooze,
  onRemoveIssue,
  onReopenIssue,
  onSnoozeIssue,
  onToggleSelect,
  onUnsnoozeIssue,
}: {
  isSelected: boolean;
  item: InboxIssueWithDetails;
  onAcceptIssue: (issueId: Id<"inboxIssues">) => Promise<void>;
  onOpenDecline: (issue: InboxIssueWithDetails) => void;
  onOpenDuplicate: (issue: InboxIssueWithDetails) => void;
  onOpenCustomSnooze: (issue: InboxIssueWithDetails) => void;
  onRemoveIssue: (issueId: Id<"inboxIssues">) => Promise<void>;
  onReopenIssue: (issueId: Id<"inboxIssues">) => Promise<void>;
  onSnoozeIssue: (issueId: Id<"inboxIssues">, until: number) => Promise<void>;
  onToggleSelect: (id: Id<"inboxIssues">) => void;
  onUnsnoozeIssue: (issueId: Id<"inboxIssues">) => Promise<void>;
}) {
  const config = STATUS_CONFIG[item.status];
  const StatusIcon = config.icon;
  const isOpen = isTriageable(item);

  return (
    <Card padding="sm" hoverable data-testid={TEST_IDS.PROJECT_INBOX.ROW}>
      <Flex align="start" gap="md">
        {isOpen ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(item._id)}
            aria-label={`Select ${item.issue.title}`}
          />
        ) : null}

        <div className={cn(getCardRecipeClassName(config.recipe), "size-8 shrink-0")}>
          <Flex align="center" justify="center" className="h-full">
            <Icon icon={StatusIcon} size="sm" />
          </Flex>
        </div>

        <FlexItem flex="1" className="min-w-0">
          <Stack gap="xs">
            <Flex align="center" gap="sm" wrap>
              <Typography variant="label" className="text-ui-text-secondary">
                {item.issue.key}
              </Typography>
              <Typography className="truncate">{item.issue.title}</Typography>
              <Badge variant="outline" size="sm">
                {config.label}
              </Badge>
            </Flex>

            <Typography variant="caption" color="tertiary">
              {formatRelativeMeta(item)}
            </Typography>

            <Flex align="center" gap="sm" wrap>
              {item.status === "snoozed" && item.snoozedUntil ? (
                <Badge variant="outline" size="sm">
                  Until {formatCompactDate(item.snoozedUntil)}
                </Badge>
              ) : null}

              {item.status === "duplicate" && item.duplicateOfIssue ? (
                <Badge variant="outline" size="sm">
                  Duplicate of {item.duplicateOfIssue.key}
                </Badge>
              ) : null}

              {item.status === "declined" && item.declineReason ? (
                <Badge variant="outline" size="sm">
                  {item.declineReason}
                </Badge>
              ) : null}

              {item.source === "email" ? (
                <Badge variant="outline" size="sm">
                  <Icon icon={Mail} size="sm" />
                  Email intake
                </Badge>
              ) : null}

              {item.triageNotes ? (
                <Typography variant="caption" color="tertiary">
                  Notes: {item.triageNotes}
                </Typography>
              ) : null}
            </Flex>
          </Stack>
        </FlexItem>

        <Flex align="center" gap="xs" justify="end" wrap>
          {isOpen ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void onAcceptIssue(item._id)}
                leftIcon={<Icon icon={CheckCircle2} size="sm" />}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenDecline(item)}
                leftIcon={<Icon icon={XCircle} size="sm" />}
              >
                Decline
              </Button>
              {item.status === "snoozed" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void onUnsnoozeIssue(item._id)}
                  leftIcon={<Icon icon={RotateCcw} size="sm" />}
                >
                  Unsnooze
                </Button>
              ) : (
                <SnoozeDropdownButton
                  label="Snooze"
                  onPreset={(until) => void onSnoozeIssue(item._id, until)}
                  onCustomDate={() => onOpenCustomSnooze(item)}
                />
              )}
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void onReopenIssue(item._id)}
              leftIcon={<Icon icon={RotateCcw} size="sm" />}
            >
              Reopen
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="iconSm"
                variant="ghost"
                aria-label={`More actions for ${item.issue.key}`}
                leftIcon={<Icon icon={MoreHorizontal} size="sm" />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOpen ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => onOpenDuplicate(item)}
                    icon={<Icon icon={Copy} size="sm" />}
                  >
                    Mark duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}

              <DropdownMenuItem
                onSelect={() => void onRemoveIssue(item._id)}
                variant="danger"
                icon={<Icon icon={Trash2} size="sm" />}
              >
                Remove from inbox
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Flex>
    </Card>
  );
}

function InboxDialogs({
  dialogs,
  projectId,
}: {
  dialogs: ReturnType<typeof useInboxDialogState>;
  projectId: Id<"projects">;
}) {
  return (
    <>
      <DeclineDialog
        open={
          dialogs.actionTarget?.kind === "declineOne" ||
          dialogs.actionTarget?.kind === "declineMany"
        }
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeDialog();
          }
        }}
        title={
          dialogs.actionTarget?.kind === "declineMany" ? "Decline selected issues" : "Decline issue"
        }
        description={
          dialogs.actionTarget?.kind === "declineMany"
            ? `Add context for why ${dialogs.actionTarget.label.toLowerCase()} should stay out of the backlog.`
            : dialogs.actionTarget?.kind === "declineOne"
              ? `Add context for why "${dialogs.actionTarget.issueTitle}" should stay out of the backlog.`
              : ""
        }
        onConfirm={dialogs.handleDeclineConfirm}
      />

      <CustomSnoozeDialog
        open={
          dialogs.actionTarget?.kind === "customSnoozeOne" ||
          dialogs.actionTarget?.kind === "customSnoozeMany"
        }
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeDialog();
          }
        }}
        title={
          dialogs.actionTarget?.kind === "customSnoozeMany"
            ? "Snooze selected issues"
            : "Snooze issue"
        }
        description={
          dialogs.actionTarget?.kind === "customSnoozeMany"
            ? `Hide ${dialogs.actionTarget.label.toLowerCase()} until the selected date.`
            : dialogs.actionTarget?.kind === "customSnoozeOne"
              ? `Hide "${dialogs.actionTarget.issueTitle}" until the selected date.`
              : ""
        }
        onConfirm={dialogs.handleCustomSnoozeConfirm}
      />

      {dialogs.actionTarget?.kind === "markDuplicate" ? (
        <DuplicateIssueDialog
          issueTitle={dialogs.actionTarget.issueTitle}
          onConfirm={dialogs.handleDuplicateConfirm}
          onOpenChange={(open) => {
            if (!open) {
              dialogs.closeDialog();
            }
          }}
          open
          projectId={projectId}
          sourceIssueId={dialogs.actionTarget.sourceIssueId}
        />
      ) : null}
    </>
  );
}

export function InboxList({ projectId }: InboxListProps) {
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const selection = useInboxSelection();
  const actions = useInboxTriageActions(projectId);
  const dialogs = useInboxDialogState({ actions, selection });
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const inboxIssues = useAuthenticatedQuery(api.inbox.list, { projectId, tab: activeTab });
  const counts = useAuthenticatedQuery(api.inbox.getCounts, { projectId });
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredIssues =
    inboxIssues === undefined ? undefined : filterInboxIssues(inboxIssues, normalizedQuery);
  const openEmptyState = getInboxEmptyStateConfig({
    counterpartCount: counts?.closed ?? 0,
    searchActive: normalizedQuery.length > 0,
    tab: "open",
  });
  const closedEmptyState = getInboxEmptyStateConfig({
    counterpartCount: counts?.open ?? 0,
    searchActive: normalizedQuery.length > 0,
    tab: "closed",
  });

  useEffect(() => {
    const requestedState = window.sessionStorage.getItem(
      PROJECT_INBOX_E2E_STATE_STORAGE_KEY,
    ) as ProjectInboxE2EState | null;

    if (requestedState !== "closed-tab" || activeTab === "closed" || dialogs.actionTarget) {
      return;
    }

    setActiveTab("closed");
    selection.clear();
    setSearchQuery("");
    window.sessionStorage.removeItem(PROJECT_INBOX_E2E_STATE_STORAGE_KEY);
  }, [activeTab, dialogs.actionTarget, selection]);

  useEffect(() => {
    if (activeTab !== "open" || dialogs.actionTarget || !filteredIssues) {
      return;
    }

    const requestedState = window.sessionStorage.getItem(
      PROJECT_INBOX_E2E_STATE_STORAGE_KEY,
    ) as ProjectInboxE2EState | null;
    const firstOpenIssue = filteredIssues.find(isTriageable);

    if (!requestedState || !firstOpenIssue) {
      return;
    }

    if (requestedState === "decline-dialog") {
      dialogs.openDialog({
        issueId: firstOpenIssue._id,
        issueTitle: firstOpenIssue.issue.title,
        kind: "declineOne",
      });
    }

    if (requestedState === "duplicate-dialog") {
      dialogs.openDialog({
        issueId: firstOpenIssue._id,
        issueTitle: firstOpenIssue.issue.title,
        kind: "markDuplicate",
        sourceIssueId: firstOpenIssue.issueId,
      });
    }

    window.sessionStorage.removeItem(PROJECT_INBOX_E2E_STATE_STORAGE_KEY);
  }, [activeTab, dialogs.actionTarget, dialogs.openDialog, filteredIssues]);

  if (inboxIssues === undefined || counts === undefined || !filteredIssues) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  const selectedIssueIds = filteredIssues
    .filter((item) => isTriageable(item) && selection.selectedIds.has(item._id))
    .map((item) => item._id);
  const selectedVisibleCount = selectedIssueIds.length;
  const triageableCount = filteredIssues.filter(isTriageable).length;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "open" | "closed");
    selection.clear();
    setSearchQuery("");
    dialogs.closeDialog();
  };

  const handleSearchChange = (value: string) => {
    selection.clear();
    dialogs.closeDialog();
    setSearchQuery(value);
  };

  return (
    <>
      <Card
        variant="flat"
        padding="md"
        className="h-full"
        data-testid={TEST_IDS.PROJECT_INBOX.CONTENT}
      >
        <Stack gap="md">
          <Flex align="start" justify="between" gap="md" wrap>
            <Stack gap="xs">
              <Typography variant="h3">Inbox</Typography>
              <Typography variant="small" color="secondary">
                Triage incoming issues before they land in the backlog.
              </Typography>
            </Stack>
            {counts.open > 0 ? <Badge variant="secondary">{counts.open} to review</Badge> : null}
          </Flex>

          <Input
            data-testid={TEST_IDS.PROJECT_INBOX.SEARCH_INPUT}
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            variant="search"
            aria-label="Search inbox issues"
          />

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="open">
                Open
                {counts.open > 0 ? (
                  <Badge variant="secondary" className="ml-2">
                    {counts.open}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="closed" data-testid={TEST_IDS.PROJECT_INBOX.CLOSED_TAB}>
                Closed
                {counts.closed > 0 ? (
                  <Badge variant="outline" className="ml-2">
                    {counts.closed}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            {activeTab === "open" && triageableCount > 0 ? (
              <InboxBulkActionsBar
                filteredIssues={filteredIssues}
                onAcceptSelected={async () => {
                  const success = await actions.acceptIssues(selectedIssueIds);
                  if (success) {
                    selection.clear();
                  }
                }}
                onOpenCustomSnooze={() =>
                  dialogs.openDialog({
                    issueIds: selectedIssueIds,
                    kind: "customSnoozeMany",
                    label: `${selectedIssueIds.length} selected issues`,
                  })
                }
                onOpenDeclineSelected={() =>
                  dialogs.openDialog({
                    issueIds: selectedIssueIds,
                    kind: "declineMany",
                    label: `${selectedIssueIds.length} selected issues`,
                  })
                }
                onSnoozeSelected={async (until) => {
                  const success = await actions.snoozeIssues(selectedIssueIds, until);
                  if (success) {
                    selection.clear();
                  }
                }}
                selectedCount={selectedVisibleCount}
                selection={selection}
                triageableCount={triageableCount}
              />
            ) : null}

            <TabsContent value="open" className="overflow-auto">
              <InboxTabContent
                emptyState={openEmptyState}
                items={filteredIssues}
                selectedIds={selection.selectedIds}
                testId={TEST_IDS.PROJECT_INBOX.OPEN_EMPTY_STATE}
                onAcceptIssue={async (issueId) => {
                  await actions.acceptIssues([issueId]);
                }}
                onEmptyAction={() => {
                  if (openEmptyState.actionKind === "clearSearch") {
                    handleSearchChange("");
                    return;
                  }

                  if (openEmptyState.actionKind === "switchToClosed") {
                    handleTabChange("closed");
                  }
                }}
                onOpenDecline={(issue) =>
                  dialogs.openDialog({
                    issueId: issue._id,
                    issueTitle: issue.issue.title,
                    kind: "declineOne",
                  })
                }
                onOpenDuplicate={(issue) =>
                  dialogs.openDialog({
                    issueId: issue._id,
                    issueTitle: issue.issue.title,
                    kind: "markDuplicate",
                    sourceIssueId: issue.issueId,
                  })
                }
                onOpenCustomSnooze={(issue) =>
                  dialogs.openDialog({
                    issueId: issue._id,
                    issueTitle: issue.issue.title,
                    kind: "customSnoozeOne",
                  })
                }
                onRemoveIssue={async (issueId) => {
                  await actions.removeIssue(issueId);
                }}
                onReopenIssue={async (issueId) => {
                  await actions.reopenIssue(issueId);
                }}
                onSnoozeIssue={async (issueId, until) => {
                  await actions.snoozeIssues([issueId], until);
                }}
                onToggleSelect={selection.toggle}
                onUnsnoozeIssue={async (issueId) => {
                  await actions.unsnoozeIssue(issueId);
                }}
              />
            </TabsContent>

            <TabsContent value="closed" className="overflow-auto">
              <InboxTabContent
                emptyState={closedEmptyState}
                items={filteredIssues}
                selectedIds={selection.selectedIds}
                testId={TEST_IDS.PROJECT_INBOX.CLOSED_EMPTY_STATE}
                onAcceptIssue={async (issueId) => {
                  await actions.acceptIssues([issueId]);
                }}
                onEmptyAction={() => {
                  if (closedEmptyState.actionKind === "clearSearch") {
                    handleSearchChange("");
                    return;
                  }

                  if (closedEmptyState.actionKind === "switchToOpen") {
                    handleTabChange("open");
                  }
                }}
                onOpenDecline={(issue) =>
                  dialogs.openDialog({
                    issueId: issue._id,
                    issueTitle: issue.issue.title,
                    kind: "declineOne",
                  })
                }
                onOpenDuplicate={(issue) =>
                  dialogs.openDialog({
                    issueId: issue._id,
                    issueTitle: issue.issue.title,
                    kind: "markDuplicate",
                    sourceIssueId: issue.issueId,
                  })
                }
                onOpenCustomSnooze={(issue) =>
                  dialogs.openDialog({
                    issueId: issue._id,
                    issueTitle: issue.issue.title,
                    kind: "customSnoozeOne",
                  })
                }
                onRemoveIssue={async (issueId) => {
                  await actions.removeIssue(issueId);
                }}
                onReopenIssue={async (issueId) => {
                  await actions.reopenIssue(issueId);
                }}
                onSnoozeIssue={async (issueId, until) => {
                  await actions.snoozeIssues([issueId], until);
                }}
                onToggleSelect={selection.toggle}
                onUnsnoozeIssue={async (issueId) => {
                  await actions.unsnoozeIssue(issueId);
                }}
              />
            </TabsContent>
          </Tabs>
        </Stack>
      </Card>

      <InboxDialogs dialogs={dialogs} projectId={projectId} />
    </>
  );
}
