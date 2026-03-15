import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  getCardRecipeClassName,
} from "@/components/ui/Card";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface PortalTimelineItem {
  id: string;
  label: string;
  timestamp: string;
}

interface PortalTimelineProps {
  items: PortalTimelineItem[];
}

/**
 * Renders timeline events for client-portal activity history.
 */
export function PortalTimeline({ items }: PortalTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Typography variant="small" color="secondary">
            No timeline events available.
          </Typography>
        ) : (
          <Stack gap="sm">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(getCardRecipeClassName("portalTimelineEntry"), "p-3")}
              >
                <Stack gap="xs">
                  <Typography variant="small">{item.label}</Typography>
                  <Typography variant="caption" color="tertiary">
                    {item.timestamp}
                  </Typography>
                </Stack>
              </div>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
