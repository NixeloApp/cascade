import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toggleInArray } from "@/lib/array-utils";
import { FormInput } from "@/lib/form";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Checkbox } from "../ui/form/Checkbox";
import { Label } from "../ui/Label";
import { Typography } from "../ui/Typography";

// =============================================================================
// Schema & Constants
// =============================================================================

const webhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Invalid URL"),
  secret: z.string(),
});

const AVAILABLE_EVENTS = [
  { value: "issue.created", label: "Issue Created" },
  { value: "issue.updated", label: "Issue Updated" },
  { value: "issue.deleted", label: "Issue Deleted" },
  { value: "sprint.started", label: "Sprint Started" },
  { value: "sprint.ended", label: "Sprint Ended" },
  { value: "comment.created", label: "Comment Added" },
];

// =============================================================================
// Component
// =============================================================================

interface WebhookFormProps {
  projectId: Id<"projects">;
  webhook?: {
    _id: Id<"webhooks">;
    name: string;
    url: string;
    secret?: string;
    events: string[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookForm({ projectId, webhook, open, onOpenChange }: WebhookFormProps) {
  // Events array (kept outside form due to checkbox array pattern)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const createWebhook = useMutation(api.webhooks.createWebhook);
  const updateWebhook = useMutation(api.webhooks.updateWebhook);

  const form = useForm({
    defaultValues: {
      name: "",
      url: "",
      secret: "",
    },
    validators: { onChange: webhookSchema },
    onSubmit: async ({ value }: { value: { name: string; url: string; secret: string } }) => {
      if (selectedEvents.length === 0) {
        showError("Select at least one event");
        return;
      }

      try {
        const webhookData = {
          name: value.name.trim(),
          url: value.url.trim(),
          secret: value.secret?.trim() || undefined,
          events: selectedEvents,
        };

        if (webhook) {
          await updateWebhook({ id: webhook._id, ...webhookData });
          showSuccess("Webhook updated");
        } else {
          await createWebhook({ projectId, ...webhookData });
          showSuccess("Webhook created");
        }
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to save webhook");
      }
    },
  });

  // Reset form when webhook changes
  useEffect(() => {
    if (webhook) {
      form.setFieldValue("name", webhook.name);
      form.setFieldValue("url", webhook.url);
      form.setFieldValue("secret", webhook.secret || "");
      setSelectedEvents(webhook.events);
    } else {
      form.reset();
      setSelectedEvents([]);
    }
  }, [webhook, form]);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => toggleInArray(prev, event));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{webhook ? "Edit Webhook" : "Create Webhook"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <FormInput
                field={field}
                label="Webhook Name"
                placeholder="e.g., Slack Notifications, Discord Bot"
                required
                autoFocus
              />
            )}
          </form.Field>

          <form.Field name="url">
            {(field) => (
              <FormInput
                field={field}
                label="Webhook URL"
                type="url"
                placeholder="https://your-server.com/webhook"
                required
              />
            )}
          </form.Field>

          <form.Field name="secret">
            {(field) => (
              <FormInput
                field={field}
                label="Secret (Optional)"
                type="password"
                placeholder="Used to sign webhook payloads"
                helperText="If provided, webhook payloads will be signed with HMAC-SHA256"
              />
            )}
          </form.Field>

          <div>
            <Label required className="block mb-2">
              Events to Subscribe
            </Label>
            <div className="space-y-2 p-3 bg-ui-bg-secondary rounded-lg">
              {AVAILABLE_EVENTS.map((event) => (
                <Checkbox
                  key={event.value}
                  label={event.label}
                  checked={selectedEvents.includes(event.value)}
                  onChange={() => toggleEvent(event.value)}
                />
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <Typography className="mt-1 text-sm text-status-error">
                Select at least one event
              </Typography>
            )}
          </div>

          <DialogFooter>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {webhook ? "Update" : "Create"} Webhook
                  </Button>
                </>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
