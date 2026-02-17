import type { Id } from "@convex/_generated/dataModel";
import type { ComponentProps, ReactNode } from "react";
import { IssueComments } from "@/components/IssueComments";
import { SubtasksList } from "@/components/IssueDetail/SubtasksList";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/Textarea";
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
    <FlexItem flex="1" className="min-w-0 p-6 space-y-8 max-w-4xl border-r border-ui-border/50">
      {/* Title & Description */}
      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={editTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-2xl font-bold h-auto py-2"
              placeholder="Issue title"
              aria-label="Issue title"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={8}
              className="text-base"
              placeholder="Add a description..."
              aria-label="Issue description"
            />
            <Flex gap="sm">
              <Button onClick={onSave}>Save Changes</Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </Flex>
          </div>
        ) : (
          <>
            <Typography variant="h1" className="text-3xl font-semibold tracking-tight border-none">
              {issueTitle}
            </Typography>
            <div className="prose max-w-none">
              <Typography variant="p" className="text-base text-ui-text-secondary">
                {issueDescription || (
                  <span className="italic text-ui-text-tertiary">No description provided</span>
                )}
              </Typography>
            </div>
          </>
        )}
      </div>

      {/* Sub-tasks Section */}
      {issueType !== "subtask" && (
        <div>
          <Typography
            variant="h3"
            className="text-sm font-semibold mb-4 uppercase tracking-wider text-ui-text-tertiary"
          >
            Sub-tasks
          </Typography>
          <SubtasksList issueId={issueId} projectId={projectId} subtasks={subtasks} />
        </div>
      )}

      {/* Comments Section */}
      <div className="pt-8 border-t border-ui-border/50">
        <Typography
          variant="h3"
          className="text-sm font-semibold mb-6 uppercase tracking-widest text-ui-text-tertiary"
        >
          Comments
        </Typography>
        <IssueComments issueId={issueId} projectId={projectId} />
      </div>
    </FlexItem>
  );
}
