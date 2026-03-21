/**
 * Icon Component
 *
 * Wrapper for Lucide icons with size variants.
 * Provides consistent sizing and styling props.
 * Use instead of raw Lucide icon imports.
 */

import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { forwardRef, type SVGProps } from "react";
import { cn } from "@/lib/utils";

const iconVariants = cva("", {
  variants: {
    size: {
      xs: "w-3 h-3",
      xsPlus: "w-3.5 h-3.5",
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
      xl: "w-8 h-8",
    },
    tone: {
      default: "",
      secondary: "text-ui-text-secondary",
      tertiary: "text-ui-text-tertiary",
      brand: "text-brand",
      success: "text-status-success",
      warning: "text-status-warning",
      error: "text-status-error",
      info: "text-status-info",
      accent: "text-accent",
    },
    animation: {
      none: "",
      pulse: "animate-pulse",
      spin: "animate-spin",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
    animation: "none",
  },
});

export type IconSize = VariantProps<typeof iconVariants>["size"];

interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, "ref">,
    VariantProps<typeof iconVariants> {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Additional className for layout/animation details not owned by size/tone */
  className?: string;
}

/**
 * Generic icon wrapper with consistent size presets.
 *
 * @example
 * ```tsx
 * import { Bug, Calendar } from "@/lib/icons";
 *
 * <Icon icon={Bug} size="lg" />
 * <Icon icon={Calendar} size="sm" tone="brand" />
 * ```
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size, tone, animation, className, ...props }, ref) => {
    return (
      <IconComponent
        ref={ref}
        className={cn(iconVariants({ size, tone, animation }), className)}
        {...props}
      />
    );
  },
);
Icon.displayName = "Icon";

export { iconVariants };
