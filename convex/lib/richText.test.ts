import { describe, expect, it } from "vitest";
import { getPlainTextFromDescription, normalizeIssueDescriptionForStorage } from "./richText";

describe("richText", () => {
  describe("normalizeIssueDescriptionForStorage", () => {
    it("returns undefined for missing descriptions", () => {
      expect(normalizeIssueDescriptionForStorage(undefined)).toBeUndefined();
    });

    it("collapses null and whitespace-only descriptions to empty strings", () => {
      expect(normalizeIssueDescriptionForStorage(null)).toBe("");
      expect(normalizeIssueDescriptionForStorage("   ")).toBe("");
    });

    it("preserves valid rich-text arrays", () => {
      const description = JSON.stringify([{ type: "p", children: [{ text: "Hello" }] }]);
      expect(normalizeIssueDescriptionForStorage(description)).toBe(description);
    });

    it("wraps a single rich-text node into an array", () => {
      expect(
        normalizeIssueDescriptionForStorage(
          JSON.stringify({ type: "p", children: [{ text: "Hello" }] }),
        ),
      ).toBe(JSON.stringify([{ type: "p", children: [{ text: "Hello" }] }]));
    });

    it("converts raw plain text into paragraph JSON", () => {
      expect(normalizeIssueDescriptionForStorage("Hello world")).toBe(
        JSON.stringify([{ type: "p", children: [{ text: "Hello world" }] }]),
      );
    });

    it("converts JSON string payloads into paragraph JSON", () => {
      expect(normalizeIssueDescriptionForStorage('"Hello world"')).toBe(
        JSON.stringify([{ type: "p", children: [{ text: "Hello world" }] }]),
      );
    });

    it("treats malformed JSON objects as raw text", () => {
      expect(normalizeIssueDescriptionForStorage('{"oops":true}')).toBe(
        JSON.stringify([{ type: "p", children: [{ text: '{"oops":true}' }] }]),
      );
    });
  });

  describe("getPlainTextFromDescription", () => {
    it("returns empty string when description is missing", () => {
      expect(getPlainTextFromDescription(undefined)).toBe("");
      expect(getPlainTextFromDescription("")).toBe("");
    });

    it("returns plain-text descriptions unchanged", () => {
      const description = "Description text";
      expect(getPlainTextFromDescription(description)).toBe(description);
    });

    it("extracts text from plate/slate JSON arrays", () => {
      const description = JSON.stringify([
        { type: "p", children: [{ text: "First line" }] },
        {
          type: "p",
          children: [{ text: "Second " }, { text: "line", bold: true }],
        },
      ]);

      expect(getPlainTextFromDescription(description)).toBe("First line\nSecond line");
    });

    it("extracts nested text from a single JSON object", () => {
      const description = JSON.stringify({
        type: "p",
        children: [{ text: "Nested " }, { text: "value" }],
      });

      expect(getPlainTextFromDescription(description)).toBe("Nested value");
    });

    it("handles JSON string payloads", () => {
      expect(getPlainTextFromDescription('"Plain from JSON string"')).toBe(
        "Plain from JSON string",
      );
    });

    it("falls back to raw input when JSON is invalid", () => {
      expect(getPlainTextFromDescription("{bad-json")).toBe("{bad-json");
    });
  });
});
