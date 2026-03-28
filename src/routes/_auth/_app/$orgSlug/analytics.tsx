import { api } from "@convex/_generated/api";
import { DAY } from "@convex/lib/timeUtils";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { OrganizationAnalyticsDashboard } from "@/components/Analytics/OrganizationAnalyticsDashboard";
import { PageContent } from "@/components/layout";
import { Flex } from "@/components/ui/Flex";
import { Select } from "@/components/ui/Select";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";

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

const PERIOD_DAYS: Record<TimePeriod, number | undefined> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: undefined,
};

function getSinceDate(period: TimePeriod): number | undefined {
  const days = PERIOD_DAYS[period];
  return days ? Date.now() - days * DAY : undefined;
}

function AnalyticsPage() {
  const { organizationId } = useOrganization();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");

  const sinceDate = getSinceDate(timePeriod);
  const periodDays = PERIOD_DAYS[timePeriod];
  const analytics = useAuthenticatedQuery(api.analytics.getOrgAnalytics, {
    organizationId,
    sinceDate,
  });
  const trend = useAuthenticatedQuery(
    api.analytics.getOrgAnalyticsTrend,
    periodDays ? { organizationId, periodDays } : "skip",
  );

  if (analytics === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  return (
    <OrganizationAnalyticsDashboard
      analytics={analytics}
      trend={trend ?? undefined}
      headerActions={
        <Flex align="center" gap="sm">
          <Select
            onChange={(value) => setTimePeriod(value as TimePeriod)}
            options={TIME_PERIODS}
            testId={TEST_IDS.ANALYTICS.ORG_PERIOD_SELECT}
            value={timePeriod}
            width="sm"
          />
        </Flex>
      }
    />
  );
}
