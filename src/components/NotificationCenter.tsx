import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Typography } from "./ui/Typography";

interface NotificationWithActor extends Doc<"notifications"> {
  actorName?: string;
}

// Pure functions - no need to be inside component
function getNotificationIcon(type: string): string {
  switch (type) {
    case "issue_assigned":
      return "👤";
    case "issue_mentioned":
      return "💬";
    case "issue_commented":
      return "💭";
    case "issue_status_changed":
      return "🔄";
    case "sprint_started":
      return "🚀";
    case "sprint_ended":
      return "🏁";
    default:
      return "📬";
  }
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { results: notificationsRaw } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: 20 },
  );
  const notifications = notificationsRaw as unknown as NotificationWithActor[];
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const removeNotification = useMutation(api.notifications.softDeleteNotification);

  const handleMarkAsRead = useCallback(
    async (id: Id<"notifications">) => {
      try {
        await markAsRead({ id });
      } catch (error) {
        showError(error, "Failed to mark notification as read");
      }
    },
    [markAsRead],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    setIsLoading(true);
    try {
      await markAllAsRead({});
    } catch (error) {
      showError(error, "Failed to mark all notifications as read");
    } finally {
      setIsLoading(false);
    }
  }, [markAllAsRead]);

  const handleDelete = useCallback(
    async (id: Id<"notifications">) => {
      try {
        await removeNotification({ id });
      } catch (error) {
        showError(error, "Failed to delete notification");
      }
    },
    [removeNotification],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {/* Notification Bell Button */}
        <button
          type="button"
          aria-label={
            unreadCount && unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative p-2 text-ui-text-secondary hover:text-ui-text-primary hover:bg-ui-bg-secondary rounded-lg transition-colors"
        >
          <svg
            aria-hidden="true"
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {/* Unread Badge */}
          {unreadCount != null && unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-status-error rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-full sm:w-96 max-w-[calc(100vw-2rem)] p-0 bg-ui-bg-primary border-ui-border-primary max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <Flex
          align="center"
          justify="between"
          className="p-4 border-b border-ui-border-primary sticky top-0 bg-ui-bg-primary rounded-t-lg"
        >
          <Typography variant="h3" className="text-lg font-semibold">
            Notifications
          </Typography>
          {unreadCount != null && unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Marking..." : "Mark all read"}
            </button>
          )}
        </Flex>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-ui-text-secondary">
              <div className="text-4xl mb-2">📭</div>
              <Typography>No notifications</Typography>
            </div>
          ) : (
            <div className="divide-y divide-ui-border-primary dark:divide-ui-border-primary-dark">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={cn(
                    "p-4 hover:bg-ui-bg-secondary dark:hover:bg-ui-bg-secondary-dark transition-colors",
                    !notification.isRead && "bg-status-info-bg dark:bg-brand-900/20",
                  )}
                >
                  <Flex align="start" gap="md">
                    {/* Icon */}
                    <div className="text-2xl shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <Flex align="start" justify="between" gap="sm">
                        <div className="flex-1">
                          <Typography className="text-sm font-medium text-ui-text-primary">
                            {notification.title}
                          </Typography>
                          <Typography className="text-sm text-ui-text-secondary mt-1">
                            {notification.message}
                          </Typography>
                          <Flex align="center" gap="sm" className="mt-1">
                            <Typography className="text-xs text-ui-text-tertiary">
                              {formatTime(notification.createdAt)}
                            </Typography>
                            {notification.actorName && (
                              <>
                                <span className="text-xs text-ui-text-tertiary">•</span>
                                <Typography className="text-xs text-ui-text-tertiary">
                                  by {notification.actorName}
                                </Typography>
                              </>
                            )}
                          </Flex>
                        </div>

                        <Flex gap="xs">
                          {!notification.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-1 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded"
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <svg
                                aria-hidden="true"
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(notification._id)}
                            className="p-1 text-ui-text-tertiary hover:text-status-error dark:hover:text-status-error hover:bg-status-error-bg rounded"
                            title="Delete"
                            aria-label="Delete notification"
                          >
                            <svg
                              aria-hidden="true"
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </Flex>
                      </Flex>
                    </div>
                  </Flex>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
