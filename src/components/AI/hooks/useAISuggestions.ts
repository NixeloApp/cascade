/**
 * useAISuggestions Hook
 * Manages AI suggestions state and business logic
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import type { SuggestionType } from "../config";

export interface UseAISuggestionsOptions {
  projectId?: Id<"projects">;
}

export interface UseAISuggestionsReturn {
  // State
  isGenerating: boolean;
  selectedType: SuggestionType | undefined;

  // Data
  suggestions: Doc<"aiSuggestions">[] | undefined;
  unreadCount: number;

  // Actions
  setSelectedType: (type: SuggestionType | undefined) => void;
  handleGenerateInsights: () => Promise<void>;
  handleAcceptSuggestion: (suggestionId: Id<"aiSuggestions">) => Promise<void>;
  handleDismissSuggestion: (suggestionId: Id<"aiSuggestions">) => Promise<void>;
}

export function useAISuggestions({ projectId }: UseAISuggestionsOptions): UseAISuggestionsReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<SuggestionType | undefined>();

  const suggestions = useQuery(
    api.ai.queries.getProjectSuggestions,
    projectId ? { projectId, suggestionType: selectedType } : "skip",
  );

  const generateInsights = useAction(api.ai.actions.generateProjectInsights);
  const acceptSuggestion = useMutation(api.ai.mutations.acceptSuggestion);
  const dismissSuggestion = useMutation(api.ai.mutations.dismissSuggestion);

  const unreadCount =
    suggestions?.filter((s: Doc<"aiSuggestions">) => !(s.accepted || s.dismissed)).length || 0;

  async function handleGenerateInsights() {
    if (!projectId || isGenerating) return;

    setIsGenerating(true);
    try {
      await generateInsights({ projectId });
      toast.success("AI insights generated successfully!");
    } catch {
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAcceptSuggestion(suggestionId: Id<"aiSuggestions">) {
    try {
      await acceptSuggestion({ suggestionId });
      toast.success("Suggestion accepted");
    } catch {
      toast.error("Failed to accept suggestion");
    }
  }

  async function handleDismissSuggestion(suggestionId: Id<"aiSuggestions">) {
    try {
      await dismissSuggestion({ suggestionId });
      toast.success("Suggestion dismissed");
    } catch {
      toast.error("Failed to dismiss suggestion");
    }
  }

  return {
    // State
    isGenerating,
    selectedType,

    // Data
    suggestions,
    unreadCount,

    // Actions
    setSelectedType,
    handleGenerateInsights,
    handleAcceptSuggestion,
    handleDismissSuggestion,
  };
}
