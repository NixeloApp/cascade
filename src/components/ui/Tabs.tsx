/**
 * Tabs Component
 *
 * Tabbed interface with content panels.
 * Supports segmented and underline style variants.
 * Wraps Radix UI Tabs with accessible navigation.
 */

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva("inline-flex max-w-full items-center text-ui-text-secondary", {
  variants: {
    variant: {
      /** Segmented style - shared chrome for compact view switching */
      pill: "min-h-10 gap-1 rounded-2xl border border-ui-border-secondary/70 bg-ui-bg-secondary/90 p-1 shadow-soft",
      /** Underline style - low-chrome section navigation */
      underline:
        "h-auto gap-5 border-0 border-b border-ui-border/70 rounded-none bg-transparent p-0",
    },
    size: {
      default: "",
      compact: "",
    },
    layout: {
      default: "",
      settings:
        "relative mb-3 flex w-full flex-nowrap gap-0.5 overflow-x-auto px-0.5 py-0.5 pb-1.5 scrollbar-subtle after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-6 after:bg-linear-to-l after:from-ui-bg-elevated after:to-transparent sm:mb-4 sm:flex-wrap sm:overflow-visible sm:py-1 sm:pb-0.5 sm:after:hidden lg:flex-nowrap",
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
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-default ring-offset-ui-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Segmented style - neutral by default, elevated when active */
        pill: "min-h-8 rounded-xl px-3 py-1.5 text-sm text-ui-text-secondary hover:bg-ui-bg-hover hover:text-ui-text data-[state=active]:bg-ui-bg data-[state=active]:text-ui-text data-[state=active]:shadow-soft data-[state=active]:ring-1 data-[state=active]:ring-ui-border-secondary/70",
        /** Underline style - border-bottom indicator */
        underline:
          "rounded-none border-b-2 border-transparent px-1 py-3 text-sm bg-transparent shadow-none text-ui-text-secondary hover:text-ui-text data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:text-ui-text data-[state=active]:shadow-none",
      },
      size: {
        default: "",
        compact: "min-h-7 rounded-full px-2.5 py-1 text-xs sm:min-h-8 sm:px-3 sm:text-sm",
      },
      width: {
        default: "",
        responsive: "w-auto shrink-0",
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
