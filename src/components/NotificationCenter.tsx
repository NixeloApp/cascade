import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { isThisWeek, isToday, isYesterday } from "date-fns";
import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { Inbox } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { NotificationItem, type NotificationWithActor } from "./NotificationItem";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

/** Notification filter categories */
type NotificationFilter = "all" | "mentions" | "assigned" | "comments" | "updates";

/** Map filter categories to notification types */
const FILTER_TYPE_MAP: Record<NotificationFilter, string[] | null> = {
  all: null, // No filtering
  mentions: ["issue_mentioned", "document_mentioned"],
  assigned: ["issue_assigned"],
  comments: ["issue_commented"],
  updates: ["issue_status_changed", "sprint_started", "sprint_ended", "document_shared"],
};

/** Date group labels */
type DateGroup = "today" | "yesterday" | "this_week" | "older";

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  older: "Older",
};

/** Determine which date group a timestamp belongs to */
function getDateGroup(timestamp: number): DateGroup {
  const date = new Date(timestamp);
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  if (isThisWeek(date, { weekStartsOn: 1 })) return "this_week";
  return "older";
}

/** Group notifications by date */
function groupNotificationsByDate(
  notifications: NotificationWithActor[],
): Map<DateGroup, NotificationWithActor[]> {
  const groups = new Map<DateGroup, NotificationWithActor[]>();

  for (const notification of notifications) {
    const group = getDateGroup(notification._creationTime);
    const existing = groups.get(group) || [];
    existing.push(notification);
    groups.set(group, existing);
  }

  return groups;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const orgContext = useOrganizationOptional();

  const { results: notificationsRaw } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: 50 }, // Fetch more to allow client-side filtering
  );
  const allNotifications = notificationsRaw as NotificationWithActor[];

  // Filter notifications based on selected filter
  const notifications = useMemo(() => {
    if (!allNotifications) return [];
    const typeFilter = FILTER_TYPE_MAP[filter];
    if (!typeFilter) return allNotifications;
    return allNotifications.filter((n) => typeFilter.includes(n.type));
  }, [allNotifications, filter]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(notifications);
  }, [notifications]);

  // Ordered groups for display
  const orderedGroups: DateGroup[] = ["today", "yesterday", "this_week", "older"];
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
          <Button
            variant="ghost"
            size="icon"
            className="relative"
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
          </Button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-full sm:w-96 max-w-[calc(100vw-2rem)] p-0 bg-ui-bg border-ui-border max-h-[80vh]"
        data-testid={TEST_IDS.HEADER.NOTIFICATION_PANEL}
      >
        <Stack gap="none" className="h-full">
          {/* Header */}
          <Card
            padding="md"
            radius="none"
            variant="ghost"
            className="border-x-0 border-t-0 sticky top-0 bg-ui-bg rounded-t-lg"
          >
            <Stack gap="sm">
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

              {/* Filter Tabs */}
              <Flex gap="xs" className="overflow-x-auto pb-1 -mb-1">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "mentions", label: "Mentions" },
                    { key: "assigned", label: "Assigned" },
                    { key: "comments", label: "Comments" },
                    { key: "updates", label: "Updates" },
                  ] as const
                ).map(({ key, label }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter(key)}
                    className={cn(
                      "shrink-0 px-3 h-7",
                      filter === key
                        ? "bg-ui-bg-secondary text-ui-text"
                        : "text-ui-text-secondary hover:text-ui-text",
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </Flex>
            </Stack>
          </Card>

          {/* Notifications List - Grouped by Date */}
          <FlexItem flex="1" className="overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <EmptyState icon={Inbox} title="No notifications" />
            ) : (
              <Stack gap="none">
                {orderedGroups.map((group) => {
                  const groupNotifs = groupedNotifications.get(group);
                  if (!groupNotifs || groupNotifs.length === 0) return null;

                  return (
                    <div key={group}>
                      {/* Group Header */}
                      <div className="px-4 py-2 bg-ui-bg-secondary border-b border-ui-border sticky top-0">
                        <Typography
                          variant="caption"
                          color="secondary"
                          className="uppercase tracking-wide"
                        >
                          {DATE_GROUP_LABELS[group]}
                        </Typography>
                      </div>
                      {/* Group Items */}
                      <div className="divide-y divide-ui-border">
                        {groupNotifs.map((notification) => (
                          <NotificationItem
                            key={notification._id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onDelete={handleDelete}
                            orgSlug={orgContext?.orgSlug}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Stack>
            )}
          </FlexItem>
        </Stack>
      </PopoverContent>
    </Popover>
  );
}
