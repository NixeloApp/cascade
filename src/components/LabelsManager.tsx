import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronRight, FolderPlus, Pencil, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useModal } from "@/hooks/useModal";
import { Tag } from "@/lib/icons";
import { showSuccess } from "@/lib/toast";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ColorPicker } from "./ui/ColorPicker";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Dialog } from "./ui/Dialog";
import { EmptyState } from "./ui/EmptyState";
import { Flex } from "./ui/Flex";
import { Input, Select } from "./ui/form";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Typography } from "./ui/Typography";

interface LabelsManagerProps {
  projectId: Id<"projects">;
}

interface LabelFormData {
  name: string;
  color: string;
  groupId: Id<"labelGroups"> | null;
  [key: string]: unknown;
}

interface GroupFormData {
  name: string;
  description: string;
  [key: string]: unknown;
}

// Default to brand-ring equivalent color
const DEFAULT_LABEL_COLOR = "#6366F1"; // matches --color-brand-ring

const DEFAULT_LABEL_FORM: LabelFormData = {
  name: "",
  color: DEFAULT_LABEL_COLOR,
  groupId: null,
};

const DEFAULT_GROUP_FORM: GroupFormData = {
  name: "",
  description: "",
};

type LabelGroup = {
  _id: Id<"labelGroups"> | null;
  name: string;
  description?: string;
  displayOrder: number;
  labels: Doc<"labels">[];
};

export function LabelsManager({ projectId }: LabelsManagerProps) {
  // Track collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Data - use the new grouped list endpoint
  const labelGroups = useQuery(api.labelGroups.list, { projectId });

  // Form states for labels
  const labelModal = useModal();
  const labelForm = useEntityForm<LabelFormData>(DEFAULT_LABEL_FORM);

  // Form states for groups
  const groupModal = useModal();
  const groupForm = useEntityForm<GroupFormData>(DEFAULT_GROUP_FORM);

  // Label mutations
  const createLabel = useMutation(api.labels.create);
  const updateLabel = useMutation(api.labels.update);
  const deleteLabelMutation = useMutation(api.labels.remove);

  // Group mutations
  const createGroup = useMutation(api.labelGroups.create);
  const updateGroup = useMutation(api.labelGroups.update);
  const deleteGroupMutation = useMutation(api.labelGroups.remove);

  // Label form submission
  const { mutate: submitLabelForm, isLoading: isLabelSubmitting } = useAsyncMutation(
    async () => {
      if (!labelForm.formData.name.trim()) return;

      if (labelForm.editingId) {
        await updateLabel({
          id: labelForm.editingId as Id<"labels">,
          name: labelForm.formData.name.trim(),
          color: labelForm.formData.color,
          groupId: labelForm.formData.groupId,
        });
        showSuccess("Label updated");
      } else {
        await createLabel({
          projectId,
          name: labelForm.formData.name.trim(),
          color: labelForm.formData.color,
          groupId: labelForm.formData.groupId ?? undefined,
        });
        showSuccess("Label created");
      }
      handleCloseLabelModal();
    },
    { errorMessage: "Failed to save label" },
  );

  // Group form submission
  const { mutate: submitGroupForm, isLoading: isGroupSubmitting } = useAsyncMutation(
    async () => {
      if (!groupForm.formData.name.trim()) return;

      if (groupForm.editingId) {
        await updateGroup({
          id: groupForm.editingId as Id<"labelGroups">,
          name: groupForm.formData.name.trim(),
          description: groupForm.formData.description.trim() || null,
        });
        showSuccess("Group updated");
      } else {
        await createGroup({
          projectId,
          name: groupForm.formData.name.trim(),
          description: groupForm.formData.description.trim() || undefined,
        });
        showSuccess("Group created");
      }
      handleCloseGroupModal();
    },
    { errorMessage: "Failed to save group" },
  );

  // Delete confirmations
  const labelDeleteConfirm = useDeleteConfirmation<"labels">({
    successMessage: "Label deleted",
    errorMessage: "Failed to delete label",
  });

  const groupDeleteConfirm = useDeleteConfirmation<"labelGroups">({
    successMessage: "Group deleted",
    errorMessage: "Failed to delete group",
  });

  // Modal handlers
  const handleCloseLabelModal = () => {
    labelModal.close();
    labelForm.resetForm();
  };

  const handleCloseGroupModal = () => {
    groupModal.close();
    groupForm.resetForm();
  };

  const handleCreateLabel = (groupId?: Id<"labelGroups"> | null) => {
    labelForm.startCreate();
    if (groupId) {
      labelForm.updateField("groupId", groupId);
    }
    labelModal.open();
  };

  const handleEditLabel = (label: Doc<"labels">) => {
    labelForm.loadForEdit({
      _id: label._id,
      name: label.name,
      color: label.color,
      groupId: label.groupId ?? null,
    });
    labelModal.open();
  };

  const handleCreateGroup = () => {
    groupForm.startCreate();
    groupModal.open();
  };

  const handleEditGroup = (group: LabelGroup) => {
    if (!group._id) return; // Can't edit "Ungrouped"
    groupForm.loadForEdit({
      _id: group._id,
      name: group.name,
      description: group.description ?? "",
    });
    groupModal.open();
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleLabelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitLabelForm();
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitGroupForm();
  };

  // Get real groups (not including virtual "Ungrouped")
  const realGroups = labelGroups
    ? (labelGroups.filter((g) => g._id !== null) as Array<
        (typeof labelGroups)[number] & { _id: Id<"labelGroups"> }
      >)
    : [];

  // Total label count
  const totalLabels = labelGroups?.reduce((sum, g) => sum + g.labels.length, 0) ?? 0;

  return (
    <>
      <Card>
        <CardHeader
          title="Labels"
          description="Organize issues with colored labels grouped by category"
          action={
            <Flex gap="sm">
              <Button
                variant="secondary"
                onClick={handleCreateGroup}
                leftIcon={<FolderPlus className="w-4 h-4" />}
              >
                New Group
              </Button>
              <Button onClick={() => handleCreateLabel()} leftIcon={<Plus className="w-4 h-4" />}>
                New Label
              </Button>
            </Flex>
          }
        />

        <CardBody>
          {labelGroups === undefined ? (
            <Flex justify="center" align="center" className="min-h-32">
              <LoadingSpinner size="lg" />
            </Flex>
          ) : totalLabels === 0 ? (
            <EmptyState
              icon={Tag}
              title="No labels yet"
              description="Create labels and organize them into groups"
              action={{
                label: "Create Your First Label",
                onClick: () => handleCreateLabel(),
              }}
            />
          ) : (
            <Flex direction="column" gap="lg">
              {labelGroups.map((group) => {
                const groupKey = group._id ?? "ungrouped";
                const isCollapsed = collapsedGroups.has(groupKey);
                const isUngrouped = group._id === null;

                return (
                  <Card key={groupKey} padding="none" className="overflow-hidden">
                    {/* Group Header */}
                    <Card
                      padding="sm"
                      radius="none"
                      variant="ghost"
                      className="bg-ui-bg-secondary cursor-pointer hover:bg-ui-bg-tertiary transition-colors"
                      onClick={() => toggleGroup(groupKey)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleGroup(groupKey);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={!isCollapsed}
                    >
                      <Flex justify="between" align="center">
                        <Flex gap="sm" align="center">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-ui-text-secondary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-ui-text-secondary" />
                          )}
                          <Typography variant="label">{group.name}</Typography>
                          <Typography variant="caption" color="tertiary">
                            ({group.labels.length})
                          </Typography>
                          {group.description && (
                            <Typography
                              variant="caption"
                              color="tertiary"
                              className="hidden sm:inline"
                            >
                              — {group.description}
                            </Typography>
                          )}
                        </Flex>

                        <Flex
                          gap="sm"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                            }
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateLabel(group._id)}
                            leftIcon={<Plus className="w-3 h-3" />}
                          >
                            Add
                          </Button>
                          {!isUngrouped && group._id && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditGroup(group)}
                                leftIcon={<Pencil className="w-3 h-3" />}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => groupDeleteConfirm.confirmDelete(group._id)}
                                leftIcon={<Trash className="w-3 h-3" />}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </Flex>
                      </Flex>
                    </Card>

                    {/* Labels in Group */}
                    {!isCollapsed && group.labels.length > 0 && (
                      <Flex direction="column" className="divide-y divide-ui-border">
                        {group.labels.map((label) => (
                          <Card
                            key={label._id}
                            padding="sm"
                            radius="none"
                            variant="ghost"
                            className="hover:bg-ui-bg-secondary transition-colors"
                          >
                            <Flex justify="between" align="center">
                              <Flex gap="md" align="center">
                                <Badge
                                  className="text-brand-foreground"
                                  style={{ backgroundColor: label.color }}
                                >
                                  {label.name}
                                </Badge>
                                <Typography variant="inlineCode" color="tertiary">
                                  {label.color}
                                </Typography>
                              </Flex>

                              <Flex gap="sm">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditLabel(label)}
                                  leftIcon={<Pencil className="w-4 h-4" />}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => labelDeleteConfirm.confirmDelete(label._id)}
                                  leftIcon={<Trash className="w-4 h-4" />}
                                >
                                  Delete
                                </Button>
                              </Flex>
                            </Flex>
                          </Card>
                        ))}
                      </Flex>
                    )}

                    {/* Empty Group State */}
                    {!isCollapsed && group.labels.length === 0 && (
                      <Card padding="md" radius="none" variant="ghost" className="text-center">
                        <Typography variant="small" color="secondary">
                          No labels in this group.{" "}
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleCreateLabel(group._id)}
                            className="p-0 h-auto text-brand hover:underline"
                          >
                            Add one
                          </Button>
                        </Typography>
                      </Card>
                    )}
                  </Card>
                );
              })}
            </Flex>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Label Modal */}
      <Dialog
        open={labelModal.isOpen}
        onOpenChange={(open) => !open && handleCloseLabelModal()}
        title={labelForm.editingId ? "Edit Label" : "Create Label"}
        className="sm:max-w-md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseLabelModal}
              disabled={isLabelSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="label-form" isLoading={isLabelSubmitting}>
              {labelForm.editingId ? "Update" : "Create"} Label
            </Button>
          </>
        }
      >
        <form id="label-form" onSubmit={handleLabelSubmit}>
          <Flex direction="column" gap="lg">
            <Input
              label="Label Name"
              value={labelForm.formData.name}
              onChange={(e) => labelForm.updateField("name", e.target.value)}
              placeholder="e.g., bug, feature, urgent"
              required
              autoFocus
            />

            <ColorPicker
              value={labelForm.formData.color}
              onChange={(color) => labelForm.updateField("color", color)}
              label="Color"
            />

            {realGroups.length > 0 && (
              <Select
                label="Group"
                value={labelForm.formData.groupId ?? ""}
                onChange={(e) =>
                  labelForm.updateField(
                    "groupId",
                    e.target.value ? (e.target.value as Id<"labelGroups">) : null,
                  )
                }
              >
                <option value="">No group (ungrouped)</option>
                {realGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            )}

            {/* Preview */}
            <div>
              <Typography variant="label" className="block text-ui-text mb-2">
                Preview
              </Typography>
              <Badge
                className="text-brand-foreground"
                style={{ backgroundColor: labelForm.formData.color }}
              >
                {labelForm.formData.name || "Label name"}
              </Badge>
            </div>
          </Flex>
        </form>
      </Dialog>

      {/* Create/Edit Group Modal */}
      <Dialog
        open={groupModal.isOpen}
        onOpenChange={(open) => !open && handleCloseGroupModal()}
        title={groupForm.editingId ? "Edit Group" : "Create Group"}
        className="sm:max-w-md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseGroupModal}
              disabled={isGroupSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="group-form" isLoading={isGroupSubmitting}>
              {groupForm.editingId ? "Update" : "Create"} Group
            </Button>
          </>
        }
      >
        <form id="group-form" onSubmit={handleGroupSubmit}>
          <Flex direction="column" gap="lg">
            <Input
              label="Group Name"
              value={groupForm.formData.name}
              onChange={(e) => groupForm.updateField("name", e.target.value)}
              placeholder="e.g., Priority, Component, Area"
              required
              autoFocus
            />

            <Input
              label="Description (optional)"
              value={groupForm.formData.description}
              onChange={(e) => groupForm.updateField("description", e.target.value)}
              placeholder="e.g., Labels for issue priority levels"
            />
          </Flex>
        </form>
      </Dialog>

      {/* Delete Label Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!labelDeleteConfirm.deleteId}
        onClose={labelDeleteConfirm.cancelDelete}
        onConfirm={() => {
          labelDeleteConfirm.executeDelete((id) => {
            return deleteLabelMutation({ id }).then(() => {
              /* intentional */
            });
          });
        }}
        title="Delete Label"
        message="Are you sure you want to delete this label? It will be removed from all issues."
        variant="danger"
        confirmLabel="Delete"
        isLoading={labelDeleteConfirm.isDeleting}
      />

      {/* Delete Group Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!groupDeleteConfirm.deleteId}
        onClose={groupDeleteConfirm.cancelDelete}
        onConfirm={() => {
          groupDeleteConfirm.executeDelete((id) => {
            return deleteGroupMutation({ id }).then(() => {
              /* intentional */
            });
          });
        }}
        title="Delete Group"
        message="Are you sure you want to delete this group? Labels in this group will become ungrouped."
        variant="danger"
        confirmLabel="Delete"
        isLoading={groupDeleteConfirm.isDeleting}
      />
    </>
  );
}
