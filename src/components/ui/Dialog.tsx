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
import {
  overlayDescriptionVariants,
  overlayDismissButtonClassName,
  overlaySectionVariants,
  overlayTitleVariants,
} from "./OverlayChrome";

const dialogVariants = cva(
  "fixed inset-x-3 top-3 bottom-3 z-50 flex flex-col overscroll-contain overflow-hidden origin-center [perspective:800px] data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-dialog-mobile sm:-translate-x-1/2 sm:-translate-y-1/2",
  {
    variants: {
      size: {
        sm: "sm:max-w-md sm:max-h-[50vh]",
        md: "sm:max-w-lg sm:max-h-[60vh]",
        lg: "sm:max-w-2xl sm:max-h-[80vh]",
        xl: "sm:max-w-4xl sm:max-h-[80vh]",
        "2xl": "sm:max-w-5xl sm:max-h-[85vh]",
        full: "sm:max-w-6xl sm:max-h-[90vh]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const dialogSurfaceVariants = cva(
  "rounded-2xl border border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg shadow-elevated sm:rounded-3xl",
  {
    variants: {
      recipe: {
        default: "",
        command: "p-0",
      },
    },
    defaultVariants: {
      recipe: "default",
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
  /** Shared dialog anatomy preset */
  recipe?: VariantProps<typeof dialogSurfaceVariants>["recipe"];
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
  recipe = "default",
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
          className={cn(dialogVariants({ size }), dialogSurfaceVariants({ recipe }), className)}
          onFocusOutside={onFocusOutside}
        >
          {/* Header */}
          <Flex
            direction="column"
            gap="xs"
            className={cn(
              overlaySectionVariants({ surface: "modal", slot: "header" }),
              "pr-10 text-center sm:text-left",
              headerClassName,
            )}
          >
            <DialogPrimitive.Title className={overlayTitleVariants({ surface: "modal" })}>
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className={cn(
                overlayDescriptionVariants({ surface: "modal" }),
                description ? "text-ui-text-secondary" : "sr-only",
              )}
            >
              {description || title}
            </DialogPrimitive.Description>
          </Flex>

          {/* Content */}
          <div
            className={cn(
              "flex flex-col",
              overlaySectionVariants({ surface: "modal", slot: "body" }),
              recipe === "command" ? "overflow-hidden p-0" : "px-4 pb-4 sm:px-6 sm:pb-6",
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
            <DialogPrimitive.Close className={overlayDismissButtonClassName}>
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
