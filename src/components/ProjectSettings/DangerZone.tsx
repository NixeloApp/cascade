import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form";
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
    <Card className="border-status-error/50">
      <div className="p-6">
        <Typography variant="large" color="error" className="mb-2">
          Danger Zone
        </Typography>
        <Typography variant="small" color="secondary" className="mb-4">
          Irreversible actions that affect the entire project
        </Typography>

        <div className="p-4 bg-status-error/5 border border-status-error/20 rounded-lg">
          <Flex justify="between" align="start">
            <div className="flex-1">
              <Typography variant="small" className="font-medium">
                Delete this project
              </Typography>
              <Typography variant="small" color="secondary" className="mt-1">
                Once you delete a project, there is no going back. This will permanently delete the
                project "{projectName}" and all its issues, sprints, and data.
              </Typography>
            </div>
            {!showConfirm && (
              <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
                Delete Project
              </Button>
            )}
          </Flex>

          {showConfirm && (
            <div className="mt-4 pt-4 border-t border-status-error/20">
              <Typography variant="small" className="mb-3">
                To confirm, type <strong className="font-mono">{projectKey}</strong> below:
              </Typography>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type ${projectKey} to confirm`}
                className="mb-3"
              />
              <Flex gap="sm">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={confirmText !== projectKey || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "I understand, delete this project"}
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
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
