import { describe, expect, it } from "vitest";
import { render } from "@/test/custom-render";
import { RoadmapLoadingState } from "./RoadmapLoadingState";

describe("RoadmapLoadingState", () => {
  it("renders skeleton layout", () => {
    const { container } = render(<RoadmapLoadingState />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).not.toBeEmptyDOMElement();
  });
});
