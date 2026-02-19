import type { Id } from "@convex/_generated/dataModel";
import { Pencil, Trash } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Stack } from "../ui/Stack";
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
    <Card padding="md" variant="flat" className="hover:bg-ui-bg-tertiary transition-colors">
      <Flex justify="between" align="start">
        <FlexItem flex="1">
          <Stack gap="sm">
            <Flex gap="sm" align="center">
              <Typography variant="h4">{webhook.name}</Typography>
              <Badge variant={webhook.isActive ? "success" : "neutral"} size="sm">
                {webhook.isActive ? "Active" : "Inactive"}
              </Badge>
            </Flex>
            <Typography variant="mono" color="secondary" className="break-all">
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
              <Typography variant="meta" color="tertiary">
                Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
              </Typography>
            )}
          </Stack>
        </FlexItem>

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
    </Card>
  );
}
