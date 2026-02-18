import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Clock, Hourglass } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { FormTextarea } from "@/lib/form";
import { formatDateForInput, formatDurationHuman, parseDuration } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { calculateManualEntryTimes, validateManualTimeEntry } from "./manualTimeEntryValidation";

// =============================================================================
// Types & Schema
// =============================================================================

type ProjectItem = FunctionReturnType<typeof api.projects.getCurrentUserProjects>["page"][number];
type IssueItem = FunctionReturnType<typeof api.issues.listSelectableIssues>[number];

type EntryMode = "duration" | "timeRange";

const timeEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string(),
  endTime: z.string(),
  durationInput: z.string(),
  description: z.string(),
  activity: z.string(),
  billable: z.boolean(),
});

// =============================================================================
// Helper Functions
// =============================================================================

function parseDurationToSeconds(input: string): number {
  const parsed = parseDuration(input);
  return parsed ?? 0;
}

function calculateTimeRangeDuration(date: string, startTime: string, endTime: string): number {
  if (!(date && startTime && endTime)) return 0;
  try {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (end <= start) return 0;
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  } catch {
    return 0;
  }
}

function addTagToList(tags: string[], newTag: string): string[] {
  const tag = newTag.trim();
  if (tag && !tags.includes(tag)) {
    return [...tags, tag];
  }
  return tags;
}

// =============================================================================
// Sub-components
// =============================================================================

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

// =============================================================================
// Main Component
// =============================================================================

interface ManualTimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
}

export function ManualTimeEntryModal({
  open,
  onOpenChange,
  projectId: initialProjectId,
  issueId: initialIssueId,
}: ManualTimeEntryModalProps) {
  const createTimeEntry = useMutation(api.timeTracking.createTimeEntry);
  const projects = useQuery(api.projects.getCurrentUserProjects, {});

  // Mode and derived state (kept outside form due to complexity)
  const [entryMode, setEntryMode] = useState<EntryMode>("duration");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [timeRangeDuration, setTimeRangeDuration] = useState(0);

  // Project/Issue selection (Radix Select)
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(initialProjectId);
  const [issueId, setIssueId] = useState<Id<"issues"> | undefined>(initialIssueId);

  // Tags (array state)
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Fetch issues for selected project
  const projectIssues = useQuery(
    api.issues.listSelectableIssues,
    projectId ? { projectId } : "skip",
  );

  type TimeEntryForm = z.infer<typeof timeEntrySchema>;

  const form = useForm({
    defaultValues: {
      date: formatDateForInput(Date.now()),
      startTime: "09:00",
      endTime: "17:00",
      durationInput: "",
      description: "",
      activity: "",
      billable: false,
    },
    validators: { onChange: timeEntrySchema },
    onSubmit: async ({ value }: { value: TimeEntryForm }) => {
      const effectiveDuration = entryMode === "duration" ? durationSeconds : timeRangeDuration;

      // Validate using extracted helper
      const validation = validateManualTimeEntry(
        { date: value.date, startTime: value.startTime, endTime: value.endTime },
        entryMode,
        durationSeconds,
        timeRangeDuration,
      );

      if (!validation.isValid) {
        showError(validation.errorMessage);
        return;
      }

      // Calculate times using extracted helper
      const { startTimeMs, endTimeMs } = calculateManualEntryTimes(
        { date: value.date, startTime: value.startTime, endTime: value.endTime },
        entryMode,
        effectiveDuration,
      );

      try {
        await createTimeEntry({
          projectId,
          issueId,
          startTime: startTimeMs,
          endTime: endTimeMs,
          description: value.description || undefined,
          activity: value.activity || undefined,
          tags,
          billable: value.billable,
        });
        showSuccess("Time entry created");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to create time entry");
      }
    },
  });

  // Subscribe to form values for derived calculations
  const date = useStore(form.store, (state) => state.values.date);
  const startTime = useStore(form.store, (state) => state.values.startTime);
  const endTime = useStore(form.store, (state) => state.values.endTime);
  const durationInput = useStore(form.store, (state) => state.values.durationInput);

  // Parse duration input when it changes
  useEffect(() => {
    if (entryMode === "duration") {
      setDurationSeconds(parseDurationToSeconds(durationInput));
    }
  }, [durationInput, entryMode]);

  // Calculate duration from time range
  useEffect(() => {
    if (entryMode === "timeRange") {
      setTimeRangeDuration(calculateTimeRangeDuration(date, startTime, endTime));
    }
  }, [date, startTime, endTime, entryMode]);

  const handleQuickIncrement = (minutes: number) => {
    const newSeconds = durationSeconds + minutes * 60;
    setDurationSeconds(newSeconds);
    form.setFieldValue("durationInput", formatDurationHuman(newSeconds));
  };

  const handleAddTag = () => {
    const newTags = addTagToList(tags, tagInput);
    if (newTags !== tags) {
      setTags(newTags);
      setTagInput("");
    }
  };

  const effectiveDuration = entryMode === "duration" ? durationSeconds : timeRangeDuration;
  const isDurationInputValid = durationInput.trim() === "" || durationSeconds > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Log Time Manually"
      className="sm:max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {/* Mode Toggle */}
        <Flex gap="xs" className="p-1 bg-ui-bg-secondary rounded-lg">
          <ModeToggleButton
            mode="duration"
            currentMode={entryMode}
            icon={Hourglass}
            label="Duration"
            onClick={() => setEntryMode("duration")}
          />
          <ModeToggleButton
            mode="timeRange"
            currentMode={entryMode}
            icon={Clock}
            label="Start/End Time"
            onClick={() => setEntryMode("timeRange")}
          />
        </Flex>

        {/* Date */}
        <form.Field name="date">
          {(field) => (
            <Stack gap="xs">
              <Label htmlFor="time-entry-date">Date *</Label>
              <input
                id="time-entry-date"
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                max={formatDateForInput(Date.now())}
                className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-brand-ring"
                required
              />
            </Stack>
          )}
        </form.Field>

        {/* Duration Mode */}
        {entryMode === "duration" && (
          <form.Field name="durationInput">
            {(field) => (
              <Stack gap="sm">
                <Stack gap="xs">
                  <Label htmlFor="time-entry-duration">Duration *</Label>
                  <input
                    id="time-entry-duration"
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., 1:30, 1.5, 1h 30m, 90m"
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-ring",
                      isDurationInputValid ? "border-ui-border" : "border-status-error",
                    )}
                  />
                  {!isDurationInputValid ? (
                    <Typography variant="caption" className="text-status-error">
                      Invalid format. Try: 1:30, 1.5, 1h 30m, or 90m
                    </Typography>
                  ) : (
                    <Typography variant="caption">Accepts: 1:30, 1.5, 1h 30m, 90m</Typography>
                  )}
                </Stack>

                {/* Quick Increment Buttons */}
                <Flex gap="sm">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickIncrement(15)}
                  >
                    +15m
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickIncrement(30)}
                  >
                    +30m
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickIncrement(60)}
                  >
                    +1h
                  </Button>
                  {durationSeconds > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDurationSeconds(0);
                        field.handleChange("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Flex>

                {/* Duration Display */}
                {durationSeconds > 0 && (
                  <Card padding="sm" className="bg-brand-subtle border-brand-border">
                    <Typography variant="mono" className="text-brand-active">
                      Duration: {formatDurationHuman(durationSeconds)}
                    </Typography>
                  </Card>
                )}
              </Stack>
            )}
          </form.Field>
        )}

        {/* Time Range Mode */}
        {entryMode === "timeRange" && (
          <Stack gap="md">
            <Grid cols={2} gap="lg">
              <form.Field name="startTime">
                {(field) => (
                  <Stack gap="xs">
                    <Label htmlFor="time-entry-start">Start Time *</Label>
                    <input
                      id="time-entry-start"
                      type="time"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-brand-ring"
                      required
                    />
                  </Stack>
                )}
              </form.Field>
              <form.Field name="endTime">
                {(field) => (
                  <Stack gap="xs">
                    <Label htmlFor="time-entry-end">End Time *</Label>
                    <input
                      id="time-entry-end"
                      type="time"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-brand-ring"
                      required
                    />
                  </Stack>
                )}
              </form.Field>
            </Grid>

            {/* Duration Display */}
            {timeRangeDuration > 0 && (
              <Card padding="sm" className="bg-brand-subtle border-brand-border">
                <Typography variant="mono" className="text-brand-active">
                  Duration: {formatDurationHuman(timeRangeDuration)}
                </Typography>
              </Card>
            )}
          </Stack>
        )}

        {/* Project Selection */}
        <Stack gap="xs">
          <Label htmlFor="time-entry-project">Project</Label>
          <Select
            value={projectId || "none"}
            onValueChange={(value) => {
              setProjectId(value === "none" ? undefined : (value as Id<"projects">));
              setIssueId(undefined);
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
        </Stack>

        {/* Issue Selection */}
        {projectId && projectIssues && projectIssues.length > 0 && (
          <Stack gap="xs">
            <Label htmlFor="time-entry-issue">Issue (optional)</Label>
            <Select
              value={issueId || "none"}
              onValueChange={(value) =>
                setIssueId(value === "none" ? undefined : (value as Id<"issues">))
              }
            >
              <SelectTrigger id="time-entry-issue" className="w-full">
                <SelectValue placeholder="Select issue..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No issue</SelectItem>
                {projectIssues.map((issue: IssueItem) => (
                  <SelectItem key={issue._id} value={issue._id}>
                    {issue.key} - {issue.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>
        )}

        {/* Description */}
        <form.Field name="description">
          {(field) => (
            <FormTextarea
              field={field}
              label="Description"
              placeholder="What did you work on?"
              rows={3}
            />
          )}
        </form.Field>

        {/* Activity */}
        <form.Field name="activity">
          {(field) => (
            <Stack gap="xs">
              <Label htmlFor="time-entry-activity">Activity</Label>
              <Select
                value={field.state.value || "none"}
                onValueChange={(value) => field.handleChange(value === "none" ? "" : value)}
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
            </Stack>
          )}
        </form.Field>

        {/* Tags */}
        <Stack gap="sm">
          <Label htmlFor="time-entry-tags">Tags</Label>
          <Flex gap="sm">
            <input
              id="time-entry-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add tag..."
              className="flex-1 px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-brand-ring"
            />
            <Button onClick={handleAddTag} variant="secondary" size="sm" type="button">
              Add
            </Button>
          </Flex>
          {tags.length > 0 && (
            <Flex gap="sm" wrap>
              {tags.map((tag) => (
                <Flex
                  key={tag}
                  as="span"
                  inline
                  align="center"
                  gap="xs"
                  className="px-2 py-1 bg-brand-subtle text-brand-hover text-xs rounded"
                >
                  {tag}
                  <Button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="p-0 min-w-0 h-auto hover:text-brand-active"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}
        </Stack>

        {/* Billable */}
        <form.Field name="billable">
          {(field) => (
            <Stack gap="xs">
              <label className="cursor-pointer">
                <Flex align="center" gap="sm">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="w-4 h-4 text-brand rounded focus:ring-2 focus:ring-brand-ring"
                  />
                  <Typography variant="label">Billable time</Typography>
                </Flex>
              </label>
              <Typography variant="caption" className="ml-6">
                Mark this time as billable to clients
              </Typography>
            </Stack>
          )}
        </form.Field>

        {/* Footer with form state - kept inside children */}
        <Flex justify="end" gap="sm" className="pt-4 border-t border-ui-border">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <>
                <Button onClick={() => onOpenChange(false)} variant="secondary" type="button">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={effectiveDuration <= 0}
                  isLoading={isSubmitting}
                >
                  Create Entry
                </Button>
              </>
            )}
          </form.Subscribe>
        </Flex>
      </form>
    </Dialog>
  );
}
