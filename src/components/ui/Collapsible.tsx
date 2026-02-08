import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import type * as React from "react";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Collapsible - Expandable/collapsible sections built on Radix.
 *
 * @example
 * // Basic usage
 * <Collapsible>
 *   <CollapsibleTrigger>Section Title</CollapsibleTrigger>
 *   <CollapsibleContent>Content here...</CollapsibleContent>
 * </Collapsible>
 *
 * @example
 * // With icon and badge
 * <Collapsible>
 *   <CollapsibleHeader icon={<Mic />} badge={<Badge>Active</Badge>}>
 *     AI Meeting Notes
 *   </CollapsibleHeader>
 *   <CollapsibleContent>Content here...</CollapsibleContent>
 * </Collapsible>
 */

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        "group flex w-full items-center justify-between text-left text-sm font-medium text-ui-text",
        "transition-all duration-200 ease-out hover:bg-ui-bg-hover rounded-md px-2 py-1.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 ring-offset-ui-bg",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
      {...props}
    >
      <div className={cn("pt-3", className)}>{children}</div>
    </CollapsiblePrimitive.Content>
  );
}

/**
 * CollapsibleHeader - Pre-built header with icon, label, badge, and chevron.
 * Use this for consistent section headers across the app.
 */
interface CollapsibleHeaderProps
  extends Omit<React.ComponentProps<typeof CollapsiblePrimitive.Trigger>, "children"> {
  /** Icon displayed before the label */
  icon?: React.ReactNode;
  /** The label text */
  children: React.ReactNode;
  /** Badge or status indicator after the label */
  badge?: React.ReactNode;
  /** Hide the chevron indicator */
  hideChevron?: boolean;
}

function CollapsibleHeader({
  icon,
  children,
  badge,
  hideChevron = false,
  className,
  ...props
}: CollapsibleHeaderProps) {
  return (
    <CollapsibleTrigger className={cn("-mx-2", className)} {...props}>
      <span className="flex items-center gap-2">
        {icon && (
          <span className="shrink-0 text-ui-text-tertiary w-5 h-5 flex items-center justify-center">
            {icon}
          </span>
        )}
        <span>{children}</span>
        {badge}
      </span>
      {!hideChevron && (
        <ChevronDown className="w-4 h-4 shrink-0 text-ui-text-tertiary transition-transform duration-200 group-data-[state=open]:rotate-180" />
      )}
    </CollapsibleTrigger>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleHeader };
