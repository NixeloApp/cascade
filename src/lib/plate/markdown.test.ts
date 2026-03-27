import type { Value } from "platejs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  markdownToValue,
  stripFrontmatter,
  triggerMarkdownImport,
  valueToMarkdown,
} from "./markdown";
import { NODE_TYPES } from "./plugins";

describe("Plate Markdown utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("stripFrontmatter", () => {
    it("removes YAML frontmatter from markdown", () => {
      const markdown = `---
title: Test Doc
date: 2024-01-01
---

# Hello World`;
      const result = stripFrontmatter(markdown);
      expect(result).toBe("# Hello World");
    });

    it("returns unchanged text when no frontmatter", () => {
      const markdown = "# Hello World\n\nSome content.";
      const result = stripFrontmatter(markdown);
      expect(result).toBe(markdown);
    });
  });

  describe("triggerMarkdownImport", () => {
    it("opens the markdown file picker", () => {
      const onSelect = vi.fn();
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});

      triggerMarkdownImport(onSelect);

      expect(clickSpy).toHaveBeenCalledOnce();
      expect(onSelect).not.toHaveBeenCalled();

      clickSpy.mockRestore();
    });
  });

  describe("markdownToValue", () => {
    it("parses headings", () => {
      const markdown = "# Heading 1\n\n## Heading 2\n\n### Heading 3";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(3);
      expect(value[0]).toMatchObject({ type: NODE_TYPES.heading1 });
      expect(value[1]).toMatchObject({ type: NODE_TYPES.heading2 });
      expect(value[2]).toMatchObject({ type: NODE_TYPES.heading3 });
    });

    it("parses paragraphs", () => {
      const markdown = "First paragraph.\n\nSecond paragraph.";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(2);
      expect(value[0]).toMatchObject({ type: NODE_TYPES.paragraph });
      expect(value[1]).toMatchObject({ type: NODE_TYPES.paragraph });
    });

    it("parses bullet list items", () => {
      const markdown = "- Item 1\n- Item 2\n- Item 3";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(3);
      value.forEach((node) => {
        expect(node).toMatchObject({ type: NODE_TYPES.listItem });
      });
    });

    it("parses numbered list items", () => {
      const markdown = "1. First\n2. Second\n3. Third";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(3);
    });

    it("parses checklist items", () => {
      const markdown = "- [ ] Unchecked\n- [x] Checked";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(2);
      expect(value[0]).toMatchObject({
        type: NODE_TYPES.todoList,
        checked: false,
      });
      expect(value[1]).toMatchObject({
        type: NODE_TYPES.todoList,
        checked: true,
      });
    });

    it("parses blockquotes", () => {
      const markdown = "> This is a quote";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(1);
      expect(value[0]).toMatchObject({ type: NODE_TYPES.blockquote });
    });

    it("parses code blocks", () => {
      const markdown = "```typescript\nconst x = 1;\n```";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(1);
      expect(value[0]).toMatchObject({
        type: NODE_TYPES.codeBlock,
        language: "typescript",
      });
    });

    it("parses images", () => {
      const markdown = "![Alt text](https://example.com/image.png)";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(1);
      expect(value[0]).toMatchObject({
        type: NODE_TYPES.image,
        url: "https://example.com/image.png",
      });
    });

    it("parses tables", () => {
      const markdown = "| A | B |\n| --- | --- |\n| 1 | 2 |";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(1);
      expect(value[0]).toMatchObject({ type: NODE_TYPES.table });
    });

    it("parses inline bold text", () => {
      const markdown = "This is **bold** text.";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(1);
      const children = (value[0] as { children: unknown[] }).children;
      expect(children).toContainEqual(expect.objectContaining({ text: "bold", bold: true }));
    });

    it("parses inline italic text", () => {
      const markdown = "This is *italic* text.";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(1);
      const children = (value[0] as { children: unknown[] }).children;
      expect(children).toContainEqual(expect.objectContaining({ text: "italic", italic: true }));
    });

    it("parses inline code", () => {
      const markdown = "This is `code` text.";
      const value = markdownToValue(markdown);

      expect(value).toHaveLength(1);
      const children = (value[0] as { children: unknown[] }).children;
      expect(children).toContainEqual(expect.objectContaining({ text: "code", code: true }));
    });

    it("returns empty paragraph for empty markdown", () => {
      const value = markdownToValue("");
      expect(value).toHaveLength(1);
      expect(value[0]).toMatchObject({ type: NODE_TYPES.paragraph });
    });
  });

  describe("valueToMarkdown", () => {
    it("converts headings to markdown", () => {
      const value: Value = [
        { type: NODE_TYPES.heading1, children: [{ text: "H1" }] },
        { type: NODE_TYPES.heading2, children: [{ text: "H2" }] },
        { type: NODE_TYPES.heading3, children: [{ text: "H3" }] },
      ];
      const markdown = valueToMarkdown(value);

      expect(markdown).toContain("# H1");
      expect(markdown).toContain("## H2");
      expect(markdown).toContain("### H3");
    });

    it("converts paragraphs to markdown", () => {
      const value: Value = [{ type: NODE_TYPES.paragraph, children: [{ text: "Hello world" }] }];
      const markdown = valueToMarkdown(value);

      expect(markdown).toBe("Hello world");
    });

    it("converts bold text to markdown", () => {
      const value: Value = [
        {
          type: NODE_TYPES.paragraph,
          children: [{ text: "This is " }, { text: "bold", bold: true }, { text: " text" }],
        },
      ];
      const markdown = valueToMarkdown(value);

      expect(markdown).toBe("This is **bold** text");
    });

    it("converts italic text to markdown", () => {
      const value: Value = [
        {
          type: NODE_TYPES.paragraph,
          children: [{ text: "This is " }, { text: "italic", italic: true }, { text: " text" }],
        },
      ];
      const markdown = valueToMarkdown(value);

      expect(markdown).toBe("This is *italic* text");
    });

    it("converts code to markdown", () => {
      const value: Value = [
        {
          type: NODE_TYPES.paragraph,
          children: [{ text: "This is " }, { text: "code", code: true }, { text: " text" }],
        },
      ];
      const markdown = valueToMarkdown(value);

      expect(markdown).toBe("This is `code` text");
    });

    it("converts blockquotes to markdown", () => {
      const value: Value = [
        {
          type: NODE_TYPES.blockquote,
          children: [{ text: "A quote" }],
        },
      ];
      const markdown = valueToMarkdown(value);

      expect(markdown).toBe("> A quote");
    });

    it("converts code blocks to markdown", () => {
      const value: Value = [
        {
          type: NODE_TYPES.codeBlock,
          language: "javascript",
          children: [
            {
              type: NODE_TYPES.codeLine,
              children: [{ text: "const x = 1;" }],
            },
          ],
        },
      ];
      const markdown = valueToMarkdown(value);

      expect(markdown).toContain("```javascript");
      expect(markdown).toContain("const x = 1;");
      expect(markdown).toContain("```");
    });

    it("converts images to markdown", () => {
      const value: Value = [
        {
          type: NODE_TYPES.image,
          url: "https://example.com/img.png",
          children: [{ text: "" }],
        },
      ];
      const markdown = valueToMarkdown(value);

      expect(markdown).toBe("![](https://example.com/img.png)");
    });
  });

  describe("round-trip conversion", () => {
    it("preserves basic structure in round-trip", () => {
      const originalMarkdown = `# Title

This is a paragraph.

- Bullet 1
- Bullet 2

> A quote`;

      const value = markdownToValue(originalMarkdown);
      const resultMarkdown = valueToMarkdown(value);

      // Should contain the same essential content
      expect(resultMarkdown).toContain("# Title");
      expect(resultMarkdown).toContain("This is a paragraph");
      expect(resultMarkdown).toContain("> A quote");
    });

    it("preserves code blocks in round-trip", () => {
      const originalMarkdown = "```typescript\nconst x: number = 42;\n```";

      const value = markdownToValue(originalMarkdown);
      const resultMarkdown = valueToMarkdown(value);

      expect(resultMarkdown).toContain("```typescript");
      expect(resultMarkdown).toContain("const x: number = 42;");
    });
  });
});
