/**
 * Time Tracking Page
 *
 * Main time tracking dashboard with entries and analytics.
 * Includes burn rate dashboard and user rate management.
 * Supports project filtering and role-based tab visibility.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MONTH, WEEK } from "@convex/lib/timeUtils";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useState } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatCurrency, formatDurationHuman } from "@/lib/formatting";
import { BarChart3 } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { PageControls, PageControlsGroup, PageControlsRow, PageStack } from "../layout";
import { EmptyState } from "../ui/EmptyState";
import { Label } from "../ui/Label";
import { OverviewBand } from "../ui/OverviewBand";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Tabs, TabsList, TabsTrigger } from "../ui/Tabs";
import { Typography } from "../ui/Typography";
import { BurnRateDashboard } from "./BurnRateDashboard";
import { TimeEntriesList } from "./TimeEntriesList";
import { UserRatesManagement } from "./UserRatesManagement";

interface TimeTrackingPageProps {
  /** Pre-selected project ID (locks to this project) */
  projectId?: Id<"projects">;
  /** User's role in the project - controls tab visibility */
  userRole?: "admin" | "editor" | "viewer" | null;
  /** If true, show all tabs regardless of role (for platform admins) */
  isGlobalAdmin?: boolean;
}

type TimeTrackingTab = "entries" | "burn-rate" | "rates";
type TimeTrackingDateRange = "week" | "month" | "all";
type TimeTrackingE2EState = "burn-rate" | "rates" | "all-time";

interface TimeEntrySummary {
  totalDuration: number;
  billableDuration: number;
  totalCost: number;
  entryCount: number;
  isTruncated: boolean;
}

interface TimeTrackingOverviewProps {
  billingEnabled: boolean;
  dateRange: TimeTrackingDateRange;
  rangeLabel: string;
  selectedProject: Id<"projects"> | "all";
  summary: TimeEntrySummary | undefined;
}

const DATE_RANGE_LABELS: Record<TimeTrackingDateRange, string> = {
  week: "Last 7 Days",
  month: "Last 30 Days",
  all: "All Time",
};

const TIME_TRACKING_E2E_STATE_STORAGE_KEY = "nixelo:e2e:time-tracking-state";

declare global {
  interface Window {
    __NIXELO_E2E_TIME_TRACKING_STATE__?: TimeTrackingE2EState;
  }
}

type TimeTrackingInitialState = {
  activeTab: TimeTrackingTab;
  dateRange: TimeTrackingDateRange;
  selectFirstProject: boolean;
};

function consumeTimeTrackingE2ERequestedState(): TimeTrackingInitialState {
  const defaultState: TimeTrackingInitialState = {
    activeTab: "entries",
    dateRange: "week",
    selectFirstProject: false,
  };

  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const requestedState =
      window.__NIXELO_E2E_TIME_TRACKING_STATE__ ??
      window.sessionStorage.getItem(TIME_TRACKING_E2E_STATE_STORAGE_KEY);
    delete window.__NIXELO_E2E_TIME_TRACKING_STATE__;
    window.sessionStorage.removeItem(TIME_TRACKING_E2E_STATE_STORAGE_KEY);

    switch (requestedState as TimeTrackingE2EState | null) {
      case "burn-rate":
        return {
          activeTab: "burn-rate",
          dateRange: "week",
          selectFirstProject: true,
        };
      case "rates":
        return {
          activeTab: "rates",
          dateRange: "week",
          selectFirstProject: true,
        };
      case "all-time":
        return {
          activeTab: "entries",
          dateRange: "all",
          selectFirstProject: false,
        };
      default:
        return defaultState;
    }
  } catch {
    return defaultState;
  }
}

function getDateRangeBounds(range: TimeTrackingDateRange): {
  startDate: number | undefined;
  endDate: number | undefined;
} {
  const now = Date.now();
  switch (range) {
    case "week":
      return { startDate: now - WEEK, endDate: now };
    case "month":
      return { startDate: now - MONTH, endDate: now };
    case "all":
      return { startDate: undefined, endDate: undefined };
  }
}

function formatLoggedMetric(totalLoggedSeconds: number, isTruncated: boolean): string {
  if (totalLoggedSeconds === 0) {
    return "0m";
  }

  return `${formatDurationHuman(totalLoggedSeconds)}${isTruncated ? "+" : ""}`;
}

function getEntriesMetricDetail(selectedProject: Id<"projects"> | "all"): string {
  return selectedProject === "all" ? "Across all visible projects" : "In the current project scope";
}

function formatBillableMetric({
  billingEnabled,
  totalCost,
  billableSeconds,
  isTruncated,
}: {
  billingEnabled: boolean;
  totalCost: number;
  billableSeconds: number;
  isTruncated: boolean;
}): string {
  if (billingEnabled && totalCost > 0) {
    return `${formatCurrency(totalCost)}${isTruncated ? "+" : ""}`;
  }

  if (billableSeconds > 0) {
    return `${formatDurationHuman(billableSeconds)}${isTruncated ? "+" : ""}`;
  }

  return "0m";
}

function getScopeDescription(selectedProject: Id<"projects"> | "all"): string {
  return selectedProject === "all"
    ? "Review the organization-wide time picture, then drill into a project when you need burn and rate detail."
    : "This view is filtered to a single project so cost and utilization stay specific.";
}

function TimeTrackingOverview({
  billingEnabled,
  dateRange,
  rangeLabel,
  selectedProject,
  summary,
}: TimeTrackingOverviewProps) {
  const totalLoggedSeconds = summary?.totalDuration ?? 0;
  const billableSeconds = summary?.billableDuration ?? 0;
  const totalCost = summary?.totalCost ?? 0;
  const entryCount = summary?.entryCount ?? 0;
  const isTruncated = summary?.isTruncated ?? false;
  const loggedValue = formatLoggedMetric(totalLoggedSeconds, isTruncated);
  const entriesDetail = getEntriesMetricDetail(selectedProject);
  const billableValue = formatBillableMetric({
    billingEnabled,
    totalCost,
    billableSeconds,
    isTruncated,
  });
  const scopeDescription = getScopeDescription(selectedProject);

  return (
    <div data-testid={TEST_IDS.TIME_TRACKING.OVERVIEW}>
      <OverviewBand
        eyebrow="Time summary"
        title="Review logged time, entry volume, and billable totals before drilling into detail."
        description="These metrics reflect the active project and date range, so the rest of the page stays anchored to the same scope."
        metrics={[
          {
            label: "Logged",
            value: <span data-testid={TEST_IDS.TIME_TRACKING.SUMMARY_LOGGED}>{loggedValue}</span>,
            detail: dateRange === "all" ? "Across all saved entries" : rangeLabel,
          },
          {
            label: "Entries",
            value: (
              <span data-testid={TEST_IDS.TIME_TRACKING.SUMMARY_ENTRIES}>
                {isTruncated ? `${entryCount}+` : entryCount}
              </span>
            ),
            detail: entriesDetail,
          },
          {
            label: "Billable",
            value: (
              <span data-testid={TEST_IDS.TIME_TRACKING.SUMMARY_BILLABLE}>{billableValue}</span>
            ),
            detail: billingEnabled ? "Tracked billable value" : "Billable time captured",
          },
        ]}
        aside={
          <Stack gap="sm">
            <Typography variant="label">Current scope</Typography>
            <Typography variant="small" color="secondary">
              {scopeDescription}
            </Typography>
          </Stack>
        }
      />
    </div>
  );
}

interface TimeTrackingControlsProps {
  activeTab: TimeTrackingTab;
  canSeeSensitiveTabs: boolean;
  dateRange: TimeTrackingDateRange;
  projectId?: Id<"projects">;
  projects: FunctionReturnType<typeof api.projects.getCurrentUserProjects>["page"] | undefined;
  selectedProject: Id<"projects"> | "all";
  onActiveTabChange: (value: TimeTrackingTab) => void;
  onDateRangeChange: (value: TimeTrackingDateRange) => void;
  onProjectChange: (value: Id<"projects"> | "all") => void;
}

function TimeTrackingControls({
  activeTab,
  canSeeSensitiveTabs,
  dateRange,
  projectId,
  projects,
  selectedProject,
  onActiveTabChange,
  onDateRangeChange,
  onProjectChange,
}: TimeTrackingControlsProps) {
  return (
    <PageControls className="border-ui-border-secondary/80" spacing="stack">
      <PageControlsRow>
        <Tabs
          value={activeTab}
          onValueChange={(value) => onActiveTabChange(value as TimeTrackingTab)}
          className="border-b border-ui-border"
        >
          <TabsList variant="underline" className="gap-6">
            <TabsTrigger
              value="entries"
              variant="underline"
              size="underlineCompact"
              tone="indigo"
              data-testid={TEST_IDS.TIME_TRACKING.TAB_ENTRIES}
            >
              Time Entries
            </TabsTrigger>
            {canSeeSensitiveTabs && (
              <>
                <TabsTrigger
                  value="burn-rate"
                  variant="underline"
                  size="underlineCompact"
                  tone="indigo"
                  data-testid={TEST_IDS.TIME_TRACKING.TAB_BURN_RATE}
                >
                  Burn Rate & Costs
                </TabsTrigger>
                <TabsTrigger
                  value="rates"
                  variant="underline"
                  size="underlineCompact"
                  tone="indigo"
                  data-testid={TEST_IDS.TIME_TRACKING.TAB_RATES}
                >
                  Hourly Rates
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </PageControlsRow>

      <PageControlsGroup gap="lg">
        {!projectId && (
          <Stack gap="xs">
            <Label htmlFor="tracking-project-filter">Project</Label>
            <Select
              value={selectedProject}
              onValueChange={(value) =>
                onProjectChange(value === "all" ? "all" : (value as Id<"projects">))
              }
            >
              <SelectTrigger
                id="tracking-project-filter"
                data-testid={TEST_IDS.TIME_TRACKING.PROJECT_FILTER}
              >
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>
        )}

        {activeTab === "entries" && (
          <Stack gap="xs">
            <Label htmlFor="tracking-date-range">Date Range</Label>
            <Select
              value={dateRange}
              onValueChange={(value) => onDateRangeChange(value as TimeTrackingDateRange)}
            >
              <SelectTrigger
                id="tracking-date-range"
                data-testid={TEST_IDS.TIME_TRACKING.DATE_RANGE_FILTER}
              >
                <SelectValue placeholder="Select range..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </Stack>
        )}
      </PageControlsGroup>
    </PageControls>
  );
}

interface TimeTrackingContentProps {
  activeTab: TimeTrackingTab;
  billingEnabled: boolean;
  canSeeSensitiveTabs: boolean;
  endDate: number | undefined;
  projectId?: Id<"projects">;
  selectedProject: Id<"projects"> | "all";
  startDate: number | undefined;
}

function TimeTrackingContent({
  activeTab,
  billingEnabled,
  canSeeSensitiveTabs,
  endDate,
  projectId,
  selectedProject,
  startDate,
}: TimeTrackingContentProps) {
  if (activeTab === "entries") {
    return (
      <TimeEntriesList
        projectId={selectedProject === "all" ? undefined : selectedProject}
        startDate={startDate}
        endDate={endDate}
        billingEnabled={billingEnabled}
      />
    );
  }

  if (canSeeSensitiveTabs && activeTab === "burn-rate" && selectedProject !== "all") {
    return <BurnRateDashboard projectId={selectedProject} />;
  }

  if (canSeeSensitiveTabs && activeTab === "burn-rate" && selectedProject === "all") {
    return (
      <EmptyState
        icon={BarChart3}
        title="Select a project"
        description="Choose a project from the filter above to view burn rate and cost analysis."
      />
    );
  }

  if (canSeeSensitiveTabs && activeTab === "rates") {
    return <UserRatesManagement />;
  }

  return projectId ? null : (
    <EmptyState
      icon={BarChart3}
      title="Select a project"
      description="Choose a project from the filter above to continue."
    />
  );
}

/** Main time tracking page with entries, burn rate, and rates tabs. */
export function TimeTrackingPage({ projectId, userRole, isGlobalAdmin }: TimeTrackingPageProps) {
  const [initialState] = useState<TimeTrackingInitialState>(() =>
    consumeTimeTrackingE2ERequestedState(),
  );
  const [activeTab, setActiveTab] = useState<TimeTrackingTab>(initialState.activeTab);
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | "all">(
    projectId ?? "all",
  );
  const [dateRange, setDateRange] = useState<TimeTrackingDateRange>(initialState.dateRange);

  // Get billing setting from organization context
  const { billingEnabled } = useOrganization();

  // Only fetch projects list if no projectId is locked
  const projects = useAuthenticatedQuery(
    api.projects.getCurrentUserProjects,
    projectId ? "skip" : {},
  );

  useEffect(() => {
    if (projectId || !initialState.selectFirstProject || selectedProject !== "all") {
      return;
    }

    const firstProjectId = projects?.page?.[0]?._id;
    if (firstProjectId) {
      setSelectedProject(firstProjectId);
    }
  }, [initialState.selectFirstProject, projectId, projects?.page, selectedProject]);

  // Determine if user can see sensitive tabs (burn rate, hourly rates)
  const canSeeSensitiveTabs = isGlobalAdmin || userRole === "admin";

  // Compute date bounds at render time to stay current in long-lived sessions
  const { startDate, endDate } = getDateRangeBounds(dateRange);
  const rangeLabel = DATE_RANGE_LABELS[dateRange];

  // Use aggregate query for accurate totals (no pagination limits)
  const summary = useAuthenticatedQuery(api.timeTracking.getTimeEntrySummary, {
    projectId: selectedProject === "all" ? undefined : selectedProject,
    startDate,
    endDate,
  });

  return (
    <PageStack data-testid={TEST_IDS.TIME_TRACKING.CONTENT}>
      {summary !== undefined && (
        <TimeTrackingOverview
          billingEnabled={billingEnabled}
          dateRange={dateRange}
          rangeLabel={rangeLabel}
          selectedProject={selectedProject}
          summary={summary}
        />
      )}

      <TimeTrackingControls
        activeTab={activeTab}
        canSeeSensitiveTabs={canSeeSensitiveTabs}
        dateRange={dateRange}
        projectId={projectId}
        projects={projects?.page}
        selectedProject={selectedProject}
        onActiveTabChange={setActiveTab}
        onDateRangeChange={setDateRange}
        onProjectChange={setSelectedProject}
      />

      <TimeTrackingContent
        activeTab={activeTab}
        billingEnabled={billingEnabled}
        canSeeSensitiveTabs={canSeeSensitiveTabs}
        endDate={endDate}
        projectId={projectId}
        selectedProject={selectedProject}
        startDate={startDate}
      />
    </PageStack>
  );
}
