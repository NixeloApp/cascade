import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useState,
} from "react";

type PopoverRenderContext = {
  close: () => void;
  open: boolean;
};

type PopoverSlot = ReactNode | ((context: PopoverRenderContext) => ReactNode);

type MockPopoverProps = {
  bodyClassName?: string;
  children?: PopoverSlot;
  className?: string;
  contentTestId?: string;
  defaultOpen?: boolean;
  footer?: PopoverSlot;
  footerClassName?: string;
  header?: PopoverSlot;
  headerClassName?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: ReactElement<{
    onClick?: (event: MouseEvent<HTMLElement>) => void;
  }>;
};

function resolveSlot(slot: PopoverSlot | undefined, context: PopoverRenderContext) {
  if (typeof slot === "function") {
    return slot(context);
  }
  return slot;
}

function callOriginalOnClick(event: MouseEvent<HTMLElement>, onClick: unknown): void {
  if (typeof onClick === "function") {
    onClick(event);
  }
}

/** Test-only Popover mock that exercises the wrapper API without Radix portals. */
export function Popover({
  bodyClassName,
  children,
  className,
  contentTestId,
  defaultOpen = false,
  footer,
  footerClassName,
  header,
  headerClassName,
  onOpenChange,
  open,
  trigger,
}: MockPopoverProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const currentOpen = isControlled ? open : internalOpen;

  const setCurrentOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const context: PopoverRenderContext = {
    close: () => setCurrentOpen(false),
    open: currentOpen,
  };

  const triggerElement =
    trigger && isValidElement(trigger)
      ? cloneElement(trigger, {
          onClick: (event: MouseEvent<HTMLElement>) => {
            callOriginalOnClick(event, trigger.props.onClick);
            setCurrentOpen(!currentOpen);
          },
        })
      : trigger;

  return (
    <div>
      {triggerElement}
      {currentOpen ? (
        <div className={className} data-testid={contentTestId}>
          {header ? <div className={headerClassName}>{resolveSlot(header, context)}</div> : null}
          <div className={bodyClassName}>{resolveSlot(children, context)}</div>
          {footer ? <div className={footerClassName}>{resolveSlot(footer, context)}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
