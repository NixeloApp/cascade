import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
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
  const activities = useQuery(api.users.getUserActivity, { userId, limit });

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
        title="No activity yet"
        description="Activity will appear here as work progresses"
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
                <Flex
                  key={activity._id}
                  gap="md"
                  align="start"
                  className={cn(
                    "p-3 transition-colors duration-fast hover:bg-ui-bg-secondary/30",
                    index !== groupActivities.length - 1 && "border-b border-ui-border",
                  )}
                >
                  {/* Action Icon */}
                  <Flex
                    align="center"
                    justify="center"
                    className="shrink-0 w-6 h-6 rounded-full bg-ui-bg text-ui-text-secondary"
                  >
                    <Icon icon={getActionIcon(activity.action)} size="xs" />
                  </Flex>

                  {/* Activity Content */}
                  <FlexItem flex="1" className="min-w-0">
                    <Stack gap="xs">
                      <Typography variant="small" className="m-0">
                        <span className={getActionColorClass(activity.action)}>
                          {formatActivityMessage(activity)}
                        </span>{" "}
                        <code className="font-mono text-brand">{activity.issueKey}</code>
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
              ))}
            </Stack>
          </Card>
        </Stack>
      ))}
    </Stack>
  );
}
