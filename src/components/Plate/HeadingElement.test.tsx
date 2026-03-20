import type { ComponentProps, ReactNode } from "react";
import { getDocumentHeadingAnchorId } from "@/lib/documents/headingAnchors";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { HeadingElement } from "./HeadingElement";

function renderHeadingElement({
  children = "Overview",
  ...props
}: Partial<ComponentProps<typeof HeadingElement>> & { children?: ReactNode }) {
  const headingProps = {
    attributes: {},
    children,
    element: { type: "h2", id: "overview", children: [{ text: "Overview" }] },
    editor: {},
    path: [0],
    ...props,
  } as ComponentProps<typeof HeadingElement>;

  return render(<HeadingElement {...headingProps} />);
}

describe("HeadingElement", () => {
  it("renders document headings with an owned anchor id and test id", () => {
    renderHeadingElement({});

    const heading = screen.getByRole("heading", { level: 2, name: "Overview" });

    expect(heading).toHaveAttribute("id", getDocumentHeadingAnchorId("overview"));
    expect(heading).toHaveAttribute("data-testid", TEST_IDS.DOCUMENT.HEADING_ANCHOR);
  });

  it("omits the anchor contract when the heading node has no id", () => {
    renderHeadingElement({
      element: {
        type: "h3",
        children: [{ text: "Untitled Section" }],
      },
      children: "Untitled Section",
    });

    const heading = screen.getByRole("heading", { level: 3, name: "Untitled Section" });

    expect(heading).not.toHaveAttribute("id");
    expect(heading).not.toHaveAttribute("data-testid");
  });
});
