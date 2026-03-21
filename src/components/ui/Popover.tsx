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
import {
  OverlayBody,
  OverlayDescription,
  OverlayFooter,
  OverlayHeader,
  OverlayTitle,
} from "./OverlayChrome";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const popoverContentVariants = cva(
  "z-50 w-72 rounded-md border border-ui-border bg-ui-bg-elevated p-4 text-ui-text shadow-elevated outline-none origin-[--radix-popover-content-transform-origin] data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
  {
    variants: {
      recipe: {
        default: "",
        overlayInset:
          "rounded-2xl border-ui-border-secondary/70 bg-linear-to-b from-ui-bg-soft/80 via-ui-bg-elevated/96 to-ui-bg-secondary/84 shadow-soft",
        reactionPicker:
          "w-auto rounded-lg border-ui-border bg-ui-bg-elevated p-1.5 shadow-elevated",
        colorPicker: "w-auto rounded-lg border-ui-border bg-ui-bg-elevated p-2 shadow-elevated",
        floatingToolbar:
          "flex w-auto items-center gap-0.5 rounded-container border-ui-border bg-ui-bg-elevated p-1.5 shadow-elevated",
        notificationMenu:
          "w-auto rounded-lg border-ui-border bg-ui-bg-elevated p-4 shadow-elevated",
        sprintWorkload:
          "w-72 overflow-hidden rounded-lg border-ui-border bg-ui-bg-elevated p-0 shadow-elevated",
        slashMenu:
          "rounded-container border-ui-border bg-ui-bg-elevated p-0 shadow-elevated data-[state=open]:animate-scale-in",
      },
      padding: {
        default: "",
        none: "p-0",
      },
    },
    defaultVariants: {
      recipe: "default",
      padding: "default",
    },
  },
);

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
    VariantProps<typeof popoverContentVariants>
>(({ className, align = "center", padding, recipe, sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(popoverContentVariants({ padding, recipe }), className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export {
  OverlayBody as PopoverBody,
  Popover,
  PopoverAnchor,
  PopoverContent,
  OverlayDescription as PopoverDescription,
  OverlayFooter as PopoverFooter,
  OverlayHeader as PopoverHeader,
  OverlayTitle as PopoverTitle,
  PopoverTrigger,
};
