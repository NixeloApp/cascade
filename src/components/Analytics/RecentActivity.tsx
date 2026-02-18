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
        <div className="relative">
          {/* Timeline line */}
          {activities.length > 1 && (
            <div className="absolute left-4 top-4 bottom-4 w-px bg-ui-border" />
          )}

          <Flex direction="column" gap="none">
            {activities.map((activity) => (
              <Flex
                key={activity._id}
                gap="md"
                align="start"
                className="relative py-3 px-2 -mx-2 rounded-lg transition-colors duration-150 hover:bg-ui-bg-secondary/30"
              >
                <Flex
                  align="center"
                  justify="center"
                  className="shrink-0 w-8 h-8 rounded-full bg-ui-bg-tertiary text-ui-text-secondary text-caption font-medium relative z-10"
                >
                  {activity.userName.charAt(0).toUpperCase()}
                </Flex>
                <FlexItem flex="1" className="min-w-0">
                  <Typography variant="small">
                    <strong>{activity.userName}</strong> {activity.action}{" "}
                    {activity.field && (
                      <>
                        <strong>{activity.field}</strong> on{" "}
                      </>
                    )}
                    <Badge
                      variant="neutral"
                      className="font-mono text-caption bg-ui-bg-tertiary/50 border-ui-border"
                    >
                      {activity.issueKey}
                    </Badge>
                  </Typography>
                  <Metadata className="mt-1.5">
                    <MetadataTimestamp date={activity._creationTime} format="absolute" />
                  </Metadata>
                </FlexItem>
              </Flex>
            ))}
          </Flex>
        </div>
      </Stack>
    </Card>
  );
}
