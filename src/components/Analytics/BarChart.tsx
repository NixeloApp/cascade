import { memo } from "react";
import { cn } from "@/lib/utils";
import { Flex, FlexItem } from "../ui/Flex";
import { Typography } from "../ui/Typography";

/**
 * Horizontal bar chart visualization
 * Extracted from AnalyticsDashboard for better organization and reusability
 */
export const BarChart = memo(function BarChart({
  data,
  color,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Flex direction="column" justify="end" gap="sm" className="h-full">
      {data.map((item) => (
        <Flex key={item.label} gap="sm" align="center">
          <Typography variant="small" className="w-24 text-ui-text truncate" title={item.label}>
            {item.label}
          </Typography>
          <FlexItem flex="1" className="bg-ui-bg-tertiary rounded-full h-6 relative">
            <div
              className={cn(
                color,
                "h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2",
              )}
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                minWidth: item.value > 0 ? "2rem" : "0",
              }}
            >
              <Typography variant="label" className="text-brand-foreground">
                {item.value}
              </Typography>
            </div>
          </FlexItem>
        </Flex>
      ))}
    </Flex>
  );
});
