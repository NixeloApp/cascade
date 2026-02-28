import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
/**
 * Wrapper card for chart visualizations
 * Extracted from AnalyticsDashboard for better organization
 */
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
