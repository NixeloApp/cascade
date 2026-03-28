/**
 * Badge Component
 *
 * Small status indicator with color variants.
 * Supports semantic colors, sizes, and dot decorations.
 * Use for labels, counts, and status indicators.
 */

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center font-medium transition-colors duration-fast", {
  variants: {
    variant: {
      primary: "bg-brand-subtle text-brand-active border border-brand-border",
      secondary: "bg-ui-bg-soft text-ui-text-secondary border border-ui-border",
      success: "bg-status-success-bg text-status-success-text border border-status-success/20",
      error: "bg-status-error-bg text-status-error-text border border-status-error/20",
      warning: "bg-status-warning-bg text-status-warning-text border border-status-warning/20",
      info: "bg-status-info-bg text-status-info-text border border-status-info/20",
      neutral: "bg-ui-bg-soft text-ui-text-secondary border border-ui-border",
      brand: "bg-brand-subtle text-brand-active border border-brand-border",
      accent: "bg-accent-subtle text-accent-active border border-accent-border",
      outline:
        "bg-transparent text-ui-text-secondary border border-ui-border hover:border-ui-border-secondary hover:bg-ui-bg-soft",
    },
    priorityTone: {
      none: "",
      highest: "bg-status-error-bg text-priority-highest border border-transparent",
      high: "bg-status-warning-bg text-priority-high border border-transparent",
      medium: "bg-status-warning-bg text-priority-medium border border-transparent",
      low: "bg-status-info-bg text-priority-low border border-transparent",
      lowest: "bg-ui-bg-tertiary text-priority-lowest border border-transparent",
    },
    statusTone: {
      none: "",
      success: "bg-status-success-bg text-status-success-text border border-transparent",
      warning: "bg-status-warning-bg text-status-warning-text border border-transparent",
      error: "bg-status-error-bg text-status-error-text border border-transparent",
      info: "bg-status-info-bg text-status-info-text border border-transparent",
      neutral: "bg-ui-bg-tertiary text-ui-text-secondary border border-transparent",
    },
    size: {
      sm: "text-xs px-2 py-0.5",
      md: "text-xs px-2 py-1",
      emphasis: "text-xs px-2 py-0.5 font-bold",
    },
    shape: {
      rounded: "rounded",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "neutral",
    priorityTone: "none",
    statusTone: "none",
    size: "sm",
    shape: "rounded",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component for tags, labels, and status indicators.
 *
 * @example
 * // Default badge
 * <Badge>Tag</Badge>
 *
 * // Success badge
 * <Badge variant="success">Active</Badge>
 *
 * // Pill-shaped badge
 * <Badge variant="brand" shape="pill">New</Badge>
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, priorityTone, shape, size, statusTone, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, priorityTone, shape, size, statusTone }), className)}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
