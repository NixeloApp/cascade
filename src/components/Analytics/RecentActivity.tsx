import { Clock } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { getCardRecipeClassName } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Metadata, MetadataTimestamp } from "../ui/Metadata";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { AnalyticsSection } from "./AnalyticsSection";

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
  return (
    <AnalyticsSection
      title="Recent Activity"
      description="The latest project updates flowing through issues and status changes."
    >
      <Stack gap="md">
        {!activities || activities.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No recent activity yet"
            description="New issue movement, status changes, and collaboration updates will land here."
            size="compact"
            surface="bare"
          />
        ) : (
          <Stack gap="none" className="relative">
            {activities.length > 1 ? (
              <div className="absolute left-4 top-4 bottom-4 w-px bg-ui-border" />
            ) : null}

            {activities.map((activity) => (
              <div key={activity._id} className={cn(getCardRecipeClassName("timelineItem"), "p-3")}>
                <Flex gap="md" align="start">
                  <Avatar
                    name={activity.userName}
                    size="md"
                    variant="neutral"
                    className="relative z-10"
                  />
                  <FlexItem flex="1" className="min-w-0">
                    <Typography variant="small">
                      <Typography as="strong" variant="strong">
                        {activity.userName}
                      </Typography>{" "}
                      {activity.action}{" "}
                      {activity.field ? (
                        <>
                          <Typography as="strong" variant="strong">
                            {activity.field}
                          </Typography>{" "}
                          on{" "}
                        </>
                      ) : null}
                      {activity.issueKey ? (
                        <Badge variant="issueKey" size="sm">
                          {activity.issueKey}
                        </Badge>
                      ) : null}
                    </Typography>
                    <Metadata className="mt-1.5">
                      <MetadataTimestamp date={activity._creationTime} format="absolute" />
                    </Metadata>
                  </FlexItem>
                </Flex>
              </div>
            ))}
          </Stack>
        )}
      </Stack>
    </AnalyticsSection>
  );
}
