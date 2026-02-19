import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

/**
 * Metric display card for analytics dashboard
 * Extracted from AnalyticsDashboard for better organization
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  highlight,
  testId,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: string | LucideIcon;
  highlight?: boolean;
  testId?: string;
}) {
  return (
    <Card
      padding="lg"
      className={cn(highlight && "ring-2 ring-status-warning")}
      data-testid={testId}
    >
      <Flex justify="between" align="center">
        <Stack gap="sm">
          <Typography variant="label" color="secondary">
            {title}
          </Typography>
          <Typography variant="h2">{value}</Typography>
          {subtitle && <Typography variant="meta">{subtitle}</Typography>}
        </Stack>
        <Typography variant="h2" color="secondary">
          {typeof icon === "string" ? icon : <Icon icon={icon} size="xl" />}
        </Typography>
      </Flex>
    </Card>
  );
}
