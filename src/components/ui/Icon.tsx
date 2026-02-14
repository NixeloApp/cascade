import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { forwardRef, type SVGProps } from "react";
import { cn } from "@/lib/utils";

const iconVariants = cva("", {
  variants: {
    size: {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
      xl: "w-8 h-8",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type IconSize = VariantProps<typeof iconVariants>["size"];

interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, "ref">,
    VariantProps<typeof iconVariants> {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Additional className for the icon */
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
 * <Icon icon={Calendar} size="sm" className="text-brand" />
 * ```
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size, className, ...props }, ref) => {
    return <IconComponent ref={ref} className={cn(iconVariants({ size }), className)} {...props} />;
  },
);
Icon.displayName = "Icon";

export { iconVariants };
