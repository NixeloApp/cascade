/** Today marker line and badge for the roadmap timeline. */

import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";

interface RoadmapTodayMarkerProps {
  offsetPx: number;
  variant: "body" | "header";
}

/** Renders a vertical line with optional "Today" badge at the given pixel offset. */
export function RoadmapTodayMarker({ offsetPx, variant }: RoadmapTodayMarkerProps) {
  const markerTestId =
    variant === "header"
      ? TEST_IDS.ROADMAP.TODAY_MARKER_HEADER
      : TEST_IDS.ROADMAP.TODAY_MARKER_BODY;

  return (
    <div
      data-testid={markerTestId}
      className="pointer-events-none absolute top-0 bottom-0 z-20 w-0"
      style={{ left: `${offsetPx}px` }}
      aria-hidden="true"
    >
      {variant === "header" ? (
        <Badge
          variant="roadmapToday"
          shape="pill"
          className="absolute top-2 left-0 -translate-x-1/2"
        >
          Today
        </Badge>
      ) : null}
      <div
        className={cn(
          "absolute left-0 -translate-x-1/2 bg-status-error/80",
          variant === "header" ? "top-0 bottom-0 w-px" : "top-0 bottom-0 w-px",
        )}
      />
    </div>
  );
}

/** Conditionally render the today marker only when offset is non-null. */
export function renderRoadmapTodayMarker(offsetPx: number | null, variant: "body" | "header") {
  if (offsetPx === null) {
    return null;
  }
  return <RoadmapTodayMarker offsetPx={offsetPx} variant={variant} />;
}
