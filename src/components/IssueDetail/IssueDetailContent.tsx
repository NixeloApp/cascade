import type { Id } from "@convex/_generated/dataModel";
import type { ComponentProps, ReactNode } from "react";
import { IssueComments } from "@/components/IssueComments";
import {
  IssueDescriptionEditor,
  IssueDescriptionReadOnly,
} from "@/components/IssueDescriptionEditor";
import { SubtasksList } from "@/components/IssueDetail/SubtasksList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form/Input";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { FileText } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { IssueDetailSection } from "./IssueDetailSection";

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

/** Main content area of issue detail with title, description, subtasks, and comments. */
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
    <FlexItem flex="1" className="min-w-0">
      <Card padding="lg">
        <Stack gap="2xl">
          <IssueDetailSection
            eyebrow="Issue workspace"
            title="Overview"
            description={
              isEditing
                ? "Refine the issue title and description before saving changes."
                : "Keep the problem, context, and acceptance criteria together."
            }
          >
            {isEditing ? (
              <Stack gap="md">
                <Input
                  value={editTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  variant="issueTitle"
                  placeholder="Issue title"
                />
                <IssueDescriptionEditor
                  value={editDescription}
                  onChange={onDescriptionChange}
                  placeholder="Add a description..."
                  minHeight={200}
                  testId={TEST_IDS.ISSUE.DESCRIPTION_EDITOR}
                />
                <Flex gap="sm">
                  <Button onClick={onSave} data-testid={TEST_IDS.ISSUE.SAVE_BUTTON}>
                    Save Changes
                  </Button>
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
                {issueDescription ? (
                  <IssueDescriptionReadOnly
                    value={issueDescription}
                    testId={TEST_IDS.ISSUE.DESCRIPTION_CONTENT}
                  />
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No description yet"
                    description="Add context, constraints, or handoff notes so the issue stays actionable."
                    size="compact"
                    align="start"
                    surface="bare"
                  />
                )}
              </Stack>
            )}
          </IssueDetailSection>

          {issueType !== "subtask" && (
            <IssueDetailSection
              title="Subtasks"
              description="Break the work into smaller trackable steps without leaving the issue."
            >
              <SubtasksList
                issueId={issueId}
                projectId={projectId}
                subtasks={subtasks}
                showHeading={false}
              />
            </IssueDetailSection>
          )}

          <IssueDetailSection
            title="Discussion"
            description="Capture decisions, blockers, and follow-up context directly on the issue."
          >
            <IssueComments issueId={issueId} projectId={projectId} />
          </IssueDetailSection>
        </Stack>
      </Card>
    </FlexItem>
  );
}
