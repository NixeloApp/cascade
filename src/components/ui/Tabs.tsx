/**
 * Tabs Component
 *
 * Tabbed interface with content panels.
 * Supports pill and underline style variants.
 * Wraps Radix UI Tabs with accessible navigation.
 */

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva("inline-flex max-w-full text-ui-text-secondary", {
  variants: {
    variant: {
      /** Pill style - contained background with rounded items */
      pill: "min-h-10 rounded-xl border border-ui-border-secondary/70 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated to-ui-bg-soft/80 p-0.5 shadow-card backdrop-blur-sm supports-[backdrop-filter]:bg-ui-bg-elevated/90 gap-1 sm:min-h-11 sm:rounded-2xl sm:p-1",
      /** Underline style - border-bottom with underline indicators */
      underline: "h-auto bg-transparent border-0 rounded-none p-0 gap-0 -mb-px",
    },
    size: {
      default: "",
      compact: "",
    },
    layout: {
      default: "",
      settings:
        "mb-3 flex w-full flex-nowrap gap-0.5 overflow-x-auto px-0.5 py-0.5 pb-1.5 scrollbar-subtle sm:mb-4 sm:flex-wrap sm:overflow-visible sm:py-1 sm:pb-0.5 lg:flex-nowrap",
    },
  },
  defaultVariants: {
    variant: "pill",
    size: "default",
    layout: "default",
  },
});

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, layout, size, variant, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ layout, size, variant }), className)}
      {...props}
    />
  ),
);
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 ring-offset-ui-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Pill style - background changes on active */
        pill: "rounded-lg px-2.5 py-1.5 text-xs text-ui-text-secondary hover:bg-ui-bg-hover/80 hover:text-ui-text data-[state=active]:bg-ui-bg-elevated data-[state=active]:text-ui-text data-[state=active]:shadow-card data-[state=active]:ring-1 data-[state=active]:ring-ui-border-secondary/70 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm",
        /** Underline style - border-bottom indicator */
        underline:
          "px-4 py-3 text-sm border-b-2 border-transparent rounded-none bg-transparent shadow-none text-ui-text-secondary hover:text-ui-text data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none",
      },
      size: {
        default: "",
        compact: "rounded-full px-2.5 py-1 text-xs sm:rounded-lg sm:px-2.5 sm:py-1",
      },
      width: {
        default: "",
        responsive: "w-auto shrink-0 sm:w-auto",
      },
    },
    defaultVariants: {
      variant: "pill",
      size: "default",
      width: "default",
    },
  },
);

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, size, variant, width, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ size, variant, width }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 ring-offset-ui-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
