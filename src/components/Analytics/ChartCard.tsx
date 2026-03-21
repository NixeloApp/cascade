import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3 } from "@/lib/icons";
import { AnalyticsSection } from "./AnalyticsSection";

/** Shared analytics chart shell with optional section description and no-data state. */
export function ChartCard({
  title,
  description,
  emptyState,
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
