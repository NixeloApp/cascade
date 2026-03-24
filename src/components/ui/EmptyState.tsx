/**
 * Empty State Component
 *
 * Placeholder for empty lists and no-data states.
 * Displays icon, title, description, and action button.
 * Supports semantic variants for different contexts.
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Typography } from "./Typography";

type EmptyStateVariant = "default" | "info" | "warning" | "error";
type EmptyStateSize = "default" | "compact";
type EmptyStateAlign = "center" | "start";
type EmptyStateSurface = "default" | "bare";

interface EmptyStateProps {
  icon: string | LucideIcon;
  title: string;
  description?: string;
  action?:
    | ReactNode
    | {
        label: string;
        onClick: () => void;
      };
  /** Visual variant for different contexts */
  variant?: EmptyStateVariant;
  /** Density variant for full-page versus in-card empty states */
  size?: EmptyStateSize;
  /** Horizontal alignment for the shell and copy */
  align?: EmptyStateAlign;
  /** Surface treatment for embedded versus standalone states */
  surface?: EmptyStateSurface;
  /** Optional className for the container */
  className?: string;
  /** Optional additional content below the description */
  children?: ReactNode;
  /** Optional data-testid for E2E testing */
  "data-testid"?: string;
}

const EMPTY_STATE_ICON_COLOR_CLASS: Record<EmptyStateVariant, string> = {
  default: "text-ui-text-tertiary",
  info: "text-status-info",
  warning: "text-status-warning",
  error: "text-status-error",
};

const EMPTY_STATE_SIZE_CLASS: Record<EmptyStateSize, string> = {
  default: "min-h-56 max-w-2xl px-6 py-8 sm:px-8 sm:py-9",
  compact: "min-h-20 px-3 py-2.5 sm:min-h-24 sm:px-4 sm:py-3",
};

const EMPTY_STATE_ICON_SHELL_CLASS: Record<EmptyStateSize, string> = {
  default: "mb-4 h-14 w-14",
  compact: "mb-1.5 h-7 w-7",
};

function EmptyStateBadge({
  size,
  surface,
  variant,
}: {
  size: EmptyStateSize;
  surface: EmptyStateSurface;
  variant: EmptyStateVariant;
}) {
  // Only show badge for default variant; other variants use icon color to convey meaning
  if (variant !== "default") return null;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-ui-border/70 bg-ui-bg-soft text-xs font-medium uppercase tracking-wider text-ui-text-tertiary",
        size === "compact"
          ? surface === "bare"
            ? "mb-1 px-1.5 py-0.5 text-micro"
            : "mb-1.5 px-2 py-0.5"
          : "mb-4 px-3 py-1",
      )}
    >
      {size === "compact" ? "Waiting for updates" : "Nothing here yet"}
    </div>
  );
}

function EmptyStateIcon({
  icon,
  iconColorClass,
  size,
}: {
  icon: string | LucideIcon;
  iconColorClass: string;
  size: EmptyStateSize;
}) {
  const iconClass = size === "compact" ? "text-2xl" : "text-3xl";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-ui-border bg-ui-bg-secondary shadow-soft",
        EMPTY_STATE_ICON_SHELL_CLASS[size],
        iconColorClass,
      )}
    >
      {typeof icon === "string" ? (
        <span aria-hidden="true" className={iconClass}>
          {icon}
        </span>
      ) : (
        <Icon
          icon={icon}
          size={size === "compact" ? "md" : "lg"}
          className="mx-auto"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function renderEmptyStateAction(action: EmptyStateProps["action"]) {
  if (!action) return null;

  if (typeof action === "object" && "label" in action && "onClick" in action) {
    return <Button onClick={action.onClick}>{action.label}</Button>;
  }

  return action;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  size = "default",
  align = "center",
  surface = "default",
  className,
  children,
  "data-testid": dataTestId,
}: EmptyStateProps) {
  const iconColorClass = EMPTY_STATE_ICON_COLOR_CLASS[variant];
  const sizeClass = EMPTY_STATE_SIZE_CLASS[size];
  const isStartAligned = align === "start";
  const isBare = surface === "bare";

  return (
    <section
      data-testid={dataTestId}
      className={cn(
        "mx-auto flex w-full flex-col justify-center animate-fade-in",
        isBare
          ? "rounded-none border-transparent bg-transparent shadow-none"
          : "rounded-container border border-ui-border/70 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated to-ui-bg-secondary/70",
        isBare && size === "compact" && "max-w-none px-0 py-0",
        !isBare && (size === "compact" ? "shadow-card" : "shadow-soft"),
        isStartAligned ? "items-start text-left" : "items-center text-center",
        sizeClass,
        className,
      )}
      aria-label={title}
    >
      <EmptyStateBadge size={size} surface={surface} variant={variant} />
      <EmptyStateIcon icon={icon} iconColorClass={iconColorClass} size={size} />
      <Typography
        variant={size === "compact" ? "large" : "h4"}
        as="h3"
        className={cn("mb-2", size === "compact" && "text-sm")}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="small"
          color="secondary"
          className={cn("max-w-md", isStartAligned ? "" : "mx-auto")}
        >
          {description}
        </Typography>
      )}
      {children}
      {action && (
        <div className={size === "compact" ? "mt-4" : "mt-6"}>{renderEmptyStateAction(action)}</div>
      )}
    </section>
  );
}
