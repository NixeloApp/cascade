import { DAY, HOUR } from "@convex/lib/timeUtils";
import type { Value } from "platejs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setDocumentHeadingAnchorElement } from "@/lib/documents/headingAnchors";
import { fireEvent, render, screen } from "@/test/custom-render";
import { DocumentSidebar } from "./DocumentSidebar";

const fixedNow = new Date("2026-03-14T12:00:00Z");

const documentInfo = {
  creatorName: "Taylor Rivera",
  createdAt: fixedNow.getTime() - DAY,
  updatedAt: fixedNow.getTime() - 2 * HOUR,
  isPublic: true,
  isArchived: true,
  projectName: "Atlas",
};

const editorValue: Value = [
  {
    type: "h1",
    id: "overview",
    children: [{ text: "Overview" }],
  },
  {
    type: "p",
    children: [{ text: "Paragraph content" }],
  },
  {
    type: "h2",
    id: "next-steps",
    children: [{ text: "Next Steps" }],
  },
];

describe("DocumentSidebar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the collapsed toggle when closed", () => {
    const onToggle = vi.fn();

    render(
      <DocumentSidebar
        editorValue={editorValue}
        documentInfo={documentInfo}
        isOpen={false}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open document sidebar" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Document")).not.toBeInTheDocument();
  });

  it("renders document metadata and heading navigation when open", () => {
    const onHeadingClick = vi.fn();
    const scrollIntoView = vi.fn();
    const targetHeading = document.createElement("div");
    targetHeading.scrollIntoView = scrollIntoView;
    setDocumentHeadingAnchorElement("next-steps", targetHeading);

    render(
      <DocumentSidebar
        editorValue={editorValue}
        documentInfo={documentInfo}
        isOpen={true}
        onToggle={vi.fn()}
        onHeadingClick={onHeadingClick}
      />,
    );

    expect(screen.getByText("Taylor Rivera")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.getByText("Atlas")).toBeInTheDocument();
    expect(screen.queryByText("Paragraph content")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Overview/ })).toHaveStyle({ paddingLeft: "8px" });
    expect(screen.getByRole("button", { name: /Next Steps/ })).toHaveStyle({ paddingLeft: "20px" });

    fireEvent.click(screen.getByRole("button", { name: /Next Steps/ }));

    expect(onHeadingClick).toHaveBeenCalledWith("next-steps");
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    setDocumentHeadingAnchorElement("next-steps", null);
  });

  it("shows the empty contents state when no headings exist", () => {
    const noHeadingValue: Value = [
      {
        type: "p",
        children: [{ text: "Body only" }],
      },
    ];

    render(
      <DocumentSidebar
        editorValue={noHeadingValue}
        documentInfo={{
          ...documentInfo,
          isPublic: false,
          isArchived: false,
          projectName: undefined,
        }}
        isOpen={true}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText("No headings found")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.queryByText("Archived")).not.toBeInTheDocument();
    expect(screen.queryByText("Atlas")).not.toBeInTheDocument();
  });

  it("applies the maximum supported toc indent for deepest headings", () => {
    const deepHeadingValue: Value = [
      {
        type: "h6",
        id: "max-depth",
        children: [{ text: "Max Heading" }],
      },
    ];

    render(
      <DocumentSidebar
        editorValue={deepHeadingValue}
        documentInfo={documentInfo}
        isOpen={true}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Max Heading/ })).toHaveStyle({
      paddingLeft: "68px",
    });
  });
});
