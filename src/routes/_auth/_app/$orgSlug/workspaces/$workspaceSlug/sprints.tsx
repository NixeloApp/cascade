import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageContent } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/formatting";
import { Calendar } from "@/lib/icons";
import { useWorkspaceLayout } from "./route";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/sprints")({
  component: WorkspaceSprintsPage,
});

type StatusFilter = "all" | "active" | "planned" | "completed";

function getSprintStatusVariant(status: string) {
  switch (status) {
    case "active":
      return "success" as const;
    case "completed":
      return "secondary" as const;
    default:
      return "info" as const;
  }
}

function WorkspaceSprintsPage() {
  const { workspaceId } = useWorkspaceLayout();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const activeSprints = useAuthenticatedQuery(api.workspaces.getActiveSprints, { workspaceId });

  if (activeSprints === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  const filtered =
    statusFilter === "all" ? activeSprints : activeSprints.filter((s) => s.status === statusFilter);

  return (
    <PageContent
      isEmpty={activeSprints.length === 0}
      emptyState={{
        icon: Calendar,
        title: "No sprints",
        description: "No sprints were found across projects in this workspace.",
      }}
    >
      <Stack gap="md">
        <Flex justify="between" align="center">
          <Typography variant="small" color="secondary">
            {filtered.length} {filtered.length === 1 ? "sprint" : "sprints"}
          </Typography>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger width="36" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </Flex>

        {filtered.length === 0 && activeSprints.length > 0 ? (
          <Typography variant="small" color="tertiary" className="text-center py-8">
            No sprints match the current filter.
          </Typography>
        ) : (
          <Stack gap="sm">
            {filtered.map((sprint) => {
              return (
                <Card key={sprint._id} hoverable padding="md">
                  <Flex justify="between" align="start" gap="md">
                    <Stack gap="xs">
                      <Flex align="center" gap="sm">
                        <Typography variant="label">{sprint.name}</Typography>
                        <Badge
                          shape="pill"
                          variant={getSprintStatusVariant(sprint.status)}
                          size="sm"
                        >
                          {sprint.status}
                        </Badge>
                      </Flex>
                      <Typography variant="small" color="tertiary">
                        {sprint.projectKey} · {sprint.projectName}
                      </Typography>
                      <Typography variant="small" color="secondary">
                        {sprint.issueCount} {sprint.issueCount === 1 ? "issue" : "issues"}
                      </Typography>
                    </Stack>
                    <Metadata size="sm">
                      {sprint.startDate ? (
                        <MetadataItem>{formatDate(sprint.startDate)}</MetadataItem>
                      ) : null}
                      {sprint.endDate ? (
                        <MetadataTimestamp date={sprint.endDate} prefix="Due" />
                      ) : null}
                    </Metadata>
                  </Flex>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </PageContent>
  );
}
