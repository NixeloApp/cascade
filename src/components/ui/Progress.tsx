/**
 * Progress Component
 *
 * Progress bar with color variants.
 * Wraps Radix UI Progress with semantic styling.
 * Use for loading states and completion indicators.
 */

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 rounded-full transition-transform duration-default ease-out",
  {
    variants: {
      variant: {
        default: "bg-brand",
        success: "bg-status-success",
        warning: "bg-status-warning",
        error: "bg-status-error",
        info: "bg-status-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressIndicatorVariants> {
  indicatorClassName?: string;
}

/**
 * Progress bar component with status variants.
 *
 * @example
 * // Default (brand color)
 * <Progress value={50} />
 *
 * // Success variant
 * <Progress value={100} variant="success" />
 *
 * // Error variant
 * <Progress value={25} variant="error" />
 */
const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, variant, indicatorClassName, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-ui-bg-tertiary",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(progressIndicatorVariants({ variant }), indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  ),
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress, progressIndicatorVariants };
