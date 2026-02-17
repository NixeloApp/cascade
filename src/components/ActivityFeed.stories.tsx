import type { Meta, StoryObj } from "@storybook/react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Ban,
  Clock,
  Eye,
  LinkIcon,
  MessageSquare,
  Pencil,
  Sparkles,
  User,
} from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { EmptyState } from "./ui/EmptyState";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { SkeletonList } from "./ui/Skeleton";
import { Typography } from "./ui/Typography";

// ============================================================================
// Mock Activity Data
// ============================================================================

interface Activity {
  _id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  issueKey?: string;
  userName: string;
  _creationTime: number;
}

const now = Date.now();
const minute = 60 * 1000;
const hour = 60 * minute;
const day = 24 * hour;

const mockActivities: Activity[] = [
  {
    _id: "act1",
    action: "created",
    issueKey: "PROJ-123",
    userName: "Alice Chen",
    _creationTime: now - 5 * minute,
  },
  {
    _id: "act2",
    action: "updated",
    field: "status",
    oldValue: "Todo",
    newValue: "In Progress",
    issueKey: "PROJ-122",
    userName: "Bob Smith",
    _creationTime: now - 15 * minute,
  },
  {
    _id: "act3",
    action: "commented",
    issueKey: "PROJ-121",
    userName: "Carol Davis",
    _creationTime: now - 1 * hour,
  },
  {
    _id: "act4",
    action: "assigned",
    field: "assignee",
    newValue: "David Wilson",
    issueKey: "PROJ-120",
    userName: "Eve Martinez",
    _creationTime: now - 2 * hour,
  },
  {
    _id: "act5",
    action: "linked",
    field: "parent issue",
    issueKey: "PROJ-119",
    userName: "Frank Brown",
    _creationTime: now - 3 * hour,
  },
  {
    _id: "act6",
    action: "updated",
    field: "priority",
    oldValue: "Low",
    newValue: "High",
    issueKey: "PROJ-118",
    userName: "Grace Lee",
    _creationTime: now - 1 * day,
  },
  {
    _id: "act7",
    action: "started_watching",
    issueKey: "PROJ-117",
    userName: "Henry Kim",
    _creationTime: now - 1.5 * day,
  },
  {
    _id: "act8",
    action: "stopped_watching",
    issueKey: "PROJ-116",
    userName: "Ivy Johnson",
    _creationTime: now - 2 * day,
  },
];

// ============================================================================
// Presentational Component (for Storybook - bypasses Convex)
// ============================================================================

interface ActivityFeedPresentationalProps {
  activities: Activity[] | undefined;
  compact?: boolean;
}

function getActionIcon(action: string): LucideIcon {
  switch (action) {
    case "created":
      return Sparkles;
    case "updated":
      return Pencil;
    case "commented":
      return MessageSquare;
    case "assigned":
      return User;
    case "linked":
      return LinkIcon;
    case "unlinked":
      return AlertTriangle;
    case "started_watching":
      return Eye;
    case "stopped_watching":
      return Ban;
    default:
      return Clock;
  }
}

function getActionColorClass(action: string): string {
  switch (action) {
    case "created":
      return "text-status-success";
    case "updated":
      return "text-ui-text";
    case "commented":
      return "text-accent";
    case "assigned":
      return "text-status-warning";
    case "linked":
    case "unlinked":
      return "text-ui-text";
    default:
      return "text-ui-text-secondary";
  }
}

function formatUpdateMessage(
  field: string,
  oldValue: string | undefined,
  newValue: string | undefined,
): string {
  if (field === "status") {
    return `changed status from ${oldValue} to ${newValue}`;
  }
  if (field === "priority") {
    return `changed priority from ${oldValue} to ${newValue}`;
  }
  if (field === "assignee") {
    if (oldValue && newValue) {
      return `reassigned from ${oldValue} to ${newValue}`;
    }
    if (newValue) {
      return `assigned to ${newValue}`;
    }
    return "unassigned";
  }
  return `updated ${field}`;
}

function formatActivityMessage(activity: {
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}) {
  const { action, field, oldValue, newValue } = activity;

  const simpleActions: Record<string, string> = {
    created: "created",
    commented: "commented on",
    started_watching: "started watching",
    stopped_watching: "stopped watching",
  };

  if (simpleActions[action]) {
    return simpleActions[action];
  }

  if (action === "linked") {
    return `linked ${field}`;
  }
  if (action === "unlinked") {
    return `unlinked ${field}`;
  }

  if (action === "updated" && field) {
    return formatUpdateMessage(field, oldValue, newValue);
  }

  return action;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / minute);
  const hours = Math.floor(diff / hour);
  const days = Math.floor(diff / day);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function ActivityFeedPresentational({
  activities,
  compact = false,
}: ActivityFeedPresentationalProps) {
  if (!activities) {
    return <SkeletonList items={5} />;
  }

  if (activities.length === 0) {
    return (
      <div data-testid={TEST_IDS.ACTIVITY.EMPTY_STATE}>
        <EmptyState
          icon={Clock}
          title="No activity yet"
          description="Activity will appear here as work progresses"
        />
      </div>
    );
  }

  return (
    <Flex direction="column" gap="none" className="relative" data-testid={TEST_IDS.ACTIVITY.FEED}>
      {/* Timeline line */}
      {!compact && activities.length > 1 && (
        <div className="absolute left-3 top-6 bottom-6 w-px bg-ui-border" />
      )}

      {activities.map((activity: Activity, index: number) => (
        <Flex
          key={`${activity._id}-${index}`}
          gap="lg"
          className={cn(
            "relative transition-colors duration-150",
            compact
              ? "py-2 hover:bg-ui-bg-secondary/50 rounded-md px-2"
              : "p-4 hover:bg-ui-bg-secondary/30 rounded-lg",
          )}
          data-testid={TEST_IDS.ACTIVITY.ENTRY}
        >
          {/* Timeline icon */}
          <Flex
            align="center"
            justify="center"
            className={cn(
              "shrink-0 relative z-10 bg-ui-bg rounded-full",
              compact ? "w-5 h-5" : "w-6 h-6",
              "text-ui-text-secondary",
            )}
          >
            <Icon icon={getActionIcon(activity.action)} size={compact ? "xs" : "sm"} />
          </Flex>

          {/* Activity content */}
          <FlexItem flex="1" className="min-w-0">
            <Flex align="start" justify="between" gap="sm">
              <FlexItem flex="1" className="min-w-0">
                <Typography variant="p" className={cn(compact ? "text-sm" : "text-base", "m-0")}>
                  <strong>{activity.userName}</strong>{" "}
                  <span className={getActionColorClass(activity.action)}>
                    {formatActivityMessage(activity)}
                  </span>
                  {activity.issueKey && (
                    <code className="ml-1 font-mono text-sm">{activity.issueKey}</code>
                  )}
                </Typography>
                {!compact && activity.field && activity.newValue && (
                  <Typography variant="muted" className="mt-1 truncate text-ui-text-secondary">
                    {activity.field}: {activity.newValue}
                  </Typography>
                )}
              </FlexItem>
              <Typography
                variant="muted"
                className={cn(
                  compact ? "text-xs" : "text-sm",
                  "flex-shrink-0 text-ui-text-tertiary",
                )}
              >
                {formatRelativeTime(activity._creationTime)}
              </Typography>
            </Flex>
          </FlexItem>
        </Flex>
      ))}
    </Flex>
  );
}

// ============================================================================
// Storybook Meta
// ============================================================================

const meta: Meta<typeof ActivityFeedPresentational> = {
  title: "Components/ActivityFeed",
  component: ActivityFeedPresentational,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    activities: {
      control: false,
      description: "Array of activity items to display",
    },
    compact: {
      control: "boolean",
      description: "Whether to use compact mode with smaller spacing",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Stories
// ============================================================================

export const Default: Story = {
  args: {
    activities: mockActivities,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Default activity feed showing various action types with full spacing.",
      },
    },
  },
};

export const Compact: Story = {
  args: {
    activities: mockActivities,
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Compact mode with smaller icons and reduced spacing, suitable for sidebars.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    activities: undefined,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Loading state while fetching activities.",
      },
    },
  },
};

export const Empty: Story = {
  args: {
    activities: [],
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no activities are available.",
      },
    },
  },
};

// ============================================================================
// Action Type Stories
// ============================================================================

export const CreatedActions: Story = {
  args: {
    activities: [
      {
        _id: "act1",
        action: "created",
        issueKey: "PROJ-100",
        userName: "Alice Chen",
        _creationTime: now - 5 * minute,
      },
      {
        _id: "act2",
        action: "created",
        issueKey: "PROJ-101",
        userName: "Bob Smith",
        _creationTime: now - 30 * minute,
      },
    ],
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Activity feed showing only created actions (green sparkle icon).",
      },
    },
  },
};

export const UpdatedActions: Story = {
  args: {
    activities: [
      {
        _id: "act1",
        action: "updated",
        field: "status",
        oldValue: "Todo",
        newValue: "In Progress",
        issueKey: "PROJ-100",
        userName: "Alice Chen",
        _creationTime: now - 5 * minute,
      },
      {
        _id: "act2",
        action: "updated",
        field: "priority",
        oldValue: "Medium",
        newValue: "High",
        issueKey: "PROJ-101",
        userName: "Bob Smith",
        _creationTime: now - 15 * minute,
      },
      {
        _id: "act3",
        action: "updated",
        field: "assignee",
        oldValue: "Carol Davis",
        newValue: "David Wilson",
        issueKey: "PROJ-102",
        userName: "Eve Martinez",
        _creationTime: now - 30 * minute,
      },
    ],
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Activity feed showing update actions with field changes.",
      },
    },
  },
};

export const CommentedActions: Story = {
  args: {
    activities: [
      {
        _id: "act1",
        action: "commented",
        issueKey: "PROJ-100",
        userName: "Alice Chen",
        _creationTime: now - 5 * minute,
      },
      {
        _id: "act2",
        action: "commented",
        issueKey: "PROJ-101",
        userName: "Bob Smith",
        _creationTime: now - 1 * hour,
      },
    ],
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Activity feed showing comment actions (blue accent color).",
      },
    },
  },
};

export const AssignedActions: Story = {
  args: {
    activities: [
      {
        _id: "act1",
        action: "assigned",
        field: "assignee",
        newValue: "David Wilson",
        issueKey: "PROJ-100",
        userName: "Alice Chen",
        _creationTime: now - 10 * minute,
      },
      {
        _id: "act2",
        action: "updated",
        field: "assignee",
        newValue: undefined,
        issueKey: "PROJ-101",
        userName: "Bob Smith",
        _creationTime: now - 30 * minute,
      },
    ],
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Activity feed showing assignment actions (warning color).",
      },
    },
  },
};

export const LinkActions: Story = {
  args: {
    activities: [
      {
        _id: "act1",
        action: "linked",
        field: "parent issue",
        issueKey: "PROJ-100",
        userName: "Alice Chen",
        _creationTime: now - 5 * minute,
      },
      {
        _id: "act2",
        action: "linked",
        field: "related issue",
        issueKey: "PROJ-101",
        userName: "Bob Smith",
        _creationTime: now - 30 * minute,
      },
      {
        _id: "act3",
        action: "unlinked",
        field: "blocked by",
        issueKey: "PROJ-102",
        userName: "Carol Davis",
        _creationTime: now - 1 * hour,
      },
    ],
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Activity feed showing link and unlink actions.",
      },
    },
  },
};

export const WatchActions: Story = {
  args: {
    activities: [
      {
        _id: "act1",
        action: "started_watching",
        issueKey: "PROJ-100",
        userName: "Alice Chen",
        _creationTime: now - 10 * minute,
      },
      {
        _id: "act2",
        action: "stopped_watching",
        issueKey: "PROJ-101",
        userName: "Bob Smith",
        _creationTime: now - 1 * hour,
      },
    ],
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Activity feed showing watch/unwatch actions.",
      },
    },
  },
};

// ============================================================================
// Size Comparison
// ============================================================================

export const CompactVsDefault: Story = {
  render: () => (
    <Flex gap="lg" direction="column">
      <div>
        <Typography variant="label" className="mb-2 block">
          Default Mode
        </Typography>
        <div className="border border-ui-border rounded-lg p-2">
          <ActivityFeedPresentational activities={mockActivities.slice(0, 3)} compact={false} />
        </div>
      </div>
      <div>
        <Typography variant="label" className="mb-2 block">
          Compact Mode
        </Typography>
        <div className="border border-ui-border rounded-lg p-2">
          <ActivityFeedPresentational activities={mockActivities.slice(0, 3)} compact={true} />
        </div>
      </div>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Side-by-side comparison of default and compact modes.",
      },
    },
  },
};

// ============================================================================
// Single Item
// ============================================================================

export const SingleActivity: Story = {
  args: {
    activities: [mockActivities[0]],
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Activity feed with a single item (no timeline line).",
      },
    },
  },
};

// ============================================================================
// Time Display
// ============================================================================

export const VariousTimeRanges: Story = {
  args: {
    activities: [
      {
        _id: "act1",
        action: "created",
        issueKey: "PROJ-100",
        userName: "Alice Chen",
        _creationTime: now - 30 * 1000, // 30 seconds ago
      },
      {
        _id: "act2",
        action: "updated",
        field: "status",
        oldValue: "Todo",
        newValue: "In Progress",
        issueKey: "PROJ-101",
        userName: "Bob Smith",
        _creationTime: now - 45 * minute,
      },
      {
        _id: "act3",
        action: "commented",
        issueKey: "PROJ-102",
        userName: "Carol Davis",
        _creationTime: now - 5 * hour,
      },
      {
        _id: "act4",
        action: "assigned",
        field: "assignee",
        newValue: "David Wilson",
        issueKey: "PROJ-103",
        userName: "Eve Martinez",
        _creationTime: now - 3 * day,
      },
    ],
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Activity feed showing various time ranges (just now, minutes, hours, days).",
      },
    },
  },
};
