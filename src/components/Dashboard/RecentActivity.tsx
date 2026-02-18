import { TrendingUp } from "@/lib/icons";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Metadata, MetadataItem, MetadataTimestamp } from "../ui/Metadata";
import { SkeletonText } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface Activity {
  _id: string;
  userName: string;
  action: string;
  issueKey: string;
  projectName: string;
  _creationTime: number;
}

interface RecentActivityProps {
  activities: Activity[] | undefined;
}

const _getActionBadgeVariant = (action: string): "success" | "info" | "warning" | "neutral" => {
  switch (action) {
    case "created":
      return "success";
    case "updated":
      return "info";
    case "commented":
      return "info";
    case "assigned":
      return "warning";
    case "moved":
      return "neutral";
    default:
      return "neutral";
  }
};

/**
 * Dashboard recent activity timeline showing latest project updates
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <CardHeader title="Feed" description="Latest updates across all projects" />
      <CardBody>
        {!activities ? (
          /* Loading skeleton */
          <Flex direction="column" gap="md">
            <SkeletonText lines={2} />
            <SkeletonText lines={2} />
            <SkeletonText lines={2} />
          </Flex>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No activity"
            description="No recent activity to show"
          />
        ) : (
          <div className="relative h-96 overflow-y-auto pr-2 custom-scrollbar">
            {/* Timeline line */}
            {activities.length > 1 && (
              <div className="absolute left-4 top-4 bottom-4 w-px bg-ui-border" />
            )}

            <Flex direction="column" gap="none">
              {activities.map((activity: Activity) => (
                <div
                  key={activity._id}
                  className="relative py-3 px-2 -mx-2 rounded-lg transition-colors duration-150 hover:bg-ui-bg-secondary/30"
                >
                  <Flex gap="md" align="start">
                    {/* User avatar */}
                    <FlexItem shrink={false} className="relative z-10 bg-ui-bg rounded-full">
                      <Avatar name={activity.userName} size="md" variant="brand" />
                    </FlexItem>

                    <FlexItem flex="1" className="min-w-0">
                      <Stack gap="xs">
                        <Typography variant="small">
                          <strong>{activity.userName}</strong> {activity.action}
                        </Typography>
                        <Badge
                          variant="neutral"
                          className="font-mono text-caption bg-ui-bg-tertiary/50 border-ui-border w-fit"
                        >
                          {activity.issueKey}
                        </Badge>
                        <Metadata separator="|">
                          <MetadataItem className="font-medium">
                            {activity.projectName}
                          </MetadataItem>
                          <MetadataTimestamp date={activity._creationTime} format="absolute" />
                        </Metadata>
                      </Stack>
                    </FlexItem>
                  </Flex>
                </div>
              ))}
            </Flex>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
