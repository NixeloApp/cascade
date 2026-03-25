import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { LucideIcon } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}

interface PageContentProps {
  children: ReactNode;
  isLoading?: boolean;
  emptyState?: EmptyStateConfig | null;
  className?: string;
}

/** Page content wrapper with loading and empty state handling. */
export function PageContent({
  children,
  isLoading,
  emptyState,
  className,
}: PageContentProps): ReactNode {
  if (isLoading) {
    return (
      <Card
        padding="xl"
        variant="ghost"
        className="border border-ui-border-secondary/80 bg-ui-bg-elevated shadow-soft"
        data-testid={TEST_IDS.PAGE.LOADING_STATE}
      >
        <Flex align="center" justify="center">
          <LoadingSpinner size="lg" />
        </Flex>
      </Card>
    );
  }

  if (emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.actions}
        surface="page"
        data-testid={TEST_IDS.PAGE.EMPTY_STATE}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className={className}>{children}</div>
    </ErrorBoundary>
  );
}
