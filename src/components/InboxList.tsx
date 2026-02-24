/**
 * InboxList Component
 *
 * Displays issues in the inbox awaiting triage.
 * Supports filtering by status (pending, snoozed, accepted, declined, duplicate)
 * and provides actions to accept, decline, snooze, or mark as duplicate.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { DAY, WEEK } from "@convex/lib/timeUtils";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Inbox,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Checkbox } from "./ui/Checkbox";
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
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Stack } from "./ui/Stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface InboxListProps {
  projectId: Id<"projects">;
}

type InboxIssueStatus = "pending" | "accepted" | "declined" | "snoozed" | "duplicate";

interface InboxIssueWithDetails {
  _id: Id<"inboxIssues">;
  projectId: Id<"projects">;
  issueId: Id<"issues">;
  status: InboxIssueStatus;
  snoozedUntil?: number;
  duplicateOfId?: Id<"issues">;
  declineReason?: string;
  triageNotes?: string;
  createdAt: number;
  updatedAt: number;
  issue: Doc<"issues">;
  createdByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  triagedByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  duplicateOfIssue: { _id: Id<"issues">; key: string; title: string } | null;
}

// =============================================================================
// Status Config
// =============================================================================

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: AlertTriangle,
    color: "bg-status-warning/10 text-status-warning",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    color: "bg-status-success/10 text-status-success",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    color: "bg-status-error/10 text-status-error",
  },
  snoozed: {
    label: "Snoozed",
    icon: Clock,
    color: "bg-ui-bg-tertiary text-ui-text-secondary",
  },
  duplicate: {
    label: "Duplicate",
    icon: Copy,
    color: "bg-ui-bg-tertiary text-ui-text-secondary",
  },
} as const;

// =============================================================================
// Main Component
// =============================================================================

export function InboxList({ projectId }: InboxListProps) {
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [selectedIds, setSelectedIds] = useState<Set<Id<"inboxIssues">>>(new Set());

  const inboxIssues = useQuery(api.inbox.list, {
    projectId,
    tab: activeTab,
  });

  const counts = useQuery(api.inbox.getCounts, { projectId });

  // Bulk mutations
  const bulkAccept = useMutation(api.inbox.bulkAccept);
  const bulkDecline = useMutation(api.inbox.bulkDecline);
  const bulkSnooze = useMutation(api.inbox.bulkSnooze);

  // Clear selection when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "open" | "closed");
    setSelectedIds(new Set());
  };

  // Toggle selection for an item
  const handleToggleSelect = (id: Id<"inboxIssues">) => {
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

  // Select all items
  const handleSelectAll = () => {
    if (!inboxIssues) return;
    const triageable = inboxIssues.filter(
      (item) => item.status === "pending" || item.status === "snoozed",
    );
    setSelectedIds(new Set(triageable.map((item) => item._id)));
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk accept
  const handleBulkAccept = async () => {
    try {
      const ids = Array.from(selectedIds);
      const result = await bulkAccept({ inboxIssueIds: ids, projectId });
      showSuccess(`Accepted ${result.accepted} issue(s)`);
      setSelectedIds(new Set());
    } catch (error) {
      showError(error, "Failed to accept issues");
    }
  };

  // Bulk decline
  const handleBulkDecline = async () => {
    try {
      const ids = Array.from(selectedIds);
      const result = await bulkDecline({ inboxIssueIds: ids, projectId });
      showSuccess(`Declined ${result.declined} issue(s)`);
      setSelectedIds(new Set());
    } catch (error) {
      showError(error, "Failed to decline issues");
    }
  };

  // Bulk snooze (1 week)
  const handleBulkSnooze = async () => {
    try {
      const ids = Array.from(selectedIds);
      const oneWeekFromNow = Date.now() + WEEK;
      const result = await bulkSnooze({ inboxIssueIds: ids, projectId, until: oneWeekFromNow });
      showSuccess(`Snoozed ${result.snoozed} issue(s) for 1 week`);
      setSelectedIds(new Set());
    } catch (error) {
      showError(error, "Failed to snooze issues");
    }
  };

  if (inboxIssues === undefined || counts === undefined) {
    return (
      <Flex align="center" justify="center" className="h-64">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  const triageableCount = inboxIssues.filter(
    (item) => item.status === "pending" || item.status === "snoozed",
  ).length;

  return (
    <Card variant="flat" padding="md" className="h-full">
      <Stack gap="md">
        <Flex align="center" justify="between">
          <Typography variant="h3">Inbox</Typography>
          {counts.open > 0 && <Badge variant="secondary">{counts.open} to review</Badge>}
        </Flex>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="open">
              Open
              {counts.open > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {counts.open}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed
              {counts.closed > 0 && (
                <Badge variant="outline" className="ml-2">
                  {counts.closed}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Bulk Actions Bar */}
          {activeTab === "open" && triageableCount > 0 && (
            <Card variant="soft" padding="sm">
              <Flex align="center" gap="md">
                <Checkbox
                  checked={selectedIds.size === triageableCount && triageableCount > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleSelectAll();
                    } else {
                      handleClearSelection();
                    }
                  }}
                />
                {selectedIds.size > 0 ? (
                  <>
                    <Typography variant="small" color="secondary">
                      {selectedIds.size} selected
                    </Typography>
                    <FlexItem grow />
                    <Button variant="secondary" size="sm" onClick={handleBulkAccept}>
                      Accept All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBulkSnooze}>
                      Snooze 1 Week
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleBulkDecline}>
                      Decline All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                      Clear
                    </Button>
                  </>
                ) : (
                  <Typography variant="small" color="tertiary">
                    Select items for bulk actions
                  </Typography>
                )}
              </Flex>
            </Card>
          )}

          <TabsContent value="open" className="flex-1 overflow-auto">
            {inboxIssues.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No pending items"
                description="All inbox issues have been triaged. New submissions will appear here."
              />
            ) : (
              <InboxIssueList
                items={inboxIssues}
                projectId={projectId}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            )}
          </TabsContent>

          <TabsContent value="closed" className="flex-1 overflow-auto">
            {inboxIssues.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No closed items"
                description="Accepted, declined, and duplicate issues will appear here."
              />
            ) : (
              <InboxIssueList
                items={inboxIssues}
                projectId={projectId}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            )}
          </TabsContent>
        </Tabs>
      </Stack>
    </Card>
  );
}

// =============================================================================
// Issue List
// =============================================================================

function InboxIssueList({
  items,
  projectId,
  selectedIds,
  onToggleSelect,
}: {
  items: InboxIssueWithDetails[];
  projectId: Id<"projects">;
  selectedIds: Set<Id<"inboxIssues">>;
  onToggleSelect: (id: Id<"inboxIssues">) => void;
}) {
  return (
    <Stack gap="sm">
      {items.map((item) => (
        <InboxIssueRow
          key={item._id}
          item={item}
          projectId={projectId}
          isSelected={selectedIds.has(item._id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </Stack>
  );
}

// =============================================================================
// Issue Row
// =============================================================================

function InboxIssueRow({
  item,
  projectId,
  isSelected,
  onToggleSelect,
}: {
  item: InboxIssueWithDetails;
  projectId: Id<"projects">;
  isSelected: boolean;
  onToggleSelect: (id: Id<"inboxIssues">) => void;
}) {
  const accept = useMutation(api.inbox.accept);
  const decline = useMutation(api.inbox.decline);
  const snooze = useMutation(api.inbox.snooze);
  const unsnooze = useMutation(api.inbox.unsnooze);
  const reopen = useMutation(api.inbox.reopen);
  const remove = useMutation(api.inbox.remove);

  const config = STATUS_CONFIG[item.status];
  const StatusIcon = config.icon;

  const handleAccept = async () => {
    try {
      await accept({ id: item._id, projectId });
      showSuccess("Issue accepted");
    } catch (error) {
      showError(error, "Failed to accept issue");
    }
  };

  const handleDecline = async () => {
    try {
      await decline({ id: item._id, projectId });
      showSuccess("Issue declined");
    } catch (error) {
      showError(error, "Failed to decline issue");
    }
  };

  const handleSnooze = async () => {
    // Snooze for 1 day by default
    const until = Date.now() + DAY;
    try {
      await snooze({ id: item._id, projectId, until });
      showSuccess("Issue snoozed for 1 day");
    } catch (error) {
      showError(error, "Failed to snooze issue");
    }
  };

  const handleUnsnooze = async () => {
    try {
      await unsnooze({ id: item._id, projectId });
      showSuccess("Issue unsnoozed");
    } catch (error) {
      showError(error, "Failed to unsnooze issue");
    }
  };

  const handleReopen = async () => {
    try {
      await reopen({ id: item._id, projectId });
      showSuccess("Issue reopened");
    } catch (error) {
      showError(error, "Failed to reopen issue");
    }
  };

  const handleDelete = async () => {
    try {
      await remove({ id: item._id, projectId });
      showSuccess("Issue removed from inbox");
    } catch (error) {
      showError(error, "Failed to remove issue");
    }
  };

  const isOpen = item.status === "pending" || item.status === "snoozed";

  return (
    <Card padding="sm" hoverable className={cn(item.status === "snoozed" && "opacity-75")}>
      <Flex align="center" gap="md">
        {/* Selection Checkbox (only for triageable items) */}
        {isOpen && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(item._id)}
            aria-label={`Select ${item.issue.title}`}
          />
        )}

        {/* Status Badge */}
        <Flex align="center" justify="center" className={cn("size-7 rounded", config.color)}>
          <Icon icon={StatusIcon} size="sm" />
        </Flex>

        {/* Issue Info */}
        <FlexItem flex="1" className="min-w-0">
          <Flex direction="column" gap="xs">
            <Flex align="center" gap="sm">
              <Typography variant="label" className="text-ui-text-secondary">
                {item.issue.key}
              </Typography>
              <Typography className="truncate">{item.issue.title}</Typography>
            </Flex>

            <Flex align="center" gap="sm">
              <Typography variant="caption" color="tertiary">
                Submitted {new Date(item.createdAt).toLocaleDateString()}
                {item.createdByUser?.name && ` by ${item.createdByUser.name}`}
              </Typography>

              {item.status === "snoozed" && item.snoozedUntil && (
                <Badge variant="outline" size="sm">
                  Until {new Date(item.snoozedUntil).toLocaleDateString()}
                </Badge>
              )}

              {item.status === "duplicate" && item.duplicateOfIssue && (
                <Badge variant="outline" size="sm">
                  Duplicate of {item.duplicateOfIssue.key}
                </Badge>
              )}

              {item.status === "declined" && item.declineReason && (
                <Badge variant="outline" size="sm">
                  {item.declineReason}
                </Badge>
              )}
            </Flex>
          </Flex>
        </FlexItem>

        {/* Quick Actions */}
        {isOpen && (
          <Flex gap="xs">
            <Button size="sm" variant="ghost" onClick={handleAccept}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDecline}>
              <XCircle className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </Flex>
        )}

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" aria-label="More actions">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOpen && (
              <>
                {item.status === "snoozed" ? (
                  <DropdownMenuItem onClick={handleUnsnooze}>
                    <Clock className="w-4 h-4 mr-2" />
                    Unsnooze
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleSnooze}>
                    <Clock className="w-4 h-4 mr-2" />
                    Snooze 1 day
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            {!isOpen && (
              <>
                <DropdownMenuItem onClick={handleReopen}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Reopen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onClick={handleDelete} className="text-status-error">
              Remove from inbox
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Flex>
    </Card>
  );
}
