/**
 * Create Issue Modal
 *
 * Modal dialog for creating new issues with full field support.
 * Includes type, priority, assignee, labels, sprint, due date, and AI suggestions.
 * Supports draft auto-save and keyboard shortcuts for quick issue creation.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import { useForm } from "@tanstack/react-form";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useState } from "react";
import { z } from "zod";
import { DuplicateDetection } from "@/components/DuplicateDetection";
import { IssueDescriptionEditor } from "@/components/IssueDescriptionEditor";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Dialog } from "@/components/ui/Dialog";
import { Flex } from "@/components/ui/Flex";
import { Input, Select } from "@/components/ui/form";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { IssueLabelChip } from "@/components/ui/IssueLabelChip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { SelectItem } from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useOrganization } from "@/hooks/useOrgContext";
import { toggleInArray } from "@/lib/array-utils";
import { COLORS } from "@/lib/constants";
import { FormInput, FormSelectRadix } from "@/lib/form";
import { Check, Plus, Sparkles } from "@/lib/icons";
import {
  getPriorityColor,
  getTypeLabel,
  ISSUE_PRIORITIES,
  ISSUE_TYPE_ICONS,
  ISSUE_TYPES_WITH_SUBTASK,
  PRIORITY_ICONS,
} from "@/lib/issue-utils";
import { formatOutOfOfficeUntil } from "@/lib/outOfOffice";
import { showError, showSuccess } from "@/lib/toast";

// =============================================================================
// Schema
// =============================================================================

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  type: z.enum(ISSUE_TYPES_WITH_SUBTASK),
  priority: z.enum(ISSUE_PRIORITIES),
  assigneeId: z.string(),
  storyPoints: z.string(),
});

/** Draft data structure for auto-save */
interface IssueDraft {
  title: string;
  description: string;
  type: IssueTypeWithSubtask;
  priority: IssuePriority;
  assigneeId: string;
  storyPoints: string;
  selectedLabels: Id<"labels">[];
}

type CreateIssueForm = z.infer<typeof createIssueSchema>;

const createIssueDefaultValues = {
  title: "",
  description: "",
  type: "task" as IssueTypeWithSubtask,
  priority: "medium" as IssuePriority,
  assigneeId: "",
  storyPoints: "",
} satisfies CreateIssueForm;

interface AISuggestions {
  description?: string;
  priority?: IssuePriority;
  labels?: string[];
}

type CreateIssueFieldGetter = (field: keyof CreateIssueForm) => string;
type CreateIssueFieldSetter = (
  field: keyof CreateIssueForm,
  value: CreateIssueForm[keyof CreateIssueForm],
) => void;

interface CreateIssueDraftBannerProps {
  draftTimestamp?: number | null;
  onDiscard: () => void;
  onRestore: () => void;
}

function CreateIssueDraftBanner({
  draftTimestamp,
  onDiscard,
  onRestore,
}: CreateIssueDraftBannerProps) {
  return (
    <Alert variant="info">
      <Flex align="center" justify="between" className="w-full">
        <AlertDescription>
          You have an unsaved draft
          {draftTimestamp && (
            <Typography as="span" variant="caption" className="ml-1">
              (saved {new Date(draftTimestamp).toLocaleTimeString()})
            </Typography>
          )}
        </AlertDescription>
        <Flex gap="sm">
          <Button type="button" variant="secondary" size="sm" onClick={onDiscard}>
            Discard
          </Button>
          <Button type="button" size="sm" onClick={onRestore}>
            Restore
          </Button>
        </Flex>
      </Flex>
    </Alert>
  );
}

type ProjectItem = FunctionReturnType<typeof api.projects.getCurrentUserProjects>["page"][number];

interface ProjectSelectorProps {
  projects: ProjectItem[];
  selectedProjectId: Id<"projects"> | null;
  onChange: (projectId: Id<"projects">) => void;
}

function CreateIssueProjectSelector({
  projects,
  selectedProjectId,
  onChange,
}: ProjectSelectorProps) {
  return (
    <Select
      label="Project"
      value={selectedProjectId || ""}
      onChange={(e) => onChange(e.target.value as Id<"projects">)}
      required
    >
      <option value="" disabled>
        Select a project...
      </option>
      {projects.map((project) => (
        <option key={project._id} value={project._id}>
          {project.name} ({project.key})
        </option>
      ))}
    </Select>
  );
}

interface TemplateSelectorProps {
  selectedTemplate: Id<"issueTemplates"> | "";
  templates: Doc<"issueTemplates">[];
  onChange: (templateId: Id<"issueTemplates"> | "") => void;
}

function CreateIssueTemplateSelector({
  selectedTemplate,
  templates,
  onChange,
}: TemplateSelectorProps) {
  return (
    <Select
      label="Use Template (Optional)"
      value={selectedTemplate}
      onChange={(e) => onChange(e.target.value as Id<"issueTemplates"> | "")}
    >
      <option value="">Start from scratch</option>
      {templates.map((template) => (
        <option key={template._id} value={template._id}>
          {template.name} ({template.type})
        </option>
      ))}
    </Select>
  );
}

interface CreateIssueAiActionProps {
  isGeneratingAI: boolean;
  showAISuggestions: boolean;
  onGenerateSuggestions: () => void;
}

function CreateIssueAiAction({
  isGeneratingAI,
  showAISuggestions,
  onGenerateSuggestions,
}: CreateIssueAiActionProps) {
  return (
    <Flex align="center" gap="sm" className="pb-2">
      <Button
        type="button"
        onClick={onGenerateSuggestions}
        isLoading={isGeneratingAI}
        variant="accentGradient"
        leftIcon={<Icon icon={Sparkles} size="sm" />}
      >
        Get AI Suggestions
      </Button>
      {showAISuggestions && (
        <Flex align="center" gap="xs" className="text-status-success" aria-live="polite">
          <Icon icon={Check} size="sm" />
          <Typography variant="small">AI suggestions applied</Typography>
        </Flex>
      )}
    </Flex>
  );
}

interface CreateIssueDuplicateDetectionProps {
  projectId: Id<"projects">;
  title: string;
  onOpenChange: (open: boolean) => void;
}

function CreateIssueDuplicateDetection({
  projectId,
  title,
  onOpenChange,
}: CreateIssueDuplicateDetectionProps) {
  return (
    <DuplicateDetection
      title={title}
      projectId={projectId}
      onIssueClick={(issueId) => {
        onOpenChange(false);
        showSuccess(`Opening ${issueId.slice(0, 8)}... You can find it in the board.`);
      }}
    />
  );
}

interface CreateIssueLabelsSectionProps {
  labels?: Doc<"labels">[];
  selectedLabels: Id<"labels">[];
  showCreateLabel: boolean;
  newLabelName: string;
  newLabelColor: string;
  isCreatingLabel: boolean;
  onCreateLabel: () => void;
  onToggleLabel: (labelId: Id<"labels">) => void;
  onCreateOpenChange: (open: boolean) => void;
  onNewLabelNameChange: (name: string) => void;
  onNewLabelColorChange: (color: string) => void;
}

function CreateIssueLabelsSection({
  labels,
  selectedLabels,
  showCreateLabel,
  newLabelName,
  newLabelColor,
  isCreatingLabel,
  onCreateLabel,
  onToggleLabel,
  onCreateOpenChange,
  onNewLabelNameChange,
  onNewLabelColorChange,
}: CreateIssueLabelsSectionProps) {
  return (
    <Stack as="fieldset" gap="xs">
      <Typography as="legend" variant="label" className="block text-ui-text">
        Labels
      </Typography>
      <Flex wrap gap="sm" align="center">
        {labels?.map((label) => {
          const isSelected = selectedLabels.includes(label._id);
          return (
            <IssueLabelChip
              key={label._id}
              onClick={() => onToggleLabel(label._id)}
              aria-pressed={isSelected}
              selected={isSelected}
              color={label.color}
              showCheck={isSelected}
            >
              {label.name}
            </IssueLabelChip>
          );
        })}
        <Popover open={showCreateLabel} onOpenChange={onCreateOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              aria-label="Create new label"
            >
              <Icon icon={Plus} size="sm" />
              <span className="ml-1">New</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <Stack gap="sm">
              <Typography variant="label">Create Label</Typography>
              <Input
                placeholder="Label name"
                value={newLabelName}
                onChange={(e) => onNewLabelNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onCreateLabel();
                  }
                }}
                autoFocus
              />
              <ColorPicker value={newLabelColor} onChange={onNewLabelColorChange} label="Color" />
              <Flex justify="end" gap="sm">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onCreateOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onCreateLabel}
                  disabled={!newLabelName.trim()}
                  isLoading={isCreatingLabel}
                >
                  Create
                </Button>
              </Flex>
            </Stack>
          </PopoverContent>
        </Popover>
      </Flex>
    </Stack>
  );
}

interface CreateIssueSupportFieldsProps {
  draftTimestamp?: number | null;
  effectiveProjectId: Id<"projects"> | null | undefined;
  handleCreateLabel: () => void;
  handleGenerateAISuggestions: () => void;
  internalSelectedProjectId: Id<"projects"> | null;
  isCreatingLabel: boolean;
  isGeneratingAI: boolean;
  labels?: Doc<"labels">[];
  newLabelColor: string;
  newLabelName: string;
  onDiscardDraft: () => void;
  onDraftRestore: () => void;
  onNewLabelColorChange: (color: string) => void;
  onNewLabelNameChange: (name: string) => void;
  onProjectChange: (projectId: Id<"projects">) => void;
  onTemplateChange: (templateId: Id<"issueTemplates"> | "") => void;
  onToggleLabel: (labelId: Id<"labels">) => void;
  orgProjects?: { page: ProjectItem[] };
  projectId?: Id<"projects">;
  selectedLabels: Id<"labels">[];
  selectedTemplate: Id<"issueTemplates"> | "";
  setShowCreateLabel: (open: boolean) => void;
  showAISuggestions: boolean;
  showCreateLabel: boolean;
  showDraftBanner: boolean;
  templates?: Doc<"issueTemplates">[];
}

function CreateIssueSupportFields({
  draftTimestamp,
  effectiveProjectId,
  handleCreateLabel,
  handleGenerateAISuggestions,
  internalSelectedProjectId,
  isCreatingLabel,
  isGeneratingAI,
  labels,
  newLabelColor,
  newLabelName,
  onDiscardDraft,
  onDraftRestore,
  onNewLabelColorChange,
  onNewLabelNameChange,
  onProjectChange,
  onTemplateChange,
  onToggleLabel,
  orgProjects,
  projectId,
  selectedLabels,
  selectedTemplate,
  setShowCreateLabel,
  showAISuggestions,
  showCreateLabel,
  showDraftBanner,
  templates,
}: CreateIssueSupportFieldsProps) {
  return (
    <>
      {showDraftBanner && (
        <CreateIssueDraftBanner
          draftTimestamp={draftTimestamp}
          onDiscard={onDiscardDraft}
          onRestore={onDraftRestore}
        />
      )}

      {!projectId && orgProjects && (
        <CreateIssueProjectSelector
          projects={orgProjects.page}
          selectedProjectId={internalSelectedProjectId}
          onChange={onProjectChange}
        />
      )}

      {templates && templates.length > 0 && (
        <CreateIssueTemplateSelector
          selectedTemplate={selectedTemplate}
          templates={templates}
          onChange={onTemplateChange}
        />
      )}

      <CreateIssueAiAction
        isGeneratingAI={isGeneratingAI}
        showAISuggestions={showAISuggestions}
        onGenerateSuggestions={handleGenerateAISuggestions}
      />

      {effectiveProjectId && (
        <CreateIssueLabelsSection
          labels={labels}
          selectedLabels={selectedLabels}
          showCreateLabel={showCreateLabel}
          newLabelName={newLabelName}
          newLabelColor={newLabelColor}
          isCreatingLabel={isCreatingLabel}
          onCreateLabel={handleCreateLabel}
          onToggleLabel={onToggleLabel}
          onCreateOpenChange={setShowCreateLabel}
          onNewLabelNameChange={onNewLabelNameChange}
          onNewLabelColorChange={onNewLabelColorChange}
        />
      )}
    </>
  );
}

function createIssueSubmitHandler({
  clearDraft,
  createAnother,
  createIssue,
  defaultDueDate,
  effectiveProjectId,
  onCreateAnother,
  onOpenChange,
  selectedLabels,
  setDraftDismissed,
  sprintId,
}: {
  clearDraft: () => void;
  createAnother: boolean;
  createIssue: (args: {
    projectId: Id<"projects">;
    title: string;
    description?: string;
    type: IssueTypeWithSubtask;
    priority: IssuePriority;
    assigneeId?: Id<"users">;
    sprintId?: Id<"sprints">;
    labels?: Id<"labels">[];
    storyPoints?: number;
    dueDate?: number;
  }) => Promise<unknown>;
  defaultDueDate?: number;
  effectiveProjectId: Id<"projects"> | null | undefined;
  onCreateAnother: () => void;
  onOpenChange: (open: boolean) => void;
  selectedLabels: Id<"labels">[];
  setDraftDismissed: (dismissed: boolean) => void;
  sprintId?: Id<"sprints">;
}) {
  return async ({ value }: { value: CreateIssueForm }) => {
    if (!effectiveProjectId) {
      showError(new Error("Project is required"), "Validation error");
      return;
    }

    try {
      await createIssue({
        projectId: effectiveProjectId,
        title: value.title.trim(),
        description: value.description?.trim() || undefined,
        type: value.type,
        priority: value.priority,
        assigneeId:
          value.assigneeId && value.assigneeId !== "unassigned"
            ? (value.assigneeId as Id<"users">)
            : undefined,
        sprintId,
        labels: selectedLabels.length > 0 ? selectedLabels : undefined,
        storyPoints: value.storyPoints ? Number.parseFloat(value.storyPoints) : undefined,
        dueDate: defaultDueDate,
      });

      showSuccess("Issue created successfully");
      clearDraft();
      setDraftDismissed(false);

      if (createAnother) {
        onCreateAnother();
        return;
      }

      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to create issue");
    }
  };
}

function useIssueDraftSupport({
  effectiveProjectId,
  formValues,
  onEditorValueApplied,
  open,
  selectedLabels,
  setFieldValue,
  setSelectedLabels,
}: {
  effectiveProjectId: Id<"projects"> | null | undefined;
  formValues: CreateIssueForm;
  onEditorValueApplied: () => void;
  open: boolean;
  selectedLabels: Id<"labels">[];
  setFieldValue: CreateIssueFieldSetter;
  setSelectedLabels: React.Dispatch<React.SetStateAction<Id<"labels">[]>>;
}) {
  const [draftDismissed, setDraftDismissed] = useState(false);
  const { hasDraft, draft, saveDraft, clearDraft, draftTimestamp } = useDraftAutoSave<IssueDraft>({
    key: "create-issue",
    contextKey: effectiveProjectId || undefined,
    enabled: open,
  });

  const showDraftBanner = hasDraft && !draftDismissed && Boolean(draft?.title);

  useEffect(() => {
    if (!open) return;

    const { title, description, type, priority, assigneeId, storyPoints } = formValues;
    if (!title.trim()) return;

    saveDraft({
      title,
      description,
      type,
      priority,
      assigneeId,
      storyPoints,
      selectedLabels,
    });
  }, [formValues, open, saveDraft, selectedLabels]);

  useEffect(() => {
    if (!open) {
      setDraftDismissed(false);
    }
  }, [open]);

  const restoreDraft = () => {
    if (!draft) return;

    setFieldValue("title", draft.title);
    setFieldValue("description", draft.description);
    setFieldValue("type", draft.type);
    setFieldValue("priority", draft.priority);
    setFieldValue("assigneeId", draft.assigneeId);
    setFieldValue("storyPoints", draft.storyPoints);
    setSelectedLabels(draft.selectedLabels);
    onEditorValueApplied();
    setDraftDismissed(true);
    showSuccess("Draft restored");
  };

  const discardDraft = () => {
    clearDraft();
    setDraftDismissed(true);
  };

  return {
    clearDraft,
    discardDraft,
    draftTimestamp,
    restoreDraft,
    setDraftDismissed,
    showDraftBanner,
  };
}

function useDefaultIssueTemplateSelection({
  selectedTemplate,
  setSelectedTemplate,
  templates,
}: {
  selectedTemplate: Id<"issueTemplates"> | "";
  setSelectedTemplate: React.Dispatch<React.SetStateAction<Id<"issueTemplates"> | "">>;
  templates?: Doc<"issueTemplates">[];
}) {
  useEffect(() => {
    if (!templates?.length || selectedTemplate) return;

    const defaultTemplate = templates.find((template) => template.isDefault);
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate._id);
    }
  }, [selectedTemplate, setSelectedTemplate, templates]);
}

function useApplySelectedIssueTemplate({
  labels,
  onEditorValueApplied,
  selectedTemplate,
  setFieldValue,
  setSelectedLabels,
  templates,
}: {
  labels?: Doc<"labels">[];
  onEditorValueApplied: () => void;
  selectedTemplate: Id<"issueTemplates"> | "";
  setFieldValue: CreateIssueFieldSetter;
  setSelectedLabels: React.Dispatch<React.SetStateAction<Id<"labels">[]>>;
  templates?: Doc<"issueTemplates">[];
}) {
  useEffect(() => {
    if (!(selectedTemplate && templates)) return;

    const template = templates.find((value) => value._id === selectedTemplate);
    if (!template) return;

    setFieldValue("type", template.type);
    setFieldValue("priority", template.defaultPriority);
    setFieldValue("title", template.titleTemplate);
    setFieldValue("description", template.descriptionTemplate || "");
    onEditorValueApplied();

    if (template.defaultLabels?.length && labels) {
      const labelIds = labels
        .filter((label) => template.defaultLabels?.includes(label.name))
        .map((label) => label._id);
      setSelectedLabels(labelIds);
    }

    if (template.defaultAssigneeId) {
      setFieldValue("assigneeId", template.defaultAssigneeId);
    }

    if (template.defaultStoryPoints !== undefined) {
      setFieldValue("storyPoints", template.defaultStoryPoints.toString());
    }
  }, [labels, onEditorValueApplied, selectedTemplate, setFieldValue, setSelectedLabels, templates]);
}

function applyAISuggestionsToForm({
  description,
  setFieldValue,
  labels,
  onEditorValueApplied,
  setSelectedLabels,
  suggestions,
}: {
  description: string;
  setFieldValue: CreateIssueFieldSetter;
  labels?: Doc<"labels">[];
  onEditorValueApplied: () => void;
  setSelectedLabels: React.Dispatch<React.SetStateAction<Id<"labels">[]>>;
  suggestions: AISuggestions;
}) {
  if (suggestions.description && !description.trim()) {
    setFieldValue("description", suggestions.description);
    onEditorValueApplied();
  }

  if (suggestions.priority) {
    setFieldValue("priority", suggestions.priority);
  }

  if (!suggestions.labels?.length || !labels) return;

  const suggestedLabelIds = labels
    .filter((label) => suggestions.labels?.includes(label.name))
    .map((label) => label._id);

  setSelectedLabels((previous) => [...new Set([...previous, ...suggestedLabelIds])]);
}

function createLabelCreationHandler({
  createLabel,
  effectiveProjectId,
  newLabelColor,
  newLabelName,
  setIsCreatingLabel,
  setNewLabelColor,
  setNewLabelName,
  setSelectedLabels,
  setShowCreateLabel,
}: {
  createLabel: (args: {
    projectId: Id<"projects">;
    name: string;
    color: string;
  }) => Promise<{ labelId: Id<"labels"> }>;
  effectiveProjectId: Id<"projects"> | null | undefined;
  newLabelColor: string;
  newLabelName: string;
  setIsCreatingLabel: React.Dispatch<React.SetStateAction<boolean>>;
  setNewLabelColor: React.Dispatch<React.SetStateAction<string>>;
  setNewLabelName: React.Dispatch<React.SetStateAction<string>>;
  setSelectedLabels: React.Dispatch<React.SetStateAction<Id<"labels">[]>>;
  setShowCreateLabel: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return async () => {
    if (!effectiveProjectId || !newLabelName.trim()) return;

    setIsCreatingLabel(true);
    try {
      const { labelId } = await createLabel({
        projectId: effectiveProjectId,
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setSelectedLabels((previous) => [...previous, labelId]);
      setNewLabelName("");
      setNewLabelColor(COLORS.DEFAULT_LABEL);
      setShowCreateLabel(false);
      showSuccess("Label created");
    } catch (error) {
      showError(error, "Failed to create label");
    } finally {
      setIsCreatingLabel(false);
    }
  };
}

function createIssueSuggestionHandler({
  effectiveProjectId,
  generateSuggestions,
  getFieldValue,
  labels,
  onEditorValueApplied,
  setFieldValue,
  setIsGeneratingAI,
  setSelectedLabels,
  setShowAISuggestions,
}: {
  effectiveProjectId: Id<"projects"> | null | undefined;
  generateSuggestions: (args: {
    projectId: Id<"projects">;
    issueTitle: string;
    issueDescription?: string;
    suggestionTypes: ["description", "priority", "labels"];
  }) => Promise<AISuggestions>;
  getFieldValue: CreateIssueFieldGetter;
  labels?: Doc<"labels">[];
  onEditorValueApplied: () => void;
  setFieldValue: CreateIssueFieldSetter;
  setIsGeneratingAI: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedLabels: React.Dispatch<React.SetStateAction<Id<"labels">[]>>;
  setShowAISuggestions: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return async () => {
    const title = getFieldValue("title");
    const description = getFieldValue("description");

    if (!(effectiveProjectId && title.trim())) {
      showError(
        new Error(effectiveProjectId ? "Please enter a title" : "Please select a project"),
        "Requirement missing",
      );
      return;
    }

    setIsGeneratingAI(true);
    try {
      const suggestions = await generateSuggestions({
        projectId: effectiveProjectId,
        issueTitle: title,
        issueDescription: description || undefined,
        suggestionTypes: ["description", "priority", "labels"],
      });

      applyAISuggestionsToForm({
        description,
        setFieldValue,
        labels,
        onEditorValueApplied,
        setSelectedLabels,
        suggestions,
      });
      setShowAISuggestions(true);
      showSuccess("AI suggestions applied!");
    } catch (error) {
      showError(error, "Failed to generate AI suggestions");
    } finally {
      setIsGeneratingAI(false);
    }
  };
}

// =============================================================================
// Component
// =============================================================================

interface CreateIssueModalProps {
  projectId?: Id<"projects">;
  sprintId?: Id<"sprints">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-filled due date timestamp (e.g., from calendar quick add) */
  defaultDueDate?: number;
}

/**
 * Render a modal dialog that lets users create a new issue for a project.
 *
 * The modal provides optional template selection, title/description inputs, type/priority selectors,
 * assignee and story point fields, label selection, and an AI-powered suggestions action. It handles
 * applying templates, toggling label selection, generating and applying AI suggestions, and creating
 * the issue via the provided project and sprint context.
 *
 * @param projectId - The id of the project the new issue will belong to.
 * @param sprintId - Optional id of the sprint to associate the new issue with.
 * @param open - Whether the modal is open.
 * @param onOpenChange - Callback invoked when the modal open state changes; receives the new open state.
 * @returns The modal's JSX element, or `null` when required project data is not yet available.
 */
export function CreateIssueModal({
  projectId,
  sprintId,
  open,
  onOpenChange,
  defaultDueDate,
}: CreateIssueModalProps) {
  const { organizationId } = useOrganization();
  const shouldLoadData = open;
  const [internalSelectedProjectId, setInternalSelectedProjectId] = useState<Id<"projects"> | null>(
    projectId || null,
  );
  const [selectedTemplate, setSelectedTemplate] = useState<Id<"issueTemplates"> | "">("");
  const [selectedLabels, setSelectedLabels] = useState<Id<"labels">[]>([]);
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<string>(COLORS.DEFAULT_LABEL);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const orgProjects = useAuthenticatedQuery(
    api.projects.getCurrentUserProjects,
    shouldLoadData && !projectId ? { organizationId } : "skip",
  );
  const effectiveProjectId = projectId || internalSelectedProjectId;
  const project = useAuthenticatedQuery(
    api.projects.getProject,
    shouldLoadData && effectiveProjectId ? { id: effectiveProjectId } : "skip",
  );
  const templates = useAuthenticatedQuery(
    api.templates.listByProject,
    shouldLoadData && effectiveProjectId ? { projectId: effectiveProjectId } : "skip",
  );
  const labels = useAuthenticatedQuery(
    api.labels.list,
    shouldLoadData && effectiveProjectId ? { projectId: effectiveProjectId } : "skip",
  );

  const { mutate: createIssue } = useAuthenticatedMutation(api.issues.createIssue);
  const { mutate: createLabel } = useAuthenticatedMutation(api.labels.createLabel);
  const generateSuggestions = useAction(api.ai.actions.generateIssueSuggestions);

  const form = useForm({
    defaultValues: createIssueDefaultValues,
    validators: { onChange: createIssueSchema },
    onSubmit: async ({ value }) => handleFormSubmit({ value }),
  });

  const bumpEditorKey = () => {
    setEditorKey((current) => current + 1);
  };

  const setCreateIssueFieldValue: CreateIssueFieldSetter = (field, value) => {
    switch (field) {
      case "title":
      case "description":
      case "assigneeId":
      case "storyPoints":
        form.setFieldValue(field, value);
        return;
      case "type":
        form.setFieldValue("type", value as IssueTypeWithSubtask);
        return;
      case "priority":
        form.setFieldValue("priority", value as IssuePriority);
        return;
    }
  };

  const getCreateIssueFieldValue: CreateIssueFieldGetter = (field) => form.getFieldValue(field);

  const {
    clearDraft,
    discardDraft,
    draftTimestamp,
    restoreDraft,
    setDraftDismissed,
    showDraftBanner,
  } = useIssueDraftSupport({
    effectiveProjectId,
    formValues: form.state.values,
    onEditorValueApplied: bumpEditorKey,
    open,
    selectedLabels,
    setFieldValue: setCreateIssueFieldValue,
    setSelectedLabels,
  });

  useDefaultIssueTemplateSelection({
    selectedTemplate,
    setSelectedTemplate,
    templates,
  });

  useApplySelectedIssueTemplate({
    labels,
    onEditorValueApplied: bumpEditorKey,
    selectedTemplate,
    setFieldValue: setCreateIssueFieldValue,
    setSelectedLabels,
    templates,
  });

  const resetForAnotherIssue = () => {
    form.reset();
    setSelectedLabels([]);
    setSelectedTemplate("");
    setShowAISuggestions(false);
  };

  const handleFormSubmit = createIssueSubmitHandler({
    clearDraft,
    createAnother,
    createIssue,
    defaultDueDate,
    effectiveProjectId,
    onCreateAnother: resetForAnotherIssue,
    onOpenChange,
    selectedLabels,
    setDraftDismissed,
    sprintId,
  });

  const toggleLabel = (labelId: Id<"labels">) => {
    setSelectedLabels((prev) => toggleInArray(prev, labelId));
  };

  const handleCreateLabel = createLabelCreationHandler({
    createLabel,
    effectiveProjectId,
    newLabelColor,
    newLabelName,
    setIsCreatingLabel,
    setNewLabelColor,
    setNewLabelName,
    setSelectedLabels,
    setShowCreateLabel,
  });

  const handleGenerateAISuggestions = createIssueSuggestionHandler({
    effectiveProjectId,
    generateSuggestions,
    getFieldValue: getCreateIssueFieldValue,
    labels,
    onEditorValueApplied: bumpEditorKey,
    setFieldValue: setCreateIssueFieldValue,
    setIsGeneratingAI,
    setSelectedLabels,
    setShowAISuggestions,
  });

  // Only show loading if we don't have a projectId but are fetching projects
  if (!(projectId || orgProjects)) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Issue"
      description="Form to create a new issue"
      size="lg"
    >
      <Stack
        as="form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        gap="md"
      >
        <CreateIssueSupportFields
          draftTimestamp={draftTimestamp}
          effectiveProjectId={effectiveProjectId}
          handleCreateLabel={handleCreateLabel}
          handleGenerateAISuggestions={handleGenerateAISuggestions}
          internalSelectedProjectId={internalSelectedProjectId}
          isCreatingLabel={isCreatingLabel}
          isGeneratingAI={isGeneratingAI}
          labels={labels}
          newLabelColor={newLabelColor}
          newLabelName={newLabelName}
          onDiscardDraft={discardDraft}
          onDraftRestore={restoreDraft}
          onNewLabelColorChange={setNewLabelColor}
          onNewLabelNameChange={setNewLabelName}
          onProjectChange={setInternalSelectedProjectId}
          onTemplateChange={setSelectedTemplate}
          onToggleLabel={toggleLabel}
          orgProjects={orgProjects}
          projectId={projectId}
          selectedLabels={selectedLabels}
          selectedTemplate={selectedTemplate}
          setShowCreateLabel={setShowCreateLabel}
          showAISuggestions={showAISuggestions}
          showCreateLabel={showCreateLabel}
          showDraftBanner={showDraftBanner}
          templates={templates}
        />

        <form.Field name="title">
          {(field) => (
            <FormInput field={field} label="Title" placeholder="Enter issue title..." required />
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.title}>
          {(title) =>
            effectiveProjectId && title ? (
              <CreateIssueDuplicateDetection
                title={title}
                projectId={effectiveProjectId}
                onOpenChange={onOpenChange}
              />
            ) : null
          }
        </form.Subscribe>

        <form.Field name="description">
          {(field) => (
            <Stack gap="xs">
              <Typography as="label" variant="label" className="block text-ui-text">
                Description
              </Typography>
              <IssueDescriptionEditor
                key={editorKey}
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                placeholder="Enter issue description..."
                minHeight={150}
              />
            </Stack>
          )}
        </form.Field>

        <Grid cols={1} colsSm={2} gap="lg">
          <form.Field name="type">
            {(field) => (
              <FormSelectRadix field={field} label="Type" placeholder="Select type">
                {ISSUE_TYPES_WITH_SUBTASK.map((type) => (
                  <SelectItem key={type} value={type}>
                    <Flex align="center" gap="sm">
                      <Icon icon={ISSUE_TYPE_ICONS[type]} size="sm" />
                      {getTypeLabel(type)}
                    </Flex>
                  </SelectItem>
                ))}
              </FormSelectRadix>
            )}
          </form.Field>

          <form.Field name="priority">
            {(field) => (
              <FormSelectRadix field={field} label="Priority" placeholder="Select priority">
                {ISSUE_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <Flex align="center" gap="sm">
                      <Icon
                        icon={PRIORITY_ICONS[priority]}
                        size="sm"
                        className={getPriorityColor(priority)}
                      />
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Flex>
                  </SelectItem>
                ))}
              </FormSelectRadix>
            )}
          </form.Field>
        </Grid>

        <form.Field name="assigneeId">
          {(field) => (
            <FormSelectRadix field={field} label="Assignee" placeholder="Select assignee">
              <SelectItem value="unassigned">
                <Flex align="center" gap="sm">
                  <Avatar name="Unassigned" size="xs" variant="neutral" />
                  Unassigned
                </Flex>
              </SelectItem>
              {project?.members.map((member) => (
                <SelectItem key={member._id} value={member._id}>
                  <Flex align="center" gap="sm">
                    <Avatar name={member.name} src={member.image} size="xs" className="h-5 w-5" />
                    <div className="min-w-0">
                      <Flex align="center" gap="xs">
                        <span>{member.name}</span>
                        {member.outOfOffice ? <Badge variant="warning">OOO</Badge> : null}
                      </Flex>
                      {member.outOfOffice ? (
                        <span className="text-xs text-ui-text-tertiary">
                          {formatOutOfOfficeUntil(member.outOfOffice)}
                        </span>
                      ) : null}
                    </div>
                  </Flex>
                </SelectItem>
              ))}
            </FormSelectRadix>
          )}
        </form.Field>

        <form.Field name="storyPoints">
          {(field) => (
            <FormInput
              field={field}
              label="Story Points"
              type="number"
              placeholder="Enter story points (optional)"
              min="0"
              step="0.5"
            />
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Flex align="center" justify="between" className="pt-4">
              <Switch
                id="create-another"
                checked={createAnother}
                onCheckedChange={setCreateAnother}
                label="Create another"
              />
              <Flex gap="sm">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Create Issue
                </Button>
              </Flex>
            </Flex>
          )}
        </form.Subscribe>
      </Stack>
    </Dialog>
  );
}
