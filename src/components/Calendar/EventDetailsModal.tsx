import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatTime } from "@/lib/formatting";
import { Calendar, Check, Clock, LinkIcon, MapPin, Trash2, X } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { MeetingRecordingSection } from "../MeetingRecordingSection";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { MetadataItem } from "../ui/Metadata";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Typography } from "../ui/Typography";
import { getEventBadgeClass } from "./calendar-colors";

interface AttendanceParticipant {
  userId: string;
  userName?: string;
  status?: "present" | "tardy" | "absent";
}

interface EventDetailsModalProps {
  eventId: Id<"calendarEvents">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsModal({ eventId, open, onOpenChange }: EventDetailsModalProps) {
  const event = useQuery(api.calendarEvents.get, { id: eventId });
  const attendance = useQuery(api.calendarEventsAttendance.getAttendance, { eventId });
  const deleteEvent = useMutation(api.calendarEvents.remove);
  const markAttendance = useMutation(api.calendarEventsAttendance.markAttendance);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  if (!event) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} title="Event Details" size="lg">
        <Flex justify="center" className="p-8">
          <LoadingSpinner size="lg" />
        </Flex>
      </Dialog>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setIsDeleting(true);
    try {
      await deleteEvent({ id: eventId });
      showSuccess("Event deleted");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAttendance = async (
    userId: Id<"users">,
    status: "present" | "tardy" | "absent",
  ) => {
    setIsSavingAttendance(true);
    try {
      await markAttendance({ eventId, userId, status });
      showSuccess("Attendance marked");
    } catch (error) {
      showError(error, "Failed to mark attendance");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const getEventTypeColor = (eventType: string): string => {
    return getEventBadgeClass(eventType, event.color);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-status-success-bg text-status-success";
      case "tentative":
        return "bg-status-warning-bg text-status-warning";
      case "cancelled":
        return "bg-status-error-bg text-status-error";
      default:
        return "bg-ui-bg-tertiary text-ui-text-secondary";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={event.title}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button
            onClick={handleDelete}
            variant="danger"
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            {isDeleting ? "Deleting..." : "Delete Event"}
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Close
          </Button>
        </>
      }
    >
      <Flex direction="column" gap="lg">
        {/* Badges */}
        <Flex gap="sm" align="center">
          <Badge size="md" className={cn("capitalize", getEventTypeColor(event.eventType))}>
            {event.eventType}
          </Badge>
          <Badge size="md" className={cn("capitalize", getStatusColor(event.status))}>
            {event.status}
          </Badge>
        </Flex>

        {/* Content */}
        <Flex direction="column" gap="lg">
          {/* Date and Time */}
          <Flex gap="md" align="start">
            <Calendar className="w-5 h-5 text-ui-text-tertiary mt-0.5" />
            <div>
              <Typography variant="label">
                {formatDate(event.startTime, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
              <Typography variant="caption">
                {event.allDay ? (
                  "All day"
                ) : (
                  <>
                    {formatTime(event.startTime, { hour: "numeric", minute: "2-digit" })} -{" "}
                    {formatTime(event.endTime, { hour: "numeric", minute: "2-digit" })}
                  </>
                )}
              </Typography>
            </div>
          </Flex>

          {/* Organizer */}
          <Flex gap="md" align="start">
            <Flex
              align="center"
              justify="center"
              className="w-5 h-5 bg-brand rounded-full text-brand-foreground text-xs font-bold mt-0.5"
            >
              {event.organizerName?.[0]?.toUpperCase()}
            </Flex>
            <div>
              <Typography variant="caption">Organizer</Typography>
              <Typography variant="label">{event.organizerName}</Typography>
              {event.organizerEmail && (
                <Typography variant="caption">{event.organizerEmail}</Typography>
              )}
            </div>
          </Flex>

          {/* Description */}
          {event.description && (
            <div className="border-t border-ui-border pt-4">
              <Typography variant="label" className="mb-2">
                Description
              </Typography>
              <Typography variant="muted" className="whitespace-pre-wrap">
                {event.description}
              </Typography>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <Flex gap="md" align="start" className="border-t border-ui-border pt-4">
              <MapPin className="w-5 h-5 text-ui-text-tertiary mt-0.5" />
              <div>
                <Typography variant="caption">Location</Typography>
                <Typography variant="label">{event.location}</Typography>
              </div>
            </Flex>
          )}

          {/* Meeting URL */}
          {event.meetingUrl && (
            <Flex gap="md" align="start" className="border-t border-ui-border pt-4">
              <LinkIcon className="w-5 h-5 text-ui-text-tertiary mt-0.5" />
              <div>
                <Typography variant="caption">Meeting Link</Typography>
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand hover:text-brand-hover:text-brand-muted"
                >
                  Join Meeting
                </a>
              </div>
            </Flex>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="border-t border-ui-border pt-4">
              <Typography variant="label" className="mb-2">
                Notes
              </Typography>
              <Typography variant="muted" className="whitespace-pre-wrap">
                {event.notes}
              </Typography>
            </div>
          )}

          {/* Recurring */}
          {event.isRecurring && (
            <div className="border-t border-ui-border pt-4">
              <MetadataItem icon={<Clock className="w-4 h-4" />}>Recurring event</MetadataItem>
            </div>
          )}

          {/* Meeting Recording Section (for meetings with a meeting URL) */}
          {event.eventType === "meeting" && event.meetingUrl && (
            <MeetingRecordingSection
              calendarEventId={eventId}
              meetingUrl={event.meetingUrl}
              meetingTitle={event.title}
              scheduledStartTime={event.startTime}
            />
          )}

          {/* Attendance Tracking (only for required meetings, only visible to organizer) */}
          {event.isRequired && attendance && (
            <div className="border-t border-ui-border pt-4">
              <Flex justify="between" align="center" className="mb-3">
                <Typography variant="label">
                  Attendance ({attendance.markedCount}/{attendance.totalAttendees} marked)
                </Typography>
              </Flex>

              <Flex direction="column" gap="sm">
                {attendance.attendees.map((attendee: AttendanceParticipant) => (
                  <Flex
                    key={attendee.userId}
                    justify="between"
                    align="center"
                    className="p-2 bg-ui-bg-secondary rounded-md"
                  >
                    <Flex gap="sm" align="center" className="flex-1">
                      {/* Status Icon */}
                      {attendee.status === "present" && (
                        <Check className="w-4 h-4 text-status-success" />
                      )}
                      {attendee.status === "tardy" && (
                        <Clock className="w-4 h-4 text-status-warning" />
                      )}
                      {attendee.status === "absent" && <X className="w-4 h-4 text-status-error" />}
                      {!attendee.status && <div className="w-4 h-4" />}

                      {/* Attendee Name */}
                      <MetadataItem className="text-ui-text font-medium">
                        {attendee.userName}
                      </MetadataItem>
                    </Flex>

                    {/* Status Dropdown */}
                    <Select
                      value={attendee.status || "none"}
                      onValueChange={(value) => {
                        if (value === "none") return;
                        handleMarkAttendance(
                          attendee.userId as Id<"users">,
                          value as "present" | "tardy" | "absent",
                        );
                      }}
                      disabled={isSavingAttendance}
                    >
                      <SelectTrigger className="text-sm px-2 py-1 border border-ui-border rounded bg-ui-bg text-ui-text">
                        <SelectValue placeholder="Not marked" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not marked</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="tardy">Tardy</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </Flex>
                ))}
              </Flex>

              {attendance.totalAttendees === 0 && (
                <Typography variant="muted" className="text-center py-4">
                  No attendees added to this meeting
                </Typography>
              )}
            </div>
          )}
        </Flex>
      </Flex>
    </Dialog>
  );
}
