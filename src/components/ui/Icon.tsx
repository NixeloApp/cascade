import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon, LucideProps } from "lucide-react";
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
  /** Tooltip/Title for the icon (accessibility) */
  title?: string;
}

/**
 * Generic icon wrapper with consistent size presets.
 * Automatically handles accessibility by hiding decorative icons unless a label is provided.
 *
 * @example
 * ```tsx
 * import { Bug, Calendar } from "@/lib/icons";
 *
 * // Decorative (hidden from screen readers)
 * <Icon icon={Bug} size="lg" />
 *
 * // Interactive/Meaningful (announced as "Calendar")
 * <Icon icon={Calendar} size="sm" aria-label="Calendar" />
 * ```
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size, className, title, ...props }, ref) => {
    // Determine accessibility attributes
    const ariaLabel = props["aria-label"];
    const ariaHiddenProp = props["aria-hidden"];

    // Default to hidden if no label/title provided, unless explicitly set
    const isDecorative = !ariaLabel && !title;
    const ariaHidden = ariaHiddenProp ?? (isDecorative ? "true" : undefined);

    // Cast props to satisfy LucideProps which might be missing strict title typing
    // but ultimately passes through to SVG
    const iconProps = {
      ...props,
      title,
      "aria-hidden": ariaHidden,
      className: cn(iconVariants({ size }), className),
    } as LucideProps;

    return <IconComponent ref={ref} {...iconProps} />;
  },
);
Icon.displayName = "Icon";

export { iconVariants };
