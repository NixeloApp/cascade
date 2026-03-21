/**
 * Calendar Color System
 *
 * Color constants and utilities for calendar events.
 * Provides event card, badge, and picker styling maps.
 * Uses semantic palette tokens for consistent theming.
 */

import type { Doc } from "@convex/_generated/dataModel";

// Derive palette color type from the schema — single source of truth
export type EventColor = NonNullable<Doc<"calendarEvents">["color"]>;

export const PALETTE_COLORS: EventColor[] = [
  "blue",
  "red",
  "green",
  "amber",
  "orange",
  "purple",
  "pink",
  "teal",
  "indigo",
  "gray",
];

function isEventColor(value: string | null | undefined): value is EventColor {
  return !!value && PALETTE_COLORS.includes(value as EventColor);
}

export const EVENT_TYPE_DEFAULT_COLOR: Record<string, EventColor> = {
  meeting: "blue",
  deadline: "red",
  timeblock: "green",
  personal: "purple",
};

/** Full event card styling: bg, hover, border, text.
 *  Solid colored backgrounds with white text (Google Calendar pattern).
 *  Amber uses dark text for contrast on its light-colored background. */
export const EVENT_COLOR_CLASSES: Record<
  EventColor,
  { bg: string; hover: string; border: string; text: string }
> = {
  blue: {
    bg: "bg-palette-blue-solid",
    hover: "hover:bg-palette-blue-solid/85",
    border: "",
    text: "text-white",
  },
  red: {
    bg: "bg-palette-red-solid",
    hover: "hover:bg-palette-red-solid/85",
    border: "",
    text: "text-white",
  },
  green: {
    bg: "bg-palette-green-solid",
    hover: "hover:bg-palette-green-solid/85",
    border: "",
    text: "text-white",
  },
  amber: {
    bg: "bg-palette-amber-solid",
    hover: "hover:bg-palette-amber-solid/85",
    border: "",
    text: "text-ui-text",
  },
  orange: {
    bg: "bg-palette-orange-solid",
    hover: "hover:bg-palette-orange-solid/85",
    border: "",
    text: "text-white",
  },
  purple: {
    bg: "bg-palette-purple-solid",
    hover: "hover:bg-palette-purple-solid/85",
    border: "",
    text: "text-white",
  },
  pink: {
    bg: "bg-palette-pink-solid",
    hover: "hover:bg-palette-pink-solid/85",
    border: "",
    text: "text-white",
  },
  teal: {
    bg: "bg-palette-teal-solid",
    hover: "hover:bg-palette-teal-solid/85",
    border: "",
    text: "text-white",
  },
  indigo: {
    bg: "bg-palette-indigo-solid",
    hover: "hover:bg-palette-indigo-solid/85",
    border: "",
    text: "text-white",
  },
  gray: {
    bg: "bg-palette-gray-solid",
    hover: "hover:bg-palette-gray-solid/85",
    border: "",
    text: "text-white",
  },
};

/** Color picker styling: bg swatch + selection ring */
export const COLOR_PICKER_CLASSES: Record<EventColor, { bg: string; ring: string }> = {
  blue: { bg: "bg-palette-blue", ring: "ring-palette-blue" },
  red: { bg: "bg-palette-red", ring: "ring-palette-red" },
  green: { bg: "bg-palette-green", ring: "ring-palette-green" },
  amber: { bg: "bg-palette-amber", ring: "ring-palette-amber" },
  orange: { bg: "bg-palette-orange", ring: "ring-palette-orange" },
  purple: { bg: "bg-palette-purple", ring: "ring-palette-purple" },
  pink: { bg: "bg-palette-pink", ring: "ring-palette-pink" },
  teal: { bg: "bg-palette-teal", ring: "ring-palette-teal" },
  indigo: { bg: "bg-palette-indigo", ring: "ring-palette-indigo" },
  gray: { bg: "bg-palette-gray", ring: "ring-palette-gray" },
};

function resolveEventColor(color?: string | null, eventType?: string): EventColor {
  if (isEventColor(color)) {
    return color;
  }

  const defaultColor = eventType ? EVENT_TYPE_DEFAULT_COLOR[eventType] : undefined;
  return isEventColor(defaultColor) ? defaultColor : "blue";
}

function getEventBadgeClassByColor(color: EventColor): string {
  switch (color) {
    case "blue":
      return "bg-palette-blue-bg text-palette-blue-text";
    case "red":
      return "bg-palette-red-bg text-palette-red-text";
    case "green":
      return "bg-palette-green-bg text-palette-green-text";
    case "amber":
      return "bg-palette-amber-bg text-palette-amber-text";
    case "orange":
      return "bg-palette-orange-bg text-palette-orange-text";
    case "purple":
      return "bg-palette-purple-bg text-palette-purple-text";
    case "pink":
      return "bg-palette-pink-bg text-palette-pink-text";
    case "teal":
      return "bg-palette-teal-bg text-palette-teal-text";
    case "indigo":
      return "bg-palette-indigo-bg text-palette-indigo-text";
    case "gray":
      return "bg-palette-gray-bg text-palette-gray-text";
  }
}

function getDotColorClassByColor(color: EventColor): string {
  switch (color) {
    case "blue":
      return "bg-palette-blue";
    case "red":
      return "bg-palette-red";
    case "green":
      return "bg-palette-green";
    case "amber":
      return "bg-palette-amber";
    case "orange":
      return "bg-palette-orange";
    case "purple":
      return "bg-palette-purple";
    case "pink":
      return "bg-palette-pink";
    case "teal":
      return "bg-palette-teal";
    case "indigo":
      return "bg-palette-indigo";
    case "gray":
      return "bg-palette-gray";
  }
}

/**
 * Returns Tailwind classes for a calendar event card based on color.
 * Defaults to blue if color is invalid.
 */
export function getEventColorClasses(color: string): {
  bg: string;
  hover: string;
  border: string;
  text: string;
} {
  return EVENT_COLOR_CLASSES[resolveEventColor(color)] ?? EVENT_COLOR_CLASSES.blue;
}

/**
 * Returns badge class for an event, resolving type-based defaults.
 * Falls back to type default color if no color specified.
 */
export function getEventBadgeClass(eventType: string, color?: string | null): string {
  return getEventBadgeClassByColor(resolveEventColor(color, eventType));
}

/** Returns the dot color class for compact calendar indicators. */
export function getDotColorClass(color: string): string {
  return getDotColorClassByColor(resolveEventColor(color));
}
