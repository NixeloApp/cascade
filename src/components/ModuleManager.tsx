import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { formatDate } from "@/lib/dates";
import { Folder, User } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ModuleStatus } from "../../convex/validators";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

interface ModuleManagerProps {
  projectId: Id<"projects">;
  canEdit?: boolean;
}

const MODULE_STATUSES: { id: ModuleStatus; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "bg-ui-bg-tertiary text-ui-text-secondary" },
  {
    id: "planned",
    label: "Planned",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    id: "in_progress",
    label: "In Progress",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  {
    id: "paused",
    label: "Paused",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    id: "completed",
    label: "Completed",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
];

function getStatusConfig(status: ModuleStatus) {
  return MODULE_STATUSES.find((s) => s.id === status) ?? MODULE_STATUSES[0];
}

interface ModuleCardProps {
  module: {
    _id: Id<"modules">;
    name: string;
    description?: string;
    status: ModuleStatus;
    startDate?: number;
    targetDate?: number;
    lead?: {
      _id: Id<"users">;
      name?: string;
      email?: string;
      image?: string;
    } | null;
    issueCount: number;
    completedCount: number;
    progress: number;
  };
  canEdit: boolean;
  onStatusChange: (moduleId: Id<"modules">, status: ModuleStatus) => Promise<void>;
  onDelete: (moduleId: Id<"modules">) => Promise<void>;
}

function ModuleCard({ module, canEdit, onStatusChange, onDelete }: ModuleCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const statusConfig = getStatusConfig(module.status);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(module._id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card padding="md" className="animate-fade-in">
      <Flex direction="column" gap="md">
        {/* Header */}
        <Flex align="start" justify="between" gap="md">
          <Flex direction="column" className="flex-1 min-w-0">
            <Flex wrap align="center" gap="sm" className="mb-2">
              <Typography variant="h5" className="truncate">
                {module.name}
              </Typography>
              <div className="relative">
                <Badge
                  size="md"
                  className={cn(statusConfig.color, canEdit && "cursor-pointer")}
                  onClick={() => canEdit && setShowStatusMenu(!showStatusMenu)}
                >
                  {statusConfig.label}
                </Badge>
                {showStatusMenu && canEdit && (
                  <div
                    role="menu"
                    className="absolute top-full left-0 mt-1 z-dropdown bg-ui-bg border border-ui-border rounded-lg shadow-lg min-w-32"
                    onMouseLeave={() => setShowStatusMenu(false)}
                  >
                    {MODULE_STATUSES.map((status) => (
                      <button
                        key={status.id}
                        type="button"
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-ui-bg-hover first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => {
                          void onStatusChange(module._id, status.id);
                          setShowStatusMenu(false);
                        }}
                      >
                        <Badge size="sm" className={status.color}>
                          {status.label}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Flex>
            {module.description && (
              <Typography variant="small" color="secondary" className="line-clamp-2">
                {module.description}
              </Typography>
            )}
          </Flex>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="text-ui-text-tertiary hover:text-status-error shrink-0"
            >
              {isDeleting ? "..." : "Delete"}
            </Button>
          )}
        </Flex>

        {/* Progress bar */}
        <Stack gap="xs">
          <Flex justify="between">
            <Typography variant="caption">
              {module.completedCount} of {module.issueCount} issues completed
            </Typography>
            <Typography variant="caption" className="text-brand">
              {module.progress}%
            </Typography>
          </Flex>
          <div className="h-1.5 bg-ui-bg-tertiary rounded-pill overflow-hidden">
            <div
              className="size-full bg-brand rounded-pill transition-default"
              style={{ width: `${module.progress}%` }}
            />
          </div>
        </Stack>

        {/* Footer */}
        <Flex align="center" justify="between" gap="md">
          <Flex align="center" gap="sm">
            {module.lead ? (
              <Flex align="center" gap="xs">
                <Avatar
                  src={module.lead.image}
                  name={module.lead.name ?? module.lead.email}
                  size="xs"
                />
                <Typography variant="caption">{module.lead.name ?? module.lead.email}</Typography>
              </Flex>
            ) : (
              <Flex align="center" gap="xs" className="text-ui-text-tertiary">
                <User className="size-3" />
                <Typography variant="caption" color="tertiary">
                  No lead
                </Typography>
              </Flex>
            )}
          </Flex>
          {(module.startDate || module.targetDate) && (
            <Typography variant="caption" color="secondary">
              {module.startDate && formatDate(module.startDate)}
              {module.startDate && module.targetDate && " - "}
              {module.targetDate && formatDate(module.targetDate)}
            </Typography>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

export function ModuleManager({ projectId, canEdit = true }: ModuleManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  const [newModuleStartDate, setNewModuleStartDate] = useState("");
  const [newModuleTargetDate, setNewModuleTargetDate] = useState("");

  const modules = useQuery(api.modules.listByProject, { projectId });
  const createModule = useMutation(api.modules.create);
  const updateModule = useMutation(api.modules.update);
  const removeModule = useMutation(api.modules.remove);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;

    try {
      await createModule({
        projectId,
        name: newModuleName.trim(),
        description: newModuleDescription.trim() || undefined,
        startDate: newModuleStartDate ? new Date(newModuleStartDate).getTime() : undefined,
        targetDate: newModuleTargetDate ? new Date(newModuleTargetDate).getTime() : undefined,
      });

      setNewModuleName("");
      setNewModuleDescription("");
      setNewModuleStartDate("");
      setNewModuleTargetDate("");
      setShowCreateForm(false);
      showSuccess("Module created successfully");
    } catch (error) {
      showError(error, "Failed to create module");
    }
  };

  const handleStatusChange = async (moduleId: Id<"modules">, status: ModuleStatus) => {
    try {
      await updateModule({ projectId, moduleId, status });
      showSuccess("Module status updated");
    } catch (error) {
      showError(error, "Failed to update module status");
    }
  };

  const handleDelete = async (moduleId: Id<"modules">) => {
    try {
      await removeModule({ projectId, moduleId });
      showSuccess("Module deleted");
    } catch (error) {
      showError(error, "Failed to delete module");
    }
  };

  if (!modules) {
    return (
      <Stack gap="lg">
        <Flex align="center" justify="between">
          <Typography variant="h4">Modules</Typography>
        </Flex>
        <Stack gap="md">
          {[1, 2, 3].map((i) => (
            <Card key={`skeleton-${i.toString()}`} padding="md" className="animate-pulse">
              <div className="h-24 bg-ui-bg-tertiary rounded" />
            </Card>
          ))}
        </Stack>
      </Stack>
    );
  }

  // Group modules by status
  const activeModules = modules.filter((m) => m.status === "in_progress");
  const plannedModules = modules.filter((m) => m.status === "planned");
  const backlogModules = modules.filter((m) => m.status === "backlog");
  const completedModules = modules.filter(
    (m) => m.status === "completed" || m.status === "cancelled",
  );
  const pausedModules = modules.filter((m) => m.status === "paused");

  return (
    <Stack gap="lg">
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="md"
        className="sm:flex-row sm:items-center"
      >
        <Stack gap="xs">
          <Typography variant="h4">Modules</Typography>
          <Typography variant="small" color="secondary">
            Organize issues by feature or component
          </Typography>
        </Stack>
        {canEdit && (
          <Button onClick={() => setShowCreateForm(true)} variant="primary">
            <span className="hidden sm:inline">Create Module</span>
            <span className="sm:hidden">+ Module</span>
          </Button>
        )}
      </Flex>

      {/* Create Module Form */}
      {showCreateForm && (
        <Card padding="md" className="animate-scale-in">
          <Stack as="form" gap="md" onSubmit={(e: React.FormEvent) => void handleCreateModule(e)}>
            <Input
              label="Module Name"
              type="text"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              placeholder="e.g., User Authentication"
              required
            />
            <Textarea
              label="Description (Optional)"
              value={newModuleDescription}
              onChange={(e) => setNewModuleDescription(e.target.value)}
              placeholder="What functionality does this module cover?"
              rows={2}
            />
            <Flex direction="column" gap="md" className="sm:flex-row">
              <FlexItem flex="1">
                <Input
                  label="Start Date (Optional)"
                  type="date"
                  value={newModuleStartDate}
                  onChange={(e) => setNewModuleStartDate(e.target.value)}
                />
              </FlexItem>
              <FlexItem flex="1">
                <Input
                  label="Target Date (Optional)"
                  type="date"
                  value={newModuleTargetDate}
                  onChange={(e) => setNewModuleTargetDate(e.target.value)}
                />
              </FlexItem>
            </Flex>
            <Flex direction="column" gap="sm" className="sm:flex-row">
              <Button type="submit" variant="primary">
                Create Module
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewModuleName("");
                  setNewModuleDescription("");
                  setNewModuleStartDate("");
                  setNewModuleTargetDate("");
                }}
              >
                Cancel
              </Button>
            </Flex>
          </Stack>
        </Card>
      )}

      {/* Modules List */}
      {modules.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No modules yet"
          description="Create modules to organize issues by feature or component"
          action={
            canEdit ? { label: "Create Module", onClick: () => setShowCreateForm(true) } : undefined
          }
        />
      ) : (
        <Stack gap="lg">
          {/* In Progress */}
          {activeModules.length > 0 && (
            <Stack gap="md">
              <Typography variant="label" color="secondary">
                In Progress ({activeModules.length})
              </Typography>
              {activeModules.map((module) => (
                <ModuleCard
                  key={module._id}
                  module={module}
                  canEdit={canEdit}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </Stack>
          )}

          {/* Planned */}
          {plannedModules.length > 0 && (
            <Stack gap="md">
              <Typography variant="label" color="secondary">
                Planned ({plannedModules.length})
              </Typography>
              {plannedModules.map((module) => (
                <ModuleCard
                  key={module._id}
                  module={module}
                  canEdit={canEdit}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </Stack>
          )}

          {/* Backlog */}
          {backlogModules.length > 0 && (
            <Stack gap="md">
              <Typography variant="label" color="secondary">
                Backlog ({backlogModules.length})
              </Typography>
              {backlogModules.map((module) => (
                <ModuleCard
                  key={module._id}
                  module={module}
                  canEdit={canEdit}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </Stack>
          )}

          {/* Paused */}
          {pausedModules.length > 0 && (
            <Stack gap="md">
              <Typography variant="label" color="secondary">
                Paused ({pausedModules.length})
              </Typography>
              {pausedModules.map((module) => (
                <ModuleCard
                  key={module._id}
                  module={module}
                  canEdit={canEdit}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </Stack>
          )}

          {/* Completed/Cancelled */}
          {completedModules.length > 0 && (
            <Stack gap="md">
              <Typography variant="label" color="secondary">
                Done ({completedModules.length})
              </Typography>
              {completedModules.map((module) => (
                <ModuleCard
                  key={module._id}
                  module={module}
                  canEdit={canEdit}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
