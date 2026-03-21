import type { LucideIcon } from "lucide-react";
import { FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { InsetPanel } from "@/components/ui/InsetPanel";
import { Metadata } from "@/components/ui/Metadata";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";

interface AnalyticsInsightCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  meta?: string[];
}

/** Compact analytics summary tile used to frame the page before the charts. */
export function AnalyticsInsightCard({
  title,
  value,
  description,
  icon,
  meta,
}: AnalyticsInsightCardProps) {
  return (
    <InsetPanel className="h-full">
      <Stack gap="sm" className="h-full">
        <Icon icon={icon} size="sm" tone="secondary" />
        <FlexItem flex="1">
          <Stack gap="xs">
            <Typography variant="label" color="secondary">
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="small" color="secondary">
              {description}
            </Typography>
          </Stack>
        </FlexItem>
        {meta && meta.length > 0 ? <Metadata>{meta.map((item) => item)}</Metadata> : null}
      </Stack>
    </InsetPanel>
  );
}
