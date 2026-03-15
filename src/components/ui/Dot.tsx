/**
 * Dot - Small circular indicator for status, presence, and decorative purposes.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const dotVariants = cva("shrink-0 rounded-full", {
  variants: {
    size: {
      xs: "h-1.5 w-1.5",
      sm: "h-2 w-2",
      md: "h-2.5 w-2.5",
      lg: "h-3 w-3",
    },
    color: {
      brand: "bg-brand",
      success: "bg-status-success",
      warning: "bg-status-warning",
      error: "bg-status-error",
      info: "bg-status-info",
      muted: "bg-ui-text-tertiary",
    },
  },
  defaultVariants: {
    size: "sm",
    color: "brand",
  },
});

interface DotProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof dotVariants> {
  /** Add pulsing animation */
  pulse?: boolean;
  /** Add brand halo shadow */
  halo?: boolean;
}

function Dot({ className, size, color, pulse, halo, ...props }: DotProps) {
  return (
    <span
      className={cn(
        dotVariants({ size, color }),
        pulse && "animate-pulse",
        halo && "shadow-brand-halo",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Dot, dotVariants };
