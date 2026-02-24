import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Clickable - Adds interactive hover/focus states to any element.
 *
 * Use this instead of raw Tailwind hover states for clickable containers.
 * For buttons, use Button. For list items, use ListItem.
 *
 * @example
 * // Basic clickable div
 * <Clickable onClick={handleClick}>
 *   <Card>Content</Card>
 * </Clickable>
 *
 * // As a link wrapper
 * <Clickable asChild>
 *   <Link to="/page">Go to page</Link>
 * </Clickable>
 *
 * // With different variants
 * <Clickable variant="subtle" className="p-4 rounded-lg">
 *   Clickable area
 * </Clickable>
 */

const clickableVariants = cva("cursor-pointer transition-fast", {
  variants: {
    variant: {
      /** Background changes on hover */
      default: "hover:bg-ui-bg-hover",
      /** More subtle - just slight background change */
      subtle: "hover:bg-ui-bg-secondary",
      /** Card-like with shadow elevation */
      elevated: "hover:shadow-card-hover hover:border-ui-border-secondary",
      /** Text color change only */
      text: "hover:text-ui-text",
      /** Brand color on hover */
      brand: "hover:text-brand",
      /** No visual change, just cursor */
      none: "",
    },
    /** Focus ring style */
    focusRing: {
      default:
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-1",
      inset:
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-inset",
      none: "",
    },
    /** Disabled state */
    disabled: {
      true: "pointer-events-none opacity-50 cursor-not-allowed",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    focusRing: "default",
    disabled: false,
  },
});

export interface ClickableProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof clickableVariants> {
  /** Render as child element */
  asChild?: boolean;
}

const Clickable = React.forwardRef<HTMLDivElement, ClickableProps>(
  ({ className, variant, focusRing, disabled, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn(clickableVariants({ variant, focusRing, disabled, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Clickable.displayName = "Clickable";

export { Clickable, clickableVariants };
