import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { Inbox } from "@/lib/icons";
import { showError } from "@/lib/toast";
import { NotificationItem, type NotificationWithActor } from "./NotificationItem";
import { Badge } from "./ui/Badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const orgContext = useOrganizationOptional();

  const { results: notificationsRaw } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: 20 },
  );
  const notifications = notificationsRaw as NotificationWithActor[];
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

  const dynamicLabel =
    unreadCount != null && unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip content="Notifications">
        <PopoverTrigger asChild>
          {/* Notification Bell Button */}
          <button
            type="button"
            className="relative p-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-secondary rounded-lg transition-colors"
            aria-label={dynamicLabel}
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
          {unreadCount != null && unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
              className="text-sm text-brand hover:text-brand-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Marking..." : "Mark all read"}
            </button>
          )}
        </Flex>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-ui-text-secondary">
              <Icon icon={Inbox} size="xl" className="mx-auto mb-2 text-ui-text-tertiary" />
              <Typography>No notifications</Typography>
            </div>
          ) : (
            <div className="divide-y divide-ui-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  orgSlug={orgContext?.orgSlug}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
