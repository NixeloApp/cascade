import type * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";

export interface ResizablePanelGroupProps
  extends React.ComponentPropsWithoutRef<typeof ResizablePrimitive.Group> {}

/**
 * ResizablePanelGroup - Container for resizable panels.
 *
 * @example
 * <ResizablePanelGroup direction="horizontal">
 *   <ResizablePanel>Left</ResizablePanel>
 *   <ResizableHandle />
 *   <ResizablePanel>Right</ResizablePanel>
 * </ResizablePanelGroup>
 */
function ResizablePanelGroup({ className, ...props }: ResizablePanelGroupProps) {
  return (
    <ResizablePrimitive.Group
      className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
      {...props}
    />
  );
}

export interface ResizablePanelProps
  extends React.ComponentPropsWithoutRef<typeof ResizablePrimitive.Panel> {}

/**
 * ResizablePanel - Individual resizable panel within a group.
 */
const ResizablePanel = ResizablePrimitive.Panel;

export interface ResizableHandleProps
  extends React.ComponentPropsWithoutRef<typeof ResizablePrimitive.Separator> {
  withHandle?: boolean;
}

/**
 * ResizableHandle - Drag handle between resizable panels.
 * Mintlify-inspired styling: subtle border that becomes more visible on hover.
 *
 * @example
 * // Simple divider
 * <ResizableHandle />
 *
 * // With visible grip handle
 * <ResizableHandle withHandle />
 */
function ResizableHandle({ withHandle, className, ...props }: ResizableHandleProps) {
  return (
    <ResizablePrimitive.Separator
      className={cn(
        "relative flex w-px items-center justify-center bg-ui-border",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
        "transition-colors duration-default",
        "hover:bg-ui-border-secondary",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ui-border-focus focus-visible:ring-offset-1",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1",
        "data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2",
        "data-[panel-group-direction=vertical]:after:translate-x-0",
        "[&[data-resize-handle-state=drag]]:bg-ui-border-secondary",
        "[&[data-resize-handle-state=hover]]:bg-ui-border-secondary",
        "cursor-col-resize data-[panel-group-direction=vertical]:cursor-row-resize",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            "z-10 flex h-4 w-3 items-center justify-center rounded-secondary border border-ui-border bg-ui-bg-elevated",
            "transition-colors duration-default",
            "group-hover:border-ui-border-secondary",
          )}
        >
          <svg
            className="h-2.5 w-2.5 text-ui-text-tertiary"
            viewBox="0 0 6 10"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="1" cy="2" r="0.75" />
            <circle cx="1" cy="5" r="0.75" />
            <circle cx="1" cy="8" r="0.75" />
            <circle cx="5" cy="2" r="0.75" />
            <circle cx="5" cy="5" r="0.75" />
            <circle cx="5" cy="8" r="0.75" />
          </svg>
        </div>
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
