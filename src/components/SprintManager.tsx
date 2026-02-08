import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { formatDate } from "@/lib/dates";
import { Trophy } from "@/lib/icons";
import { getStatusColor } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { SkeletonProjectCard } from "./ui/Skeleton";
import { Typography } from "./ui/Typography";

interface SprintManagerProps {
  projectId: Id<"projects">;
  canEdit?: boolean;
}

interface SprintCardProps {
  sprint: Doc<"sprints"> & { issueCount: number };
  canEdit: boolean;
  onStartSprint: (sprintId: Id<"sprints">) => Promise<void>;
  onCompleteSprint: (sprintId: Id<"sprints">) => Promise<void>;
}

function SprintCard({ sprint, canEdit, onStartSprint, onCompleteSprint }: SprintCardProps) {
  // Calculate progress percentage for active sprints
  const getProgressPercentage = () => {
    if (!sprint.startDate || !sprint.endDate) return 0;
    const now = Date.now();
    const total = sprint.endDate - sprint.startDate;
    const elapsed = now - sprint.startDate;
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const progress = sprint.status === "active" ? getProgressPercentage() : 0;

  return (
    <div className="card-subtle p-4 animate-fade-in">
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="lg"
        className="sm:flex-row sm:items-center"
      >
        <FlexItem flex="1" className="w-full sm:w-auto">
          <Flex wrap align="center" gap="sm" className="sm:gap-3 mb-2">
            <Typography variant="h5">{sprint.name}</Typography>
            <Badge size="md" className={getStatusColor(sprint.status)}>
              {sprint.status}
            </Badge>
            <Badge variant="neutral" size="sm">
              {sprint.issueCount} issues
            </Badge>
          </Flex>
          {sprint.goal && (
            <Typography variant="muted" className="mb-2">
              {sprint.goal}
            </Typography>
          )}

          {/* Progress bar for active sprints */}
          {sprint.status === "active" && sprint.startDate && sprint.endDate && (
            <div className="mt-3 mb-2">
              <Flex justify="between" className="mb-1">
                <Typography variant="caption">Sprint progress</Typography>
                <Typography variant="caption" className="text-brand">
                  {Math.round(progress)}%
                </Typography>
              </Flex>
              <div className="h-1.5 bg-ui-bg-tertiary rounded-pill overflow-hidden">
                <div
                  className="h-full bg-brand rounded-pill transition-default"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {sprint.startDate && sprint.endDate && (
            <Typography variant="caption">
              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
            </Typography>
          )}
        </FlexItem>
        {canEdit && (
          <Flex direction="column" gap="sm" className="sm:flex-row w-full sm:w-auto">
            {sprint.status === "future" && (
              <Button onClick={() => void onStartSprint(sprint._id)} variant="success" size="sm">
                Start Sprint
              </Button>
            )}
            {sprint.status === "active" && (
              <Button
                onClick={() => void onCompleteSprint(sprint._id)}
                variant="secondary"
                size="sm"
              >
                Complete Sprint
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </div>
  );
}

export function SprintManager({ projectId, canEdit = true }: SprintManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");

  const sprints = useQuery(api.sprints.listByProject, { projectId });
  const createSprint = useMutation(api.sprints.create);
  const startSprint = useMutation(api.sprints.startSprint);
  const completeSprint = useMutation(api.sprints.completeSprint);

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    try {
      await createSprint({
        projectId,
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || undefined,
      });

      setNewSprintName("");
      setNewSprintGoal("");
      setShowCreateForm(false);
      showSuccess("Sprint created successfully");
    } catch (error) {
      showError(error, "Failed to create sprint");
    }
  };

  const handleStartSprint = async (sprintId: Id<"sprints">) => {
    const startDate = Date.now();
    const endDate = startDate + 14 * 24 * 60 * 60 * 1000; // 2 weeks

    try {
      await startSprint({
        sprintId,
        startDate,
        endDate,
      });
      showSuccess("Sprint started successfully");
    } catch (error) {
      showError(error, "Failed to start sprint");
    }
  };

  const handleCompleteSprint = async (sprintId: Id<"sprints">) => {
    try {
      await completeSprint({ sprintId });
      showSuccess("Sprint completed successfully");
    } catch (error) {
      showError(error, "Failed to complete sprint");
    }
  };

  if (!sprints) {
    return (
      <div>
        <Flex align="center" justify="between" className="mb-6">
          <Typography variant="h4">Sprint Management</Typography>
        </Flex>
        <div className="space-y-4">
          <SkeletonProjectCard />
          <SkeletonProjectCard />
          <SkeletonProjectCard />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="md"
        className="sm:flex-row sm:items-center mb-6"
      >
        <Typography variant="h4">Sprint Management</Typography>
        {canEdit && (
          <Button onClick={() => setShowCreateForm(true)} variant="primary">
            <span className="hidden sm:inline">Create Sprint</span>
            <span className="sm:hidden">+ Sprint</span>
          </Button>
        )}
      </Flex>

      {/* Create Sprint Form */}
      {showCreateForm && (
        <div className="card-subtle p-4 mb-6 animate-scale-in">
          <form onSubmit={(e) => void handleCreateSprint(e)} className="space-y-4">
            <Input
              label="Sprint Name"
              type="text"
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              placeholder="e.g., Sprint 1"
            />
            <Textarea
              label="Sprint Goal (Optional)"
              value={newSprintGoal}
              onChange={(e) => setNewSprintGoal(e.target.value)}
              placeholder="What do you want to achieve in this sprint?"
              rows={2}
            />
            <Flex direction="column" gap="sm" className="sm:flex-row">
              <Button type="submit" variant="primary">
                Create Sprint
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSprintName("");
                  setNewSprintGoal("");
                }}
              >
                Cancel
              </Button>
            </Flex>
          </form>
        </div>
      )}

      {/* Sprints List */}
      <div className="space-y-4">
        {sprints.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No sprints yet"
            description="Create a sprint to start planning work"
            action={
              canEdit
                ? { label: "Create Sprint", onClick: () => setShowCreateForm(true) }
                : undefined
            }
          />
        ) : (
          sprints.map((sprint: Doc<"sprints"> & { issueCount: number }) => (
            <SprintCard
              key={sprint._id}
              sprint={sprint}
              canEdit={canEdit}
              onStartSprint={handleStartSprint}
              onCompleteSprint={handleCompleteSprint}
            />
          ))
        )}
      </div>
    </div>
  );
}
