import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { Flex } from "./Flex";

// =============================================================================
// Dialog - Clean API with required title/description
// =============================================================================

interface DialogProps {
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
  /** Whether to show the close button. Default: true */
  showCloseButton?: boolean;
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
  showCloseButton = true,
  "data-testid": testId,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ui-bg-overlay data-[state=open]:animate-fade-in data-[state=closed]:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Content
          data-testid={testId}
          className={cn(
            "bg-ui-bg fixed top-1/2 left-1/2 z-50 grid w-full max-w-dialog-mobile -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-ui-border p-6 shadow-elevated sm:max-w-lg origin-center [perspective:800px] data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
            className,
          )}
        >
          {/* Header */}
          <Flex direction="column" gap="sm" className="text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg leading-none font-semibold tracking-tight text-ui-text">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className={cn("text-sm", description ? "text-ui-text-secondary" : "sr-only")}
            >
              {description || title}
            </DialogPrimitive.Description>
          </Flex>

          {/* Content */}
          {children}

          {/* Footer */}
          {footer && (
            <Flex className="flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4">{footer}</Flex>
          )}

          {/* Close button */}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm text-ui-text-secondary opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
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
