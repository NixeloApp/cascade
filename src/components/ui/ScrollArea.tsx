/**
 * Scroll Area Component
 *
 * Custom scrollbar with cross-platform styling.
 * Wraps Radix UI ScrollArea with themed bars.
 * Use for scrollable content regions.
 */

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const scrollAreaVariants = cva("relative overflow-hidden", {
  variants: {
    size: {
      none: "",
      contentSm: "max-h-40",
      contentLg: "max-h-96",
    },
  },
  defaultVariants: {
    size: "none",
  },
});

function ScrollArea({
  className,
  children,
  size,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> &
  VariantProps<typeof scrollAreaVariants>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn(scrollAreaVariants({ size }), className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="h-full w-full rounded-[inherit] [&>div]:!block"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" && "h-full w-1.5 border-l border-l-transparent p-px",
        orientation === "horizontal" && "h-1.5 flex-col border-t border-t-transparent p-px",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-scrollbar-thumb transition-colors hover:bg-scrollbar-thumb-hover"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
