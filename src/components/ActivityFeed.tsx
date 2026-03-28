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
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatRelativeTime } from "@/lib/formatting";
import type { LucideIcon } from "@/lib/icons";
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
import {
  getActivityFeedActionColorClassName,
  getActivityFeedContainerClassName,
  getActivityFeedContentClassName,
  getActivityFeedDetailClassName,
  getActivityFeedEmptyStateClassName,
  getActivityFeedEntryClassName,
  getActivityFeedIconCenterClassName,
  getActivityFeedIconShellClassName,
  getActivityFeedIssueLinkClassName,
  getActivityFeedMessageClassName,
  getActivityFeedRailClassName,
  getActivityFeedTimestampClassName,
} from "./ui/activityFeedSurfaceClassNames";
import { Button } from "./ui/Button";
import { Card, getCardRecipeClassName } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { Inline } from "./ui/Inline";
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
export function ActivityFeed({
  projectId,
  limit: initialLimit = 50,
  compact = false,
}: ActivityFeedProps) {
  const { orgSlug } = useOrganization();
  const [displayLimit, setDisplayLimit] = useState(initialLimit);
  const activities = useAuthenticatedQuery(api.analytics.getRecentActivity, {
    projectId,
    limit: displayLimit,
  });

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
          className={compact ? undefined : getActivityFeedEmptyStateClassName()}
        />
      </div>
    );
  }

  return (
    <Flex
      direction="column"
      gap="none"
      className={getActivityFeedContainerClassName()}
      data-testid={TEST_IDS.ACTIVITY.FEED}
    >
      {/* Timeline line */}
      {!compact && activities.length > 1 && (
        <div className={getActivityFeedRailClassName()} data-testid={TEST_IDS.ACTIVITY.RAIL} />
      )}

      {activities.map((activity: Activity) => (
        <Card
          key={activity._id}
          recipe={compact ? "activityFeedEntryCompact" : "activityFeedEntry"}
          className={getActivityFeedEntryClassName()}
          data-testid={TEST_IDS.ACTIVITY.ENTRY}
        >
          <Flex gap="lg">
            {/* Timeline icon */}
            <div
              className={cn(
                getCardRecipeClassName("activityTimelineIcon"),
                getActivityFeedIconShellClassName(compact),
              )}
            >
              <Flex
                align="center"
                justify="center"
                className={getActivityFeedIconCenterClassName()}
              >
                <Icon icon={getActionIcon(activity.action)} size={compact ? "xs" : "sm"} />
              </Flex>
            </div>

            {/* Activity content */}
            <FlexItem flex="1" className={getActivityFeedContentClassName()}>
              <Flex align="start" justify="between" gap="sm">
                <FlexItem flex="1" className={getActivityFeedContentClassName()}>
                  <Typography
                    variant={compact ? "small" : "p"}
                    className={getActivityFeedMessageClassName()}
                  >
                    <Typography as="strong" variant="strong">
                      {activity.userName}
                    </Typography>{" "}
                    <Inline className={getActivityFeedActionColorClassName(activity.action)}>
                      {formatActivityMessage(activity)}
                    </Inline>
                    {activity.issueKey && (
                      <Link
                        to={ROUTES.issues.detail.path}
                        params={{ orgSlug, key: activity.issueKey }}
                        className={getActivityFeedIssueLinkClassName()}
                      >
                        {activity.issueKey}
                      </Link>
                    )}
                  </Typography>
                  {!compact && activity.field && activity.newValue && (
                    <Typography variant="muted" className={getActivityFeedDetailClassName()}>
                      {activity.field}: {activity.newValue}
                    </Typography>
                  )}
                </FlexItem>
                <Typography
                  variant={compact ? "meta" : "small"}
                  className={getActivityFeedTimestampClassName()}
                  data-testid={TEST_IDS.ACTIVITY.TIMESTAMP}
                >
                  {formatRelativeTime(activity._creationTime)}
                </Typography>
              </Flex>
            </FlexItem>
          </Flex>
        </Card>
      ))}

      {!compact && activities.length >= displayLimit && (
        <Flex justify="center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDisplayLimit((prev) => prev + 50)}
          >
            Load More
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
