/**
 * Activity Feed
 *
 * Timeline of activity events for issues or documents.
 * Shows comments, status changes, assignments, and other updates.
 * Groups events by date with relative timestamps.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatRelativeTime } from "@/lib/formatting";
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
import { Card, getCardRecipeClassName } from "./ui/Card";
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

/**
 * Displays a timeline of recent project activity (issue creation, updates, comments).
 */
export function ActivityFeed({ projectId, limit = 50, compact = false }: ActivityFeedProps) {
  const { orgSlug } = useOrganization();
  const activities = useAuthenticatedQuery(api.analytics.getRecentActivity, { projectId, limit });

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
          align={compact ? "center" : "start"}
          size={compact ? "compact" : "default"}
          className={compact ? undefined : "max-w-full"}
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

      {activities.map((activity: Activity) => (
        <Card
          key={activity._id}
          recipe={compact ? "activityFeedEntryCompact" : "activityFeedEntry"}
          className="relative"
          data-testid={TEST_IDS.ACTIVITY.ENTRY}
        >
          <Flex gap="lg">
            {/* Timeline icon */}
            <div
              className={cn(
                getCardRecipeClassName("activityTimelineIcon"),
                compact ? "size-5 shrink-0 relative z-10" : "size-6 shrink-0 relative z-10",
              )}
            >
              <Flex align="center" justify="center" className="h-full">
                <Icon icon={getActionIcon(activity.action)} size={compact ? "xs" : "sm"} />
              </Flex>
            </div>

            {/* Activity content */}
            <FlexItem flex="1" className="min-w-0">
              <Flex align="start" justify="between" gap="sm">
                <FlexItem flex="1" className="min-w-0">
                  <Typography variant={compact ? "small" : "p"} className="m-0">
                    <Typography as="strong" variant="strong">
                      {activity.userName}
                    </Typography>{" "}
                    <span className={getActionColorClass(activity.action)}>
                      {formatActivityMessage(activity)}
                    </span>
                    {activity.issueKey && (
                      <Link
                        to={ROUTES.issues.detail.path}
                        params={{ orgSlug, key: activity.issueKey }}
                        className="ml-1 font-mono text-brand"
                      >
                        {activity.issueKey}
                      </Link>
                    )}
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
                  data-testid={TEST_IDS.ACTIVITY.TIMESTAMP}
                >
                  {formatRelativeTime(activity._creationTime)}
                </Typography>
              </Flex>
            </FlexItem>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
}
