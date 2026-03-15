import { TrendingUp } from "@/lib/icons";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { IconCircle } from "../ui/IconCircle";
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

/**
 * Dashboard recent activity timeline showing latest project updates
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card
      hoverable
      variant="outline"
      className="border-ui-border/50 bg-ui-bg/70 shadow-soft backdrop-blur-sm"
    >
      <CardHeader
        title="Recent activity"
        description="Latest updates across projects and teammates"
        className="border-ui-border/50"
      />
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
            description="Fresh updates from your team will appear here."
            size="compact"
          />
        ) : (
          <div className="relative h-96 overflow-y-auto pr-2 custom-scrollbar">
            {/* Timeline line */}
            {activities.length > 1 && (
              <div className="absolute bottom-4 left-4 top-4 w-px bg-ui-border/60" />
            )}

            <Flex direction="column" gap="none">
              {activities.map((activity: Activity) => (
                <Card
                  key={activity._id}
                  variant="ghost"
                  padding="none"
                  hoverable
                  radius="lg"
                  className="relative border border-transparent px-2 py-2"
                >
                  <Flex gap="md" align="start">
                    {/* User avatar */}
                    <IconCircle size="sm" className="relative z-10 bg-ui-bg">
                      <Avatar name={activity.userName} size="md" variant="brand" />
                    </IconCircle>

                    <FlexItem flex="1" className="min-w-0">
                      <Stack gap="xs">
                        <Typography variant="small">
                          <Typography as="strong" variant="strong">
                            {activity.userName}
                          </Typography>{" "}
                          {activity.action}
                        </Typography>
                        <Badge
                          variant="neutral"
                          className="w-fit border-ui-border/50 bg-ui-bg-tertiary/60 font-mono text-caption"
                        >
                          {activity.issueKey}
                        </Badge>
                        <Metadata separator="|">
                          <MetadataItem>{activity.projectName}</MetadataItem>
                          <MetadataTimestamp date={activity._creationTime} format="absolute" />
                        </Metadata>
                      </Stack>
                    </FlexItem>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
