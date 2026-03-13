/**
 * Popover Component
 *
 * Floating content anchored to a trigger element.
 * Wraps Radix UI Popover with styled content.
 * Supports controlled and uncontrolled modes.
 */

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const popoverContentVariants = cva(
  "z-50 w-72 rounded-md border border-ui-border bg-ui-bg-elevated p-4 text-ui-text shadow-elevated outline-none data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out origin-[--radix-popover-content-transform-origin]",
  {
    variants: {
      recipe: {
        default: "",
        overlayInset:
          "rounded-2xl border-ui-border-secondary/70 bg-linear-to-b from-ui-bg-soft/80 via-ui-bg-elevated/96 to-ui-bg-secondary/84 shadow-soft",
        slashMenu:
          "rounded-container border-ui-border bg-ui-bg-elevated p-0 shadow-elevated data-[state=open]:animate-scale-in",
      },
    },
    defaultVariants: {
      recipe: "default",
    },
  },
);

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
    VariantProps<typeof popoverContentVariants>
>(({ className, align = "center", recipe, sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(popoverContentVariants({ recipe }), className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
