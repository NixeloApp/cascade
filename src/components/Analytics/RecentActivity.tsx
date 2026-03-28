import { Clock } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { Avatar } from "../ui/Avatar";
import {
  getAnalyticsRecentActivityAvatarClassName,
  getAnalyticsRecentActivityContentClassName,
  getAnalyticsRecentActivityItemClassName,
  getAnalyticsRecentActivityListClassName,
  getAnalyticsRecentActivityMetadataClassName,
  getAnalyticsRecentActivityRailClassName,
} from "../ui/analyticsRecentActivitySurfaceClassNames";
import { Badge } from "../ui/Badge";
import { getIssueKeyBadgeClassName } from "../ui/badgeSurfaceClassNames";
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
      data-testid={TEST_IDS.ANALYTICS.RECENT_ACTIVITY}
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
          <Stack gap="none" className={getAnalyticsRecentActivityListClassName()}>
            {activities.length > 1 ? (
              <div
                className={getAnalyticsRecentActivityRailClassName()}
                data-testid={TEST_IDS.ANALYTICS.RECENT_ACTIVITY_TIMELINE_RAIL}
              />
            ) : null}

            {activities.map((activity) => (
              <div key={activity._id} className={getAnalyticsRecentActivityItemClassName()}>
                <Flex gap="md" align="start">
                  <Avatar
                    name={activity.userName}
                    size="md"
                    variant="neutral"
                    className={getAnalyticsRecentActivityAvatarClassName()}
                  />
                  <FlexItem flex="1" className={getAnalyticsRecentActivityContentClassName()}>
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
                        <Badge
                          variant="secondary"
                          size="sm"
                          className={getIssueKeyBadgeClassName()}
                        >
                          {activity.issueKey}
                        </Badge>
                      ) : null}
                    </Typography>
                    <Metadata className={getAnalyticsRecentActivityMetadataClassName()}>
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
