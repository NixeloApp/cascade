/**
 * AISuggestionsPanel - Refactored with useAISuggestions hook
 */

import type { Doc, Id } from "@convex/_generated/dataModel";
import { AlertTriangle, Calendar, Check, Lightbulb, Sparkles, Target, X } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { InlineSpinner } from "../ui/LoadingSpinner";
import { MetadataTimestamp } from "../ui/Metadata";
import { Progress } from "../ui/Progress";
import { SegmentedControl, SegmentedControlItem } from "../ui/SegmentedControl";
import { Skeleton } from "../ui/Skeleton";
import { Typography } from "../ui/Typography";
import { SUGGESTION_METADATA, type SuggestionType } from "./config";
import { useAISuggestions } from "./hooks";

interface AISuggestionsPanelProps {
  projectId?: Id<"projects">;
}

export function AISuggestionsPanel({ projectId }: AISuggestionsPanelProps) {
  const {
    isGenerating,
    selectedType,
    suggestions,
    setSelectedType,
    handleGenerateInsights,
    handleAcceptSuggestion,
    handleDismissSuggestion,
  } = useAISuggestions({ projectId });

  if (!projectId) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <EmptyState
          icon={Target}
          title="No Project Selected"
          description="Select a project to view AI suggestions."
          size="compact"
          surface="bare"
        />
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="h-full bg-ui-bg">
      {/* Action Bar */}
      <Card
        variant="ghost"
        padding="sm"
        radius="none"
        className="border-x-0 border-t-0 border-b border-ui-border bg-ui-bg-secondary sm:p-4"
      >
        <Button
          variant="accentGradient"
          size="touchWide"
          onClick={handleGenerateInsights}
          disabled={isGenerating}
        >
          <Flex align="center" justify="center" gap="sm">
            {isGenerating ? (
              <>
                <InlineSpinner size="sm" variant="inherit" className="sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Analyzing Project...</span>
                <span className="sm:hidden">Analyzing...</span>
              </>
            ) : (
              <>
                <Icon icon={Sparkles} size="md" />
                <span className="hidden sm:inline">Generate AI Insights</span>
                <span className="sm:hidden">Generate Insights</span>
              </>
            )}
          </Flex>
        </Button>

        {/* Filter Tabs */}
        <SegmentedControl
          value={selectedType ?? "all"}
          onValueChange={(value: string) =>
            setSelectedType(value === "all" ? undefined : (value as SuggestionType))
          }
          wrap
          className="mt-3 w-full"
          size="sm"
        >
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="risk_detection">
            <Icon icon={AlertTriangle} size="sm" className="inline mr-1" /> Risks
          </SegmentedControlItem>
          <SegmentedControlItem value="insight">
            <Icon icon={Lightbulb} size="sm" className="inline mr-1" /> Insights
          </SegmentedControlItem>
          <SegmentedControlItem value="sprint_planning">
            <Icon icon={Calendar} size="sm" className="inline mr-1" /> Planning
          </SegmentedControlItem>
        </SegmentedControl>
      </Card>

      {/* Suggestions List */}
      <FlexItem flex="1" className="overflow-y-auto">
        <Card variant="ghost" padding="sm" className="sm:p-4">
          {!suggestions ? (
            <Flex direction="column" gap="md">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </Flex>
          ) : suggestions.length === 0 ? (
            <Flex align="center" justify="center" className="h-full text-center">
              <EmptyState
                icon={Target}
                title="No Suggestions Yet"
                description='Click "Generate AI Insights" to analyze your project and get AI-powered recommendations.'
                surface="bare"
              />
            </Flex>
          ) : (
            <Flex direction="column" gap="md">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion._id}
                  suggestion={suggestion}
                  onAccept={handleAcceptSuggestion}
                  onDismiss={handleDismissSuggestion}
                />
              ))}
            </Flex>
          )}
        </Card>
      </FlexItem>
    </Flex>
  );
}

// Sub-components

interface SuggestionCardProps {
  suggestion: Doc<"aiSuggestions">;
  onAccept: (id: Id<"aiSuggestions">) => void;
  onDismiss: (id: Id<"aiSuggestions">) => void;
}

function SuggestionCard({ suggestion, onAccept, onDismiss }: SuggestionCardProps) {
  const metadata = SUGGESTION_METADATA[suggestion.suggestionType as SuggestionType];

  return (
    <Card variant="interactive" padding="md" radius="md">
      <Flex align="start" gap="md">
        <Icon icon={metadata?.icon || Lightbulb} size="lg" className="shrink-0" />
        <FlexItem flex="1" className="min-w-0">
          <Flex align="center" gap="sm" className="mb-2">
            <Badge variant="brand" shape="pill">
              {metadata?.label || suggestion.suggestionType}
            </Badge>
            <MetadataTimestamp date={suggestion._creationTime} format="absolute" />
          </Flex>
          <Typography variant="p" className="whitespace-pre-wrap break-words">
            {suggestion.suggestion}
          </Typography>
          {suggestion.reasoning && (
            <Typography variant="caption" className="mt-2">
              <Typography variant="label" as="span">
                Reasoning:
              </Typography>{" "}
              {suggestion.reasoning}
            </Typography>
          )}
          {suggestion.confidence !== undefined && (
            <div className="mt-2">
              <Flex align="center" gap="sm">
                <Typography variant="caption" color="tertiary">
                  Confidence:
                </Typography>
                <FlexItem flex="1">
                  <Progress value={suggestion.confidence * 100} className="max-w-25" />
                </FlexItem>
                <Typography variant="caption" color="tertiary">
                  {Math.round(suggestion.confidence * 100)}%
                </Typography>
              </Flex>
            </div>
          )}
          {!(suggestion.accepted || suggestion.dismissed) && (
            <Flex gap="sm" className="mt-3">
              <Button
                variant="success"
                size="sm"
                onClick={() => onAccept(suggestion._id)}
                className="flex-1 sm:flex-none"
                leftIcon={<Icon icon={Check} size="sm" />}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDismiss(suggestion._id)}
                className="flex-1 sm:flex-none"
                leftIcon={<Icon icon={X} size="sm" />}
              >
                Dismiss
              </Button>
            </Flex>
          )}
          {suggestion.accepted && (
            <div className="mt-3">
              <Badge variant="success" size="sm">
                <Icon icon={Check} size="xs" className="inline mr-1" /> Accepted
              </Badge>
            </div>
          )}
          {suggestion.dismissed && (
            <div className="mt-3">
              <Badge variant="neutral" size="sm">
                <Icon icon={X} size="xs" className="inline mr-1" /> Dismissed
              </Badge>
            </div>
          )}
        </FlexItem>
      </Flex>
    </Card>
  );
}
