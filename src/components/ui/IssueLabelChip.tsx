import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Check } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

const issueLabelChipVariants = cva(
  "inline-flex items-center rounded-full text-sm font-medium text-brand-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "opacity-100 ring-2 ring-brand ring-offset-2",
        false: "opacity-60 hover:opacity-80",
      },
      size: {
        sm: "h-7 px-2.5 py-1",
        md: "h-auto px-3 py-1",
      },
    },
    defaultVariants: {
      selected: false,
      size: "md",
    },
  },
);

export interface IssueLabelChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof issueLabelChipVariants> {
  color: string;
  showCheck?: boolean;
}

export const IssueLabelChip = React.forwardRef<HTMLButtonElement, IssueLabelChipProps>(
  ({ className, color, selected, size, showCheck = false, children, style, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(issueLabelChipVariants({ selected, size }), className)}
      style={{ backgroundColor: color, ...style }}
      {...props}
    >
      {showCheck && <Icon icon={Check} size="sm" className="mr-1" />}
      {children}
    </button>
  ),
);
IssueLabelChip.displayName = "IssueLabelChip";

export { issueLabelChipVariants };
