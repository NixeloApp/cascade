/**
 * AIAssistantButton - Reusable floating button for AI assistant
 */

import { Bot } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { AI_CONFIG } from "./config";

export interface AIAssistantButtonProps {
  onClick: () => void;
  unreadCount?: number;
  position?: {
    bottom?: number;
    right?: number;
    top?: number;
    left?: number;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
  keyboardShortcut?: string;
}

const SIZE_CLASSES = {
  sm: "w-12 h-12 text-xl",
  md: "w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl",
  lg: "w-16 h-16 sm:w-20 sm:h-20 text-3xl sm:text-4xl",
} as const;

export function AIAssistantButton({
  onClick,
  unreadCount = 0,
  position,
  size = "md",
  className = "",
  keyboardShortcut = "Cmd/Ctrl+Shift+A",
}: AIAssistantButtonProps) {
  const positionClasses = position
    ? [
        position.bottom !== undefined && `bottom-${position.bottom}`,
        position.right !== undefined && `right-${position.right}`,
        position.top !== undefined && `top-${position.top}`,
        position.left !== undefined && `left-${position.left}`,
      ]
        .filter(Boolean)
        .join(" ")
    : "bottom-6 right-6 sm:bottom-8 sm:right-8";

  const tooltipText =
    unreadCount > 0
      ? `AI Assistant (${keyboardShortcut}) - ${unreadCount} new suggestion${unreadCount > 1 ? "s" : ""}`
      : `AI Assistant (${keyboardShortcut})`;

  const ariaLabel =
    unreadCount > 0 ? `Open AI Assistant (${unreadCount} unread)` : "Open AI Assistant";

  const displayCount =
    unreadCount > AI_CONFIG.badge.maxCount ? `${AI_CONFIG.badge.maxCount}+` : unreadCount;

  return (
    <Button
      variant="unstyled"
      onClick={onClick}
      className={cn(
        "fixed",
        positionClasses,
        SIZE_CLASSES[size],
        "bg-linear-to-r from-brand to-accent text-brand-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 transition-all duration-default flex items-center justify-center z-30 group",
        className,
      )}
      title={tooltipText}
      aria-label={ariaLabel}
    >
      <Icon icon={Bot} size="lg" />
      {unreadCount > 0 && (
        <Flex
          align="center"
          justify="center"
          className="absolute -top-1 -right-1 w-6 h-6 bg-status-error text-brand-foreground text-xs font-bold rounded-full shadow-md animate-pulse"
        >
          {displayCount}
        </Flex>
      )}
    </Button>
  );
}
