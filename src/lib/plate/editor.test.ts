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

  it("preserves inline elements inside paragraphs through round-trip", () => {
    const snapshot = plateValueToProseMirrorSnapshot([
      {
        type: "p",
        children: [
          { text: "Click " },
          { type: "a", url: "https://example.com", children: [{ text: "here" }] },
          { text: " or mention " },
          { type: "mention", value: "user-1", children: [{ text: "@bob" }] },
        ],
      },
    ] as const);

    // Inline elements should be preserved, not flattened to plain text
    const paragraphContent = snapshot.content?.[0].content ?? [];
    const linkNode = paragraphContent.find((n) => n.type === "a");
    expect(linkNode?.type).toBe("a");
    expect(linkNode?.attrs?.url).toBe("https://example.com");

    const mentionNode = paragraphContent.find((n) => n.type === "mention");
    expect(mentionNode?.type).toBe("mention");

    // Round-trip back to Plate
    const restored = proseMirrorSnapshotToValue(snapshot);
    expect(restored).toHaveLength(1);
    const p = restored[0] as Record<string, unknown>;
    expect(p.type).toBe("p");
    const children = p.children as Array<Record<string, unknown>>;
    const restoredLink = children.find((c) => c.type === "a");
    expect(restoredLink?.type).toBe("a");
    expect(restoredLink?.url).toBe("https://example.com");
    const restoredMention = children.find((c) => c.type === "mention");
    expect(restoredMention?.type).toBe("mention");
    expect(restoredMention?.value).toBe("user-1");
  });

  it("preserves table elements through round-trip", () => {
    const snapshot = plateValueToProseMirrorSnapshot([
      {
        type: "table",
        children: [
          {
            type: "tr",
            children: [{ type: "th", children: [{ type: "p", children: [{ text: "Header" }] }] }],
          },
          {
            type: "tr",
            children: [{ type: "td", children: [{ type: "p", children: [{ text: "Cell" }] }] }],
          },
        ],
      },
    ] as const);
    expect(snapshot.content?.[0].type).toBe("table");

    const restored = proseMirrorSnapshotToValue(snapshot);
    expect(restored).toHaveLength(1);
    expect((restored[0] as Record<string, unknown>).type).toBe("table");
  });

  it("preserves image elements through round-trip", () => {
    const snapshot = plateValueToProseMirrorSnapshot([
      {
        type: "img",
        url: "https://example.com/photo.png",
        alt: "A photo",
        children: [{ text: "" }],
      },
    ] as const);
    expect(snapshot.content?.[0].type).toBe("image");
    expect(snapshot.content?.[0].attrs?.src).toBe("https://example.com/photo.png");

    const restored = proseMirrorSnapshotToValue(snapshot);
    expect(restored).toHaveLength(1);
    const img = restored[0] as Record<string, unknown>;
    expect(img.type).toBe("img");
    expect(img.url).toBe("https://example.com/photo.png");
  });

  it("preserves unknown element types via passthrough instead of flattening", () => {
    const snapshot = plateValueToProseMirrorSnapshot([
      {
        type: "mention",
        value: "user-123",
        children: [{ text: "@alice" }],
      },
    ] as const);
    expect(snapshot.content?.[0].type).toBe("mention");

    const restored = proseMirrorSnapshotToValue(snapshot);
    expect(restored).toHaveLength(1);
    const mention = restored[0] as Record<string, unknown>;
    expect(mention.type).toBe("mention");
    expect(mention.value).toBe("user-123");
    // Children must be proper Plate text leaves, not ProseMirror element objects
    expect(mention.children).toEqual([{ text: "@alice" }]);
  });
});
