/**
 * Chart Card
 *
 * Wrapper card component for chart visualizations.
 * Provides consistent styling with title and padding.
 * Used for analytics dashboard chart sections.
 */

import type { ReactNode } from "react";
import { AnalyticsSection } from "./AnalyticsSection";
export function ChartCard({
  title,
  children,
}: {
  title: string | ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AnalyticsSection title={title} contentClassName="h-64">
      {children}
    </AnalyticsSection>
  );
}
