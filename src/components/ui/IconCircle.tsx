/**
 * IconCircle - Circular container for icons, used in hero sections, empty states, etc.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";

const iconCircleVariants = cva("shrink-0 rounded-full", {
  variants: {
    size: {
      xs: "h-6 w-6",
      sm: "h-8 w-8",
      md: "h-12 w-12",
      lg: "h-16 w-16",
      xl: "h-20 w-20",
    },
    variant: {
      soft: "bg-ui-bg-soft",
      brand: "bg-brand-subtle",
      success: "bg-status-success-bg",
      warning: "bg-status-warning-bg",
      error: "bg-status-error-bg",
      muted: "bg-ui-bg-tertiary",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "soft",
  },
});

interface IconCircleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof iconCircleVariants> {}

function IconCircle({ className, size, variant, children, ...props }: IconCircleProps) {
  return (
    <Flex
      align="center"
      justify="center"
      className={cn(iconCircleVariants({ size, variant }), className)}
      {...props}
    >
      {children}
    </Flex>
  );
}

export { IconCircle, iconCircleVariants };
