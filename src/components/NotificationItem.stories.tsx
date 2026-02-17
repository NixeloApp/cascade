import type { Meta, StoryObj } from "@storybook/react";
import {
  Bell,
  Check,
  FileText,
  Flag,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Rocket,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Flex, FlexItem } from "./ui/Flex";
import { Metadata, MetadataItem, MetadataTimestamp } from "./ui/Metadata";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

// ============================================================================
// Types
// ============================================================================

interface MockNotification {
  _id: string;
  _creationTime: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actorName?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getNotificationIcon(type: string) {
  switch (type) {
    case "issue_assigned":
      return <User className="w-5 h-5 text-brand" />;
    case "issue_mentioned":
      return <MessageCircle className="w-5 h-5 text-accent" />;
    case "issue_commented":
      return <MessageSquare className="w-5 h-5 text-accent" />;
    case "issue_status_changed":
      return <RefreshCw className="w-5 h-5 text-status-info" />;
    case "sprint_started":
      return <Rocket className="w-5 h-5 text-status-success" />;
    case "sprint_ended":
      return <Flag className="w-5 h-5 text-status-warning" />;
    case "document_shared":
    case "document_mentioned":
      return <FileText className="w-5 h-5 text-brand" />;
    default:
      return <Bell className="w-5 h-5 text-ui-text-tertiary" />;
  }
}

// ============================================================================
// Presentational Component (exported for NotificationCenter.stories)
// ============================================================================

interface NotificationItemPresentationalProps {
  notification: MockNotification;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
}

export function NotificationItemPresentational({
  notification,
  onMarkAsRead = () => {},
  onDelete = () => {},
}: NotificationItemPresentationalProps) {
  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-4 border-b border-ui-border last:border-0 hover:bg-ui-bg-secondary focus-within:bg-ui-bg-secondary transition-colors",
        !notification.isRead && "bg-brand-subtle/10",
      )}
    >
      {/* Icon */}
      <FlexItem shrink={false} className="mt-0.5">
        {getNotificationIcon(notification.type)}
      </FlexItem>

      {/* Main Content */}
      <FlexItem flex="1" className="min-w-0 text-left">
        <Typography variant="label" as="p" className="group-hover:text-ui-text-primary">
          {notification.title}
        </Typography>
        <Typography variant="small" color="secondary" className="mt-0.5 line-clamp-2">
          {notification.message}
        </Typography>

        <Metadata className="mt-1.5">
          <MetadataTimestamp date={notification._creationTime} />
          {notification.actorName && <MetadataItem>{notification.actorName}</MetadataItem>}
        </Metadata>
      </FlexItem>

      {/* Actions */}
      <Flex
        direction="column"
        gap="xs"
        className="shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
      >
        {!notification.isRead && (
          <Tooltip content="Mark as read">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-brand hover:bg-brand-subtle/20"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead();
              }}
              aria-label="Mark as read"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        )}
        <Tooltip content="Delete">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-ui-text-tertiary hover:text-status-error hover:bg-status-error/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </Tooltip>
      </Flex>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-brand group-hover:hidden" />
      )}
    </div>
  );
}

// ============================================================================
// Mock Data
// ============================================================================

const now = Date.now();
const hour = 60 * 60 * 1000;

let notifCounter = 0;
const createMockNotification = (overrides: Partial<MockNotification> = {}): MockNotification => {
  notifCounter++;
  return {
    _id: `notif-${notifCounter}`,
    _creationTime: now - hour,
    type: "issue_assigned",
    title: "Issue assigned to you",
    message: "PROJ-123: Fix login button alignment has been assigned to you",
    isRead: false,
    actorName: "Alice Chen",
    ...overrides,
  };
};

// ============================================================================
// Story Configuration
// ============================================================================

const meta: Meta<typeof NotificationItemPresentational> = {
  title: "Features/NotificationItem",
  component: NotificationItemPresentational,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Individual notification item with icon, content, timestamp, and actions (mark as read, delete).",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-md border border-ui-border rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationItemPresentational>;

// ============================================================================
// Stories
// ============================================================================

export const Unread: Story = {
  args: {
    notification: createMockNotification({ isRead: false }),
  },
};

export const Read: Story = {
  args: {
    notification: createMockNotification({ isRead: true }),
  },
};

export const IssueAssigned: Story = {
  args: {
    notification: createMockNotification({
      type: "issue_assigned",
      title: "Issue assigned to you",
      message: "PROJ-123: Fix login button alignment has been assigned to you",
      actorName: "Alice Chen",
    }),
  },
};

export const IssueCommented: Story = {
  args: {
    notification: createMockNotification({
      type: "issue_commented",
      title: "New comment on your issue",
      message:
        'Bob said: "I found the root cause of the issue and it seems to be related to the CSS..."',
      actorName: "Bob Wilson",
    }),
  },
};

export const IssueMentioned: Story = {
  args: {
    notification: createMockNotification({
      type: "issue_mentioned",
      title: "You were mentioned",
      message: "Charlie mentioned you in PROJ-456: Please review this when you have a moment",
      actorName: "Charlie Davis",
    }),
  },
};

export const IssueStatusChanged: Story = {
  args: {
    notification: createMockNotification({
      type: "issue_status_changed",
      title: "Issue status changed",
      message: "PROJ-789 moved from In Progress to Done",
    }),
  },
};

export const SprintStarted: Story = {
  args: {
    notification: createMockNotification({
      type: "sprint_started",
      title: "Sprint started",
      message: "Sprint 5 has been started. 12 issues are planned for this sprint.",
      actorName: "Diana Martinez",
    }),
  },
};

export const SprintEnded: Story = {
  args: {
    notification: createMockNotification({
      type: "sprint_ended",
      title: "Sprint ended",
      message: "Sprint 4 has ended. 8 of 10 issues were completed.",
      actorName: "Diana Martinez",
    }),
  },
};

export const DocumentShared: Story = {
  args: {
    notification: createMockNotification({
      type: "document_shared",
      title: "Document shared with you",
      message: "Design Specs has been shared with you by Eve",
      actorName: "Eve Johnson",
    }),
  },
};

export const LongMessage: Story = {
  args: {
    notification: createMockNotification({
      title: "New comment on your issue",
      message:
        "This is a very long notification message that should be truncated after two lines to prevent the notification item from becoming too tall. The message continues with more details that might not be visible without expanding.",
      actorName: "Frank Thompson",
    }),
  },
};

export const NoActor: Story = {
  args: {
    notification: createMockNotification({
      type: "issue_status_changed",
      title: "Issue status changed",
      message: "PROJ-101 was automatically moved to Done",
      actorName: undefined,
    }),
  },
};

export const OldNotification: Story = {
  args: {
    notification: createMockNotification({
      _creationTime: now - 7 * 24 * hour,
      title: "Week-old notification",
      message: "This notification is from a week ago",
    }),
  },
};

export const MultipleNotifications: Story = {
  render: () => (
    <div className="divide-y divide-ui-border">
      <NotificationItemPresentational
        notification={createMockNotification({
          type: "issue_assigned",
          isRead: false,
        })}
      />
      <NotificationItemPresentational
        notification={createMockNotification({
          type: "issue_commented",
          isRead: false,
          _creationTime: now - 2 * hour,
        })}
      />
      <NotificationItemPresentational
        notification={createMockNotification({
          type: "sprint_started",
          isRead: true,
          _creationTime: now - 24 * hour,
        })}
      />
    </div>
  ),
  decorators: [], // Remove default decorator for this story
};
