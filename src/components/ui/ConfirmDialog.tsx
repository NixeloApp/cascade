import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./Button";
import { Flex } from "./Flex";

// =============================================================================
// ConfirmDialog - Specialized AlertDialog with icon variants
// =============================================================================

interface ConfirmDialogProps {
  /** Controlled open state */
  isOpen: boolean;
  /** Callback when dialog closes */
  onClose: () => void;
  /** Callback when confirm action is triggered */
  onConfirm: () => void;
  /** Dialog title (required for accessibility) */
  title: string;
  /** Dialog message/description (required for accessibility) */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Visual variant with icon */
  variant?: "danger" | "warning" | "info";
  /** Whether confirm action is in progress */
  isLoading?: boolean;
}

/**
 * ConfirmDialog component with icon variants for different confirmation types.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   message="This action cannot be undone."
 *   variant="danger"
 *   confirmLabel="Delete"
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: "bg-status-error-bg",
      iconColor: "text-status-error",
    },
    warning: {
      icon: AlertCircle,
      iconBg: "bg-status-warning-bg",
      iconColor: "text-status-warning",
    },
    info: {
      icon: Info,
      iconBg: "bg-status-info-bg",
      iconColor: "text-status-info",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ui-bg-overlay data-[state=open]:animate-fade-in data-[state=closed]:opacity-0 transition-opacity duration-fast" />
        <AlertDialogPrimitive.Content className="bg-ui-bg border-ui-border fixed top-1/2 left-1/2 z-50 grid w-full max-w-dialog-mobile -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-elevated sm:max-w-md origin-center [perspective:800px] data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out">
          {/* Header with icon */}
          <Flex align="start" gap="lg">
            <Flex
              align="center"
              justify="center"
              className={cn("size-10 rounded-full shrink-0", config.iconBg)}
            >
              <Icon className={cn("size-5", config.iconColor)} />
            </Flex>
            <Flex direction="column" gap="sm" className="flex-1 pt-0.5">
              <AlertDialogPrimitive.Title className="text-lg leading-none font-semibold tracking-tight text-ui-text">
                {title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="text-ui-text-secondary text-sm leading-relaxed">
                {message}
              </AlertDialogPrimitive.Description>
            </Flex>
          </Flex>

          {/* Footer */}
          <Flex className="flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-6">
            <AlertDialogPrimitive.Cancel
              disabled={isLoading}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "bg-ui-bg text-ui-text border border-ui-border hover:bg-ui-bg-secondary",
              )}
            >
              {cancelLabel}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(buttonVariants({ variant: variant === "info" ? "primary" : "danger" }))}
            >
              {isLoading ? (
                <Flex align="center" gap="sm">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Loading...</span>
                </Flex>
              ) : (
                confirmLabel
              )}
            </AlertDialogPrimitive.Action>
          </Flex>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
