/**
 * Section Error Fallback
 *
 * Inline error display for component-level failures.
 * Shows error message with optional retry button.
 * Used as fallback for ErrorBoundary components.
 */

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { AlertTriangle } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Typography } from "./ui/Typography";

interface Props {
  title: string;
  message?: string;
  onRetry?: () => void;
  children?: ReactNode;
  iconClassName?: string;
}

/** Error fallback UI for section-level error boundaries with retry option. */
export function SectionErrorFallback({ title, message, onRetry, children, iconClassName }: Props) {
  return (
    <Flex align="center" justify="center" className="h-full">
      <Stack align="center" gap="md" className="max-w-md w-full text-center">
        <Icon icon={AlertTriangle} size="xl" className={cn("text-status-error", iconClassName)} />
        <Typography variant="h3">{title}</Typography>
        <Typography color="secondary">
          {message ||
            "This section encountered an error. Try reloading or contact support if the problem persists."}
        </Typography>
        {children}
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </Stack>
    </Flex>
  );
}
