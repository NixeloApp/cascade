import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  Bell,
  Check,
  FileText,
  Flag,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Rocket,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export interface NotificationWithActor extends Doc<"notifications"> {
  actorName?: string;
}

interface NotificationItemProps {
  notification: NotificationWithActor;
  onMarkAsRead: (id: Id<"notifications">) => void;
  onDelete: (id: Id<"notifications">) => void;
  orgSlug?: string;
}

/**
 * Returns the appropriate Lucide icon based on the notification type.
 */
function getNotificationIcon(type: string) {
  switch (type) {
    case "issue_assigned":
      return <User className="w-5 h-5 text-brand" />;
    case "issue_mentioned":
      return <MessageCircle className="w-5 h-5 text-accent" />;
    case "issue_commented":
      return <MessageSquare className="w-5 h-5 text-accent" />;
    case "issue_status_changed":
      return <RefreshCw className="w-5 h-5 text-status-info" />;
    case "sprint_started":
      return <Rocket className="w-5 h-5 text-status-success" />;
    case "sprint_ended":
      return <Flag className="w-5 h-5 text-status-warning" />;
    case "document_shared":
    case "document_mentioned":
      return <FileText className="w-5 h-5 text-brand" />;
    default:
      return <Bell className="w-5 h-5 text-ui-text-tertiary" />;
  }
}

/**
 * A component that renders a single notification item.
 * Supports navigation to issue/document, and actions (Mark as read, Delete).
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  orgSlug,
}: NotificationItemProps) {
  // Fetch issue details if present to resolve key for navigation
  const issue = useQuery(
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

  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (linkTo && linkParams) {
      return (
        <Link
          to={linkTo}
          params={linkParams}
          className="flex-1 min-w-0 group-hover:text-brand transition-colors"
          onClick={() => {
            if (!notification.isRead) {
              onMarkAsRead(notification._id);
            }
          }}
        >
          {children}
        </Link>
      );
    }
    return (
      <FlexItem flex="1" className="min-w-0 text-left">
        {children}
      </FlexItem>
    );
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-4 border-b border-ui-border last:border-0 hover:bg-ui-bg-secondary focus-within:bg-ui-bg-secondary transition-colors",
        !notification.isRead && "bg-brand-subtle/10",
      )}
    >
      {/* Icon */}
      <FlexItem shrink={false} className="mt-0.5">
        {getNotificationIcon(notification.type)}
      </FlexItem>

      {/* Main Content (Clickable if linked) */}
      <ContentWrapper>
        <Typography variant="label" as="p" className="group-hover:text-ui-text-primary">
          {notification.title}
        </Typography>
        <Typography variant="small" color="secondary" className="mt-0.5 line-clamp-2">
          {notification.message}
        </Typography>

        <Metadata className="mt-1.5">
          <MetadataTimestamp date={notification._creationTime} />
          {notification.actorName && <MetadataItem>{notification.actorName}</MetadataItem>}
        </Metadata>
      </ContentWrapper>

      {/* Actions (Separate from link) */}
      <Flex
        direction="column"
        gap="xs"
        className="shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
      >
        {!notification.isRead && (
          <Tooltip content="Mark as read">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-brand hover:bg-brand-subtle/20"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification._id);
              }}
              aria-label="Mark as read"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        )}
        <Tooltip content="Delete">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-ui-text-tertiary hover:text-status-error hover:bg-status-error/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification._id);
            }}
            aria-label="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </Tooltip>
      </Flex>

      {/* Unread Indicator (Visual only) */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-brand group-hover:hidden" />
      )}
    </div>
  );
}
