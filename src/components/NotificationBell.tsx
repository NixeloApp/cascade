import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Bell, Flag, MessageCircle, MessageSquare, RefreshCw, Rocket, User, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Metadata, MetadataItem, MetadataTimestamp } from "./ui/Metadata";
import { Typography } from "./ui/Typography";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { results: notifications, status } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: 20 },
  );
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const removeNotification = useMutation(api.notifications.softDeleteNotification);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = async (
    notificationId: Id<"notifications">,
    issueId?: Id<"issues">,
  ) => {
    await markAsRead({ id: notificationId });
    setIsOpen(false);

    // Could navigate to the issue/document here if needed
    if (issueId) {
      // Navigation logic would go here
    }
  };

  const getNotificationIcon = (type: string): LucideIcon => {
    switch (type) {
      case "issue_assigned":
        return User;
      case "issue_mentioned":
        return MessageSquare;
      case "issue_commented":
        return MessageCircle;
      case "issue_status_changed":
        return RefreshCw;
      case "sprint_started":
        return Rocket;
      case "sprint_ended":
        return Flag;
      default:
        return Bell;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
        className="relative p-2 min-h-0"
      >
        <Bell className="w-6 h-6" />

        {/* Unread Badge */}
        {unreadCount !== undefined && unreadCount > 0 && (
          <span className="absolute top-0 right-0 grid place-items-center w-5 h-5 text-xs font-bold text-brand-foreground bg-status-error rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <Flex
          direction="column"
          className="absolute right-0 mt-2 w-96 bg-ui-bg rounded-lg shadow-xl border border-ui-border z-50 max-h-128 overflow-hidden"
        >
          {/* Header */}
          <Flex align="center" justify="between" className="px-4 py-3 border-b border-ui-border">
            <Typography variant="h4">Notifications</Typography>
            {notifications && notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-brand hover:text-brand min-h-0 p-0"
              >
                Mark all read
              </Button>
            )}
          </Flex>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {status === "LoadingFirstPage" ? (
              <Flex align="center" justify="center" className="py-8">
                <LoadingSpinner />
              </Flex>
            ) : notifications.length === 0 ? (
              <Flex direction="column" align="center" justify="center" className="py-12 px-4">
                <div className="text-6xl mb-4">🔔</div>
                <Typography variant="small" color="secondary" className="text-center">
                  No notifications yet
                </Typography>
                <Typography variant="meta" className="text-center mt-1">
                  We'll notify you when something happens
                </Typography>
              </Flex>
            ) : (
              <div>
                {notifications.map(
                  (notification: Doc<"notifications"> & { actorName?: string }) => (
                    <button
                      key={notification._id}
                      type="button"
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-ui-bg-secondary cursor-pointer border-b border-ui-border transition-colors",
                        !notification.isRead && "bg-brand-subtle",
                      )}
                      onClick={() =>
                        handleNotificationClick(notification._id, notification.issueId)
                      }
                    >
                      <Flex align="start" gap="md">
                        <Icon
                          icon={getNotificationIcon(notification.type)}
                          size="lg"
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <Typography variant="label" as="p">
                            {notification.title}
                          </Typography>
                          <Typography variant="small" color="secondary" className="mt-1">
                            {notification.message}
                          </Typography>
                          <Metadata className="mt-2">
                            <MetadataTimestamp date={notification._creationTime} />
                            {notification.actorName && (
                              <MetadataItem>by {notification.actorName}</MetadataItem>
                            )}
                          </Metadata>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification({ id: notification._id });
                          }}
                          aria-label="Remove notification"
                          className="shrink-0 text-ui-text-tertiary hover:text-ui-text-secondary"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </Flex>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </Flex>
      )}
    </div>
  );
}
