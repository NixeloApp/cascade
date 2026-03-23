import { describe, expect, it } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { RoadmapTodayMarker, renderRoadmapTodayMarker } from "./RoadmapTodayMarker";

describe("RoadmapTodayMarker", () => {
  it("renders the header variant with a Today badge", () => {
    render(<RoadmapTodayMarker offsetPx={100} variant="header" />);
    expect(screen.getByTestId(TEST_IDS.ROADMAP.TODAY_MARKER_HEADER)).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders the body variant without a badge", () => {
    render(<RoadmapTodayMarker offsetPx={200} variant="body" />);
    expect(screen.getByTestId(TEST_IDS.ROADMAP.TODAY_MARKER_BODY)).toBeInTheDocument();
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
  });

  it("returns null from renderRoadmapTodayMarker when offset is null", () => {
    const result = renderRoadmapTodayMarker(null, "header");
    expect(result).toBeNull();
  });
});
