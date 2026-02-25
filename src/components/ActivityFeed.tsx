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
  User,
} from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { EmptyState } from "./ui/EmptyState";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { SkeletonList } from "./ui/Skeleton";
import { Typography } from "./ui/Typography";

interface Activity {
  _id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  issueKey?: string;
  userName: string;
  _creationTime: number;
}

interface ActivityFeedProps {
  projectId: Id<"projects">;
  limit?: number;
  compact?: boolean;
}

export function ActivityFeed({ projectId, limit = 50, compact = false }: ActivityFeedProps) {
  const activities = useQuery(api.analytics.getRecentActivity, { projectId, limit });

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
      return `changed status from ${oldValue} to ${newValue}`;
    }
    if (field === "priority") {
      return `changed priority from ${oldValue} to ${newValue}`;
    }
    if (field === "assignee") {
      if (oldValue && newValue) {
        return `reassigned from ${oldValue} to ${newValue}`;
      }
      if (newValue) {
        return `assigned to ${newValue}`;
      }
      return "unassigned";
    }
    return `updated ${field}`;
  };

  const formatActivityMessage = (activity: {
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    issueKey?: string;
  }) => {
    const { action, field, oldValue, newValue } = activity;

    // Handle simple action messages
    const simpleActions: Record<string, string> = {
      created: "created",
      commented: "commented on",
      started_watching: "started watching",
      stopped_watching: "stopped watching",
    };

    if (simpleActions[action]) {
      return simpleActions[action];
    }

    // Handle linked/unlinked actions
    if (action === "linked") {
      return `linked ${field}`;
    }
    if (action === "unlinked") {
      return `unlinked ${field}`;
    }

    // Handle updated actions with field-specific formatting
    if (action === "updated" && field) {
      return formatUpdateMessage(field, oldValue, newValue);
    }

    // Default fallback
    return action;
  };

  if (!activities) {
    return <SkeletonList items={5} />;
  }

  if (activities.length === 0) {
    return (
      <div data-testid={TEST_IDS.ACTIVITY.EMPTY_STATE}>
        <EmptyState
          icon={Clock}
          title="No activity yet"
          description="Activity will appear here as work progresses"
        />
      </div>
    );
  }

  return (
    <Flex direction="column" gap="none" className="relative" data-testid={TEST_IDS.ACTIVITY.FEED}>
      {/* Timeline line */}
      {!compact && activities.length > 1 && (
        <div className="absolute left-3 top-6 bottom-6 w-px bg-ui-border" />
      )}

      {activities.map((activity: Activity, index: number) => (
        <Flex
          key={`${activity._id}-${index}`}
          gap="lg"
          className={cn(
            "relative transition-colors duration-fast",
            compact
              ? "py-2 hover:bg-ui-bg-secondary/50 rounded-md px-2"
              : "p-4 hover:bg-ui-bg-secondary/30 rounded-lg",
          )}
          data-testid={TEST_IDS.ACTIVITY.ENTRY}
        >
          {/* Timeline icon */}
          <Flex
            align="center"
            justify="center"
            className={cn(
              "shrink-0 relative z-10 bg-ui-bg rounded-full",
              compact ? "w-5 h-5" : "w-6 h-6",
              "text-ui-text-secondary",
            )}
          >
            <Icon icon={getActionIcon(activity.action)} size={compact ? "xs" : "sm"} />
          </Flex>

          {/* Activity content */}
          <FlexItem flex="1" className="min-w-0">
            <Flex align="start" justify="between" gap="sm">
              <FlexItem flex="1" className="min-w-0">
                <Typography variant={compact ? "small" : "p"} className="m-0">
                  <strong>{activity.userName}</strong>{" "}
                  <span className={getActionColorClass(activity.action)}>
                    {formatActivityMessage(activity)}
                  </span>
                  {activity.issueKey && <code className="ml-1 font-mono">{activity.issueKey}</code>}
                </Typography>
                {!compact && activity.field && activity.newValue && (
                  <Typography variant="muted" className="mt-1 truncate text-ui-text-secondary">
                    {activity.field}: {activity.newValue}
                  </Typography>
                )}
              </FlexItem>
              <Typography
                variant={compact ? "meta" : "small"}
                className="shrink-0 text-ui-text-tertiary"
              >
                {formatRelativeTime(activity._creationTime)}
              </Typography>
            </Flex>
          </FlexItem>
        </Flex>
      ))}
    </Flex>
  );
}
