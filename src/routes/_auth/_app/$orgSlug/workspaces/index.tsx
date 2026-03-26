import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDeferredValue, useMemo, useState } from "react";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { PageContent, PageHeader, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Input } from "@/components/ui/Input";
import { OverviewBand } from "@/components/ui/OverviewBand";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { WorkspaceCard } from "@/components/Workspaces/WorkspaceCard";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Building2, SearchX, X } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import {
  filterWorkspaces,
  getWorkspaceOverviewCopy,
  getWorkspaceSearchEmptyState,
  getWorkspaceSearchSummary,
  shouldShowWorkspaceSearch,
} from "@/lib/workspaces";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/")({
  component: WorkspacesList,
});

type WorkspaceListData = Exclude<
  ReturnType<typeof useAuthenticatedQuery<typeof api.workspaces.list>>,
  undefined
>;
type WorkspaceListItem = WorkspaceListData[number];

function getWorkspacePageEmptyState(onCreateWorkspace: () => void) {
  return {
    icon: Building2,
    title: "No workspaces yet",
    description: "Create your first workspace to organize teams and projects",
    actions: (
      <Button variant="primary" onClick={onCreateWorkspace}>
        + Create Workspace
      </Button>
    ),
  };
}

interface WorkspaceSearchControlsProps {
  showSearch: boolean;
  hasSearch: boolean;
  searchQuery: string;
  matchCount: number;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

function WorkspaceSearchControls({
  showSearch,
  hasSearch,
  searchQuery,
  matchCount,
  onSearchChange,
  onClearSearch,
}: WorkspaceSearchControlsProps) {
  if (!showSearch) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Flex gap="sm" align="center">
        <Input
          data-testid={TEST_IDS.WORKSPACE.SEARCH_INPUT}
          type="text"
          variant="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search workspaces..."
        />
        {hasSearch && (
          <Button variant="ghost" size="sm" onClick={onClearSearch} aria-label="Clear search">
            <X className="size-4" />
          </Button>
        )}
      </Flex>

      {hasSearch && (
        <Typography variant="small" color="secondary">
          {getWorkspaceSearchSummary(matchCount, searchQuery)}
        </Typography>
      )}
    </Stack>
  );
}

interface WorkspaceResultsProps {
  filteredWorkspaces: WorkspaceListItem[] | undefined;
  hasSearch: boolean;
  orgSlug: string;
  searchEmptyState: ReturnType<typeof getWorkspaceSearchEmptyState> | null;
  onClearSearch: () => void;
}

function WorkspaceResults({
  filteredWorkspaces,
  hasSearch,
  orgSlug,
  searchEmptyState,
  onClearSearch,
}: WorkspaceResultsProps) {
  if (filteredWorkspaces && filteredWorkspaces.length > 0) {
    return (
      <Grid cols={1} colsMd={2} gap="xl">
        {filteredWorkspaces.map((workspace) => (
          <WorkspaceCard key={workspace._id} orgSlug={orgSlug} workspace={workspace} />
        ))}
      </Grid>
    );
  }

  if (!hasSearch) {
    return null;
  }

  return (
    <EmptyState
      icon={SearchX}
      title={searchEmptyState?.title ?? "No workspaces match your search"}
      description={
        searchEmptyState?.description ?? "Try a different workspace name, slug, or description."
      }
      data-testid={TEST_IDS.WORKSPACE.SEARCH_EMPTY_STATE}
      action={{
        label: "Clear search",
        onClick: onClearSearch,
      }}
    />
  );
}

export function WorkspacesList() {
  const { organizationId, orgSlug } = useOrganization();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const workspaces = useAuthenticatedQuery(api.workspaces.list, { organizationId });

  const filteredWorkspaces = useMemo(() => {
    if (!workspaces) return undefined;
    return filterWorkspaces(workspaces, deferredQuery);
  }, [workspaces, deferredQuery]);

  const workspaceCount = workspaces?.length ?? 0;
  const totalTeams = workspaces?.reduce((sum, workspace) => sum + workspace.teamCount, 0) ?? 0;
  const totalProjects =
    workspaces?.reduce((sum, workspace) => sum + workspace.projectCount, 0) ?? 0;
  const overviewCopy = getWorkspaceOverviewCopy({
    workspaceCount,
    totalTeams,
    totalProjects,
  });
  const hasSearch = searchQuery.trim().length > 0;
  const showSearch = shouldShowWorkspaceSearch(workspaceCount, searchQuery);
  const matchCount = filteredWorkspaces?.length ?? 0;
  const searchEmptyState = hasSearch ? getWorkspaceSearchEmptyState(searchQuery) : null;
  const pageEmptyState =
    workspaces !== undefined && workspaces.length === 0
      ? getWorkspacePageEmptyState(() => setIsCreateModalOpen(true))
      : null;

  const handleWorkspaceCreated = (slug: string) => {
    navigate({
      to: ROUTES.workspaces.detail.path,
      params: { orgSlug, workspaceSlug: slug },
    });
  };

  return (
    <PageLayout>
      <PageHeader
        title="Workspaces"
        description="Organize your teams and projects into departments"
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            + Create Workspace
          </Button>
        }
      />

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleWorkspaceCreated}
      />

      <PageContent isLoading={workspaces === undefined} emptyState={pageEmptyState}>
        <Stack gap="xl">
          <OverviewBand
            eyebrow={overviewCopy.eyebrow}
            title={overviewCopy.title}
            description={overviewCopy.description}
            metrics={[
              { label: "Workspaces", value: workspaceCount },
              { label: "Teams", value: totalTeams },
              { label: "Projects", value: totalProjects },
            ]}
          />

          <WorkspaceSearchControls
            showSearch={showSearch}
            hasSearch={hasSearch}
            searchQuery={searchQuery}
            matchCount={matchCount}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery("")}
          />

          <WorkspaceResults
            filteredWorkspaces={filteredWorkspaces}
            hasSearch={hasSearch}
            orgSlug={orgSlug}
            searchEmptyState={searchEmptyState}
            onClearSearch={() => setSearchQuery("")}
          />
        </Stack>
      </PageContent>
    </PageLayout>
  );
}
