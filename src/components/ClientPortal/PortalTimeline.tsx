import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

interface PortalTimelineItem {
  id: string;
  label: string;
  timestamp: string;
}

interface PortalTimelineProps {
  items: PortalTimelineItem[];
}

export function PortalTimeline({ items }: PortalTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {items.length === 0 ? (
          <Typography variant="small" color="secondary">
            No timeline events available.
          </Typography>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-ui-border p-3">
              <Typography variant="small">{item.label}</Typography>
              <Typography variant="caption" color="tertiary">
                {item.timestamp}
              </Typography>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
