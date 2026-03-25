import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LucideIcon } from "@/lib/icons";
import { BarChart3 } from "@/lib/icons";
import { AnalyticsSection } from "./AnalyticsSection";

/** Shared analytics chart shell with optional section description and no-data state. */
export function ChartCard({
  title,
  description,
  emptyState,
  emptyStateTestId,
  testId,
  children,
}: {
  title: string | ReactNode;
  description?: ReactNode;
  emptyState?: {
    title: string;
    description: string;
    icon?: string | LucideIcon;
  };
  emptyStateTestId?: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <AnalyticsSection
      title={title}
      description={description}
      contentClassName="h-64"
      data-testid={testId}
    >
      {emptyState ? (
        <EmptyState
          data-testid={emptyStateTestId}
          icon={emptyState.icon ?? BarChart3}
          title={emptyState.title}
          description={emptyState.description}
          size="compact"
          surface="bare"
        />
      ) : (
        children
      )}
    </AnalyticsSection>
  );
}
