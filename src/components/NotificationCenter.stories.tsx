import type { Meta, StoryObj } from "@storybook/react";
import { Bell } from "lucide-react";
import { useState } from "react";
import { NotificationItemPresentational } from "./NotificationItem.stories";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { Flex, FlexItem } from "./ui/Flex";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
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
// Presentational Component (bypasses Convex hooks)
// ============================================================================

interface NotificationCenterPresentationalProps {
  notifications: MockNotification[];
  unreadCount: number;
  initialOpen?: boolean;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
}

function NotificationCenterPresentational({
  notifications,
  unreadCount,
  initialOpen = false,
  onMarkAsRead = () => {},
  onMarkAllAsRead = () => {},
  onDelete = () => {},
}: NotificationCenterPresentationalProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isLoading, setIsLoading] = useState(false);

  const dynamicLabel = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

  const handleMarkAllAsRead = () => {
    setIsLoading(true);
    onMarkAllAsRead();
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip content="Notifications">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative p-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-secondary rounded-lg transition-colors"
            aria-label={dynamicLabel}
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <Badge
                variant="error"
                size="sm"
                shape="pill"
                className="absolute top-0 right-0 font-bold leading-none transform translate-x-1/2 -translate-y-1/2 border-0"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-full sm:w-96 max-w-notification p-0 bg-ui-bg border-ui-border max-h-panel flex flex-col"
      >
        {/* Header */}
        <Flex
          align="center"
          justify="between"
          className="p-4 border-b border-ui-border sticky top-0 bg-ui-bg rounded-t-lg"
        >
          <Typography variant="h3" className="text-lg font-semibold">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              isLoading={isLoading}
              className="text-brand hover:text-brand-hover"
            >
              Mark all read
            </Button>
          )}
        </Flex>

        {/* Notifications List */}
        <FlexItem flex="1" className="overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" />
          ) : (
            <div className="divide-y divide-ui-border">
              {notifications.map((notification) => (
                <NotificationItemPresentational
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={() => onMarkAsRead(notification._id)}
                  onDelete={() => onDelete(notification._id)}
                />
              ))}
            </div>
          )}
        </FlexItem>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Mock Data
// ============================================================================

const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

const mockNotifications: MockNotification[] = [
  {
    _id: "notif-1",
    _creationTime: now - 5 * 60 * 1000,
    type: "issue_assigned",
    title: "Issue assigned to you",
    message: "PROJ-123: Fix login button alignment has been assigned to you",
    isRead: false,
    actorName: "Alice Chen",
  },
  {
    _id: "notif-2",
    _creationTime: now - hour,
    type: "issue_commented",
    title: "New comment on your issue",
    message: 'Bob said: "I found the root cause of the issue..."',
    isRead: false,
    actorName: "Bob Wilson",
  },
  {
    _id: "notif-3",
    _creationTime: now - 3 * hour,
    type: "issue_mentioned",
    title: "You were mentioned",
    message: "Charlie mentioned you in PROJ-456",
    isRead: true,
    actorName: "Charlie Davis",
  },
  {
    _id: "notif-4",
    _creationTime: now - day,
    type: "sprint_started",
    title: "Sprint started",
    message: "Sprint 5 has been started by Diana",
    isRead: true,
    actorName: "Diana Martinez",
  },
  {
    _id: "notif-5",
    _creationTime: now - 2 * day,
    type: "issue_status_changed",
    title: "Issue status changed",
    message: "PROJ-789 moved from In Progress to Done",
    isRead: true,
  },
];

// ============================================================================
// Story Configuration
// ============================================================================

const meta: Meta<typeof NotificationCenterPresentational> = {
  title: "Features/NotificationCenter",
  component: NotificationCenterPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Notification center with bell icon, unread count badge, and popover panel showing notifications list.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof NotificationCenterPresentational>;

// ============================================================================
// Stories
// ============================================================================

export const Closed: Story = {
  args: {
    notifications: mockNotifications,
    unreadCount: 2,
    initialOpen: false,
  },
};

export const OpenWithNotifications: Story = {
  args: {
    notifications: mockNotifications,
    unreadCount: 2,
    initialOpen: true,
  },
};

export const OpenEmpty: Story = {
  args: {
    notifications: [],
    unreadCount: 0,
    initialOpen: true,
  },
};

export const NoUnread: Story = {
  args: {
    notifications: mockNotifications.map((n) => ({ ...n, isRead: true })),
    unreadCount: 0,
    initialOpen: false,
  },
};

export const ManyUnread: Story = {
  args: {
    notifications: mockNotifications.map((n) => ({ ...n, isRead: false })),
    unreadCount: 5,
    initialOpen: false,
  },
};

export const OverflowBadge: Story = {
  args: {
    notifications: mockNotifications,
    unreadCount: 150,
    initialOpen: false,
  },
};

export const SingleNotification: Story = {
  args: {
    notifications: [mockNotifications[0]],
    unreadCount: 1,
    initialOpen: true,
  },
};

export const AllRead: Story = {
  args: {
    notifications: mockNotifications.map((n) => ({ ...n, isRead: true })),
    unreadCount: 0,
    initialOpen: true,
  },
};
