/**
 * Project Board Page
 *
 * Kanban board view for project issues with sprint support.
 * Handles URL-based filtering and sprint selection.
 * Shows sprint progress and workload indicators.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { ExportButton } from "@/components/ExportButton";
import { type BoardFilters, FilterBar } from "@/components/FilterBar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { PageContent, PageError } from "@/components/layout";
import { SprintProgressBar, SprintWorkload } from "@/components/Sprints";
import { Badge } from "@/components/ui/Badge";
import { Flex, FlexItem } from "@/components/ui/Flex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useProjectByKey } from "@/hooks/useProjectByKey";
import {
  type BoardSearchFilters,
  filtersToSearchParams,
  searchParamsToFilters,
  validateBoardSearchFilters,
} from "@/lib/filter-url";

interface BoardSearch extends BoardSearchFilters {
  sprint?: string;
}

export const Route = createFileRoute("/_auth/_app/$orgSlug/projects/$key/board")({
  component: BoardPage,
  validateSearch: (search: Record<string, unknown>): BoardSearch => ({
    sprint: typeof search.sprint === "string" ? search.sprint : undefined,
    ...validateBoardSearchFilters(search),
  }),
});

function BoardPage() {
  const { key } = Route.useParams();
  const searchParams = Route.useSearch();
  const { sprint: sprintParam } = searchParams;
  const navigate = Route.useNavigate();

  // Derive filters from URL (URL is source of truth)
  // Use individual params as dependencies for stable memoization
  const filters = searchParamsToFilters({
    query: searchParams.query,
    type: searchParams.type,
    priority: searchParams.priority,
    assigneeId: searchParams.assigneeId,
    labels: searchParams.labels,
    dueDate: searchParams.dueDate,
    startDate: searchParams.startDate,
    createdAt: searchParams.createdAt,
  });

  // Update URL when filters change
  const handleFilterChange = (newFilters: BoardFilters) => {
    navigate({
      search: (prev) => ({
        sprint: prev.sprint,
        ...filtersToSearchParams(newFilters),
      }),
      replace: true,
    });
  };

  const project = useProjectByKey(key);
  const sprints = useAuthenticatedQuery(
    api.sprints.listByProject,
    project ? { projectId: project._id } : "skip",
  );

  if (project === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (!project) {
    return (
      <PageError
        title="Project Not Found"
        message={`The project "${key}" doesn't exist or you don't have access to it.`}
      />
    );
  }

  const activeSprint = sprints?.find((s: Doc<"sprints">) => s.status === "active");
  const selectedSprintId = sprintParam as Id<"sprints"> | undefined;
  const effectiveSprintId = selectedSprintId || activeSprint?._id;
  const showMobileSprintControls = project.boardType === "scrum" && !!sprints;

  const handleSprintChange = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        sprint: value === "active" ? undefined : value,
      }),
      replace: true,
    });
  };

  return (
    <Flex direction="column" className="h-full">
      <div className="hidden px-2 pt-1.5 sm:block sm:px-4 sm:pt-3">
        <div className="rounded-2xl border border-ui-border/70 bg-ui-bg-elevated/90 px-4 py-3 shadow-soft">
          <Flex
            align="center"
            justify="between"
            gap="md"
            className="flex-row flex-wrap sm:flex-nowrap"
          >
            <Flex align="center" gap="sm" wrap className="min-w-0">
              <div>
                <Typography variant="h4" className="tracking-tight">
                  Delivery board
                </Typography>
                <Typography variant="caption" className="mt-1">
                  Filter issues, switch sprints, and move work without leaving the board.
                </Typography>
              </div>
              <Badge variant="neutral" size="sm" className="inline-flex text-xs">
                {project.key}
              </Badge>
              <Badge variant="accent" size="md" className="inline-flex">
                {project.boardType}
              </Badge>
            </Flex>
            <Flex align="center" gap="sm" wrap className="w-full justify-end sm:ml-auto sm:w-auto">
              {/* Sprint Progress & Workload */}
              {project.boardType === "scrum" && effectiveSprintId && (
                <>
                  <SprintProgressBar projectId={project._id} sprintId={effectiveSprintId} />
                  <SprintWorkload sprintId={effectiveSprintId} />
                </>
              )}

              <ExportButton projectId={project._id} sprintId={effectiveSprintId} />
              {project.boardType === "scrum" && sprints && (
                <Select value={selectedSprintId || "active"} onValueChange={handleSprintChange}>
                  <SelectTrigger className="w-48 px-3 py-2 border border-ui-border rounded-md text-sm">
                    <SelectValue placeholder="Active Sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Sprint</SelectItem>
                    {sprints.map((sprint: Doc<"sprints">) => (
                      <SelectItem key={sprint._id} value={sprint._id}>
                        {sprint.name} ({sprint.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Flex>
          </Flex>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar projectId={project._id} filters={filters} onFilterChange={handleFilterChange} />

      {/* Board Content */}
      <FlexItem flex="1" className="overflow-hidden">
        <KanbanBoard
          projectId={project._id}
          sprintId={effectiveSprintId}
          filters={filters}
          mobileActions={
            <>
              {showMobileSprintControls && sprints && (
                <Select value={selectedSprintId || "active"} onValueChange={handleSprintChange}>
                  <SelectTrigger className="h-7 min-w-24 rounded-lg border border-ui-border/70 bg-ui-bg-elevated/92 px-2 text-xs shadow-soft">
                    <SelectValue placeholder="Sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Sprint</SelectItem>
                    {sprints.map((sprint: Doc<"sprints">) => (
                      <SelectItem key={sprint._id} value={sprint._id}>
                        {sprint.name} ({sprint.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <ExportButton projectId={project._id} sprintId={effectiveSprintId} />
            </>
          }
        />
      </FlexItem>
    </Flex>
  );
}
