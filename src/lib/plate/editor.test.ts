import { describe, expect, it } from "vitest";
import {
  getInitialValue,
  plateValueToProseMirrorSnapshot,
  proseMirrorSnapshotToValue,
} from "./editor";

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

describe("plateValueToProseMirrorSnapshot", () => {
  it("serializes headings, paragraphs, and inline marks", () => {
    expect(
      plateValueToProseMirrorSnapshot([
        {
          type: "h3",
          children: [{ text: "Weekly Sync" }],
        },
        {
          type: "p",
          children: [
            { text: "Bold", bold: true },
            { text: " and " },
            { text: "italic", italic: true },
          ],
        },
      ] as const),
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Weekly Sync" }],
        },
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
  });

  it("serializes lists and code blocks into ProseMirror structure", () => {
    expect(
      plateValueToProseMirrorSnapshot([
        {
          type: "ul",
          children: [
            {
              type: "li",
              children: [{ text: "First item" }],
            },
            {
              type: "li",
              children: [{ text: "Second item" }],
            },
          ],
        },
        {
          type: "code_block",
          children: [
            {
              type: "code_line",
              children: [{ text: "const ready = true;" }],
            },
            {
              type: "code_line",
              children: [{ text: "return ready;" }],
            },
          ],
        },
      ] as const),
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "First item" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Second item" }],
                },
              ],
            },
          ],
        },
        {
          type: "codeBlock",
          content: [
            { type: "text", text: "const ready = true;" },
            { type: "hardBreak" },
            { type: "text", text: "return ready;" },
          ],
        },
      ],
    });
  });
});
