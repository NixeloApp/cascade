/**
 * Chart Card
 *
 * Wrapper card component for chart visualizations.
 * Provides consistent styling with title and padding.
 * Used for analytics dashboard chart sections.
 */

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
export function ChartCard({
  title,
  children,
}: {
  title: string | ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card padding="lg">
      <Stack gap="md">
        {typeof title === "string" ? <Typography variant="large">{title}</Typography> : title}
        <div className="h-64">{children}</div>
      </Stack>
    </Card>
  );
}
