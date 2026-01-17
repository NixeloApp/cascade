import { Badge } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { SkeletonText } from "../ui/Skeleton";
import { Typography } from "../ui/Typography";

interface Activity {
  _id: string;
  userName: string;
  action: string;
  issueKey: string;
  projectName: string;
  createdAt: number;
}

interface RecentActivityProps {
  activities: Activity[] | undefined;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "created":
      return "➕";
    case "updated":
      return "✏️";
    case "commented":
      return "💬";
    case "assigned":
      return "👤";
    case "moved":
      return "🔄";
    default:
      return "📝";
  }
};

/**
 * Dashboard recent activity timeline showing latest project updates
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="bg-ui-bg-primary/40 backdrop-blur-md border-ui-border-primary/50">
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
          <EmptyState icon="📊" title="No activity" description="No recent activity to show" />
        ) : (
          <Flex direction="column" gap="md" className="h-96 overflow-y-auto pr-2 custom-scrollbar">
            {activities.map((activity: Activity, activityIndex: number) => (
              <div
                key={activity._id}
                className="relative animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${activityIndex * 50}ms` }}
              >
                {/* Timeline connector */}
                {activityIndex < activities.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-ui-border-primary/50" />
                )}

                <Flex gap="md" align="start">
                  {/* Icon circle with glass effect */}
                  <Flex
                    align="center"
                    justify="center"
                    className="shrink-0 w-8 h-8 rounded-full bg-brand-600/10 dark:bg-brand-400/10 border border-brand-600/20 relative z-10"
                  >
                    <span className="text-sm" aria-hidden="true">
                      {getActionIcon(activity.action)}
                    </span>
                  </Flex>

                  <div className="flex-1 min-w-0 pb-4">
                    <div className="text-sm">
                      <Typography
                        variant="small"
                        as="span"
                        className="font-bold text-ui-text-primary"
                      >
                        {activity.userName}
                      </Typography>{" "}
                      <Typography variant="small" as="span" color="secondary">
                        {activity.action}
                      </Typography>
                    </div>
                    <div className="mt-1">
                      <Badge
                        variant="neutral"
                        className="font-mono text-[10px] bg-ui-bg-tertiary/50 border-ui-border-primary/50"
                      >
                        {activity.issueKey}
                      </Badge>
                    </div>
                    <Flex
                      gap="xs"
                      align="center"
                      className="mt-1.5 text-[10px] text-ui-text-tertiary uppercase tracking-wider font-bold"
                    >
                      <span>{activity.projectName}</span>
                      <span>•</span>
                      <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                    </Flex>
                  </div>
                </Flex>
              </div>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}
