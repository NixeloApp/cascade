import type { Id } from "@convex/_generated/dataModel";
import { Pencil, Trash } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface WebhookCardProps {
  webhook: {
    _id: Id<"webhooks">;
    name: string;
    url: string;
    isActive: boolean;
    events: string[];
    lastTriggered?: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Displays a single webhook configuration
 * Extracted from WebhooksManager for better reusability
 */
export function WebhookCard({ webhook, onEdit, onDelete }: WebhookCardProps) {
  return (
    <div className="p-4 bg-ui-bg-secondary rounded-lg hover:bg-ui-bg-tertiary transition-colors">
      <Flex justify="between" align="start">
        <div className="flex-1">
          <Flex gap="sm" align="center" className="mb-2">
            <Typography variant="h4" className="font-medium text-ui-text">
              {webhook.name}
            </Typography>
            <Badge variant={webhook.isActive ? "success" : "neutral"} size="sm">
              {webhook.isActive ? "Active" : "Inactive"}
            </Badge>
          </Flex>
          <Typography className="text-sm text-ui-text-secondary mb-2 font-mono break-all">
            {webhook.url}
          </Typography>
          <Flex wrap gap="xs">
            {webhook.events.map((event) => (
              <Badge key={event} variant="brand" size="sm">
                {event}
              </Badge>
            ))}
          </Flex>
          {webhook.lastTriggered && (
            <Typography className="text-xs text-ui-text-tertiary mt-2">
              Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
            </Typography>
          )}
        </div>

        <Flex gap="sm" className="ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            leftIcon={<Pencil className="w-4 h-4" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            leftIcon={<Trash className="w-4 h-4" />}
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </div>
  );
}
