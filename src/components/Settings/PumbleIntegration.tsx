import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toggleInArray } from "@/lib/array-utils";
import { FormInput } from "@/lib/form";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { Flex, FlexItem } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Grid } from "../ui/Grid";
import { Label } from "../ui/Label";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type PumbleWebhook = Doc<"pumbleWebhooks">;
type Project = Doc<"projects">;

// =============================================================================
// Schema & Constants
// =============================================================================

const webhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  webhookUrl: z
    .string()
    .url("Invalid URL")
    .refine((url) => url.includes("pumble.com"), {
      message: "Must be a valid Pumble webhook URL",
    }),
});

const AVAILABLE_EVENTS = [
  { value: "issue.created", label: "Issue Created" },
  { value: "issue.updated", label: "Issue Updated" },
  { value: "issue.assigned", label: "Issue Assigned" },
  { value: "issue.completed", label: "Issue Completed" },
  { value: "issue.deleted", label: "Issue Deleted" },
  { value: "comment.created", label: "Comment Added" },
];

export function PumbleIntegration() {
  const [showAddModal, setShowAddModal] = useState(false);
  const webhooks = useQuery(api.pumble.listWebhooks);
  const projectsResult = useQuery(api.projects.getCurrentUserProjects, {});
  const projects: Project[] = projectsResult?.page ?? [];

  return (
    <Card>
      {/* Header */}
      <div className="p-6 border-b border-ui-border">
        <Flex justify="between" align="start">
          <Flex gap="md" align="center">
            <FlexItem shrink={false}>
              <Flex
                align="center"
                justify="center"
                className="w-12 h-12 bg-linear-to-br from-accent-ring to-palette-pink rounded-lg"
              >
                <svg
                  className="w-6 h-6 text-brand-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </Flex>
            </FlexItem>
            <Stack gap="xs">
              <Typography variant="h3">Pumble Integration</Typography>
              <Typography variant="small" color="secondary">
                Send notifications to Pumble channels when issues are created or updated
              </Typography>
            </Stack>
          </Flex>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            className="bg-accent hover:bg-accent-hover"
          >
            Add Webhook
          </Button>
        </Flex>
      </div>

      {/* Content */}
      <Card padding="lg">
        {webhooks === undefined ? (
          <Flex align="center" justify="center" className="py-12">
            <Typography color="tertiary">Loading webhooks...</Typography>
          </Flex>
        ) : webhooks.length === 0 ? (
          <EmptyState onAddWebhook={() => setShowAddModal(true)} />
        ) : (
          <Stack gap="lg">
            {webhooks.map((webhook) => (
              <WebhookCard key={webhook._id} webhook={webhook} projects={projects} />
            ))}
          </Stack>
        )}

        {/* Documentation Link */}
        <div className="mt-6 pt-6 border-t border-ui-border">
          <a
            href="https://help.pumble.com/hc/en-us/articles/360041954051-Incoming-webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:text-accent-hover"
          >
            <Flex gap="xs" align="center">
              <span>How to create a Pumble incoming webhook</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Flex>
          </a>
        </div>
      </Card>

      {/* Add Webhook Modal */}
      <AddWebhookModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        projects={projects || []}
      />
    </Card>
  );
}

function EmptyState({ onAddWebhook }: { onAddWebhook: () => void }) {
  return (
    <Stack gap="md" align="center" className="text-center py-12">
      <Flex align="center" justify="center" className="w-16 h-16 bg-accent-subtle rounded-full">
        <svg
          className="w-8 h-8 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          role="img"
          aria-label="Chat message icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </Flex>
      <Typography variant="h3">No Pumble webhooks configured</Typography>
      <Typography variant="small" color="secondary" className="max-w-md">
        Connect Nixelo to Pumble channels to receive notifications when issues are created, updated,
        or assigned.
      </Typography>
      <Button onClick={onAddWebhook} variant="primary" className="bg-accent hover:bg-accent-hover">
        Add Your First Webhook
      </Button>
    </Stack>
  );
}

// WebhookCard component for displaying webhook details
interface WebhookCardProps {
  webhook: PumbleWebhook;
  projects: Project[];
}

function WebhookCard({ webhook, projects }: WebhookCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const testWebhookAction = useAction(api.pumble.testWebhook);
  const deleteWebhookMutation = useMutation(api.pumble.deleteWebhook);
  const updateWebhookMutation = useMutation(api.pumble.updateWebhook);

  const project = webhook.projectId ? projects.find((p) => p._id === webhook.projectId) : null;

  const handleTest = async () => {
    try {
      await testWebhookAction({ webhookId: webhook._id });
      showSuccess("Test message sent to Pumble!");
    } catch (error) {
      showError(error, "Failed to send test message");
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateWebhookMutation({
        webhookId: webhook._id,
        isActive: !webhook.isActive,
      });
      showSuccess(webhook.isActive ? "Webhook disabled" : "Webhook enabled");
    } catch (error) {
      showError(error, "Failed to update webhook");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete webhook "${webhook.name}"?`)) return;

    try {
      await deleteWebhookMutation({ webhookId: webhook._id });
      showSuccess("Webhook deleted");
    } catch (error) {
      showError(error, "Failed to delete webhook");
    }
  };

  const maskedUrl = webhook.webhookUrl
    ? webhook.webhookUrl.replace(/([^/]{8})[^/]+/, "$1***")
    : "No URL";

  return (
    <Card padding="md" className="hover:border-accent-hover transition-colors">
      <Stack gap="md">
        <Flex justify="between" align="start">
          <FlexItem flex="1">
            <Stack gap="xs">
              <Flex gap="sm" align="center">
                <Typography variant="h4">{webhook.name}</Typography>
                {webhook.isActive ? (
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    Inactive
                  </Badge>
                )}
              </Flex>
              <Typography variant="small" color="secondary" className="font-mono">
                {maskedUrl}
              </Typography>
              {project && <Typography variant="caption">Project: {project.name}</Typography>}
            </Stack>
          </FlexItem>
        </Flex>

        {/* Events */}
        <Flex wrap className="gap-1.5">
          {webhook.events.map((event: string) => (
            <Badge key={event} variant="accent" size="sm">
              {event.replace("issue.", "")}
            </Badge>
          ))}
        </Flex>

        {/* Stats */}
        {webhook.lastMessageAt && (
          <Typography variant="caption" color="tertiary">
            Last triggered: {new Date(webhook.lastMessageAt).toLocaleDateString()}
          </Typography>
        )}

        {/* Actions */}
        <Flex gap="sm" align="center" className="pt-3 border-t border-ui-border">
          <Button
            onClick={handleTest}
            variant="ghost"
            size="sm"
            className="text-accent hover:bg-accent-subtle"
          >
            Test Webhook
          </Button>
          <Button onClick={handleToggleActive} variant="secondary" size="sm">
            {webhook.isActive ? "Disable" : "Enable"}
          </Button>
          <Button onClick={() => setShowEditModal(true)} variant="secondary" size="sm">
            Edit
          </Button>
          <Button onClick={handleDelete} variant="danger" size="sm" className="ml-auto">
            Delete
          </Button>
        </Flex>
      </Stack>

      {/* Edit Modal */}
      <EditWebhookModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        webhook={webhook}
        projects={projects}
      />
    </Card>
  );
}

interface AddWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
}

function AddWebhookModal({ open, onOpenChange, projects }: AddWebhookModalProps) {
  // Events kept outside form due to checkbox array pattern
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(undefined);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "issue.created",
    "issue.updated",
    "issue.assigned",
  ]);

  const addWebhook = useMutation(api.pumble.addWebhook);

  const form = useForm({
    defaultValues: {
      name: "",
      webhookUrl: "",
    },
    validators: { onChange: webhookSchema },
    onSubmit: async ({ value }: { value: { name: string; webhookUrl: string } }) => {
      if (selectedEvents.length === 0) {
        showError("Please select at least one event");
        return;
      }

      try {
        await addWebhook({
          name: value.name.trim(),
          webhookUrl: value.webhookUrl.trim(),
          projectId,
          events: selectedEvents,
        });
        showSuccess("Webhook added successfully!");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to add webhook");
      }
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setProjectId(undefined);
      setSelectedEvents(["issue.created", "issue.updated", "issue.assigned"]);
    }
  }, [open, form]);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => toggleInArray(prev, event));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Pumble Webhook"
      className="sm:max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Name */}
        <form.Field name="name">
          {(field) => (
            <FormInput
              field={field}
              label="Webhook Name"
              placeholder="e.g., Team Notifications"
              required
            />
          )}
        </form.Field>

        {/* Webhook URL */}
        <form.Field name="webhookUrl">
          {(field) => (
            <FormInput
              field={field}
              label="Webhook URL"
              type="url"
              placeholder="https://api.pumble.com/projects/.../..."
              className="font-mono text-sm"
              helperText="Get this from Pumble: Channel Settings > Integrations > Incoming Webhooks"
              required
            />
          )}
        </form.Field>

        {/* Project */}
        <Stack gap="xs">
          <Label htmlFor="project-select">Project (Optional)</Label>
          <select
            id="project-select"
            value={projectId || ""}
            onChange={(e) =>
              setProjectId(e.target.value ? (e.target.value as Id<"projects">) : undefined)
            }
            className="w-full px-3 py-2 border border-ui-border rounded-lg bg-ui-bg text-ui-text"
          >
            <option value="">All Projects</option>
            {projects?.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <Typography variant="caption">
            Leave empty to receive notifications from all projects
          </Typography>
        </Stack>

        {/* Events */}
        <Stack gap="sm">
          <Label required>Events to Send</Label>
          <Grid cols={2} gap="md">
            {AVAILABLE_EVENTS.map((event) => (
              <Checkbox
                key={event.value}
                label={event.label}
                checked={selectedEvents.includes(event.value)}
                onChange={() => toggleEvent(event.value)}
              />
            ))}
          </Grid>
          {selectedEvents.length === 0 && (
            <Typography variant="small" color="error">
              Select at least one event
            </Typography>
          )}
        </Stack>

        {/* Actions - kept inside form due to form.Subscribe */}
        <Flex justify="end" gap="sm" className="pt-4 border-t border-ui-border">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  variant="secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-accent hover:bg-accent-hover"
                  isLoading={isSubmitting}
                >
                  Add Webhook
                </Button>
              </>
            )}
          </form.Subscribe>
        </Flex>
      </form>
    </Dialog>
  );
}

interface EditWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: PumbleWebhook;
  projects: Project[];
}

function EditWebhookModal({ open, onOpenChange, webhook }: EditWebhookModalProps) {
  // Events kept outside form due to checkbox array pattern
  const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook.events);

  const updateWebhook = useMutation(api.pumble.updateWebhook);

  const form = useForm({
    defaultValues: {
      name: webhook.name,
      webhookUrl: webhook.webhookUrl || "",
    },
    validators: { onChange: webhookSchema },
    onSubmit: async ({ value }: { value: { name: string; webhookUrl: string } }) => {
      if (selectedEvents.length === 0) {
        showError("Please select at least one event");
        return;
      }

      try {
        await updateWebhook({
          webhookId: webhook._id,
          name: value.name.trim(),
          webhookUrl: value.webhookUrl.trim(),
          events: selectedEvents,
        });
        showSuccess("Webhook updated successfully!");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to update webhook");
      }
    },
  });

  // Reset form when webhook changes
  useEffect(() => {
    form.setFieldValue("name", webhook.name);
    form.setFieldValue("webhookUrl", webhook.webhookUrl);
    setSelectedEvents(webhook.events);
  }, [webhook, form]);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => toggleInArray(prev, event));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Edit Webhook" className="sm:max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Name */}
        <form.Field name="name">
          {(field) => (
            <FormInput
              field={field}
              label="Webhook Name"
              placeholder="e.g., Team Notifications"
              required
            />
          )}
        </form.Field>

        {/* Webhook URL */}
        <form.Field name="webhookUrl">
          {(field) => (
            <FormInput
              field={field}
              label="Webhook URL"
              type="url"
              className="font-mono text-sm"
              required
            />
          )}
        </form.Field>

        {/* Events */}
        <Stack gap="sm">
          <Label required>Events to Send</Label>
          <Grid cols={2} gap="md">
            {AVAILABLE_EVENTS.map((event) => (
              <Checkbox
                key={event.value}
                label={event.label}
                checked={selectedEvents.includes(event.value)}
                onChange={() => toggleEvent(event.value)}
              />
            ))}
          </Grid>
          {selectedEvents.length === 0 && (
            <Typography variant="small" color="error">
              Select at least one event
            </Typography>
          )}
        </Stack>

        {/* Actions - kept inside form due to form.Subscribe */}
        <Flex justify="end" gap="sm" className="pt-4 border-t border-ui-border">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  variant="secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-accent hover:bg-accent-hover"
                  isLoading={isSubmitting}
                >
                  Save Changes
                </Button>
              </>
            )}
          </form.Subscribe>
        </Flex>
      </form>
    </Dialog>
  );
}
