/**
 * Pumble Integration Settings
 *
 * Configuration UI for Pumble (team chat) integration.
 * Allows setting up webhooks, channel mappings, and notification rules.
 * Supports bi-directional sync between issues and Pumble messages.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { toggleInArray } from "@/lib/array-utils";
import { FormInput } from "@/lib/form";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Dialog } from "../ui/Dialog";
import { EmptyState as EmptyStateBlock } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Select } from "../ui/form/Select";
import { Grid } from "../ui/Grid";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type PumbleWebhook = Doc<"pumbleWebhooks">;
type Project = FunctionReturnType<typeof api.projects.getCurrentUserProjects>["page"][number];

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

/** Pumble webhook integration manager with add/edit/delete functionality. */
export function PumbleIntegration() {
  const [showAddModal, setShowAddModal] = useState(false);
  const webhooks = useAuthenticatedQuery(api.pumble.listWebhooks, {});
  const projectsResult = useAuthenticatedQuery(api.projects.getCurrentUserProjects, {});
  const projects: Project[] = projectsResult?.page ?? [];

  return (
    <Card padding="none" variant="outline">
      {/* Header */}
      <CardHeader action={<Button onClick={() => setShowAddModal(true)}>Add Webhook</Button>}>
        <Flex gap="md" align="center">
          <Card variant="section" padding="sm" radius="md">
            <MessageSquare className="h-5 w-5 text-accent" />
          </Card>
          <Stack gap="xs">
            <Typography variant="h3">Pumble Integration</Typography>
            <Typography variant="small" color="secondary">
              Send notifications to Pumble channels when issues are created or updated
            </Typography>
          </Stack>
        </Flex>
      </CardHeader>

      {/* Content */}
      <Card padding="lg" radius="none" variant="section">
        <Stack gap="lg">
          {webhooks === undefined ? (
            <Card padding="xl" variant="section">
              <Flex align="center" justify="center">
                <Typography color="tertiary">Loading webhooks...</Typography>
              </Flex>
            </Card>
          ) : webhooks.length === 0 ? (
            <PumbleEmptyState onAddWebhook={() => setShowAddModal(true)} />
          ) : (
            <Stack gap="lg">
              {webhooks.map((webhook) => (
                <WebhookCard key={webhook._id} webhook={webhook} projects={projects} />
              ))}
            </Stack>
          )}

          <Card variant="section" padding="sm">
            <Flex gap="md" align="center">
              <Button
                asChild
                variant="link"
                size="none"
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                <a
                  href="https://help.pumble.com/hc/en-us/articles/360041954051-Incoming-webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How to create a Pumble incoming webhook
                </a>
              </Button>
            </Flex>
          </Card>
        </Stack>
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

function PumbleEmptyState({ onAddWebhook }: { onAddWebhook: () => void }) {
  return (
    <EmptyStateBlock
      icon={MessageSquare}
      title="No Pumble webhooks configured"
      description="Connect Nixelo to Pumble channels to receive notifications when issues are created, updated, or assigned."
      action={{
        label: "Add Your First Webhook",
        onClick: onAddWebhook,
      }}
      variant="info"
    />
  );
}

// WebhookCard component for displaying webhook details
interface WebhookCardProps {
  webhook: PumbleWebhook;
  projects: Project[];
}

function WebhookCard({ webhook, projects }: WebhookCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const testWebhookAction = useAction(api.pumble.testWebhook);
  const { mutate: deleteWebhookMutation } = useAuthenticatedMutation(api.pumble.deleteWebhook);
  const { mutate: updateWebhookMutation } = useAuthenticatedMutation(api.pumble.updateWebhook);

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

  const handleDeleteConfirm = async () => {
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
    <Card padding="md" variant="outline" hoverable>
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
              <Typography variant="mono">{maskedUrl}</Typography>
              {project && <Typography variant="caption">Project: {project.name}</Typography>}
            </Stack>
          </FlexItem>
        </Flex>

        <Flex gap="xs" wrap>
          {webhook.events.map((event: string) => (
            <Badge key={event} variant="accent" size="sm">
              {event.replace("issue.", "")}
            </Badge>
          ))}
        </Flex>

        {webhook.lastMessageAt && (
          <Typography variant="caption" color="tertiary">
            Last triggered: {new Date(webhook.lastMessageAt).toLocaleDateString()}
          </Typography>
        )}

        <Card padding="sm" variant="section">
          <Flex justify="between" align="center" gap="sm" wrap>
            <Flex gap="sm" wrap>
              <Button onClick={handleTest} variant="ghost" size="sm">
                Test Webhook
              </Button>
              <Button onClick={handleToggleActive} variant="secondary" size="sm">
                {webhook.isActive ? "Disable" : "Enable"}
              </Button>
              <Button onClick={() => setShowEditModal(true)} variant="secondary" size="sm">
                Edit
              </Button>
            </Flex>
            <Button onClick={() => setDeleteConfirmOpen(true)} variant="danger" size="sm">
              Delete
            </Button>
          </Flex>
        </Card>
      </Stack>

      {/* Edit Modal */}
      <EditWebhookModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        webhook={webhook}
        projects={projects}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Webhook"
        message={`Are you sure you want to delete webhook "${webhook.name}"?`}
        variant="danger"
        confirmLabel="Delete"
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

  const { mutate: addWebhook } = useAuthenticatedMutation(api.pumble.addWebhook);

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
    <Dialog open={open} onOpenChange={onOpenChange} title="Add Pumble Webhook" size="lg">
      <Stack
        gap="lg"
        as="form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          form.handleSubmit();
        }}
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
              helperText="Get this from Pumble: Channel Settings > Integrations > Incoming Webhooks"
              required
            />
          )}
        </form.Field>

        <Select
          id="project-select"
          label="Project (Optional)"
          value={projectId || ""}
          onChange={(e) =>
            setProjectId(e.target.value ? (e.target.value as Id<"projects">) : undefined)
          }
          helperText="Leave empty to receive notifications from all projects"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </Select>

        <Stack gap="sm">
          <Typography variant="label">Events to Send</Typography>
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

        <Card padding="sm" variant="flat">
          <Flex justify="end" gap="sm">
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
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    Add Webhook
                  </Button>
                </>
              )}
            </form.Subscribe>
          </Flex>
        </Card>
      </Stack>
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

  const { mutate: updateWebhook } = useAuthenticatedMutation(api.pumble.updateWebhook);

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
    <Dialog open={open} onOpenChange={onOpenChange} title="Edit Webhook" size="lg">
      <Stack
        gap="lg"
        as="form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          form.handleSubmit();
        }}
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
          {(field) => <FormInput field={field} label="Webhook URL" type="url" required />}
        </form.Field>

        <Stack gap="sm">
          <Typography variant="label">Events to Send</Typography>
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

        <Card padding="sm" variant="flat">
          <Flex justify="end" gap="sm">
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
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    Save Changes
                  </Button>
                </>
              )}
            </form.Subscribe>
          </Flex>
        </Card>
      </Stack>
    </Dialog>
  );
}
