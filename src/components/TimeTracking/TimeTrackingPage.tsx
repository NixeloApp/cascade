/**
 * Time Tracking Page
 *
 * Main time tracking dashboard with entries and analytics.
 * Includes burn rate dashboard and user rate management.
 * Supports project filtering and role-based tab visibility.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { MONTH, WEEK } from "@convex/lib/timeUtils";
import { useMemo, useState } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatCurrency, formatDurationHuman } from "@/lib/formatting";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
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

interface TimeEntrySummary {
  totalDuration: number;
  billableDuration: number;
  totalCost: number;
  entryCount: number;
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

  return (
    <OverviewBand
      eyebrow="Operations pulse"
      title="Track time with enough context to understand cost, not just duration."
      description="Use one workspace-level view for recent entries, burn, and rates so delivery health stays visible while the team is still moving."
      metrics={[
        {
          label: "Logged",
          value: totalLoggedSeconds > 0 ? formatDurationHuman(totalLoggedSeconds) : "0m",
          detail: dateRange === "all" ? "Across all saved entries" : rangeLabel,
        },
        {
          label: "Entries",
          value: entryCount,
          detail:
            selectedProject === "all"
              ? "Across all visible projects"
              : "In the current project scope",
        },
        {
          label: "Billable",
          value:
            billingEnabled && totalCost > 0
              ? formatCurrency(totalCost)
              : billableSeconds > 0
                ? formatDurationHuman(billableSeconds)
                : "0m",
          detail: billingEnabled ? "Tracked billable value" : "Billable time captured",
        },
      ]}
      aside={
        <Stack gap="sm">
          <Typography variant="label">Current scope</Typography>
          <Typography variant="small" color="secondary">
            {selectedProject === "all"
              ? "Review the organization-wide time picture, then drill into a project when you need burn and rate detail."
              : "This view is filtered to a single project so cost and utilization stay specific."}
          </Typography>
        </Stack>
      }
    />
  );
}

interface TimeTrackingControlsProps {
  activeTab: TimeTrackingTab;
  canSeeSensitiveTabs: boolean;
  dateRange: TimeTrackingDateRange;
  projectId?: Id<"projects">;
  projects: Doc<"projects">[] | undefined;
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
    <Card variant="default" padding="md" className="border-ui-border-secondary/80">
      <Stack gap="md">
        <Tabs
          value={activeTab}
          onValueChange={(value) => onActiveTabChange(value as TimeTrackingTab)}
          className="border-b border-ui-border"
        >
          <TabsList variant="underline" className="gap-6">
            <TabsTrigger
              value="entries"
              variant="underline"
              className="pb-3 px-1 data-[state=active]:border-brand-indigo-border data-[state=active]:text-brand-indigo-text"
            >
              Time Entries
            </TabsTrigger>
            {canSeeSensitiveTabs && (
              <>
                <TabsTrigger
                  value="burn-rate"
                  variant="underline"
                  className="pb-3 px-1 data-[state=active]:border-brand-indigo-border data-[state=active]:text-brand-indigo-text"
                >
                  Burn Rate & Costs
                </TabsTrigger>
                <TabsTrigger
                  value="rates"
                  variant="underline"
                  className="pb-3 px-1 data-[state=active]:border-brand-indigo-border data-[state=active]:text-brand-indigo-text"
                >
                  Hourly Rates
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>

        <Flex align="center" gap="lg" className="flex-wrap">
          {!projectId && (
            <Stack gap="xs">
              <Label htmlFor="tracking-project-filter">Project</Label>
              <Select
                value={selectedProject}
                onValueChange={(value) =>
                  onProjectChange(value === "all" ? "all" : (value as Id<"projects">))
                }
              >
                <SelectTrigger id="tracking-project-filter" className="px-3 py-2 text-sm">
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
                <SelectTrigger id="tracking-date-range" className="px-3 py-2 text-sm">
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
        </Flex>
      </Stack>
    </Card>
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
      <Card variant="soft" className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-ui-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          role="img"
          aria-label="Chart icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <Typography variant="label" className="mt-2">
          Select a project
        </Typography>
        <Typography variant="small" color="tertiary" className="mt-1">
          Choose a project to view burn rate and cost analysis
        </Typography>
      </Card>
    );
  }

  if (canSeeSensitiveTabs && activeTab === "rates") {
    return <UserRatesManagement />;
  }

  return projectId ? null : (
    <Card variant="soft" className="text-center">
      <Typography variant="small" color="secondary">
        Select a project to continue.
      </Typography>
    </Card>
  );
}

/** Main time tracking page with entries, burn rate, and rates tabs. */
export function TimeTrackingPage({ projectId, userRole, isGlobalAdmin }: TimeTrackingPageProps) {
  const [activeTab, setActiveTab] = useState<TimeTrackingTab>("entries");
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | "all">(
    projectId ?? "all",
  );
  const [dateRange, setDateRange] = useState<TimeTrackingDateRange>("week");

  // Get billing setting from organization context
  const { billingEnabled } = useOrganization();

  // Only fetch projects list if no projectId is locked
  const projects = useAuthenticatedQuery(
    api.projects.getCurrentUserProjects,
    projectId ? "skip" : {},
  );

  // Determine if user can see sensitive tabs (burn rate, hourly rates)
  const canSeeSensitiveTabs = isGlobalAdmin || userRole === "admin";

  // Compute date bounds at render time to stay current in long-lived sessions
  const { startDate, endDate } = useMemo(() => getDateRangeBounds(dateRange), [dateRange]);
  const rangeLabel = DATE_RANGE_LABELS[dateRange];

  // Use aggregate query for accurate totals (no pagination limits)
  const summary = useAuthenticatedQuery(api.timeTracking.getTimeEntrySummary, {
    projectId: selectedProject === "all" ? undefined : selectedProject,
    startDate,
    endDate,
  });

  return (
    <Flex direction="column" gap="xl">
      <TimeTrackingOverview
        billingEnabled={billingEnabled}
        dateRange={dateRange}
        rangeLabel={rangeLabel}
        selectedProject={selectedProject}
        summary={summary}
      />

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
    </Flex>
  );
}
