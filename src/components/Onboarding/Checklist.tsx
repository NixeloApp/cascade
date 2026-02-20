import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Rocket, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Progress } from "../ui/Progress";
import { Typography } from "../ui/Typography";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function OnboardingChecklist() {
  const [isExpanded, setIsExpanded] = useState(true);
  const onboarding = useQuery(api.onboarding.getOnboardingStatus);
  const projects = useQuery(api.projects.getCurrentUserProjects, {});
  // Efficient query - only checks if user has any completed issue
  const hasCompletedIssue = useQuery(api.onboarding.hasCompletedIssue);
  // Check if user has created any issues (just need count > 0)
  const userIssueCount = useQuery(api.issues.getUserIssueCount);
  const updateOnboarding = useMutation(api.onboarding.updateOnboardingStatus);

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
    <div className="fixed bottom-6 right-6 w-80 bg-ui-bg rounded-container shadow-elevated border border-ui-border z-40 overflow-hidden">
      {/* Header - Mintlify-inspired with subtle gradient */}
      <Flex
        justify="between"
        align="center"
        className="p-4 bg-ui-bg-soft border-b border-ui-border"
      >
        <Flex gap="md" align="center">
          <Flex align="center" justify="center" className="w-9 h-9 rounded-lg bg-brand-subtle">
            <Icon icon={Rocket} size="md" />
          </Flex>
          <div>
            <Typography variant="h3" className="font-semibold text-ui-text tracking-tight">
              Getting Started
            </Typography>
            <Typography className="text-xs text-ui-text-tertiary">
              {completedCount} of {totalCount} complete
            </Typography>
          </div>
        </Flex>
        <Flex gap="xs" align="center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-ui-text-tertiary" />
            ) : (
              <ChevronUp className="w-4 h-4 text-ui-text-tertiary" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-7 w-7">
            <X className="w-4 h-4 text-ui-text-tertiary" />
          </Button>
        </Flex>
      </Flex>

      {/* Progress Bar - Mintlify-inspired with brand color */}
      <div className="px-4 pt-4">
        <Flex align="center" gap="md">
          <Progress
            value={progress}
            indicatorClassName="bg-brand duration-500"
            className="flex-1"
          />
          <Typography className="text-xs font-medium text-ui-text-secondary tabular-nums">
            {progress}%
          </Typography>
        </Flex>
      </div>

      {/* Checklist Items - Mintlify-inspired with cleaner spacing */}
      {isExpanded && (
        <Flex direction="column" gap="sm" className="p-4">
          {items.map((item, index) => (
            <Flex
              key={item.id}
              gap="md"
              align="start"
              className={cn(
                "p-3 rounded-lg transition-colors duration-fast",
                item.completed ? "bg-transparent" : "bg-ui-bg-soft hover:bg-ui-bg-hover",
              )}
            >
              <Flex
                align="center"
                justify="center"
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full transition-all duration-default",
                  item.completed
                    ? "bg-status-success text-brand-foreground"
                    : "border-2 border-ui-border-secondary text-ui-text-tertiary",
                )}
              >
                {item.completed ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Typography variant="caption" as="span">
                    {index + 1}
                  </Typography>
                )}
              </Flex>
              <FlexItem flex="1" className="min-w-0">
                <Typography
                  className={cn(
                    "font-medium text-sm leading-tight",
                    item.completed ? "text-ui-text-tertiary line-through" : "text-ui-text",
                  )}
                >
                  {item.title}
                </Typography>
                <Typography className="text-xs text-ui-text-tertiary mt-0.5">
                  {item.description}
                </Typography>
              </FlexItem>
            </Flex>
          ))}

          {/* Completion Message - Mintlify-inspired success state */}
          {allComplete && (
            <div className="mt-2 p-4 bg-status-success-bg rounded-lg border border-status-success/20">
              <Flex gap="md" align="start">
                <Flex
                  align="center"
                  justify="center"
                  className="w-8 h-8 rounded-full bg-status-success/20 shrink-0"
                >
                  <Check className="w-4 h-4 text-status-success" />
                </Flex>
                <div>
                  <Typography className="text-sm font-semibold text-status-success-text">
                    All done!
                  </Typography>
                  <Typography className="text-xs text-status-success-text/80 mt-1">
                    You're ready to use Nixelo. Feel free to dismiss this checklist.
                  </Typography>
                </div>
              </Flex>
            </div>
          )}
        </Flex>
      )}
    </div>
  );
}
