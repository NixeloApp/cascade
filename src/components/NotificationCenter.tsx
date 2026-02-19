import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { Inbox } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError } from "@/lib/toast";
import { NotificationItem, type NotificationWithActor } from "./NotificationItem";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
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

  const handleMarkAsRead = async (id: Id<"notifications">) => {
    try {
      await markAsRead({ id });
    } catch (error) {
      showError(error, "Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    try {
      await markAllAsRead({});
    } catch (error) {
      showError(error, "Failed to mark all notifications as read");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: Id<"notifications">) => {
    try {
      await removeNotification({ id });
    } catch (error) {
      showError(error, "Failed to delete notification");
    }
  };

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
            data-testid={TEST_IDS.HEADER.NOTIFICATION_BUTTON}
          >
            <Bell className="w-6 h-6" />
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
        data-testid={TEST_IDS.HEADER.NOTIFICATION_PANEL}
      >
        {/* Header */}
        <Card
          padding="md"
          radius="none"
          variant="ghost"
          className="border-x-0 border-t-0 sticky top-0 bg-ui-bg rounded-t-lg"
        >
          <Flex align="center" justify="between">
            <Typography variant="h3">Notifications</Typography>
            {unreadCount != null && unreadCount > 0 && (
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
        </Card>

        {/* Notifications List */}
        <FlexItem flex="1" className="overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <EmptyState icon={Inbox} title="No notifications" />
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
        </FlexItem>
      </PopoverContent>
    </Popover>
  );
}
