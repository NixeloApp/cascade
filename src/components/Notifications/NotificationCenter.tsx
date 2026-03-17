/**
 * Notification Center
 *
 * Header popover panel for viewing and managing notifications.
 * Groups notifications by date and supports filtering by type.
 * Provides mark as read, archive, snooze, and delete actions.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { isThisWeek, isToday, isYesterday } from "date-fns";
import { Bell, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import {
  useAuthenticatedMutation,
  useAuthenticatedQuery,
  useAuthReady,
} from "@/hooks/useConvexHelpers";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { Inbox } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError } from "@/lib/toast";
import { NotificationItem, type NotificationWithActor } from "./NotificationItem";

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

/** Notification popover with grouped notifications and filtering. */
export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const orgContext = useOrganizationOptional();
  const { canAct } = useAuthReady();

  // Filter by type on the backend for proper pagination
  const typeFilter = FILTER_TYPE_MAP[filter];
  const { results: notificationsRaw } = usePaginatedQuery(
    api.notifications.list,
    canAct ? { types: typeFilter ?? undefined } : "skip",
    { initialNumItems: 50 },
  );
  const notifications = (notificationsRaw ?? []) as NotificationWithActor[];

  // Group notifications by date
  const groupedNotifications = groupNotificationsByDate(notifications);

  // Ordered groups for display
  const orderedGroups: DateGroup[] = ["today", "yesterday", "this_week", "older"];
  const unreadCount = useAuthenticatedQuery(api.notifications.getUnreadCount, {});
  const { mutate: markAsRead } = useAuthenticatedMutation(api.notifications.markAsRead);
  const { mutate: markAllAsRead } = useAuthenticatedMutation(api.notifications.markAllAsRead);
  const { mutate: archiveNotification } = useAuthenticatedMutation(
    api.notifications.archiveNotification,
  );
  const { mutate: snoozeNotification } = useAuthenticatedMutation(
    api.notifications.snoozeNotification,
  );
  const { mutate: removeNotification } = useAuthenticatedMutation(
    api.notifications.softDeleteNotification,
  );

  const handleMarkAsRead = async (id: Id<"notifications">) => {
    try {
      await markAsRead({ id });
    } catch (error) {
      showError(error, "Failed to mark notification as read");
    }
  };

  const handleArchive = async (id: Id<"notifications">) => {
    try {
      await archiveNotification({ id });
    } catch (error) {
      showError(error, "Failed to archive notification");
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

  const handleSnooze = async (id: Id<"notifications">, snoozedUntil: number) => {
    try {
      await snoozeNotification({ id, snoozedUntil });
    } catch (error) {
      showError(error, "Failed to snooze notification");
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
            chrome="quiet"
            chromeSize="icon"
            className="relative"
            aria-label={dynamicLabel}
            data-testid={TEST_IDS.HEADER.NOTIFICATION_BUTTON}
          >
            <Bell className="w-5 h-5" />
            {/* Unread Badge */}
            {unreadCount != null && unreadCount > 0 && (
              <Badge
                variant="alertCount"
                size="sm"
                shape="pill"
                className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 animate-scale-in"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent
        align="end"
        recipe="overlayInset"
        className="max-h-popover-panel w-full max-w-dialog-mobile p-0 sm:w-96"
        data-testid={TEST_IDS.HEADER.NOTIFICATION_PANEL}
      >
        <Stack gap="none" className="h-full">
          {/* Header */}
          <Card recipe="notificationPanelHeader" padding="md" radius="none">
            <Stack gap="sm">
              <Flex align="center" justify="between">
                <Typography variant="h3">Notifications</Typography>
                {unreadCount != null && unreadCount > 0 && (
                  <Button
                    variant="link"
                    size="none"
                    onClick={handleMarkAllAsRead}
                    isLoading={isLoading}
                  >
                    Mark all read
                  </Button>
                )}
              </Flex>

              {/* Filter Tabs */}
              <Flex gap="xs" wrap>
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
                    chrome={filter === key ? "active" : "quiet"}
                    chromeSize="compactPill"
                    onClick={() => setFilter(key)}
                    className="h-7 shrink-0"
                  >
                    {label}
                  </Button>
                ))}
              </Flex>
            </Stack>
          </Card>

          {/* Notifications List - Grouped by Date */}
          <FlexItem flex="1" className="overflow-y-auto scrollbar-subtle">
            {!notifications || notifications.length === 0 ? (
              <EmptyState icon={Inbox} title="No notifications" size="compact" />
            ) : (
              <Stack gap="xs">
                {orderedGroups.map((group) => {
                  const groupNotifs = groupedNotifications.get(group);
                  if (!groupNotifs || groupNotifs.length === 0) return null;

                  return (
                    <div key={group} className="animate-fade-in">
                      {/* Group Header */}
                      <Card recipe="notificationPanelSectionHeader" padding="sm" radius="none">
                        <Typography
                          variant="caption"
                          color="secondary"
                          className="uppercase tracking-wide"
                        >
                          {DATE_GROUP_LABELS[group]}
                        </Typography>
                      </Card>
                      {/* Group Items */}
                      <div className="divide-y divide-ui-border">
                        {groupNotifs.map((notification) => (
                          <NotificationItem
                            key={notification._id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                            onSnooze={handleSnooze}
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

          {/* Footer - View All Link */}
          {orgContext?.orgSlug && (
            <Card recipe="notificationPanelFooter" padding="sm" radius="none">
              <Button asChild variant="link" size="none" className="w-full justify-center gap-2">
                <Link
                  to={ROUTES.notifications.path}
                  params={{ orgSlug: orgContext.orgSlug }}
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </Card>
          )}
        </Stack>
      </PopoverContent>
    </Popover>
  );
}
