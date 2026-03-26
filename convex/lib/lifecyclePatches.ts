/**
 * Build the terminal completion fields for a successfully finished enrollment.
 */
export function buildCompletedEnrollmentPatch(
  completedAt: number,
  currentStep?: number,
): {
  status: "completed";
  completedAt: number;
  nextSendAt: undefined;
  currentStep?: number;
} {
  return currentStep === undefined
    ? {
        status: "completed",
        completedAt,
        nextSendAt: undefined,
      }
    : {
        currentStep,
        status: "completed",
        completedAt,
        nextSendAt: undefined,
      };
}

/**
 * Build the terminal-state fields for replied, bounced, or unsubscribed enrollments.
 */
export function buildTerminalEnrollmentPatch(
  reason: "replied" | "bounced" | "unsubscribed",
  completedAt: number,
): {
  status: "replied" | "bounced" | "unsubscribed";
  completedAt: number;
  nextSendAt: undefined;
  lastRepliedAt?: number;
} {
  return reason === "replied"
    ? {
        status: reason,
        completedAt,
        nextSendAt: undefined,
        lastRepliedAt: completedAt,
      }
    : {
        status: reason,
        completedAt,
        nextSendAt: undefined,
      };
}
