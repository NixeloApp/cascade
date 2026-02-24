import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, type TooltipProps } from "./Tooltip";

/**
 * IconButton - A compact button designed for icons.
 *
 * Use this instead of raw Tailwind hover states for icon buttons.
 * For text buttons, use the regular Button component.
 *
 * @example
 * // Basic icon button
 * <IconButton><XIcon /></IconButton>
 *
 * // With tooltip (automatically handles aria-label)
 * <IconButton tooltip="Close"><XIcon /></IconButton>
 *
 * // Different sizes
 * <IconButton size="sm"><PlusIcon /></IconButton>
 * <IconButton size="lg"><MenuIcon /></IconButton>
 *
 * // Variants
 * <IconButton variant="ghost"><SettingsIcon /></IconButton>
 * <IconButton variant="subtle"><EditIcon /></IconButton>
 * <IconButton variant="danger"><TrashIcon /></IconButton>
 */

const iconButtonVariants = cva(
  "inline-flex items-center justify-center shrink-0 rounded-secondary transition-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Default: subtle background on hover */
        ghost: "text-ui-text-tertiary hover:text-ui-text hover:bg-ui-bg-hover",
        /** Slightly more visible: secondary text */
        subtle: "text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover",
        /** For actions on existing backgrounds */
        muted: "text-ui-text-tertiary hover:text-ui-text-secondary",
        /** Danger action (delete, remove) */
        danger: "text-ui-text-tertiary hover:text-status-error hover:bg-status-error-bg",
        /** Brand action */
        brand: "text-ui-text-tertiary hover:text-brand hover:bg-brand-subtle",
        /** Solid background (for toolbars) */
        solid:
          "bg-ui-bg-soft text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text border border-ui-border",
      },
      size: {
        xs: "h-6 w-6 p-1",
        sm: "h-8 w-8 p-1.5",
        md: "h-9 w-9 p-2",
        lg: "h-10 w-10 p-2.5",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "sm",
    },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Render as child element (for wrapping links, etc.) */
  asChild?: boolean;
  /**
   * Optional tooltip text.
   * If provided, wraps the button in a Tooltip and sets the aria-label (if not explicitly provided).
   */
  tooltip?: string;
  /** Side to display the tooltip */
  tooltipSide?: TooltipProps["side"];
  /** Additional class for tooltip content */
  tooltipClassName?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      type = "button",
      tooltip,
      tooltipSide,
      tooltipClassName,
      ...props
    },
    ref,
  ) => {
    // Determine effective aria-label
    // Prefer explicit aria-label from props, fallback to tooltip string
    const ariaLabel = props["aria-label"] || tooltip;

    const Comp = asChild ? Slot : "button";

    const button = (
      <Comp
        className={cn(iconButtonVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        {...props}
      />
    );

    if (tooltip) {
      return (
        <Tooltip content={tooltip} side={tooltipSide} className={tooltipClassName}>
          {button}
        </Tooltip>
      );
    }

    return button;
  },
);
IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
