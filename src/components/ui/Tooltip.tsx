/**
 * Tooltip Component
 *
 * Informational tooltip with hover trigger.
 * Wraps Radix UI Tooltip with accessible defaults.
 * Supports text shortcuts and conditional rendering.
 */

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipRoot = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-ui-bg-elevated border border-ui-border px-3 py-1.5 text-xs text-ui-text shadow-elevated animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export interface TooltipProps {
  /** Content to show in the tooltip */
  content: React.ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactNode;
  /** Side of the trigger to show tooltip */
  side?: "top" | "right" | "bottom" | "left";
  /** Alignment of the tooltip */
  align?: "start" | "center" | "end";
  /** Delay in ms before tooltip shows */
  delayDuration?: number;
  /** Additional class for content */
  className?: string;
}

/**
 * Tooltip component for displaying helpful text on hover.
 *
 * @example
 * // Basic tooltip
 * <Tooltip content="Helpful text">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * // With positioning
 * <Tooltip content="Info" side="right">
 *   <InfoIcon />
 * </Tooltip>
 */
function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration,
  className,
}: TooltipProps) {
  return (
    <TooltipRoot delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={className}>
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}

export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };
