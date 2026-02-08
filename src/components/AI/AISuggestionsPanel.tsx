/**
 * AISuggestionsPanel - Refactored with useAISuggestions hook
 */

import type { Doc, Id } from "@convex/_generated/dataModel";
import React from "react";
import { AlertTriangle, Calendar, Check, Lightbulb, Sparkles, Target, X } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { MetadataTimestamp } from "../ui/Metadata";
import { Progress } from "../ui/Progress";
import { Skeleton } from "../ui/Skeleton";
import { ToggleGroup, ToggleGroupItem } from "../ui/ToggleGroup";
import { Typography } from "../ui/Typography";
import { SUGGESTION_METADATA, type SuggestionType } from "./config";
import { useAISuggestions } from "./hooks";

interface AISuggestionsPanelProps {
  projectId?: Id<"projects">;
}

export const AISuggestionsPanel = React.memo(function AISuggestionsPanel({
  projectId,
}: AISuggestionsPanelProps) {
  const {
    isGenerating,
    selectedType,
    suggestions,
    unreadCount: _unreadCount,
    setSelectedType,
    handleGenerateInsights,
    handleAcceptSuggestion,
    handleDismissSuggestion,
  } = useAISuggestions({ projectId });

  if (!projectId) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <div className="text-center">
          <Typography variant="muted">Select a project to view AI suggestions</Typography>
        </div>
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="h-full bg-ui-bg">
      {/* Action Bar */}
      <div className="p-3 sm:p-4 border-b border-ui-border bg-ui-bg-secondary">
        <button
          type="button"
          onClick={handleGenerateInsights}
          disabled={isGenerating}
          className="w-full px-4 py-2.5 sm:py-3 bg-linear-to-r from-brand to-accent text-brand-foreground rounded-lg text-sm sm:text-base font-medium hover:from-brand-hover hover:to-accent-hover focus:outline-none focus:ring-2 focus:ring-brand-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
        >
          <Flex align="center" justify="center" gap="sm">
            {isGenerating ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        </button>

        {/* Filter Tabs */}
        <ToggleGroup
          type="single"
          value={selectedType ?? "all"}
          onValueChange={(value: string) =>
            setSelectedType(value === "all" ? undefined : (value as SuggestionType))
          }
          className="mt-3 flex-wrap"
          size="sm"
        >
          <ToggleGroupItem value="all" variant="brand">
            All
          </ToggleGroupItem>
          <ToggleGroupItem value="risk_detection" variant="error">
            <Icon icon={AlertTriangle} size="sm" className="inline mr-1" /> Risks
          </ToggleGroupItem>
          <ToggleGroupItem value="insight" variant="accent">
            <Icon icon={Lightbulb} size="sm" className="inline mr-1" /> Insights
          </ToggleGroupItem>
          <ToggleGroupItem value="sprint_planning" variant="success">
            <Icon icon={Calendar} size="sm" className="inline mr-1" /> Planning
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {!suggestions ? (
          <Flex direction="column" gap="md">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </Flex>
        ) : suggestions.length === 0 ? (
          <Flex align="center" justify="center" className="h-full text-center px-4">
            <div>
              <Icon icon={Target} size="xl" className="mx-auto mb-4 text-ui-text-tertiary" />
              <Typography variant="h5" className="mb-2">
                No Suggestions Yet
              </Typography>
              <Typography variant="muted" className="mb-4">
                Click "Generate AI Insights" to analyze your project and get AI-powered
                recommendations.
              </Typography>
            </div>
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
      </div>
    </Flex>
  );
});

// Sub-components

interface SuggestionCardProps {
  suggestion: Doc<"aiSuggestions">;
  onAccept: (id: Id<"aiSuggestions">) => void;
  onDismiss: (id: Id<"aiSuggestions">) => void;
}

const SuggestionCard = React.memo(function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: SuggestionCardProps) {
  const metadata = SUGGESTION_METADATA[suggestion.suggestionType as SuggestionType];

  return (
    <div className="bg-ui-bg border border-ui-border rounded-lg p-3 sm:p-4 shadow-card hover:shadow-card-hover transition-shadow">
      <Flex align="start" gap="md">
        <Icon icon={metadata?.icon || Lightbulb} size="lg" className="shrink-0" />
        <div className="flex-1 min-w-0">
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
              <span className="font-medium">Reasoning:</span> {suggestion.reasoning}
            </Typography>
          )}
          {suggestion.confidence !== undefined && (
            <div className="mt-2">
              <Flex align="center" gap="sm">
                <Typography variant="caption" color="tertiary">
                  Confidence:
                </Typography>
                <Progress value={suggestion.confidence * 100} className="flex-1 max-w-25" />
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
        </div>
      </Flex>
    </div>
  );
});
