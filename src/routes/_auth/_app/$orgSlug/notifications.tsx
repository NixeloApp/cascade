import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { isThisWeek, isToday, isYesterday } from "date-fns";
import { Archive, Bell, CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { NotificationItem, type NotificationWithActor } from "@/components/NotificationItem";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Typography } from "@/components/ui/Typography";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { Inbox } from "@/lib/icons";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

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

function NotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [activeTab, setActiveTab] = useState<"inbox" | "archived">("inbox");
  const orgContext = useOrganizationOptional();

  // Active notifications
  const { results: notificationsRaw } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: 100 },
  );
  const allNotifications = notificationsRaw as NotificationWithActor[];

  // Archived notifications
  const archivedNotifications = useQuery(api.notifications.listArchived, {});

  // Unread count
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const archiveNotification = useMutation(api.notifications.archiveNotification);
  const unarchiveNotification = useMutation(api.notifications.unarchiveNotification);
  const archiveAllNotifications = useMutation(api.notifications.archiveAllNotifications);
  const removeNotification = useMutation(api.notifications.softDeleteNotification);

  // Filter notifications based on selected filter
  const notifications = useMemo(() => {
    if (!allNotifications) return [];
    const typeFilter = FILTER_TYPE_MAP[filter];
    if (!typeFilter) return allNotifications;
    return allNotifications.filter((n) => typeFilter.includes(n.type));
  }, [allNotifications, filter]);

  // Ordered groups for display
  const orderedGroups: DateGroup[] = ["today", "yesterday", "this_week", "older"];

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

  const handleUnarchive = async (id: Id<"notifications">) => {
    try {
      await unarchiveNotification({ id });
    } catch (error) {
      showError(error, "Failed to unarchive notification");
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

  const handleArchiveAll = async () => {
    setIsLoading(true);
    try {
      await archiveAllNotifications({});
    } catch (error) {
      showError(error, "Failed to archive all notifications");
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
                <Typography variant="caption" color="secondary" className="uppercase tracking-wide">
                  {DATE_GROUP_LABELS[group]}
                </Typography>
              </div>
              <div className="divide-y divide-ui-border">
                {groupNotifs.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
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
    <PageLayout>
      <PageHeader
        title="Notifications"
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
                isLoading={isLoading}
                leftIcon={<CheckCheck className="h-4 w-4" />}
              >
                Mark all read
              </Button>
            )}
            {activeTab === "inbox" && notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchiveAll}
                isLoading={isLoading}
                leftIcon={<Archive className="h-4 w-4" />}
              >
                Archive all
              </Button>
            )}
          </Flex>
        }
      />

      <PageContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inbox" | "archived")}>
          <Flex justify="between" align="center" className="mb-4">
            <TabsList>
              <TabsTrigger value="inbox">
                <Flex align="center" gap="xs">
                  <Bell className="h-4 w-4" />
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
                  <Archive className="h-4 w-4" />
                  Archived
                </Flex>
              </TabsTrigger>
            </TabsList>

            {activeTab === "inbox" && (
              <Flex gap="xs">
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
                      "px-3 h-7",
                      filter === key
                        ? "bg-ui-bg-secondary text-ui-text"
                        : "text-ui-text-secondary hover:text-ui-text",
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </Flex>
            )}
          </Flex>

          <Card padding="none">
            <TabsContent value="inbox" className="mt-0">
              {renderNotificationList(notifications)}
            </TabsContent>

            <TabsContent value="archived" className="mt-0">
              {renderNotificationList(
                (archivedNotifications as NotificationWithActor[]) || [],
                true,
              )}
            </TabsContent>
          </Card>
        </Tabs>
      </PageContent>
    </PageLayout>
  );
}
