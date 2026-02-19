import type { Id } from "@convex/_generated/dataModel";
import type { ComponentProps, ReactNode } from "react";
import { IssueComments } from "@/components/IssueComments";
import { SubtasksList } from "@/components/IssueDetail/SubtasksList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/Textarea";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";

interface IssueDetailContentProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
  issueTitle: string;
  issueDescription: string | undefined;
  issueType: string;
  subtasks: ComponentProps<typeof SubtasksList>["subtasks"];
  isEditing: boolean;
  editTitle: string;
  editDescription: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function IssueDetailContent({
  issueId,
  projectId,
  issueTitle,
  issueDescription,
  issueType,
  subtasks,
  isEditing,
  editTitle,
  editDescription,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onCancel,
}: IssueDetailContentProps): ReactNode {
  return (
    <FlexItem flex="1" className="min-w-0 max-w-4xl border-r border-ui-border/50">
      <Card padding="lg" radius="none" variant="ghost">
        <Stack gap="xl">
          {/* Title & Description */}
          <Stack gap="md">
            {isEditing ? (
              <Stack gap="md">
                <Input
                  value={editTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-2xl font-bold h-auto py-2"
                  placeholder="Issue title"
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  rows={8}
                  className="text-base"
                  placeholder="Add a description..."
                />
                <Flex gap="sm">
                  <Button onClick={onSave}>Save Changes</Button>
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </Flex>
              </Stack>
            ) : (
              <Stack gap="md">
                <Typography variant="h2" className="border-none">
                  {issueTitle}
                </Typography>
                <div className="prose max-w-none">
                  <Typography variant="p" color="secondary">
                    {issueDescription || (
                      <span className="italic text-ui-text-tertiary">No description provided</span>
                    )}
                  </Typography>
                </div>
              </Stack>
            )}
          </Stack>

          {/* Sub-tasks Section */}
          {issueType !== "subtask" && (
            <Stack gap="md">
              <Typography variant="label" color="tertiary">
                Sub-tasks
              </Typography>
              <SubtasksList issueId={issueId} projectId={projectId} subtasks={subtasks} />
            </Stack>
          )}

          {/* Comments Section */}
          <Stack gap="lg" className="pt-8 border-t border-ui-border/50">
            <Typography variant="label" color="tertiary">
              Comments
            </Typography>
            <IssueComments issueId={issueId} projectId={projectId} />
          </Stack>
        </Stack>
      </Card>
    </FlexItem>
  );
}
