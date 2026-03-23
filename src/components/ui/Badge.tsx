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
      landingHero:
        "border-ui-border/60 bg-ui-bg-elevated/88 px-4 py-2 text-ui-text shadow-soft backdrop-blur-sm hover:border-ui-border-secondary",
      mention:
        "inline-flex items-center gap-1 align-baseline cursor-pointer border border-transparent bg-brand-subtle text-brand",
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
      dashboardTag:
        "bg-ui-bg-tertiary/60 text-ui-text-secondary border border-ui-border/50 uppercase",
      issueKey: "bg-ui-bg-tertiary/60 text-ui-text-secondary border border-ui-border/50 font-mono",
      sidebarSection:
        "bg-ui-bg-elevated/80 text-ui-text-secondary border border-ui-border/60 shadow-soft uppercase tracking-wider font-semibold",
      roadmapToday: "bg-status-error text-brand-foreground border border-status-error/20 shadow-sm",
      roadmapGroup:
        "bg-ui-bg-tertiary text-ui-text-secondary border border-transparent font-medium",
      projectHeaderKey:
        "bg-ui-bg-soft text-ui-text-secondary border border-ui-border uppercase tracking-wider",
      calendarDayCurrent: "bg-transparent text-ui-text border border-transparent",
      calendarDayMuted: "bg-transparent text-ui-text-tertiary border border-transparent",
      calendarDayToday: "bg-brand text-brand-foreground border border-transparent shadow-sm",
      calendarHeaderCount: "bg-transparent text-ui-text border border-ui-border shadow-none",
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
      mentionInput: "px-1 py-0 text-sm",
      sm: "text-xs px-2 py-0.5",
      md: "text-xs px-2 py-1",
      emphasis: "text-xs px-2 py-0.5 font-bold",
      fabAlertCount: "min-h-6 min-w-6 justify-center px-1.5 text-xs",
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
