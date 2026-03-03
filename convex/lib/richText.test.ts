import { describe, expect, it } from "vitest";
import { getPlainTextFromDescription } from "./richText";

describe("richText", () => {
  describe("getPlainTextFromDescription", () => {
    it("returns empty string when description is missing", () => {
      expect(getPlainTextFromDescription(undefined)).toBe("");
      expect(getPlainTextFromDescription("")).toBe("");
    });

    it("returns plain-text legacy descriptions unchanged", () => {
      const description = "Legacy description text";
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
