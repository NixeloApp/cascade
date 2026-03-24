/**
 * Notifications Page
 *
 * Full-page notification center with filtering and pagination.
 * Groups notifications by date (today, yesterday, this week, earlier).
 * Supports mark all read, archive, snooze, and individual notification actions.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";
import { isThisWeek, isToday, isYesterday } from "date-fns";
import { useState } from "react";
import {
  PageContent,
  PageControls,
  PageControlsGroup,
  PageControlsRow,
  PageHeader,
  PageLayout,
  PageStack,
} from "@/components/layout";
import { NotificationItem, type NotificationWithActor } from "@/components/Notifications";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Typography } from "@/components/ui/Typography";
import {
  useAuthenticatedMutation,
  useAuthenticatedQuery,
  useAuthReady,
} from "@/hooks/useConvexHelpers";
import { useOfflineNotificationMarkAsRead } from "@/hooks/useOfflineNotificationMarkAsRead";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { Archive, Bell, CheckCheck, Inbox } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
export const Route = createFileRoute("/_auth/_app/$orgSlug/notifications")({
  component: NotificationsPage,
});

/** Notification filter categories */
type NotificationFilter = "all" | "mentions" | "assigned" | "comments" | "updates";

/** Map filter categories to notification types */
const FILTER_TYPE_MAP: Record<NotificationFilter, string[] | null> = {
  all: null,
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

/** Full-page notifications hub with filters, tabs, and per-notification actions. */
export function NotificationsPage() {
  const [bulkActionLoading, setBulkActionLoading] = useState<"markAll" | "archiveAll" | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [activeTab, setActiveTab] = useState<"inbox" | "archived">("inbox");
  const orgContext = useOrganizationOptional();
  const { canAct } = useAuthReady();

  // Active notifications - filter by type on the backend for proper pagination
  const typeFilter = FILTER_TYPE_MAP[filter];
  const { results: notificationsRaw } = usePaginatedQuery(
    api.notifications.list,
    canAct ? { types: typeFilter ?? undefined } : "skip",
    { initialNumItems: 100 },
  );
  const notifications = (notificationsRaw ?? []) as NotificationWithActor[];

  // Archived notifications (paginated)
  const {
    results: archivedNotificationsRaw,
    loadMore: loadMoreArchived,
    status: archivedStatus,
  } = usePaginatedQuery(api.notifications.listArchived, canAct ? {} : "skip", {
    initialNumItems: 25,
  });
  const archivedNotifications = (archivedNotificationsRaw ?? []) as NotificationWithActor[];

  // Unread count
  const unreadCount = useAuthenticatedQuery(api.notifications.getUnreadCount, {});

  // Mutations
  const { markAsRead: offlineMarkAsRead } = useOfflineNotificationMarkAsRead();
  const { mutate: markAllAsRead } = useAuthenticatedMutation(api.notifications.markAllAsRead);
  const { mutate: archiveNotification } = useAuthenticatedMutation(
    api.notifications.archiveNotification,
  );
  const { mutate: unarchiveNotification } = useAuthenticatedMutation(
    api.notifications.unarchiveNotification,
  );
  const { mutate: archiveAllNotifications } = useAuthenticatedMutation(
    api.notifications.archiveAllNotifications,
  );
  const { mutate: snoozeNotification } = useAuthenticatedMutation(
    api.notifications.snoozeNotification,
  );
  const { mutate: removeNotification } = useAuthenticatedMutation(
    api.notifications.softDeleteNotification,
  );

  // Ordered groups for display
  const orderedGroups: DateGroup[] = ["today", "yesterday", "this_week", "older"];

  const handleMarkAsRead = async (id: Id<"notifications">) => {
    try {
      await offlineMarkAsRead(id);
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

  const handleUnarchive = async (id: Id<"notifications">) => {
    try {
      await unarchiveNotification({ id });
    } catch (error) {
      showError(error, "Failed to unarchive notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (bulkActionLoading) return;
    setBulkActionLoading("markAll");
    try {
      await markAllAsRead({});
      showSuccess("All notifications marked as read");
    } catch (error) {
      showError(error, "Failed to mark all notifications as read");
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleArchiveAll = async () => {
    if (bulkActionLoading) return;
    setBulkActionLoading("archiveAll");
    try {
      await archiveAllNotifications({});
      showSuccess("All notifications archived");
    } catch (error) {
      showError(error, "Failed to archive all notifications");
    } finally {
      setBulkActionLoading(null);
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

  const renderNotificationList = (notifs: NotificationWithActor[], isArchived = false) => {
    if (!notifs || notifs.length === 0) {
      return (
        <EmptyState
          icon={isArchived ? Archive : Inbox}
          title={isArchived ? "No archived notifications" : "No notifications"}
          description={
            isArchived ? "Archived notifications will appear here" : "You're all caught up!"
          }
        />
      );
    }

    if (isArchived) {
      // Archived notifications are shown as a flat list
      return (
        <div className="divide-y divide-ui-border">
          {notifs.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onArchive={handleUnarchive}
              onDelete={handleDelete}
              orgSlug={orgContext?.orgSlug}
            />
          ))}
        </div>
      );
    }

    // Active notifications are grouped by date
    const grouped = groupNotificationsByDate(notifs);
    return (
      <Stack gap="none">
        {orderedGroups.map((group) => {
          const groupNotifs = grouped.get(group);
          if (!groupNotifs || groupNotifs.length === 0) return null;

          return (
            <div key={group}>
              <div className="px-4 py-2 bg-ui-bg-secondary border-b border-ui-border sticky top-0 z-10">
                <Typography variant="eyebrow">{DATE_GROUP_LABELS[group]}</Typography>
              </div>
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
    );
  };

  return (
    <PageLayout data-testid={TEST_IDS.NOTIFICATIONS.CONTENT}>
      <PageStack>
        <PageHeader
          title="Notifications"
          spacing="stack"
          description={
            unreadCount != null && unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"
          }
          actions={
            <Flex gap="sm">
              {activeTab === "inbox" && unreadCount != null && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  isLoading={bulkActionLoading === "markAll"}
                  disabled={bulkActionLoading !== null}
                  leftIcon={<Icon icon={CheckCheck} size="sm" />}
                >
                  Mark all read
                </Button>
              )}
              {activeTab === "inbox" && notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleArchiveAll}
                  isLoading={bulkActionLoading === "archiveAll"}
                  disabled={bulkActionLoading !== null}
                  leftIcon={<Icon icon={Archive} size="sm" />}
                >
                  Archive all
                </Button>
              )}
            </Flex>
          }
        />

        <PageContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inbox" | "archived")}>
            <PageStack>
              <PageControls spacing="stack">
                <PageControlsRow>
                  <TabsList>
                    <TabsTrigger value="inbox">
                      <Flex align="center" gap="xs">
                        <Icon icon={Bell} size="sm" />
                        Inbox
                        {unreadCount != null && unreadCount > 0 && (
                          <Badge variant="brand" size="sm" shape="pill">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Badge>
                        )}
                      </Flex>
                    </TabsTrigger>
                    <TabsTrigger value="archived">
                      <Flex align="center" gap="xs">
                        <Icon icon={Archive} size="sm" />
                        Archived
                      </Flex>
                    </TabsTrigger>
                  </TabsList>

                  {activeTab === "inbox" && (
                    <PageControlsGroup className="sm:justify-end">
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
                          variant="unstyled"
                          chrome={filter === key ? "filterActive" : "filter"}
                          chromeSize="compactPillSm"
                          onClick={() => setFilter(key)}
                        >
                          {label}
                        </Button>
                      ))}
                    </PageControlsGroup>
                  )}
                </PageControlsRow>
              </PageControls>

              <Card padding="none">
                <TabsContent value="inbox" className="mt-0">
                  {renderNotificationList(notifications)}
                </TabsContent>

                <TabsContent value="archived" className="mt-0">
                  {renderNotificationList(archivedNotifications, true)}
                  {archivedStatus === "CanLoadMore" ? (
                    <Flex justify="center" className="py-4">
                      <Button variant="ghost" size="sm" onClick={() => loadMoreArchived(25)}>
                        Load more archived
                      </Button>
                    </Flex>
                  ) : null}
                </TabsContent>
              </Card>
            </PageStack>
          </Tabs>
        </PageContent>
      </PageStack>
    </PageLayout>
  );
}
