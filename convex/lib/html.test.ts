import { describe, expect, it } from "vitest";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("should escape special characters", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("should escape single quotes", () => {
    expect(escapeHtml("' OR 1=1")).toBe("&#39; OR 1=1");
  });

  it("should escape ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("should handle empty strings", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("should return the same string if no special characters are present", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });

  it("should handle mixed content", () => {
    expect(escapeHtml('Hello "World" & <Universe>')).toBe(
      "Hello &quot;World&quot; &amp; &lt;Universe&gt;",
    );
  });
});
