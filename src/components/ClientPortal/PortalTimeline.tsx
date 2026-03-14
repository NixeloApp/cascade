import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";

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
              <Card key={item.id} recipe="portalTimelineEntry" padding="sm">
                <Stack gap="xs">
                  <Typography variant="small">{item.label}</Typography>
                  <Typography variant="caption" color="tertiary">
                    {item.timestamp}
                  </Typography>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
