import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Input } from "../ui/form";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface DangerZoneProps {
  projectId: Id<"projects">;
  projectName: string;
  projectKey: string;
  isOwner: boolean;
  orgSlug: string;
}

export function DangerZone({
  projectId,
  projectName,
  projectKey,
  isOwner,
  orgSlug,
}: DangerZoneProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const deleteProject = useMutation(api.projects.softDeleteProject);

  const handleDelete = async () => {
    if (confirmText !== projectKey) {
      showError(new Error("Please type the project key to confirm"), "Confirmation required");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProject({ projectId });
      showSuccess("Project deleted successfully");
      navigate({ to: ROUTES.projects.list.path, params: { orgSlug } });
    } catch (error) {
      showError(error, "Failed to delete project");
      setIsDeleting(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Card padding="lg" className="border-status-error/30 bg-status-error-bg/30">
      <Stack gap="lg">
        <Flex justify="between" align="center">
          <Stack gap="xs">
            <Typography variant="h4" color="error">
              Danger Zone
            </Typography>
            <Typography variant="small" color="secondary">
              Irreversible actions that affect the entire project
            </Typography>
          </Stack>
        </Flex>

        <Card padding="md" className="bg-status-error/5 border-status-error/15">
          <Flex justify="between" align="start" gap="lg">
            <FlexItem flex="1">
              <Typography variant="label" color="error">
                Delete this project
              </Typography>
              <Typography variant="small" color="secondary" className="mt-1.5 leading-relaxed">
                Once you delete a project, there is no going back. This will permanently delete the
                project "{projectName}" and all its issues, sprints, and data.
              </Typography>
            </FlexItem>
            {!showConfirm && (
              <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
                Delete Project
              </Button>
            )}
          </Flex>

          {showConfirm && (
            <Card
              padding="md"
              variant="ghost"
              radius="none"
              className="mt-5 border-t border-status-error/15"
            >
              <Stack gap="md">
                <Typography variant="small" color="error">
                  To confirm, type{" "}
                  <code className="font-semibold bg-status-error/10 px-1.5 py-0.5 rounded">
                    {projectKey}
                  </code>{" "}
                  below:
                </Typography>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Type ${projectKey} to confirm`}
                />
                <Flex gap="sm">
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={confirmText !== projectKey || isDeleting}
                    isLoading={isDeleting}
                  >
                    I understand, delete this project
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmText("");
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Stack>
            </Card>
          )}
        </Card>
      </Stack>
    </Card>
  );
}
