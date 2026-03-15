/**
 * User Activity Feed
 *
 * Profile activity timeline showing recent user actions.
 * Displays issue changes, comments, assignments, and status updates.
 * Groups activities by date with relative timestamps.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatRelativeTime } from "@/lib/dates";
import {
  AlertTriangle,
  Ban,
  Clock,
  Eye,
  LinkIcon,
  MessageSquare,
  Pencil,
  Sparkles,
  Trash2,
  User,
} from "@/lib/icons";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { SkeletonList } from "./ui/Skeleton";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

interface UserActivity {
  _id: Id<"issueActivity">;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  _creationTime: number;
  issueKey: string;
  issueTitle: string;
  projectKey: string;
  projectName: string;
}

interface UserActivityFeedProps {
  userId: Id<"users">;
  limit?: number;
  showProjectInfo?: boolean;
}

/**
 * Displays a user's recent activity across all accessible projects.
 */
export function UserActivityFeed({
  userId,
  limit = 20,
  showProjectInfo = true,
}: UserActivityFeedProps) {
  const activities = useAuthenticatedQuery(api.users.getUserActivity, { userId, limit });

  const getActionIcon = (action: string): LucideIcon => {
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
      case "deleted":
        return Trash2;
      default:
        return Clock;
    }
  };

  const getActionColorClass = (action: string): string => {
    switch (action) {
      case "created":
        return "text-status-success";
      case "updated":
        return "text-ui-text";
      case "commented":
        return "text-accent";
      case "assigned":
        return "text-status-warning";
      case "deleted":
        return "text-status-error";
      case "linked":
      case "unlinked":
        return "text-ui-text";
      default:
        return "text-ui-text-secondary";
    }
  };

  const formatUpdateMessage = (
    field: string,
    oldValue: string | undefined,
    newValue: string | undefined,
  ): string => {
    if (field === "status") {
      return `changed status from "${oldValue}" to "${newValue}"`;
    }
    if (field === "priority") {
      return `changed priority from "${oldValue}" to "${newValue}"`;
    }
    if (field === "assignee") {
      if (oldValue && newValue) {
        return `reassigned from "${oldValue}" to "${newValue}"`;
      }
      if (newValue) {
        return `assigned to "${newValue}"`;
      }
      return "unassigned";
    }
    return `updated ${field}`;
  };

  const formatActivityMessage = (activity: UserActivity): string => {
    const { action, field, oldValue, newValue } = activity;

    const simpleActions: Record<string, string> = {
      created: "created",
      commented: "commented on",
      started_watching: "started watching",
      stopped_watching: "stopped watching",
      deleted: "deleted",
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
  };

  // Group activities by date
  const groupActivitiesByDate = (activities: UserActivity[]) => {
    const groups: Record<string, UserActivity[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    for (const activity of activities) {
      const activityDate = new Date(activity._creationTime);
      activityDate.setHours(0, 0, 0, 0);

      let groupKey: string;
      if (activityDate.getTime() === today.getTime()) {
        groupKey = "Today";
      } else if (activityDate.getTime() === yesterday.getTime()) {
        groupKey = "Yesterday";
      } else if (activityDate >= thisWeek) {
        groupKey = "This Week";
      } else {
        groupKey = "Older";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    }

    return groups;
  };

  if (!activities) {
    return <SkeletonList items={5} />;
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No recent activity"
        description="Updates appear here as work moves."
        align="start"
        size="compact"
        className="max-w-full"
      />
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <Stack gap="lg">
      {Object.entries(groupedActivities).map(([groupName, groupActivities]) => (
        <Stack key={groupName} gap="sm">
          <Typography variant="label" className="text-ui-text-secondary">
            {groupName}
          </Typography>
          <Card padding="none" variant="flat">
            <Stack gap="none">
              {groupActivities.map((activity, index) => (
                <Card
                  key={activity._id}
                  recipe="activityFeedEntry"
                  padding="none"
                  radius="none"
                  className={
                    index !== groupActivities.length - 1
                      ? "border-x-0 border-t-0 border-b border-ui-border"
                      : "border-0"
                  }
                >
                  <Flex gap="md" align="start">
                    {/* Action Icon */}
                    <Card
                      recipe="activityTimelineIcon"
                      padding="none"
                      radius="full"
                      className="size-6 shrink-0"
                    >
                      <Flex align="center" justify="center" className="h-full">
                        <Icon icon={getActionIcon(activity.action)} size="xs" />
                      </Flex>
                    </Card>

                    {/* Activity Content */}
                    <FlexItem flex="1" className="min-w-0">
                      <Stack gap="xs">
                        <Typography variant="small" className="m-0">
                          <span className={getActionColorClass(activity.action)}>
                            {formatActivityMessage(activity)}
                          </span>{" "}
                          <Typography as="code" variant="meta" className="text-brand">
                            {activity.issueKey}
                          </Typography>
                        </Typography>
                        <Typography variant="caption" className="truncate text-ui-text-secondary">
                          {activity.issueTitle}
                        </Typography>
                        {showProjectInfo && (
                          <Typography variant="meta" className="text-ui-text-tertiary">
                            in {activity.projectName}
                          </Typography>
                        )}
                      </Stack>
                    </FlexItem>

                    {/* Timestamp */}
                    <Typography variant="meta" className="shrink-0 text-ui-text-tertiary">
                      {formatRelativeTime(activity._creationTime)}
                    </Typography>
                  </Flex>
                </Card>
              ))}
            </Stack>
          </Card>
        </Stack>
      ))}
    </Stack>
  );
}
