/**
 * Popover Component
 *
 * Floating content anchored to a trigger or explicit anchor element.
 * Owns the Radix popover anatomy so feature code only interacts with a single wrapper API.
 */

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { OverlayBody, OverlayFooter, OverlayHeader } from "./OverlayChrome";
import { Tooltip, type TooltipProps } from "./Tooltip";

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

type PopoverContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;
type PopoverHeaderDensity = "default" | "compact";
type PopoverRenderContext = {
  close: () => void;
  open: boolean;
};
type PopoverSlot = React.ReactNode | ((context: PopoverRenderContext) => React.ReactNode);

function resolveSlot(slot: PopoverSlot | undefined, context: PopoverRenderContext) {
  if (typeof slot === "function") {
    return slot(context);
  }
  return slot;
}

export interface PopoverProps extends VariantProps<typeof popoverContentVariants> {
  align?: PopoverContentProps["align"];
  anchor?: React.ReactNode;
  avoidCollisions?: PopoverContentProps["avoidCollisions"];
  bodyClassName?: string;
  children?: PopoverSlot;
  className?: string;
  collisionPadding?: PopoverContentProps["collisionPadding"];
  contentTestId?: string;
  defaultOpen?: boolean;
  footer?: PopoverSlot;
  footerClassName?: string;
  header?: PopoverSlot;
  headerClassName?: string;
  headerDensity?: PopoverHeaderDensity;
  modal?: boolean;
  onCloseAutoFocus?: PopoverContentProps["onCloseAutoFocus"];
  onEscapeKeyDown?: PopoverContentProps["onEscapeKeyDown"];
  onInteractOutside?: PopoverContentProps["onInteractOutside"];
  onOpenAutoFocus?: PopoverContentProps["onOpenAutoFocus"];
  onOpenChange?: (open: boolean) => void;
  onPointerDownOutside?: PopoverContentProps["onPointerDownOutside"];
  open?: boolean;
  side?: PopoverContentProps["side"];
  sideOffset?: number;
  tooltip?: Omit<TooltipProps, "children">;
  trigger?: React.ReactElement;
}

export function Popover({
  align = "center",
  anchor,
  avoidCollisions,
  bodyClassName,
  children,
  className,
  collisionPadding,
  contentTestId,
  defaultOpen = false,
  footer,
  footerClassName,
  header,
  headerClassName,
  headerDensity = "default",
  modal,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onInteractOutside,
  onOpenAutoFocus,
  onOpenChange,
  onPointerDownOutside,
  open,
  padding,
  recipe,
  side,
  sideOffset = 4,
  tooltip,
  trigger,
}: PopoverProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const resolvedOpen = isControlled ? open : internalOpen;

  const setResolvedOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const context = React.useMemo<PopoverRenderContext>(
    () => ({
      close: () => setResolvedOpen(false),
      open: resolvedOpen,
    }),
    [resolvedOpen, setResolvedOpen],
  );

  const renderedHeader = resolveSlot(header, context);
  const renderedChildren = resolveSlot(children, context);
  const renderedFooter = resolveSlot(footer, context);
  const shouldRenderBodyChrome =
    bodyClassName !== undefined || renderedHeader != null || renderedFooter != null;

  const triggerElement = trigger ? (
    <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
  ) : null;

  return (
    <PopoverPrimitive.Root modal={modal} open={resolvedOpen} onOpenChange={setResolvedOpen}>
      {triggerElement ? (
        tooltip ? (
          <Tooltip {...tooltip}>{triggerElement}</Tooltip>
        ) : (
          triggerElement
        )
      ) : null}
      {anchor}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          avoidCollisions={avoidCollisions}
          className={cn(popoverContentVariants({ padding, recipe }), className)}
          collisionPadding={collisionPadding}
          data-testid={contentTestId}
          onCloseAutoFocus={onCloseAutoFocus}
          onEscapeKeyDown={onEscapeKeyDown}
          onInteractOutside={onInteractOutside}
          onOpenAutoFocus={onOpenAutoFocus}
          onPointerDownOutside={onPointerDownOutside}
          side={side}
          sideOffset={sideOffset}
        >
          {renderedHeader != null ? (
            <OverlayHeader className={headerClassName} density={headerDensity} surface="popover">
              {renderedHeader}
            </OverlayHeader>
          ) : null}
          {shouldRenderBodyChrome ? (
            <OverlayBody className={bodyClassName} surface="popover">
              {renderedChildren}
            </OverlayBody>
          ) : (
            renderedChildren
          )}
          {renderedFooter != null ? (
            <OverlayFooter className={footerClassName} surface="popover">
              {renderedFooter}
            </OverlayFooter>
          ) : null}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
