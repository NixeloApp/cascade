import { AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./AlertDialog";
import { Flex } from "./Flex";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

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
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-ui-bg border-ui-border sm:max-w-md">
        <AlertDialogHeader>
          <Flex align="start" gap="lg">
            <Flex
              align="center"
              justify="center"
              className={cn("size-10 rounded-full shrink-0", config.iconBg)}
            >
              <Icon className={cn("size-5", config.iconColor)} />
            </Flex>
            <Flex direction="column" gap="sm" className="flex-1 pt-0.5">
              <AlertDialogTitle className="tracking-tight">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-ui-text-secondary leading-relaxed">
                {message}
              </AlertDialogDescription>
            </Flex>
          </Flex>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3">
          <AlertDialogCancel
            disabled={isLoading}
            className="bg-ui-bg text-ui-text border border-ui-border hover:bg-ui-bg-secondary focus:ring-2 focus:ring-brand-ring focus:ring-offset-2 transition-all duration-default"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "transition-all duration-default focus:ring-2 focus:ring-offset-2",
              variant === "info"
                ? "bg-brand text-brand-foreground hover:bg-brand-hover focus:ring-brand-ring"
                : "bg-status-error text-brand-foreground hover:bg-status-error/90 focus:ring-status-error/50",
            )}
          >
            {isLoading ? (
              <Flex align="center" gap="sm">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading...</span>
              </Flex>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
