import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

/**
 * Mintlify-inspired alert/banner component.
 *
 * Features:
 * - Semantic status colors with subtle backgrounds
 * - Ultra-subtle borders (20% opacity)
 * - Automatic icon based on variant
 * - Optional dismiss button with hover state
 * - Proper text hierarchy via AlertTitle and AlertDescription
 */
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-ui-bg-soft border-ui-border text-ui-text",
        info: "bg-status-info-bg border-status-info/20 text-status-info-text [&>svg]:text-status-info",
        success:
          "bg-status-success-bg border-status-success/20 text-status-success-text [&>svg]:text-status-success",
        warning:
          "bg-status-warning-bg border-status-warning/20 text-status-warning-text [&>svg]:text-status-warning",
        error:
          "bg-status-error-bg border-status-error/20 text-status-error-text [&>svg]:text-status-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const alertIcons = {
  default: null,
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
};

interface AlertProps extends React.ComponentProps<"div">, VariantProps<typeof alertVariants> {
  /** Called when the dismiss button is clicked. If not provided, dismiss button is hidden. */
  onDismiss?: () => void;
}

function Alert({ className, variant = "default", onDismiss, children, ...props }: AlertProps) {
  const Icon = variant ? alertIcons[variant] : null;

  return (
    <div
      data-slot="alert"
      role={["error", "warning"].includes(variant || "") ? "alert" : "status"}
      className={cn(alertVariants({ variant }), onDismiss && "pr-10", className)}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" />}
      {children}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "absolute right-3 top-3 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2",
            variant === "info" && "hover:bg-status-info/10 focus:ring-status-info",
            variant === "success" && "hover:bg-status-success/10 focus:ring-status-success",
            variant === "warning" && "hover:bg-status-warning/10 focus:ring-status-warning",
            variant === "error" && "hover:bg-status-error/10 focus:ring-status-error",
            variant === "default" && "hover:bg-ui-bg-tertiary focus:ring-ui-border",
          )}
          aria-label="Dismiss"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function AlertTitle({ className, children, color: _color, ...props }: React.ComponentProps<"h5">) {
  return (
    <Typography
      as="h5"
      variant="h5"
      data-slot="alert-title"
      className={cn("text-sm font-semibold leading-tight tracking-tight", className)}
      {...props}
    >
      {children}
    </Typography>
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("mt-1 text-sm opacity-80 [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle, alertVariants };
