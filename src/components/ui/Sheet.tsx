import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { Flex } from "./Flex";

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
  },
  defaultVariants: {
    side: "right",
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
  /** Whether to show the close button. Default: true */
  showCloseButton?: boolean;
  /** Custom header content (replaces default title/description) */
  header?: React.ReactNode;
  /** Test ID for the sheet */
  "data-testid"?: string;
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
  footer,
  showCloseButton = true,
  header,
  "data-testid": testId,
}: SheetProps) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-ui-bg-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <SheetPrimitive.Content
          data-testid={testId}
          className={cn(sheetVariants({ side }), className)}
        >
          {/* Custom header or default */}
          {header ?? (
            <Flex direction="column" gap="sm" className="p-6 text-left border-b border-ui-border">
              <SheetPrimitive.Title className="text-lg font-semibold text-ui-text">
                {title}
              </SheetPrimitive.Title>
              <SheetPrimitive.Description
                className={cn("text-sm", description ? "text-ui-text-secondary" : "sr-only")}
              >
                {description || title}
              </SheetPrimitive.Description>
            </Flex>
          )}

          {/* Content */}
          {children}

          {/* Footer */}
          {footer && (
            <Flex className="flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 border-t border-ui-border">
              {footer}
            </Flex>
          )}

          {/* Close button */}
          {showCloseButton && (
            <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm text-ui-text-secondary opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-ring focus:ring-offset-2 disabled:pointer-events-none">
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
