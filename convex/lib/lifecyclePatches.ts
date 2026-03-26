import type { Id } from "../_generated/dataModel";

/**
 * Build archive-state fields for records that track only `isArchived` and `archivedAt`.
 */
export function buildArchivedStatePatch(archivedAt: number): {
  isArchived: true;
  archivedAt: number;
} {
  return {
    isArchived: true,
    archivedAt,
  };
}

/**
 * Build archive-state fields for records that also track the archiving user.
 */
export function buildArchivedStatePatchWithActor(
  archivedAt: number,
  archivedBy: Id<"users">,
): {
  isArchived: true;
  archivedAt: number;
  archivedBy: Id<"users">;
} {
  return {
    isArchived: true,
    archivedAt,
    archivedBy,
  };
}

/**
 * Clear archive-state fields for records without `archivedBy`.
 */
export function buildRestoredArchiveStatePatch(): {
  isArchived: undefined;
  archivedAt: undefined;
} {
  return {
    isArchived: undefined,
    archivedAt: undefined,
  };
}

/**
 * Clear archive-state fields for records that also track `archivedBy`.
 */
export function buildRestoredArchiveStatePatchWithActor(): {
  isArchived: undefined;
  archivedAt: undefined;
  archivedBy: undefined;
} {
  return {
    isArchived: undefined,
    archivedAt: undefined,
    archivedBy: undefined,
  };
}

/**
 * Build the archive fields for issue records.
 */
export function buildIssueArchivePatch(
  archivedAt: number,
  archivedBy?: Id<"users">,
): { archivedAt: number; archivedBy?: Id<"users"> } {
  return archivedBy === undefined
    ? {
        archivedAt,
      }
    : {
        archivedAt,
        archivedBy,
      };
}

/**
 * Clear the archive fields for issue records.
 */
export function buildIssueRestorePatch(): {
  archivedAt: undefined;
  archivedBy: undefined;
} {
  return {
    archivedAt: undefined,
    archivedBy: undefined,
  };
}

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
