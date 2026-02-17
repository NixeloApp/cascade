import type { Meta, StoryObj } from "@storybook/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Inbox,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
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
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { Typography } from "./ui/Typography";

// ============================================================================
// Types
// ============================================================================

type InboxIssueStatus = "pending" | "accepted" | "declined" | "snoozed" | "duplicate";

interface InboxIssueWithDetails {
  _id: string;
  projectId: string;
  issueId: string;
  status: InboxIssueStatus;
  snoozedUntil?: number;
  duplicateOfId?: string;
  declineReason?: string;
  triageNotes?: string;
  createdAt: number;
  updatedAt: number;
  issue: {
    key: string;
    title: string;
  };
  createdByUser: { _id: string; name?: string; image?: string } | null;
  triagedByUser: { _id: string; name?: string; image?: string } | null;
  duplicateOfIssue: { _id: string; key: string; title: string } | null;
}

// ============================================================================
// Status Config
// ============================================================================

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

// ============================================================================
// Mock Data
// ============================================================================

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const mockPendingIssues: InboxIssueWithDetails[] = [
  {
    _id: "inbox-1",
    projectId: "project-1",
    issueId: "issue-1",
    status: "pending",
    createdAt: now - 2 * day,
    updatedAt: now - 2 * day,
    issue: { key: "PROJ-101", title: "Login page is not responsive on mobile devices" },
    createdByUser: { _id: "user-1", name: "Alice Chen" },
    triagedByUser: null,
    duplicateOfIssue: null,
  },
  {
    _id: "inbox-2",
    projectId: "project-1",
    issueId: "issue-2",
    status: "pending",
    createdAt: now - 1 * day,
    updatedAt: now - 1 * day,
    issue: { key: "PROJ-102", title: "Add dark mode support to settings page" },
    createdByUser: { _id: "user-2", name: "Bob Smith" },
    triagedByUser: null,
    duplicateOfIssue: null,
  },
  {
    _id: "inbox-3",
    projectId: "project-1",
    issueId: "issue-3",
    status: "snoozed",
    snoozedUntil: now + 3 * day,
    createdAt: now - 5 * day,
    updatedAt: now - 1 * day,
    issue: { key: "PROJ-103", title: "Performance optimization for dashboard" },
    createdByUser: { _id: "user-3", name: "Carol Davis" },
    triagedByUser: null,
    duplicateOfIssue: null,
  },
];

const mockClosedIssues: InboxIssueWithDetails[] = [
  {
    _id: "inbox-4",
    projectId: "project-1",
    issueId: "issue-4",
    status: "accepted",
    createdAt: now - 7 * day,
    updatedAt: now - 3 * day,
    issue: { key: "PROJ-100", title: "Fix navigation bar alignment" },
    createdByUser: { _id: "user-1", name: "Alice Chen" },
    triagedByUser: { _id: "user-4", name: "David Wilson" },
    duplicateOfIssue: null,
  },
  {
    _id: "inbox-5",
    projectId: "project-1",
    issueId: "issue-5",
    status: "declined",
    declineReason: "Out of scope",
    createdAt: now - 10 * day,
    updatedAt: now - 5 * day,
    issue: { key: "PROJ-099", title: "Add animation to every button" },
    createdByUser: { _id: "user-2", name: "Bob Smith" },
    triagedByUser: { _id: "user-4", name: "David Wilson" },
    duplicateOfIssue: null,
  },
  {
    _id: "inbox-6",
    projectId: "project-1",
    issueId: "issue-6",
    status: "duplicate",
    createdAt: now - 8 * day,
    updatedAt: now - 4 * day,
    issue: { key: "PROJ-098", title: "Login page responsive issue" },
    createdByUser: { _id: "user-3", name: "Carol Davis" },
    triagedByUser: { _id: "user-4", name: "David Wilson" },
    duplicateOfIssue: {
      _id: "issue-1",
      key: "PROJ-101",
      title: "Login page is not responsive on mobile devices",
    },
  },
];

// ============================================================================
// Presentational Components
// ============================================================================

function InboxIssueRow({
  item,
  isSelected,
  onToggleSelect,
  onAccept,
  onDecline,
  onSnooze,
  onUnsnooze,
  onReopen,
  onRemove,
}: {
  item: InboxIssueWithDetails;
  isSelected: boolean;
  onToggleSelect: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onSnooze: () => void;
  onUnsnooze: () => void;
  onReopen: () => void;
  onRemove: () => void;
}) {
  const config = STATUS_CONFIG[item.status];
  const StatusIcon = config.icon;
  const isOpen = item.status === "pending" || item.status === "snoozed";

  return (
    <Flex
      align="center"
      gap="md"
      className={cn(
        "p-3 rounded-lg border border-ui-border bg-ui-bg hover:bg-ui-bg-hover transition-colors",
        item.status === "snoozed" && "opacity-75",
      )}
    >
      {/* Selection Checkbox (only for triageable items) */}
      {isOpen && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect()}
          aria-label={`Select ${item.issue.title}`}
        />
      )}

      {/* Status Badge */}
      <div className={cn("p-1.5 rounded", config.color)}>
        <StatusIcon className="w-4 h-4" />
      </div>

      {/* Issue Info */}
      <FlexItem flex="1" className="min-w-0">
        <Flex direction="column" gap="xs">
          <Flex align="center" gap="sm">
            <Typography variant="label" className="text-ui-text-secondary">
              {item.issue.key}
            </Typography>
            <Typography className="truncate">{item.issue.title}</Typography>
          </Flex>

          <Flex align="center" gap="sm" className="text-xs text-ui-text-tertiary">
            <span>
              Submitted {new Date(item.createdAt).toLocaleDateString()}
              {item.createdByUser?.name && ` by ${item.createdByUser.name}`}
            </span>

            {item.status === "snoozed" && item.snoozedUntil && (
              <Badge variant="outline" className="text-xs">
                Until {new Date(item.snoozedUntil).toLocaleDateString()}
              </Badge>
            )}

            {item.status === "duplicate" && item.duplicateOfIssue && (
              <Badge variant="outline" className="text-xs">
                Duplicate of {item.duplicateOfIssue.key}
              </Badge>
            )}

            {item.status === "declined" && item.declineReason && (
              <Badge variant="outline" className="text-xs">
                {item.declineReason}
              </Badge>
            )}
          </Flex>
        </Flex>
      </FlexItem>

      {/* Quick Actions */}
      {isOpen && (
        <Flex gap="xs">
          <Button size="sm" variant="ghost" onClick={onAccept}>
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={onDecline}>
            <XCircle className="w-4 h-4 mr-1" />
            Decline
          </Button>
        </Flex>
      )}

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOpen && (
            <>
              {item.status === "snoozed" ? (
                <DropdownMenuItem onClick={onUnsnooze}>
                  <Clock className="w-4 h-4 mr-2" />
                  Unsnooze
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onSnooze}>
                  <Clock className="w-4 h-4 mr-2" />
                  Snooze 1 day
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {!isOpen && (
            <>
              <DropdownMenuItem onClick={onReopen}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Reopen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={onRemove} className="text-status-error">
            Remove from inbox
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  );
}

interface InboxListPresentationalProps {
  openIssues: InboxIssueWithDetails[] | undefined;
  closedIssues: InboxIssueWithDetails[] | undefined;
  openCount: number;
  closedCount: number;
}

function InboxListPresentational({
  openIssues,
  closedIssues,
  openCount,
  closedCount,
}: InboxListPresentationalProps) {
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const currentIssues = activeTab === "open" ? openIssues : closedIssues;

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as "open" | "closed");
    setSelectedIds(new Set());
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!openIssues) return;
    const triageable = openIssues.filter(
      (item) => item.status === "pending" || item.status === "snoozed",
    );
    setSelectedIds(new Set(triageable.map((item) => item._id)));
  }, [openIssues]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Stub handlers for story
  const noOp = () => {};

  if (currentIssues === undefined) {
    return (
      <Flex align="center" justify="center" className="h-64">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  const triageableCount =
    activeTab === "open" && openIssues
      ? openIssues.filter((item) => item.status === "pending" || item.status === "snoozed").length
      : 0;

  return (
    <Flex direction="column" className="h-full p-4">
      <Flex align="center" justify="between" className="mb-4">
        <Typography variant="h3">Inbox</Typography>
        {openCount > 0 && <Badge variant="secondary">{openCount} to review</Badge>}
      </Flex>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="open">
            Open
            {openCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {openCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed
            {closedCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {closedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Bulk Actions Bar */}
        {activeTab === "open" && triageableCount > 0 && (
          <Flex align="center" gap="md" className="mb-4 p-2 bg-ui-bg-secondary rounded-container">
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
                <Typography variant="small" className="text-ui-text-secondary">
                  {selectedIds.size} selected
                </Typography>
                <FlexItem grow />
                <Button variant="secondary" size="sm" onClick={noOp}>
                  Accept All
                </Button>
                <Button variant="outline" size="sm" onClick={noOp}>
                  Snooze 1 Week
                </Button>
                <Button variant="danger" size="sm" onClick={noOp}>
                  Decline All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                  Clear
                </Button>
              </>
            ) : (
              <Typography variant="small" className="text-ui-text-tertiary">
                Select items for bulk actions
              </Typography>
            )}
          </Flex>
        )}

        <TabsContent value="open" className="flex-1 overflow-auto">
          {currentIssues.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No pending items"
              description="All inbox issues have been triaged. New submissions will appear here."
            />
          ) : (
            <Flex direction="column" gap="sm">
              {currentIssues.map((item) => (
                <InboxIssueRow
                  key={item._id}
                  item={item}
                  isSelected={selectedIds.has(item._id)}
                  onToggleSelect={() => handleToggleSelect(item._id)}
                  onAccept={noOp}
                  onDecline={noOp}
                  onSnooze={noOp}
                  onUnsnooze={noOp}
                  onReopen={noOp}
                  onRemove={noOp}
                />
              ))}
            </Flex>
          )}
        </TabsContent>

        <TabsContent value="closed" className="flex-1 overflow-auto">
          {currentIssues.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No closed items"
              description="Accepted, declined, and duplicate issues will appear here."
            />
          ) : (
            <Flex direction="column" gap="sm">
              {currentIssues.map((item) => (
                <InboxIssueRow
                  key={item._id}
                  item={item}
                  isSelected={selectedIds.has(item._id)}
                  onToggleSelect={() => handleToggleSelect(item._id)}
                  onAccept={noOp}
                  onDecline={noOp}
                  onSnooze={noOp}
                  onUnsnooze={noOp}
                  onReopen={noOp}
                  onRemove={noOp}
                />
              ))}
            </Flex>
          )}
        </TabsContent>
      </Tabs>
    </Flex>
  );
}

// ============================================================================
// Storybook Meta
// ============================================================================

const meta: Meta<typeof InboxListPresentational> = {
  title: "Components/InboxList",
  component: InboxListPresentational,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-4xl border border-ui-border rounded-lg bg-ui-bg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    openIssues: mockPendingIssues,
    closedIssues: mockClosedIssues,
    openCount: mockPendingIssues.length,
    closedCount: mockClosedIssues.length,
  },
  parameters: {
    docs: {
      description: {
        story: "Default inbox view with pending items to triage.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    openIssues: undefined,
    closedIssues: undefined,
    openCount: 0,
    closedCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Loading state while fetching inbox items.",
      },
    },
  },
};

export const EmptyInbox: Story = {
  args: {
    openIssues: [],
    closedIssues: [],
    openCount: 0,
    closedCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Empty inbox with no items to triage.",
      },
    },
  },
};

export const OnlyPendingItems: Story = {
  args: {
    openIssues: mockPendingIssues.filter((i) => i.status === "pending"),
    closedIssues: [],
    openCount: mockPendingIssues.filter((i) => i.status === "pending").length,
    closedCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Inbox with only pending items (no snoozed or closed).",
      },
    },
  },
};

export const OnlyClosedItems: Story = {
  args: {
    openIssues: [],
    closedIssues: mockClosedIssues,
    openCount: 0,
    closedCount: mockClosedIssues.length,
  },
  parameters: {
    docs: {
      description: {
        story: "Inbox with no open items but several closed items.",
      },
    },
  },
};

export const WithSnoozedItems: Story = {
  args: {
    openIssues: [
      ...mockPendingIssues,
      {
        _id: "inbox-7",
        projectId: "project-1",
        issueId: "issue-7",
        status: "snoozed",
        snoozedUntil: now + 7 * day,
        createdAt: now - 10 * day,
        updatedAt: now - 2 * day,
        issue: { key: "PROJ-104", title: "Review accessibility compliance" },
        createdByUser: { _id: "user-1", name: "Alice Chen" },
        triagedByUser: null,
        duplicateOfIssue: null,
      },
    ],
    closedIssues: mockClosedIssues,
    openCount: 4,
    closedCount: mockClosedIssues.length,
  },
  parameters: {
    docs: {
      description: {
        story: "Inbox with snoozed items showing the snooze date badge.",
      },
    },
  },
};

export const ManyItems: Story = {
  args: {
    openIssues: Array.from({ length: 10 }, (_, i) => ({
      _id: `inbox-many-${i}`,
      projectId: "project-1",
      issueId: `issue-many-${i}`,
      status: i % 3 === 0 ? "snoozed" : "pending",
      snoozedUntil: i % 3 === 0 ? now + (i + 1) * day : undefined,
      createdAt: now - (10 - i) * day,
      updatedAt: now - (10 - i) * day,
      issue: {
        key: `PROJ-${200 + i}`,
        title: `Sample issue ${i + 1} that needs triage and review`,
      },
      createdByUser: { _id: `user-${i % 4}`, name: `User ${(i % 4) + 1}` },
      triagedByUser: null,
      duplicateOfIssue: null,
    })) as InboxIssueWithDetails[],
    closedIssues: mockClosedIssues,
    openCount: 10,
    closedCount: mockClosedIssues.length,
  },
  parameters: {
    docs: {
      description: {
        story: "Inbox with many items to show scrolling behavior.",
      },
    },
  },
};
