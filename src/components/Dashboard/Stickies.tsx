/**
 * Stickies / Quick Notes
 *
 * Personal quick-capture notes panel for the dashboard.
 * Supports colored notes with inline editing and deletion.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Plus, StickyNote, Trash2, X } from "@/lib/icons";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import {
  getQuietCompactPillButtonClassName,
  getQuietRoundIconButtonClassName,
  getSelectableRoundIconButtonClassName,
} from "../ui/buttonSurfaceClassNames";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Textarea } from "../ui/Textarea";
import { Typography } from "../ui/Typography";
import { DashboardPanel, DashboardPanelBody, DashboardPanelHeader } from "./DashboardPanel";

const STICKY_COLORS = [
  { name: "yellow", classes: "bg-status-warning-bg border-status-warning/30" },
  { name: "blue", classes: "bg-status-info-bg border-status-info/30" },
  { name: "green", classes: "bg-status-success-bg border-status-success/30" },
  { name: "pink", classes: "bg-status-error-bg border-status-error/30" },
  { name: "purple", classes: "bg-brand-subtle/20 border-brand/30" },
] as const;

function getStickyClasses(color?: string) {
  return (STICKY_COLORS.find((c) => c.name === color) ?? STICKY_COLORS[0]).classes;
}

interface StickyCardProps {
  id: Id<"stickies">;
  content: string;
  color?: string;
  onUpdate: (id: Id<"stickies">, content: string) => Promise<void>;
  onDelete: (id: Id<"stickies">) => Promise<void>;
}

function StickyCard({ id, content, color, onUpdate, onDelete }: StickyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleSave = async () => {
    if (editContent.trim() !== content) {
      await onUpdate(id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <Card variant="section" padding="sm" className={cn(getStickyClasses(color))}>
      <Stack gap="xs">
        <Flex justify="end">
          <Button
            variant="unstyled"
            size="icon"
            aria-label="Delete note"
            onClick={() => onDelete(id)}
            className={getQuietRoundIconButtonClassName()}
          >
            <Icon icon={Trash2} size="xs" />
          </Button>
        </Flex>
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setEditContent(content);
                setIsEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <Button
            variant="ghost"
            className="justify-start text-left"
            onClick={() => {
              setIsEditing(true);
              setEditContent(content);
            }}
          >
            <Typography variant="small" className="whitespace-pre-wrap break-words">
              {content || "Click to edit..."}
            </Typography>
          </Button>
        )}
      </Stack>
    </Card>
  );
}

/** Stickies panel for the dashboard. */
export function Stickies() {
  const { organizationId } = useOrganization();
  const stickies = useAuthenticatedQuery(api.stickies.list, { organizationId });
  const { mutate: createSticky } = useAuthenticatedMutation(api.stickies.create);
  const { mutate: updateSticky } = useAuthenticatedMutation(api.stickies.update);
  const { mutate: removeSticky } = useAuthenticatedMutation(api.stickies.remove);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("yellow");

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    try {
      await createSticky({
        organizationId,
        content: newContent.trim(),
        color: selectedColor,
      });
      setNewContent("");
      setIsAdding(false);
    } catch (error) {
      showError(error, "Failed to create note");
    }
  };

  const handleUpdate = async (id: Id<"stickies">, content: string) => {
    try {
      await updateSticky({ id, content });
    } catch (error) {
      showError(error, "Failed to update note");
    }
  };

  const handleDelete = async (id: Id<"stickies">) => {
    try {
      await removeSticky({ id });
    } catch (error) {
      showError(error, "Failed to delete note");
    }
  };

  const sortedStickies = [...(stickies ?? [])].sort((a, b) => a.order - b.order);

  return (
    <DashboardPanel>
      <DashboardPanelHeader
        title="Quick Notes"
        actions={
          !isAdding ? (
            <Button
              variant="unstyled"
              size="icon"
              onClick={() => setIsAdding(true)}
              aria-label="Add note"
              className={getQuietRoundIconButtonClassName()}
            >
              <Icon icon={Plus} size="sm" />
            </Button>
          ) : undefined
        }
      />
      <DashboardPanelBody>
        {isAdding && (
          <Stack gap="sm">
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Quick note..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCreate();
                }
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewContent("");
                }
              }}
            />
            <Flex gap="xs" align="center" justify="between">
              <Flex gap="xs">
                {STICKY_COLORS.map((c) => (
                  <Button
                    key={c.name}
                    variant="unstyled"
                    size="icon"
                    onClick={() => setSelectedColor(c.name)}
                    aria-label={`${c.name} color`}
                    className={getSelectableRoundIconButtonClassName(selectedColor === c.name)}
                  >
                    <div className={cn("size-3", c.classes)} />
                  </Button>
                ))}
              </Flex>
              <Flex gap="xs">
                <Button
                  size="sm"
                  variant="unstyled"
                  onClick={() => {
                    setIsAdding(false);
                    setNewContent("");
                  }}
                  className={getQuietCompactPillButtonClassName()}
                >
                  <Icon icon={X} size="xs" inline />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={!newContent.trim()}>
                  Add
                </Button>
              </Flex>
            </Flex>
          </Stack>
        )}

        {stickies === undefined ? null : sortedStickies.length === 0 && !isAdding ? (
          <EmptyState
            icon={StickyNote}
            title="No quick notes"
            description="Capture thoughts, reminders, and ideas."
            size="compact"
            surface="bare"
            action={
              <Button size="sm" onClick={() => setIsAdding(true)}>
                <Icon icon={Plus} size="xs" inline />
                Add note
              </Button>
            }
          />
        ) : (
          <Grid cols={2} gap="sm">
            {sortedStickies.map((sticky) => (
              <StickyCard
                key={sticky._id}
                id={sticky._id}
                content={sticky.content}
                color={sticky.color}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </Grid>
        )}
      </DashboardPanelBody>
    </DashboardPanel>
  );
}
