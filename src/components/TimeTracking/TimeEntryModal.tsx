import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Clock, Hourglass, Play } from "lucide-react";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDateForInput, formatDurationHuman } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Textarea } from "../ui/form";
import { Grid } from "../ui/Grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Typography } from "../ui/Typography";
import {
  calculateEntryTimes,
  validateContext,
  validateLogTimeSubmission,
} from "./timeEntryValidation";
import { type EntryMode, useTimeEntryForm } from "./useTimeEntryForm";

type ProjectItem = FunctionReturnType<typeof api.projects.getCurrentUserProjects>["page"][number];
type IssueItem = FunctionReturnType<typeof api.issues.listSelectableIssues>[number];

interface TimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
  defaultMode?: "timer" | "log";
  billingEnabled?: boolean;
}

// Mode toggle button component
function ModeToggleButton({
  mode,
  currentMode,
  icon: Icon,
  label,
  onClick,
}: {
  mode: EntryMode;
  currentMode: EntryMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  const isActive = currentMode === mode;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive ? "bg-ui-bg text-ui-text shadow-sm" : "text-ui-text-secondary hover:text-ui-text",
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// Tags input component
function TagsInput({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
}: {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}) {
  return (
    <div>
      <label htmlFor="time-entry-tags" className="block text-sm font-medium text-ui-text mb-1">
        Tags
      </label>
      <Flex gap="sm">
        <input
          id="time-entry-tags"
          type="text"
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddTag();
            }
          }}
          placeholder="Add tag..."
          className="flex-1 px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-brand-ring"
        />
        <Button type="button" onClick={onAddTag} variant="secondary" size="sm">
          Add
        </Button>
      </Flex>
      {tags.length > 0 && (
        <div className="mt-2">
          <Flex gap="sm" className="flex-wrap">
            {tags.map((tag) => (
              <Flex
                key={tag}
                as="span"
                inline
                align="center"
                gap="xs"
                className="px-2 py-1 bg-brand-indigo-track text-brand-indigo-text text-xs rounded"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-brand-active"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </Flex>
            ))}
          </Flex>
        </div>
      )}
    </div>
  );
}

// Duration mode fields component
function DurationModeFields({
  date,
  durationInput,
  durationSeconds,
  isDurationInputValid,
  onDateChange,
  onDurationChange,
  onQuickIncrement,
  onClearDuration,
}: {
  date: string;
  durationInput: string;
  durationSeconds: number;
  isDurationInputValid: boolean;
  onDateChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onQuickIncrement: (minutes: number) => void;
  onClearDuration: () => void;
}) {
  return (
    <>
      <div>
        <label htmlFor="time-entry-date" className="block text-sm font-medium text-ui-text mb-1">
          Date *
        </label>
        <input
          id="time-entry-date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          max={formatDateForInput(Date.now())}
          className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-brand-ring"
          required
        />
      </div>
      <div>
        <label
          htmlFor="time-entry-duration"
          className="block text-sm font-medium text-ui-text mb-1"
        >
          Duration *
        </label>
        <input
          id="time-entry-duration"
          type="text"
          value={durationInput}
          onChange={(e) => onDurationChange(e.target.value)}
          placeholder="e.g., 1:30, 1.5, 1h 30m, 90m"
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-ring bg-ui-bg text-ui-text",
            isDurationInputValid ? "border-ui-border" : "border-status-error",
          )}
        />
        <Typography className="text-xs text-ui-text-tertiary mt-1">
          Accepts: 1:30, 1.5, 1h 30m, 90m
        </Typography>
        <Flex gap="sm" className="mt-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => onQuickIncrement(15)}>
            +15m
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onQuickIncrement(30)}>
            +30m
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onQuickIncrement(60)}>
            +1h
          </Button>
          {durationSeconds > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={onClearDuration}>
              Clear
            </Button>
          )}
        </Flex>
        {durationSeconds > 0 && (
          <div className="mt-3 p-3 bg-brand-indigo-track border border-brand-indigo-border rounded-lg">
            <Typography variant="mono" className="text-sm font-medium text-brand-indigo-text">
              Duration: {formatDurationHuman(durationSeconds)}
            </Typography>
          </div>
        )}
      </div>
    </>
  );
}

// Time range mode fields component
function TimeRangeModeFields({
  date,
  startTime,
  endTime,
  timeRangeDuration,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: {
  date: string;
  startTime: string;
  endTime: string;
  timeRangeDuration: number;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}) {
  return (
    <>
      <div>
        <label
          htmlFor="time-entry-date-range"
          className="block text-sm font-medium text-ui-text mb-1"
        >
          Date *
        </label>
        <input
          id="time-entry-date-range"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          max={formatDateForInput(Date.now())}
          className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-brand-ring"
          required
        />
      </div>
      <Grid cols={2} gap="lg">
        <div>
          <label htmlFor="time-entry-start" className="block text-sm font-medium text-ui-text mb-1">
            Start Time *
          </label>
          <input
            id="time-entry-start"
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-brand-ring"
            required
          />
        </div>
        <div>
          <label htmlFor="time-entry-end" className="block text-sm font-medium text-ui-text mb-1">
            End Time *
          </label>
          <input
            id="time-entry-end"
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-brand-ring"
            required
          />
        </div>
      </Grid>
      {timeRangeDuration > 0 && (
        <div className="p-3 bg-brand-indigo-track border border-brand-indigo-border rounded-lg">
          <Typography variant="mono" className="text-sm font-medium text-brand-indigo-text">
            Duration: {formatDurationHuman(timeRangeDuration)}
          </Typography>
        </div>
      )}
    </>
  );
}

/**
 * Unified Time Entry Modal
 *
 * Combines timer start and manual time logging into one reusable component.
 * Supports pre-filling project/issue via props for context-aware usage.
 */
export function TimeEntryModal({
  open,
  onOpenChange,
  projectId: initialProjectId,
  issueId: initialIssueId,
  defaultMode = "log",
  billingEnabled,
}: TimeEntryModalProps) {
  const createTimeEntry = useMutation(api.timeTracking.createTimeEntry);
  const startTimerMutation = useMutation(api.timeTracking.startTimer);
  const projects = useQuery(api.projects.getCurrentUserProjects, {});

  const { state, actions, computed } = useTimeEntryForm({
    initialProjectId,
    initialIssueId,
    defaultMode,
    open,
  });

  const projectIssues = useQuery(
    api.issues.listSelectableIssues,
    state.projectId ? { projectId: state.projectId } : "skip",
  );

  const handleStartTimer = async () => {
    const contextResult = validateContext(computed.hasValidContext);
    if (!contextResult.isValid) {
      showError(contextResult.errorMessage);
      return;
    }

    try {
      await startTimerMutation({
        projectId: state.projectId,
        issueId: state.issueId,
        description: state.description || undefined,
        activity: state.activity || undefined,
        billable: state.billable,
        tags: state.tags.length > 0 ? state.tags : undefined,
      });
      showSuccess("Timer started");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to start timer");
    }
  };

  const handleLogTime = async () => {
    const validationResult = validateLogTimeSubmission(
      state,
      computed.hasValidContext,
      computed.effectiveDuration,
    );

    if (!validationResult.isValid) {
      showError(validationResult.errorMessage);
      return;
    }

    const { startTime: entryStartTime, endTime: entryEndTime } = calculateEntryTimes(
      state,
      computed.effectiveDuration,
    );

    try {
      await createTimeEntry({
        projectId: state.projectId,
        issueId: state.issueId,
        startTime: entryStartTime,
        endTime: entryEndTime,
        description: state.description || undefined,
        activity: state.activity || undefined,
        tags: state.tags,
        billable: state.billable,
      });
      showSuccess("Time entry created");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to create time entry");
    }
  };

  const handleSubmit = () => {
    if (computed.isTimerMode) {
      void handleStartTimer();
    } else {
      void handleLogTime();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={computed.isTimerMode ? "Start Timer" : "Log Time"}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" onClick={() => onOpenChange(false)} variant="secondary">
            Cancel
          </Button>
          <Button
            type="submit"
            form="time-entry-form"
            variant="primary"
            disabled={!computed.isTimerMode && computed.effectiveDuration <= 0}
            leftIcon={computed.isTimerMode ? <Play className="w-4 h-4" /> : undefined}
          >
            {computed.isTimerMode ? "Start Timer" : "Log Time"}
          </Button>
        </>
      }
    >
      <form
        id="time-entry-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        {/* Mode Toggle */}
        <Flex gap="xs" className="p-1 bg-ui-bg-secondary rounded-lg">
          <ModeToggleButton
            mode="timer"
            currentMode={state.entryMode}
            icon={Play}
            label="Start Timer"
            onClick={() => actions.setEntryMode("timer")}
          />
          <ModeToggleButton
            mode="duration"
            currentMode={state.entryMode}
            icon={Hourglass}
            label="Duration"
            onClick={() => actions.setEntryMode("duration")}
          />
          <ModeToggleButton
            mode="timeRange"
            currentMode={state.entryMode}
            icon={Clock}
            label="Time Range"
            onClick={() => actions.setEntryMode("timeRange")}
          />
        </Flex>

        {/* Project Selection */}
        <div>
          <label
            htmlFor="time-entry-project"
            className="block text-sm font-medium text-ui-text mb-1"
          >
            Project
          </label>
          <Select
            value={state.projectId || "none"}
            onValueChange={(value) => {
              actions.setProjectId(value === "none" ? undefined : (value as Id<"projects">));
              actions.setIssueId(undefined);
            }}
          >
            <SelectTrigger id="time-entry-project" className="w-full">
              <SelectValue placeholder="Select project..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects?.page?.map((project: ProjectItem) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Issue Selection */}
        {state.projectId && projectIssues && projectIssues.length > 0 && (
          <div>
            <label
              htmlFor="time-entry-issue"
              className="block text-sm font-medium text-ui-text mb-1"
            >
              Issue
            </label>
            <Select
              value={state.issueId || "none"}
              onValueChange={(value) =>
                actions.setIssueId(value === "none" ? undefined : (value as Id<"issues">))
              }
            >
              <SelectTrigger id="time-entry-issue" className="w-full">
                <SelectValue placeholder="Select issue..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No issue</SelectItem>
                {projectIssues
                  .sort((a: IssueItem, b: IssueItem) => (a.title > b.title ? 1 : -1))
                  .map((issue: IssueItem) => (
                    <SelectItem key={issue._id} value={issue._id}>
                      {issue.key} - {issue.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Description */}
        <Textarea
          label="Description"
          value={state.description}
          onChange={(e) => actions.setDescription(e.target.value)}
          placeholder="What are you working on?"
          rows={2}
        />

        {/* Activity */}
        <div>
          <label
            htmlFor="time-entry-activity"
            className="block text-sm font-medium text-ui-text mb-1"
          >
            Activity
          </label>
          <Select
            value={state.activity || "none"}
            onValueChange={(value) => actions.setActivity(value === "none" ? "" : value)}
          >
            <SelectTrigger id="time-entry-activity" className="w-full">
              <SelectValue placeholder="Select activity..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select activity...</SelectItem>
              {ACTIVITY_TYPES.map((activityType) => (
                <SelectItem key={activityType} value={activityType}>
                  {activityType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Billable */}
        {billingEnabled && (
          <div>
            <label className="cursor-pointer">
              <Flex align="center" gap="sm">
                <input
                  type="checkbox"
                  checked={state.billable}
                  onChange={(e) => actions.setBillable(e.target.checked)}
                  className="w-4 h-4 text-brand rounded focus:ring-2 focus:ring-brand-ring"
                />
                <Typography variant="label">Billable time</Typography>
              </Flex>
            </label>
          </div>
        )}

        {/* Tags */}
        <TagsInput
          tags={state.tags}
          tagInput={state.tagInput}
          onTagInputChange={actions.setTagInput}
          onAddTag={actions.handleAddTag}
          onRemoveTag={actions.handleRemoveTag}
        />

        {/* Duration Mode Fields */}
        {state.entryMode === "duration" && (
          <DurationModeFields
            date={state.date}
            durationInput={state.durationInput}
            durationSeconds={state.durationSeconds}
            isDurationInputValid={computed.isDurationInputValid}
            onDateChange={actions.setDate}
            onDurationChange={actions.setDurationInput}
            onQuickIncrement={actions.handleQuickIncrement}
            onClearDuration={actions.clearDuration}
          />
        )}

        {/* Time Range Mode Fields */}
        {state.entryMode === "timeRange" && (
          <TimeRangeModeFields
            date={state.date}
            startTime={state.startTime}
            endTime={state.endTime}
            timeRangeDuration={state.timeRangeDuration}
            onDateChange={actions.setDate}
            onStartTimeChange={actions.setStartTime}
            onEndTimeChange={actions.setEndTime}
          />
        )}
      </form>
    </Dialog>
  );
}
