/**
 * Sprint duration presets for quick sprint setup.
 * Nixelo advantage: Plane requires manual date entry, we offer presets.
 */

export type SprintDurationPreset = {
  id: string;
  label: string;
  days: number;
  description: string;
};

export const SPRINT_DURATION_PRESETS: SprintDurationPreset[] = [
  {
    id: "1-week",
    label: "1 Week",
    days: 7,
    description: "Short iteration for rapid delivery",
  },
  {
    id: "2-week",
    label: "2 Weeks",
    days: 14,
    description: "Standard sprint duration",
  },
  {
    id: "3-week",
    label: "3 Weeks",
    days: 21,
    description: "Extended sprint for larger features",
  },
  {
    id: "4-week",
    label: "4 Weeks",
    days: 28,
    description: "Monthly iteration cycle",
  },
  {
    id: "custom",
    label: "Custom",
    days: 0,
    description: "Set custom start and end dates",
  },
];

export const DEFAULT_SPRINT_PRESET = "2-week";

/**
 * Calculate end date from start date and preset duration
 */
export function calculateEndDate(startDate: Date | number, presetId: string): Date {
  const preset = SPRINT_DURATION_PRESETS.find((p) => p.id === presetId);
  const days = preset?.days ?? 14;
  const start = typeof startDate === "number" ? new Date(startDate) : startDate;
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return end;
}

/**
 * Get preset by ID
 */
export function getSprintPreset(presetId: string): SprintDurationPreset | undefined {
  return SPRINT_DURATION_PRESETS.find((p) => p.id === presetId);
}

/**
 * Format duration in human-readable form
 */
export function formatSprintDuration(days: number): string {
  if (days === 7) return "1 week";
  if (days === 14) return "2 weeks";
  if (days === 21) return "3 weeks";
  if (days === 28) return "4 weeks";
  return `${days} days`;
}
