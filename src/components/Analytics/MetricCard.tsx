import type { LucideIcon } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardBody } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Typography } from "../ui/Typography";

/**
 * Metric display card for analytics dashboard
 * Extracted from AnalyticsDashboard for better organization
 */
export const MetricCard = memo(function MetricCard({
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
    <Card className={cn(highlight && "ring-2 ring-status-warning")} data-testid={testId}>
      <CardBody className="p-6">
        <Flex justify="between" align="center">
          <div>
            <Typography className="text-sm font-medium" color="secondary">
              {title}
            </Typography>
            <Typography className="text-3xl font-bold mt-2">{value}</Typography>
            {subtitle && (
              <Typography variant="muted" className="text-xs mt-1">
                {subtitle}
              </Typography>
            )}
          </div>
          <div className="text-4xl">
            {typeof icon === "string" ? icon : <Icon icon={icon} size="xl" />}
          </div>
        </Flex>
      </CardBody>
    </Card>
  );
});
