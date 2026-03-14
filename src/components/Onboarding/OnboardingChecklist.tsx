/**
 * Onboarding Checklist
 *
 * Collapsible progress checklist for new users.
 * Tracks onboarding milestones and completion.
 * Dismissable after all tasks are completed.
 */

import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Check, ChevronDown, ChevronUp, Rocket, X } from "@/lib/icons";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Progress } from "../ui/Progress";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

/** Collapsible checklist showing onboarding progress and pending tasks. */
export function OnboardingChecklist() {
  const [isExpanded, setIsExpanded] = useState(true);
  const onboarding = useAuthenticatedQuery(api.onboarding.getOnboardingStatus, {});
  const projects = useAuthenticatedQuery(api.projects.getCurrentUserProjects, {});
  // Efficient query - only checks if user has any completed issue
  const hasCompletedIssue = useAuthenticatedQuery(api.onboarding.hasCompletedIssue, {});
  // Check if user has created any issues (just need count > 0)
  const userIssueCount = useAuthenticatedQuery(api.issues.getUserIssueCount, {});
  const { mutate: updateOnboarding } = useAuthenticatedMutation(
    api.onboarding.updateOnboardingStatus,
  );

  if (!onboarding || onboarding.checklistDismissed || onboarding.onboardingCompleted) {
    return null;
  }

  // Calculate completion status for each task (using efficient backend queries)
  const hasProjects = (projects?.page.length ?? 0) > 0;
  const hasCreatedIssue = (userIssueCount ?? 0) > 0;

  const items: ChecklistItem[] = [
    {
      id: "tour",
      title: "Take the welcome tour",
      description: "Learn the basics of Nixelo",
      completed: onboarding.tourShown,
    },
    {
      id: "project",
      title: "Create a project",
      description: "Set up your first project or project",
      completed: hasProjects || onboarding.wizardCompleted,
    },
    {
      id: "issue",
      title: "Create an issue",
      description: "Add a task, bug, or story to track",
      completed: hasCreatedIssue,
    },
    {
      id: "complete",
      title: "Complete an issue",
      description: "Move an issue to 'Done'",
      completed: hasCompletedIssue ?? false,
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const allComplete = completedCount === totalCount;

  const handleDismiss = () => {
    void updateOnboarding({
      checklistDismissed: true,
      onboardingCompleted: allComplete,
    });
  };

  return (
    <Card recipe="floatingWidget" padding="none" className="fixed bottom-6 right-6 z-40 w-80">
      <Card recipe="onboardingChecklistHeader" padding="md">
        <Flex justify="between" align="center">
          <Flex gap="md" align="center">
            <Card recipe="onboardingChecklistHero" className="h-9 w-9">
              <Flex align="center" justify="center" className="h-full w-full">
                <Icon icon={Rocket} size="md" />
              </Flex>
            </Card>
            <Stack gap="none">
              <Typography variant="h4">Getting Started</Typography>
              <Typography variant="meta">
                {completedCount} of {totalCount} complete
              </Typography>
            </Stack>
          </Flex>
          <Flex gap="xs" align="center">
            <IconButton
              variant="ghost"
              size="compact"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Collapse checklist" : "Expand checklist"}
              aria-expanded={isExpanded}
              aria-controls="onboarding-checklist-items"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </IconButton>
            <IconButton
              variant="ghost"
              size="compact"
              onClick={handleDismiss}
              aria-label="Dismiss checklist"
            >
              <X className="h-4 w-4" />
            </IconButton>
          </Flex>
        </Flex>
      </Card>

      <Card padding="md" className="border-0 shadow-none">
        <Flex align="center" gap="md">
          <FlexItem flex="1">
            <Progress value={progress} indicatorClassName="bg-brand duration-slow" />
          </FlexItem>
          <Typography variant="meta">{progress}%</Typography>
        </Flex>
      </Card>

      {isExpanded && (
        <Card padding="md" className="border-0 shadow-none">
          <Stack id="onboarding-checklist-items" gap="sm">
            {items.map((item, index) => (
              <Card
                key={item.id}
                recipe={
                  item.completed ? "onboardingChecklistItemComplete" : "onboardingChecklistItem"
                }
                padding="sm"
              >
                <Flex gap="md" align="start">
                  <Card
                    recipe={
                      item.completed ? "onboardingChecklistStepComplete" : "onboardingChecklistStep"
                    }
                    className="h-6 w-6 shrink-0"
                  >
                    <Flex align="center" justify="center" className="h-full w-full">
                      {item.completed ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Typography as="span" variant="caption">
                          {index + 1}
                        </Typography>
                      )}
                    </Flex>
                  </Card>
                  <FlexItem flex="1" className="min-w-0">
                    <Stack gap="xs">
                      <Typography
                        variant="small"
                        color={item.completed ? "tertiary" : "default"}
                        className={item.completed ? "line-through" : undefined}
                      >
                        {item.title}
                      </Typography>
                      <Typography variant="meta">{item.description}</Typography>
                    </Stack>
                  </FlexItem>
                </Flex>
              </Card>
            ))}

            {allComplete && (
              <Card recipe="successCallout" padding="md" className="mt-2">
                <Flex gap="md" align="start">
                  <Card recipe="onboardingChecklistSuccessIcon" className="h-8 w-8 shrink-0">
                    <Flex align="center" justify="center" className="h-full w-full">
                      <Check className="h-4 w-4 text-status-success" />
                    </Flex>
                  </Card>
                  <Stack gap="xs">
                    <Typography variant="small" className="text-status-success-text">
                      All done!
                    </Typography>
                    <Typography variant="meta" className="text-status-success-text/80">
                      You're ready to use Nixelo. Feel free to dismiss this checklist.
                    </Typography>
                  </Stack>
                </Flex>
              </Card>
            )}
          </Stack>
        </Card>
      )}
    </Card>
  );
}
