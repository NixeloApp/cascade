import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Github, Trash2 } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Flex } from "../ui/Flex";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
/**
 * GitHub linked repositories management
 * Extracted from Settings/GitHubIntegration for better organization
 */
export function LinkedRepositories() {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Id<"projects"> | null>(null);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [pendingUnlinkId, setPendingUnlinkId] = useState<Id<"githubRepositories"> | null>(null);
  const projects = useAuthenticatedQuery(api.projects.getCurrentUserProjects, {});
  const repositories = useAuthenticatedQuery(
    api.github.listRepositories,
    selectedWorkspace ? { projectId: selectedWorkspace } : "skip",
  );
  const { mutate: unlinkRepo } = useAuthenticatedMutation(api.github.unlinkRepository);

  const handleUnlinkClick = (repoId: Id<"githubRepositories">) => {
    setPendingUnlinkId(repoId);
    setUnlinkConfirmOpen(true);
  };

  const handleUnlinkConfirm = async () => {
    if (!pendingUnlinkId) return;
    try {
      await unlinkRepo({ repositoryId: pendingUnlinkId });
      showSuccess("Repository unlinked");
    } catch (error) {
      showError(error, "Failed to unlink repository");
    } finally {
      setPendingUnlinkId(null);
    }
  };

  return (
    <Stack gap="md">
      <Typography variant="h4">Linked Repositories</Typography>

      {/* Project selector */}
      <Stack gap="xs">
        <Label htmlFor="project-selector">Select Project</Label>
        <Select
          value={selectedWorkspace || ""}
          onValueChange={(value) => setSelectedWorkspace(value as Id<"projects">)}
        >
          <SelectTrigger className="w-full px-3 py-2 border border-ui-border rounded-md bg-ui-bg">
            <SelectValue placeholder="-- Select a project --" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">-- Select a project --</SelectItem>
            {projects?.page?.map((project: Doc<"projects">) => (
              <SelectItem key={project._id} value={project._id}>
                {project.name} ({project.key})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Stack>

      {/* Repository list */}
      {selectedWorkspace && (
        <Stack gap="sm">
          {repositories && repositories.length === 0 && (
            <Typography variant="small" color="secondary" className="italic">
              No repositories linked to this project yet.
            </Typography>
          )}
          {repositories?.map((repo: Doc<"githubRepositories">) => (
            <Card key={repo._id} padding="sm" className="bg-ui-bg-secondary">
              <Flex justify="between" align="center">
                <Flex gap="md" align="center">
                  <Github className="h-5 w-5 text-ui-text-tertiary" />
                  <Stack gap="none">
                    <Typography variant="label">{repo.repoFullName}</Typography>
                    <Typography variant="caption" color="secondary">
                      {repo.syncPRs && "PRs"} {repo.syncPRs && repo.autoLinkCommits && "• "}
                      {repo.autoLinkCommits && "Auto-link commits"}
                    </Typography>
                  </Stack>
                </Flex>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkClick(repo._id)}
                  aria-label={`Unlink ${repo.repoFullName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Flex>
            </Card>
          ))}
        </Stack>
      )}

      {selectedWorkspace && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast.info("Repository linking UI coming soon")}
        >
          + Link New Repository
        </Button>
      )}

      <ConfirmDialog
        isOpen={unlinkConfirmOpen}
        onClose={() => setUnlinkConfirmOpen(false)}
        onConfirm={handleUnlinkConfirm}
        title="Unlink Repository"
        message="Are you sure you want to unlink this repository?"
        variant="danger"
        confirmLabel="Unlink"
      />
    </Stack>
  );
}
