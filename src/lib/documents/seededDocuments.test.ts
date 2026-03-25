import { describe, expect, it } from "vitest";
import { getInitialValue, proseMirrorSnapshotToValue } from "@/lib/plate/editor";
import { blockNoteContentToPlateValue, serializePlateSeedValue } from "./seededDocuments";

describe("blockNoteContentToPlateValue", () => {
  it("converts headings, formatted paragraphs, grouped lists, and checklist items", () => {
    const value = blockNoteContentToPlateValue([
      {
        type: "heading",
        props: { level: 1 },
        content: [{ type: "text", text: "Meeting Notes" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", styles: { bold: true }, text: "Date: " },
          { type: "text", text: "Mar 24, 2026" },
        ],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Agenda item" }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Second item" }],
      },
      {
        type: "numberedListItem",
        content: [{ type: "text", text: "First step" }],
      },
      {
        type: "checkListItem",
        props: { checked: true },
        content: [{ type: "text", text: "Send recap" }],
      },
    ]);

    expect(value).toEqual([
      { type: "h1", children: [{ text: "Meeting Notes" }] },
      {
        type: "p",
        children: [{ text: "Date: ", bold: true }, { text: "Mar 24, 2026" }],
      },
      {
        type: "ul",
        children: [
          { type: "li", children: [{ text: "Agenda item" }] },
          { type: "li", children: [{ text: "Second item" }] },
        ],
      },
      {
        type: "ol",
        children: [{ type: "li", children: [{ text: "First step" }] }],
      },
      {
        type: "todo_li",
        checked: true,
        children: [{ text: "Send recap" }],
      },
    ]);
  });

  it("preserves nested child blocks inside list items", () => {
    const value = blockNoteContentToPlateValue([
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Parent item" }],
        children: [
          {
            type: "bulletListItem",
            content: [{ type: "text", text: "Nested item" }],
          },
        ],
      },
    ]);

    expect(value).toEqual([
      {
        type: "ul",
        children: [
          {
            type: "li",
            children: [
              { text: "Parent item" },
              {
                type: "ul",
                children: [{ type: "li", children: [{ text: "Nested item" }] }],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("falls back to the shared empty value for invalid content", () => {
    expect(blockNoteContentToPlateValue(null)).toEqual(getInitialValue());
    expect(blockNoteContentToPlateValue([])).toEqual(getInitialValue());
  });
});

describe("serializePlateSeedValue", () => {
  it("serializes a seeded value into a ProseMirror snapshot string", () => {
    const serialized = serializePlateSeedValue([
      { type: "h2", children: [{ text: "Weekly Sync" }] },
      { type: "p", children: [{ text: "Summary text" }] },
    ]);

    expect(proseMirrorSnapshotToValue(JSON.parse(serialized))).toEqual([
      { type: "h2", children: [{ text: "Weekly Sync" }] },
      { type: "p", children: [{ text: "Summary text" }] },
    ]);
  });
});
