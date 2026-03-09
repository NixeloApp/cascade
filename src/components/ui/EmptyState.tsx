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
  /** Optional className for the container */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  size = "default",
  align = "center",
  className,
}: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null;

    // Check if action is a button configuration object
    if (typeof action === "object" && action !== null && "label" in action && "onClick" in action) {
      const act = action as { label: string; onClick: () => void };
      if (typeof act.label === "string" && typeof act.onClick === "function") {
        return <Button onClick={act.onClick}>{act.label}</Button>;
      }
    }
    return action as ReactNode;
  };

  const iconColorClass = {
    default: "text-ui-text-tertiary",
    info: "text-status-info",
    warning: "text-status-warning",
    error: "text-status-error",
  }[variant];

  const sizeClass = {
    default: "min-h-56 max-w-2xl px-6 py-8 sm:px-8 sm:py-9",
    compact: "min-h-44 px-5 py-5 sm:px-6",
  }[size];

  const iconShellClass = {
    default: "mb-4 h-14 w-14",
    compact: "mb-4 h-12 w-12",
  }[size];

  const iconClass = size === "compact" ? "text-2xl" : "text-3xl";
  const isStartAligned = align === "start";

  return (
    <section
      className={cn(
        "mx-auto flex w-full flex-col justify-center rounded-container border border-ui-border/70 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated to-ui-bg-secondary/70 animate-fade-in",
        size === "compact" ? "shadow-card" : "shadow-soft",
        isStartAligned ? "items-start text-left" : "items-center text-center",
        sizeClass,
        className,
      )}
      aria-label={title}
    >
      {size === "default" || size === "compact" ? (
        <div className="mb-4 inline-flex items-center rounded-full border border-ui-border/70 bg-ui-bg-soft px-3 py-1 text-xs font-medium uppercase tracking-wider text-ui-text-tertiary">
          {size === "compact" ? "Waiting for updates" : "Nothing here yet"}
        </div>
      ) : null}
      <div
        className={cn(
          "flex items-center justify-center rounded-full border border-ui-border bg-ui-bg-secondary shadow-soft",
          iconShellClass,
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
      <Typography variant={size === "compact" ? "large" : "h4"} as="h3" className="mb-2">
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
      {action && <div className="mt-6">{renderAction()}</div>}
    </section>
  );
}
