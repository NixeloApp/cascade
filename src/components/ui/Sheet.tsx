/**
 * Sheet Component
 *
 * Slide-in panel from screen edges.
 * Wraps Radix UI Dialog with directional animations.
 * Use for secondary navigation and forms.
 */

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import {
  overlayDescriptionVariants,
  overlayDismissButtonClassName,
  overlaySectionVariants,
  overlayTitleVariants,
} from "./OverlayChrome";

// =============================================================================
// Sheet Variants
// =============================================================================

const sheetVariants = cva("fixed z-50 gap-4 bg-ui-bg shadow-elevated border-ui-border", {
  variants: {
    side: {
      top: "inset-x-0 top-0 border-b data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up-out",
      bottom:
        "inset-x-0 bottom-0 border-t data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down-out",
      left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=open]:animate-enter-left data-[state=closed]:animate-exit-left sm:max-w-sm",
      right:
        "inset-y-0 right-0 h-full w-3/4 border-l data-[state=open]:animate-enter-right data-[state=closed]:animate-exit-right sm:max-w-sm",
    },
    layout: {
      default: "",
      panel: "flex flex-col p-0",
    },
  },
  defaultVariants: {
    side: "right",
    layout: "default",
  },
});

// =============================================================================
// Sheet - Clean API with required title/description
// =============================================================================

interface SheetProps extends VariantProps<typeof sheetVariants> {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Sheet title (required for accessibility) */
  title: string;
  /** Sheet description (required for accessibility). Visually hidden if not provided. */
  description?: string;
  /** Sheet content */
  children: React.ReactNode;
  /** Additional class for the sheet panel */
  className?: string;
  /** Footer content (buttons, etc.) */
  footer?: React.ReactNode;
  /** Additional class for the scrollable body region */
  bodyClassName?: string;
  /** Additional class for the header region */
  headerClassName?: string;
  /** Additional class for the footer region */
  footerClassName?: string;
  /** Whether to show the close button. Default: true */
  showCloseButton?: boolean;
  /** Custom header content (replaces default title/description) */
  header?: React.ReactNode;
  /** Test ID for the sheet */
  "data-testid"?: string;
}

function containsSheetPrimitiveNode(
  node: React.ReactNode,
  target: typeof SheetPrimitive.Title | typeof SheetPrimitive.Description,
): boolean {
  let found = false;

  React.Children.forEach(node, (child) => {
    if (found || !React.isValidElement<{ children?: React.ReactNode }>(child)) return;

    const childType = child.type;
    if (
      childType === target ||
      ((typeof childType === "object" || typeof childType === "function") &&
        "displayName" in childType &&
        childType.displayName === target.displayName)
    ) {
      found = true;
      return;
    }

    if (child.props.children) {
      found = containsSheetPrimitiveNode(child.props.children, target);
    }
  });

  return found;
}

/**
 * Sheet (side panel) component with enforced accessibility.
 *
 * @example
 * ```tsx
 * <Sheet
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Settings"
 *   description="Configure your preferences"
 *   side="right"
 * >
 *   <form>...</form>
 * </Sheet>
 * ```
 */
function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  side = "right",
  layout = "default",
  footer,
  bodyClassName,
  headerClassName,
  footerClassName,
  showCloseButton = true,
  header,
  "data-testid": testId,
}: SheetProps) {
  const headerProvidesTitle = header
    ? containsSheetPrimitiveNode(header, SheetPrimitive.Title)
    : false;
  const headerProvidesDescription = header
    ? containsSheetPrimitiveNode(header, SheetPrimitive.Description)
    : false;

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-ui-bg-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <SheetPrimitive.Content
          data-testid={testId}
          className={cn(sheetVariants({ side, layout }), className)}
        >
          {/* Custom header or default */}
          <div
            className={cn(
              overlaySectionVariants({ surface: "modal", slot: "header" }),
              "text-left",
              headerClassName,
            )}
          >
            {header ? (
              <>
                {!headerProvidesTitle && (
                  <SheetPrimitive.Title className="sr-only">{title}</SheetPrimitive.Title>
                )}
                {!headerProvidesDescription && (
                  <SheetPrimitive.Description className="sr-only">
                    {description || title}
                  </SheetPrimitive.Description>
                )}
                {header}
              </>
            ) : (
              <Flex direction="column" gap="xs">
                <SheetPrimitive.Title className={overlayTitleVariants({ surface: "modal" })}>
                  {title}
                </SheetPrimitive.Title>
                <SheetPrimitive.Description
                  className={cn(
                    overlayDescriptionVariants({ surface: "modal" }),
                    description ? "text-ui-text-secondary" : "sr-only",
                  )}
                >
                  {description || title}
                </SheetPrimitive.Description>
              </Flex>
            )}
          </div>

          {/* Content */}
          <div
            className={cn(
              overlaySectionVariants({ surface: "modal", slot: "body" }),
              bodyClassName,
            )}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <Flex
              className={cn(
                overlaySectionVariants({ surface: "modal", slot: "footer" }),
                footerClassName,
              )}
            >
              {footer}
            </Flex>
          )}

          {/* Close button */}
          {showCloseButton && (
            <SheetPrimitive.Close className={overlayDismissButtonClassName}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

// =============================================================================
// SheetTrigger - For uncontrolled usage
// =============================================================================

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger {...props} />;
}

// =============================================================================
// SheetClose - For custom close buttons inside sheet content
// =============================================================================

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close {...props} />;
}

export { Sheet, SheetClose, SheetTrigger };
