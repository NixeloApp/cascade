/**
 * Notification Item
 *
 * Individual notification row with type-specific icons and actions.
 * Supports mentions, assignments, comments, and status updates.
 * Includes snooze, archive, and delete actions.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Dot";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon as AppIcon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import {
  Archive,
  Bell,
  Check,
  Clock,
  FileText,
  Flag,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Rocket,
  Trash2,
  User,
} from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { HOUR, WEEK } from "@/lib/time";
export interface NotificationWithActor extends Doc<"notifications"> {
  actorName?: string;
}

interface NotificationItemProps {
  notification: NotificationWithActor;
  onMarkAsRead: (id: Id<"notifications">) => void;
  onArchive: (id: Id<"notifications">) => void;
  onDelete: (id: Id<"notifications">) => void;
  onSnooze?: (id: Id<"notifications">, snoozedUntil: number) => void;
  orgSlug?: string;
}

/**
 * Returns the appropriate Lucide icon based on the notification type.
 */
function getNotificationIcon(type: string) {
  switch (type) {
    case "issue_assigned":
      return <AppIcon icon={User} size="md" tone="brand" />;
    case "issue_mentioned":
      return <AppIcon icon={MessageCircle} size="md" tone="accent" />;
    case "issue_commented":
      return <AppIcon icon={MessageSquare} size="md" tone="accent" />;
    case "issue_status_changed":
      return <AppIcon icon={RefreshCw} size="md" tone="info" />;
    case "sprint_started":
      return <AppIcon icon={Rocket} size="md" tone="success" />;
    case "sprint_ended":
      return <AppIcon icon={Flag} size="md" tone="warning" />;
    case "document_shared":
    case "document_mentioned":
      return <AppIcon icon={FileText} size="md" tone="brand" />;
    default:
      return <AppIcon icon={Bell} size="md" tone="tertiary" />;
  }
}

/**
 * A component that renders a single notification item.
 * Supports navigation to issue/document, and actions (Mark as read, Delete).
 */
/** Snooze duration options */
const SNOOZE_OPTIONS = [
  { label: "1 hour", duration: HOUR },
  { label: "3 hours", duration: 3 * HOUR },
  { label: "Tomorrow 9am", duration: null }, // Special handling
  { label: "Next week", duration: WEEK },
];

/** Calculate snooze until time for "Tomorrow 9am" */
function getTomorrow9am(): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow.getTime();
}

/** Individual notification card with read, archive, delete, and snooze actions. */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onSnooze,
  orgSlug,
}: NotificationItemProps) {
  const [snoozePopoverOpen, setSnoozePopoverOpen] = useState(false);

  // Fetch issue details if present to resolve key for navigation
  const issue = useAuthenticatedQuery(
    api.issues.getIssue,
    notification.issueId ? { id: notification.issueId } : "skip",
  );

  // Determine navigation target
  let linkTo: string | undefined;
  let linkParams: Record<string, string> | undefined;

  if (orgSlug) {
    if (issue) {
      linkTo = ROUTES.issues.detail.path;
      linkParams = { orgSlug, key: issue.key };
    } else if (notification.documentId) {
      linkTo = ROUTES.documents.detail.path;
      linkParams = { orgSlug, id: notification.documentId };
    }
  }

  const content = (
    <Stack gap="xs">
      <Typography variant="label" as="p">
        {notification.title}
      </Typography>
      <Typography variant="small" color="secondary" className="line-clamp-2">
        {notification.message}
      </Typography>

      <Metadata>
        <MetadataTimestamp date={notification._creationTime} />
        {notification.actorName && <MetadataItem>{notification.actorName}</MetadataItem>}
      </Metadata>
    </Stack>
  );

  const ContentWrapper = () => {
    if (linkTo && linkParams) {
      return (
        <FlexItem flex="1" className="min-w-0 text-left">
          <Link
            to={linkTo}
            params={linkParams}
            className="block"
            onClick={() => {
              if (!notification.isRead) {
                onMarkAsRead(notification._id);
              }
            }}
          >
            {content}
          </Link>
        </FlexItem>
      );
    }

    return (
      <FlexItem flex="1" className="min-w-0 text-left">
        {content}
      </FlexItem>
    );
  };

  return (
    <Card
      recipe={notification.isRead ? "notificationRow" : "notificationRowUnread"}
      padding="md"
      radius="none"
      className="group relative animate-fade-in last:border-0"
      data-testid={TEST_IDS.NOTIFICATION.ITEM}
    >
      <Flex direction="column" directionSm="row" gap="md" alignSm="start">
        <Flex flex="1" align="start" gap="md" className="min-w-0">
          <FlexItem shrink={false}>{getNotificationIcon(notification.type)}</FlexItem>
          <ContentWrapper />
        </Flex>

        <Flex
          data-testid={TEST_IDS.NOTIFICATION.ACTIONS}
          directionSm="column"
          gap="xs"
          align="center"
          alignSm="end"
          justify="end"
          justifySm="start"
          pt="sm"
          className="border-t border-ui-border/60 sm:ml-auto sm:shrink-0 sm:border-t-0"
        >
          {!notification.isRead && (
            <Tooltip content="Mark as read">
              <IconButton
                variant="brand"
                size="xs"
                reveal="responsive"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification._id);
                }}
                aria-label="Mark as read"
              >
                <AppIcon icon={Check} size="xsPlus" />
              </IconButton>
            </Tooltip>
          )}
          {onSnooze && (
            <Popover open={snoozePopoverOpen} onOpenChange={setSnoozePopoverOpen}>
              <Tooltip content="Snooze">
                <PopoverTrigger asChild>
                  <IconButton
                    variant="ghost"
                    size="xs"
                    reveal="responsive"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Snooze notification"
                  >
                    <AppIcon icon={Clock} size="xsPlus" />
                  </IconButton>
                </PopoverTrigger>
              </Tooltip>
              <PopoverContent align="end" recipe="notificationMenu" className="w-48">
                <Stack gap="xs">
                  <Typography variant="label">Snooze until</Typography>
                  {SNOOZE_OPTIONS.map((option) => (
                    <Button
                      key={option.label}
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        const snoozedUntil =
                          option.duration === null
                            ? getTomorrow9am()
                            : Date.now() + option.duration;
                        onSnooze(notification._id, snoozedUntil);
                        setSnoozePopoverOpen(false);
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Stack>
              </PopoverContent>
            </Popover>
          )}
          <Tooltip content="Archive">
            <IconButton
              variant="ghost"
              size="xs"
              reveal="responsive"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(notification._id);
              }}
              aria-label="Archive notification"
            >
              <AppIcon icon={Archive} size="xsPlus" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Delete">
            <IconButton
              variant="danger"
              size="xs"
              reveal="responsive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification._id);
              }}
              aria-label="Delete notification"
            >
              <AppIcon icon={Trash2} size="xsPlus" />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>

      {!notification.isRead && <Dot className="absolute top-4 right-4" />}
    </Card>
  );
}
