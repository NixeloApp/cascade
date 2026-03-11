/**
 * Dialog Component
 *
 * Modal dialog with overlay and configurable sizes.
 * Wraps Radix UI Dialog with accessible defaults.
 * Includes header, content, and footer composition.
 */

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import type * as React from "react";

import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { modalSectionVariants, surfaceRecipeVariants } from "./surfaceRecipes";

const dialogVariants = cva(
  "fixed top-1/2 left-1/2 z-50 flex w-full max-w-dialog-mobile -translate-x-1/2 -translate-y-1/2 flex-col overscroll-contain overflow-hidden origin-center [perspective:800px] data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
  {
    variants: {
      size: {
        sm: "sm:max-w-md max-h-[50vh]",
        md: "sm:max-w-lg max-h-[60vh]",
        lg: "sm:max-w-2xl max-h-[80vh]",
        xl: "sm:max-w-4xl max-h-[80vh]",
        "2xl": "sm:max-w-5xl max-h-[85vh]",
        full: "sm:max-w-6xl max-h-[90vh]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

// =============================================================================
// Dialog - Clean API with required title/description
// =============================================================================

interface DialogProps extends VariantProps<typeof dialogVariants> {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title (required for accessibility) */
  title: string;
  /** Dialog description (required for accessibility). Visually hidden if not provided. */
  description?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Additional class for the dialog panel */
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
  /** Optional focus-outside handler for Radix dialog content */
  onFocusOutside?: React.ComponentProps<typeof DialogPrimitive.Content>["onFocusOutside"];
  /** Test ID for the dialog */
  "data-testid"?: string;
}

/**
 * Dialog component with enforced accessibility.
 *
 * @example
 * ```tsx
 * <Dialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Create Project"
 *   description="Add a new project to your workspace"
 *   footer={<Button onClick={handleSave}>Save</Button>}
 * >
 *   <form>...</form>
 * </Dialog>
 * ```
 */
function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  footer,
  bodyClassName,
  headerClassName,
  footerClassName,
  size,
  showCloseButton = true,
  onFocusOutside,
  "data-testid": testId,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-testid={TEST_IDS.DIALOG.OVERLAY}
          className="fixed inset-0 z-50 bg-ui-bg-overlay backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:opacity-0 transition-opacity duration-fast"
        />
        <DialogPrimitive.Content
          data-testid={testId}
          className={cn(
            dialogVariants({ size }),
            surfaceRecipeVariants({ recipe: "overlayShell" }),
            className,
          )}
          onFocusOutside={onFocusOutside}
        >
          {/* Header */}
          <Flex
            direction="column"
            gap="xs"
            className={cn(
              modalSectionVariants({ slot: "header" }),
              "pr-10 text-center sm:text-left",
              headerClassName,
            )}
          >
            <DialogPrimitive.Title className="text-xl leading-none font-semibold tracking-tight text-ui-text">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className={cn(
                "max-w-2xl text-sm leading-6",
                description ? "text-ui-text-secondary" : "sr-only",
              )}
            >
              {description || title}
            </DialogPrimitive.Description>
          </Flex>

          {/* Content */}
          <div className={cn(modalSectionVariants({ slot: "body" }), bodyClassName)}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <Flex className={cn(modalSectionVariants({ slot: "footer" }), footerClassName)}>
              {footer}
            </Flex>
          )}

          {/* Close button */}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-ui-border-secondary/70 bg-ui-bg-elevated/90 text-ui-text-secondary shadow-soft transition-all hover:border-ui-border-secondary hover:bg-ui-bg-soft hover:text-ui-text focus:outline-none focus:ring-2 focus:ring-brand-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// =============================================================================
// DialogTrigger - For uncontrolled usage with trigger element
// =============================================================================

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />;
}

// =============================================================================
// DialogClose - For custom close buttons inside dialog content
// =============================================================================

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close {...props} />;
}

export { Dialog, DialogClose, DialogTrigger };
