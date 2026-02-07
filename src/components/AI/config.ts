/**
 * AI Components Configuration
 * Centralized constants, types, and configuration for AI features
 */

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Calendar, FileText, Lightbulb, Tag, User, Zap } from "@/lib/icons";

/**
 * Suggestion types as defined in schema
 */
export const SUGGESTION_TYPES = [
  "issue_description",
  "issue_priority",
  "issue_labels",
  "issue_assignee",
  "sprint_planning",
  "risk_detection",
  "insight",
] as const;

export type SuggestionType = (typeof SUGGESTION_TYPES)[number];

/**
 * UI Configuration Constants
 */
export const AI_CONFIG = {
  // Panel dimensions
  panel: {
    width: {
      mobile: "w-full",
      tablet: "sm:w-120",
      desktop: "md:w-130",
    },
    headerHeight: 140, // Used in calc(100vh - 140px)
  },

  // Animation durations (ms)
  animations: {
    tabTransition: 150,
    slideInOut: 300,
    copyFeedback: 2000,
  },

  // Floating button configuration
  button: {
    mobile: {
      size: 14, // w-14 h-14
      bottom: 6, // bottom-6
      right: 6, // right-6
    },
    desktop: {
      size: 16, // sm:w-16 sm:h-16
      bottom: 8, // sm:bottom-8
      right: 8, // sm:right-8
    },
  },

  // Textarea limits
  textarea: {
    minHeight: 44, // px
    maxHeight: 120, // px
  },

  // Message display
  message: {
    maxWidth: {
      mobile: "85%",
      desktop: "80%",
    },
  },

  // Badge limits
  badge: {
    maxCount: 9, // Show "9+" for counts > 9
  },
} as const;

/**
 * Suggestion type metadata
 */
export const SUGGESTION_METADATA: Record<
  SuggestionType,
  {
    icon: LucideIcon;
    label: string;
    color: string;
  }
> = {
  issue_description: {
    icon: FileText,
    label: "Issue Description",
    color: "info",
  },
  issue_priority: {
    icon: Zap,
    label: "Priority Suggestion",
    color: "warning",
  },
  issue_labels: {
    icon: Tag,
    label: "Label Suggestion",
    color: "accent",
  },
  issue_assignee: {
    icon: User,
    label: "Assignee Suggestion",
    color: "success",
  },
  sprint_planning: {
    icon: Calendar,
    label: "Sprint Planning",
    color: "brand",
  },
  risk_detection: {
    icon: AlertTriangle,
    label: "Risk Detected",
    color: "error",
  },
  insight: {
    icon: Lightbulb,
    label: "Project Insight",
    color: "warning",
  },
};

/**
 * Keyboard shortcuts
 */
export const AI_SHORTCUTS = {
  togglePanel: {
    key: "a",
    meta: true,
    shift: true,
    description: "Toggle AI assistant",
  },
  sendMessage: {
    key: "Enter",
    description: "Send message",
  },
  newLine: {
    key: "Enter",
    shift: true,
    description: "New line",
  },
} as const;
