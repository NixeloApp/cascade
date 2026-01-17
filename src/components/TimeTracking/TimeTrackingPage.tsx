import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import { useOrganization } from "@/hooks/useOrgContext";
import { cn } from "@/lib/utils";
import { Flex } from "../ui/Flex";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
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

export function TimeTrackingPage({ projectId, userRole, isGlobalAdmin }: TimeTrackingPageProps) {
  const [activeTab, setActiveTab] = useState<"entries" | "burn-rate" | "rates">("entries");
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | "all">(
    projectId ?? "all",
  );
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");

  // Get billing setting from organization context
  const { billingEnabled } = useOrganization();

  // Only fetch projects list if no projectId is locked
  const projects = useQuery(api.projects.getCurrentUserProjects, projectId ? "skip" : undefined);

  // Determine if user can see sensitive tabs (burn rate, hourly rates)
  const canSeeSensitiveTabs = isGlobalAdmin || userRole === "admin";

  // Calculate date range
  const now = Date.now();
  const ranges = {
    week: {
      startDate: now - 7 * 24 * 60 * 60 * 1000,
      endDate: now,
    },
    month: {
      startDate: now - 30 * 24 * 60 * 60 * 1000,
      endDate: now,
    },
    all: {
      startDate: undefined,
      endDate: undefined,
    },
  };

  const { startDate, endDate } = ranges[dateRange];

  return (
    <Flex direction="column" gap="xl" className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div>
        <Typography variant="h1" className="text-2xl font-bold text-ui-text-primary">
          Time Tracking
        </Typography>
        <Typography className="text-sm text-ui-text-secondary mt-1">
          Track time, analyze costs, and monitor burn rate
        </Typography>
      </div>

      {/* Tabs */}
      <div className="border-b border-ui-border-primary">
        <nav className="-mb-px flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("entries")}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === "entries"
                ? "border-brand-indigo-border text-brand-indigo-text"
                : "border-transparent text-ui-text-secondary hover:text-ui-text-primary",
            )}
          >
            Time Entries
          </button>
          {canSeeSensitiveTabs && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("burn-rate")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "burn-rate"
                    ? "border-brand-indigo-border text-brand-indigo-text"
                    : "border-transparent text-ui-text-secondary hover:text-ui-text-primary",
                )}
              >
                Burn Rate & Costs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rates")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "rates"
                    ? "border-brand-indigo-border text-brand-indigo-text"
                    : "border-transparent text-ui-text-secondary hover:text-ui-text-primary",
                )}
              >
                Hourly Rates
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Filters */}
      <Flex align="center" gap="lg" className="flex-wrap">
        {/* Project filter - only show if not locked to a specific project */}
        {!projectId && (
          <div>
            <label
              htmlFor="tracking-project-filter"
              className="block text-xs font-medium text-ui-text-primary mb-1"
            >
              Project
            </label>
            <Select
              value={selectedProject}
              onValueChange={(value) =>
                setSelectedProject(value === "all" ? "all" : (value as Id<"projects">))
              }
            >
              <SelectTrigger id="tracking-project-filter" className="px-3 py-2 text-sm">
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects?.page?.map((project: Doc<"projects">) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date range filter */}
        {activeTab === "entries" && (
          <div>
            <label
              htmlFor="tracking-date-range"
              className="block text-xs font-medium text-ui-text-primary mb-1"
            >
              Date Range
            </label>
            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as "week" | "month" | "all")}
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
          </div>
        )}
      </Flex>

      {/* Content */}
      <div>
        {activeTab === "entries" && (
          <TimeEntriesList
            projectId={selectedProject === "all" ? undefined : selectedProject}
            startDate={startDate}
            endDate={endDate}
            billingEnabled={billingEnabled}
          />
        )}

        {/* Sensitive tabs - only render if user has permission */}
        {canSeeSensitiveTabs && activeTab === "burn-rate" && selectedProject !== "all" && (
          <BurnRateDashboard projectId={selectedProject} />
        )}

        {canSeeSensitiveTabs && activeTab === "burn-rate" && selectedProject === "all" && (
          <div className="text-center p-12 bg-ui-bg-secondary rounded-lg">
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
            <Typography variant="h3" className="mt-2 text-sm font-medium text-ui-text-primary">
              Select a project
            </Typography>
            <Typography className="mt-1 text-sm text-ui-text-tertiary">
              Choose a project to view burn rate and cost analysis
            </Typography>
          </div>
        )}

        {canSeeSensitiveTabs && activeTab === "rates" && <UserRatesManagement />}
      </div>
    </Flex>
  );
}
