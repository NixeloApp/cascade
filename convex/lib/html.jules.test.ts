import { describe, expect, it } from "vitest";
import { escapeHtml, escapeScriptJson } from "./html";

describe("html utils", () => {
  describe("escapeHtml", () => {
    it("should escape basic HTML characters", () => {
      expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
      expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
      expect(escapeHtml("'single'")).toBe("&#039;single&#039;");
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });

    it("should handle mixed content", () => {
      const input = '<script>alert("xss")</script>';
      const expected = "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;";
      expect(escapeHtml(input)).toBe(expected);
    });

    it("should not modify safe strings", () => {
      expect(escapeHtml("hello world")).toBe("hello world");
      expect(escapeHtml("12345")).toBe("12345");
    });
  });

  describe("escapeScriptJson", () => {
    it("should escape < characters in JSON", () => {
      const data = { content: "</script><script>alert(1)</script>" };
      const json = escapeScriptJson(data);
      expect(json).toContain("\\u003c/script>");
      expect(json).not.toContain("</script>");
    });

    it("should correctly stringify objects", () => {
      const data = { a: 1, b: "test" };
      expect(JSON.parse(escapeScriptJson(data))).toEqual(data);
    });

    it("should handle arrays", () => {
      const data = ["<foo>", "bar"];
      expect(escapeScriptJson(data)).toBe('["\\u003cfoo>","bar"]');
    });
  });
});
