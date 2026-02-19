import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode | { label: string; onClick: () => void };
}

interface PageContentProps {
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyState?: EmptyStateConfig;
  className?: string;
}

export function PageContent({
  children,
  isLoading,
  isEmpty,
  emptyState,
  className,
}: PageContentProps): ReactNode {
  if (isLoading) {
    return (
      <Card padding="xl" variant="ghost">
        <Flex align="center" justify="center">
          <LoadingSpinner size="lg" />
        </Flex>
      </Card>
    );
  }

  if (isEmpty && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className={className}>{children}</div>
    </ErrorBoundary>
  );
}
