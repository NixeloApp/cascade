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
      mention: "bg-brand-subtle text-brand border border-transparent",
      mentionInput:
        "relative inline-block border border-transparent bg-ui-bg-secondary text-ui-text font-normal shadow-none",
      secondary: "bg-ui-bg-soft text-ui-text-secondary border border-ui-border",
      alertCount: "bg-status-error text-brand-foreground border border-status-error/20 shadow-md",
      success: "bg-status-success-bg text-status-success-text border border-status-success/20",
      error: "bg-status-error-bg text-status-error-text border border-status-error/20",
      warning: "bg-status-warning-bg text-status-warning-text border border-status-warning/20",
      info: "bg-status-info-bg text-status-info-text border border-status-info/20",
      neutral: "bg-ui-bg-soft text-ui-text-secondary border border-ui-border",
      brand: "bg-brand-subtle text-brand-active border border-brand-border",
      accent: "bg-accent-subtle text-accent-active border border-accent-border",
      calendarDayCurrent: "bg-transparent text-ui-text border border-transparent",
      calendarDayMuted: "bg-transparent text-ui-text-tertiary border border-transparent",
      calendarDayToday: "bg-brand text-brand-foreground border border-transparent shadow-sm",
      calendarHeaderCount: "bg-transparent text-ui-text border border-ui-border shadow-none",
      outline:
        "bg-transparent text-ui-text-secondary border border-ui-border hover:border-ui-border-secondary hover:bg-ui-bg-soft",
    },
    size: {
      mentionInput: "px-1 py-0 text-sm",
      sm: "text-xs px-2 py-0.5",
      md: "text-xs px-2 py-1",
      calendarHeaderCount: "px-1.5 py-0.5 text-xs",
      calendarDay: "h-6 w-6 justify-center px-0 text-xs sm:h-7 sm:w-7 sm:text-sm",
    },
    shape: {
      rounded: "rounded",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "neutral",
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
  ({ className, variant, size, shape, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape }), className)}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
