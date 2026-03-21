import type { ReactNode } from "react";
import { Card, type CardProps } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface AnalyticsSectionProps extends Omit<CardProps, "children" | "recipe" | "title"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

/**
 * Shared analytics surface for charts, ranked lists, and other section content.
 * Keeps analytics panels on the same shell/header rhythm instead of hand-rolling
 * card structure per page.
 */
export function AnalyticsSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  padding = "lg",
  ...props
}: AnalyticsSectionProps) {
  return (
    <Card recipe="dashboardPanel" padding={padding} className={className} {...props}>
      <Stack gap="md">
        <Flex justify="between" align="start" gap="md" wrap>
          <FlexItem flex="1">
            <Stack gap="xs">
              {typeof title === "string" ? <Typography variant="large">{title}</Typography> : title}
              {description ? (
                <Typography variant="small" color="secondary">
                  {description}
                </Typography>
              ) : null}
            </Stack>
          </FlexItem>

          {actions ? <FlexItem shrink={false}>{actions}</FlexItem> : null}
        </Flex>

        <div className={cn(contentClassName)}>{children}</div>
      </Stack>
    </Card>
  );
}
