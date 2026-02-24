import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Metadata, MetadataTimestamp } from "../ui/Metadata";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

/**
 * Recent activity timeline for analytics dashboard
 * Extracted from AnalyticsDashboard for better organization
 */
interface Activity {
  _id: string;
  userName: string;
  action: string;
  field?: string;
  issueKey?: string;
  _creationTime: number;
}

export function RecentActivity({ activities }: { activities: Activity[] | undefined }) {
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <Card variant="elevated" padding="lg">
      <Stack gap="md">
        <Typography variant="large">Recent Activity</Typography>
        <Stack gap="none" className="relative">
          {/* Timeline line */}
          {activities.length > 1 && (
            <div className="absolute left-4 top-4 bottom-4 w-px bg-ui-border" />
          )}

          {activities.map((activity) => (
            <Flex
              key={activity._id}
              gap="md"
              align="start"
              className="relative rounded-lg transition-colors duration-fast hover:bg-ui-bg-secondary/30"
            >
              <Avatar
                name={activity.userName}
                size="md"
                variant="neutral"
                className="relative z-10"
              />
              <FlexItem flex="1" className="min-w-0">
                <Typography variant="small">
                  <strong>{activity.userName}</strong> {activity.action}{" "}
                  {activity.field && (
                    <>
                      <strong>{activity.field}</strong> on{" "}
                    </>
                  )}
                  {activity.issueKey && (
                    <Badge
                      variant="neutral"
                      className="font-mono text-caption bg-ui-bg-tertiary/50 border-ui-border"
                    >
                      {activity.issueKey}
                    </Badge>
                  )}
                </Typography>
                <Metadata className="mt-1.5">
                  <MetadataTimestamp date={activity._creationTime} format="absolute" />
                </Metadata>
              </FlexItem>
            </Flex>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
