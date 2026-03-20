import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const insetPanelVariants = cva("border border-ui-border-secondary/70 bg-ui-bg-soft/90", {
  variants: {
    size: {
      default: "p-3",
      compact: "px-3 py-2",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface InsetPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof insetPanelVariants> {}

export const InsetPanel = React.forwardRef<HTMLDivElement, InsetPanelProps>(
  ({ className, size, ...props }, ref) => (
    <div ref={ref} className={cn(insetPanelVariants({ size }), className)} {...props} />
  ),
);

InsetPanel.displayName = "InsetPanel";
