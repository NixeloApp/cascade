import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Typography } from "./Typography";

type EmptyStateVariant = "default" | "info" | "warning" | "error";

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
  /** Optional className for the container */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
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

  return (
    <div
      className={cn("text-center py-12 px-4 animate-fade-in", className)}
      role="status"
      aria-label={title}
    >
      <div className={cn("text-6xl mb-4", iconColorClass)}>
        {typeof icon === "string" ? icon : <Icon icon={icon} size="xl" className="mx-auto" />}
      </div>
      <Typography variant="large" as="h3" className="mb-1">
        {title}
      </Typography>
      {description && (
        <Typography variant="small" color="secondary" className="mb-4 max-w-sm mx-auto">
          {description}
        </Typography>
      )}
      {action && <div className="mt-4">{renderAction()}</div>}
    </div>
  );
}
