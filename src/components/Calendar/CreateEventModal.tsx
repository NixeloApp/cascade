import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { z } from "zod";
import { FormInput, FormTextarea } from "@/lib/form";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form/Input";
import { Grid } from "../ui/Grid";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import {
  COLOR_PICKER_CLASSES,
  EVENT_TYPE_DEFAULT_COLOR,
  type EventColor,
  PALETTE_COLORS,
} from "./calendar-colors";

// =============================================================================
// Schema
// =============================================================================

const eventTypes = ["meeting", "deadline", "timeblock", "personal"] as const;

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  startDate: z.string().min(1, "Date is required"),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean(),
  eventType: z.enum(eventTypes),
  location: z.string(),
  meetingUrl: z.union([z.string().url(), z.literal("")]),
  isRequired: z.boolean(),
});

// =============================================================================
// Component
// =============================================================================

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
}

export function CreateEventModal({
  open,
  onOpenChange,
  defaultDate = new Date(),
  projectId,
  issueId,
}: CreateEventModalProps) {
  const createEvent = useMutation(api.calendarEvents.create);
  const projects = useQuery(api.projects.getCurrentUserProjects, {});

  // Project selection (uses Radix Select, kept outside form)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<Id<"projects"> | undefined>(
    projectId,
  );
  const [selectedColor, setSelectedColor] = useState<EventColor | undefined>(undefined);

  type CreateEventForm = z.infer<typeof createEventSchema>;

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      startDate: defaultDate.toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      eventType: "meeting" as CreateEventForm["eventType"],
      location: "",
      meetingUrl: "",
      isRequired: false,
    },
    validators: { onChange: createEventSchema },
    onSubmit: async ({ value }: { value: CreateEventForm }) => {
      try {
        // Parse start and end times
        const [startHour, startMinute] = value.startTime.split(":").map(Number);
        const [endHour, endMinute] = value.endTime.split(":").map(Number);

        const startDateTime = new Date(value.startDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        const endDateTime = new Date(value.startDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        await createEvent({
          title: value.title,
          description: value.description || undefined,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          allDay: value.allDay,
          location: value.location || undefined,
          eventType: value.eventType,
          meetingUrl: value.meetingUrl || undefined,
          projectId: selectedWorkspaceId,
          issueId,
          attendeeIds: [],
          isRequired: value.eventType === "meeting" ? value.isRequired : undefined,
          color: selectedColor,
        });

        showSuccess("Event created successfully");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to create event");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="tracking-tight">Create Event</DialogTitle>
          <DialogDescription>Add a new event to your calendar</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Subscribe selector={(state) => state.values}>
            {({ eventType, allDay, isRequired }) => (
              <Flex direction="column" gap="lg" className="p-6">
                {/* Title */}
                <form.Field name="title">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Event Title *"
                      placeholder="Team standup, Client call, etc."
                      required
                    />
                  )}
                </form.Field>

                {/* Event Type */}
                <div>
                  <Label className="mb-1">Event Type</Label>
                  <Grid cols={4} gap="sm">
                    {eventTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          form.setFieldValue("eventType", type as (typeof eventTypes)[number]);
                          if (!selectedColor) {
                            setSelectedColor(EVENT_TYPE_DEFAULT_COLOR[type]);
                          }
                        }}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium capitalize",
                          eventType === type
                            ? "bg-brand text-brand-foreground"
                            : "bg-ui-bg-secondary text-ui-text hover:bg-ui-bg-tertiary",
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </Grid>
                </div>

                {/* Color */}
                <div>
                  <Label className="mb-1">Color</Label>
                  <Flex gap="sm" className="flex-wrap">
                    {PALETTE_COLORS.map((color) => {
                      const isActive =
                        (selectedColor ?? EVENT_TYPE_DEFAULT_COLOR[eventType as string]) === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "size-7 rounded-full transition-all",
                            COLOR_PICKER_CLASSES[color].bg,
                            isActive
                              ? cn("ring-2 ring-offset-2", COLOR_PICKER_CLASSES[color].ring)
                              : "hover:scale-110",
                          )}
                          title={color}
                          aria-label={`Select ${color} color`}
                        />
                      );
                    })}
                  </Flex>
                </div>

                {/* Date and Time */}
                <Grid cols={3} gap="lg">
                  <div className="col-span-3 sm:col-span-1">
                    <form.Field name="startDate">
                      {(field) => (
                        <Input
                          id="event-date"
                          label="Date"
                          type="date"
                          value={field.state.value as string}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          required
                        />
                      )}
                    </form.Field>
                  </div>
                  <div>
                    <form.Field name="startTime">
                      {(field) => (
                        <Input
                          id="event-start-time"
                          label="Start Time"
                          type="time"
                          value={field.state.value as string}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          disabled={allDay as boolean}
                        />
                      )}
                    </form.Field>
                  </div>
                  <div>
                    <form.Field name="endTime">
                      {(field) => (
                        <Input
                          id="event-end-time"
                          label="End Time"
                          type="time"
                          value={field.state.value as string}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          disabled={allDay as boolean}
                        />
                      )}
                    </form.Field>
                  </div>
                </Grid>

                {/* All Day Toggle */}
                <form.Field name="allDay">
                  {(field) => (
                    <Checkbox
                      id="event-all-day"
                      label="All day event"
                      checked={field.state.value as boolean}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                  )}
                </form.Field>

                {/* Required Attendance (only for meetings) */}
                {eventType === "meeting" && (
                  <form.Field name="isRequired">
                    {(field) => (
                      <Checkbox
                        id="event-is-required"
                        label="Required attendance"
                        description={
                          isRequired
                            ? "Admins can mark who attended, was tardy, or missed"
                            : undefined
                        }
                        checked={field.state.value as boolean}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                      />
                    )}
                  </form.Field>
                )}

                {/* Description */}
                <form.Field name="description">
                  {(field) => (
                    <FormTextarea
                      field={field}
                      label="Description"
                      rows={3}
                      placeholder="Add notes, agenda, or details..."
                    />
                  )}
                </form.Field>

                {/* Location */}
                <form.Field name="location">
                  {(field) => (
                    <Input
                      id="event-location"
                      label="Location"
                      type="text"
                      value={(field.state.value as string) ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Office, Zoom, Google Meet, etc."
                    />
                  )}
                </form.Field>

                {/* Meeting URL */}
                {eventType === "meeting" && (
                  <form.Field name="meetingUrl">
                    {(field) => (
                      <Input
                        id="event-meeting-url"
                        label="Meeting Link"
                        type="url"
                        value={(field.state.value as string) ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="https://zoom.us/j/..."
                      />
                    )}
                  </form.Field>
                )}

                {/* Link to Project */}
                <div>
                  <Label htmlFor="event-project" className="mb-1">
                    Link to Project
                  </Label>
                  <Select
                    value={selectedWorkspaceId || "none"}
                    onValueChange={(value) =>
                      setSelectedWorkspaceId(
                        value === "none" ? undefined : (value as Id<"projects">),
                      )
                    }
                  >
                    <SelectTrigger className="w-full px-3 py-2 border border-ui-border rounded-md bg-ui-bg text-ui-text">
                      <SelectValue placeholder="No project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects?.page?.map((project: Doc<"projects">) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.name} ({project.key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <DialogFooter className="pt-4 border-t border-ui-border">
                  <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <>
                        <Button onClick={() => onOpenChange(false)} variant="secondary">
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting}>
                          {isSubmitting ? "Creating..." : "Create Event"}
                        </Button>
                      </>
                    )}
                  </form.Subscribe>
                </DialogFooter>
              </Flex>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
