import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const progressPillVariants = cva("inline-block rounded-full transition-all duration-medium", {
  variants: {
    tone: {
      active: "bg-brand",
      inactive: "bg-ui-border",
    },
    length: {
      compact: "w-4",
      extended: "w-6",
    },
  },
  defaultVariants: {
    tone: "inactive",
    length: "compact",
  },
});

export interface ProgressPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof progressPillVariants> {}

/**
 * Tiny progress indicator segment used by lightweight multi-step flows.
 */
export const ProgressPill = React.forwardRef<HTMLSpanElement, ProgressPillProps>(
  ({ className, tone, length, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("h-1.5", progressPillVariants({ tone, length }), className)}
        {...props}
      />
    );
  },
);

ProgressPill.displayName = "ProgressPill";
