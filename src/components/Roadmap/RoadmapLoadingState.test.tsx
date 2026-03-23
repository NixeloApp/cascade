import { describe, expect, it } from "vitest";
import { render } from "@/test/custom-render";
import { RoadmapLoadingState } from "./RoadmapLoadingState";

describe("RoadmapLoadingState", () => {
  it("renders without crashing", () => {
    const { container } = render(<RoadmapLoadingState />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
