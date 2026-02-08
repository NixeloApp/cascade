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
    <Card className="border-status-error/30 bg-status-error-bg/30">
      <div className="p-6">
        <Flex justify="between" align="center" className="mb-6">
          <div>
            <Typography variant="large" className="font-semibold tracking-tight text-status-error">
              Danger Zone
            </Typography>
            <Typography variant="small" color="secondary" className="mt-0.5">
              Irreversible actions that affect the entire project
            </Typography>
          </div>
        </Flex>

        <div className="p-5 bg-status-error/5 border border-status-error/15 rounded-lg transition-default">
          <Flex justify="between" align="start" gap="lg">
            <FlexItem flex="1">
              <Typography variant="small" className="font-semibold text-status-error-text">
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
            <div className="mt-5 pt-5 border-t border-status-error/15">
              <Typography variant="small" className="mb-3 text-status-error-text">
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
                className="mb-4"
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
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
