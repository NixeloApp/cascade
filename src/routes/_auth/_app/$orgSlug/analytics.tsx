import { api } from "@convex/_generated/api";
import { DAY, WEEK } from "@convex/lib/timeUtils";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { OrganizationAnalyticsDashboard } from "@/components/Analytics/OrganizationAnalyticsDashboard";
import { PageContent } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";

export const Route = createFileRoute("/_auth/_app/$orgSlug/analytics")({
  component: AnalyticsPage,
});

type TimePeriod = "7d" | "30d" | "90d" | "all";

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

function getSinceDate(period: TimePeriod): number | undefined {
  const now = Date.now();
  switch (period) {
    case "7d":
      return now - 7 * DAY;
    case "30d":
      return now - 30 * DAY;
    case "90d":
      return now - 90 * DAY;
    default:
      return undefined;
  }
}

function AnalyticsPage() {
  const { organizationId } = useOrganization();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");

  const sinceDate = getSinceDate(timePeriod);
  const analytics = useAuthenticatedQuery(api.analytics.getOrgAnalytics, {
    organizationId,
    sinceDate,
  });

  if (analytics === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return (
    <OrganizationAnalyticsDashboard
      analytics={analytics}
      headerActions={
        <Flex align="center" gap="sm">
          <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Flex>
      }
    />
  );
}
