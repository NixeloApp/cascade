import { describe, expect, it } from "vitest";
import { getInitialValue, proseMirrorSnapshotToValue } from "./editor";

describe("proseMirrorSnapshotToValue", () => {
  it("converts headings and paragraphs into plate value", () => {
    const value = proseMirrorSnapshotToValue({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Retrospective" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "We shipped the auth refresh." }],
        },
      ],
    });

    expect(value).toEqual([
      {
        type: "h2",
        children: [{ text: "Retrospective" }],
      },
      {
        type: "p",
        children: [{ text: "We shipped the auth refresh." }],
      },
    ]);
  });

  it("preserves common text marks", () => {
    const value = proseMirrorSnapshotToValue({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Bold", marks: [{ type: "bold" }] },
            { type: "text", text: " and " },
            { type: "text", text: "italic", marks: [{ type: "italic" }] },
          ],
        },
      ],
    });

    expect(value).toEqual([
      {
        type: "p",
        children: [
          { text: "Bold", bold: true },
          { text: " and " },
          { text: "italic", italic: true },
        ],
      },
    ]);
  });

  it("falls back to the shared empty value for invalid snapshots", () => {
    expect(proseMirrorSnapshotToValue(null)).toEqual(getInitialValue());
    expect(proseMirrorSnapshotToValue({ type: "paragraph" })).toEqual(getInitialValue());
  });
});
