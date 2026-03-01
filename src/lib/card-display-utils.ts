/**
 * Card Display Utilities for Kanban Board
 *
 * Controls which properties are visible on issue cards.
 * Allows users to customize card density/information display.
 */

// =============================================================================
// Types
// =============================================================================

/** Available card display properties that can be toggled */
export interface CardDisplayOptions {
  /** Show issue labels */
  labels: boolean;
  /** Show assignee avatar */
  assignee: boolean;
  /** Show priority icon */
  priority: boolean;
  /** Show story points badge */
  storyPoints: boolean;
  /** Show issue type icon */
  issueType: boolean;
}

/** Keys of toggleable card properties */
export type CardDisplayProperty = keyof CardDisplayOptions;

// =============================================================================
// Constants
// =============================================================================

/** Default display options - show all properties */
export const DEFAULT_CARD_DISPLAY: CardDisplayOptions = {
  labels: true,
  assignee: true,
  priority: true,
  storyPoints: true,
  issueType: true,
};

/** Display property labels for UI */
export const CARD_DISPLAY_LABELS: Record<CardDisplayProperty, string> = {
  labels: "Labels",
  assignee: "Assignee",
  priority: "Priority",
  storyPoints: "Story Points",
  issueType: "Issue Type",
};

/** Display property descriptions */
export const CARD_DISPLAY_DESCRIPTIONS: Record<CardDisplayProperty, string> = {
  labels: "Show label badges on cards",
  assignee: "Show assignee avatar on cards",
  priority: "Show priority icon on cards",
  storyPoints: "Show story points badge on cards",
  issueType: "Show issue type icon on cards",
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get all available card display properties
 */
export function getCardDisplayProperties(): CardDisplayProperty[] {
  return ["issueType", "priority", "labels", "assignee", "storyPoints"];
}

/**
 * Count how many properties are visible
 */
export function countVisibleProperties(options: CardDisplayOptions): number {
  return Object.values(options).filter(Boolean).length;
}

/**
 * Check if all properties are visible
 */
export function areAllPropertiesVisible(options: CardDisplayOptions): boolean {
  return Object.values(options).every(Boolean);
}

/**
 * Check if any property is hidden
 */
export function hasHiddenProperties(options: CardDisplayOptions): boolean {
  return Object.values(options).some((v) => !v);
}

/**
 * Toggle a single property
 */
export function toggleProperty(
  options: CardDisplayOptions,
  property: CardDisplayProperty,
): CardDisplayOptions {
  return {
    ...options,
    [property]: !options[property],
  };
}

/**
 * Show all properties
 */
export function showAllProperties(): CardDisplayOptions {
  return { ...DEFAULT_CARD_DISPLAY };
}

/**
 * Hide all optional properties (keep issue type for identification)
 */
export function showMinimalProperties(): CardDisplayOptions {
  return {
    labels: false,
    assignee: false,
    priority: false,
    storyPoints: false,
    issueType: true, // Always keep type icon for identification
  };
}
