import { describe, expect, it } from "vitest";
import {
  buildComplianceFooter,
  injectClickTracking,
  injectOpenTrackingPixel,
  isAutoReply,
  renderTemplate,
} from "./helpers";

describe("outreach helpers", () => {
  describe("renderTemplate", () => {
    const contact = {
      email: "john@startup.com",
      firstName: "John",
      lastName: "Doe",
      company: "Acme Inc",
      customFields: { role: "CTO", city: "Berlin" },
    };

    it("replaces standard variables", () => {
      const result = renderTemplate("Hi {{firstName}} from {{company}}", contact);
      expect(result).toBe("Hi John from Acme Inc");
    });

    it("replaces email variable", () => {
      const result = renderTemplate("Your email: {{email}}", contact);
      expect(result).toBe("Your email: john@startup.com");
    });

    it("replaces lastName variable", () => {
      const result = renderTemplate("Dear {{firstName}} {{lastName}}", contact);
      expect(result).toBe("Dear John Doe");
    });

    it("replaces custom field variables", () => {
      const result = renderTemplate("Hey {{firstName}}, as {{role}} in {{city}}", contact);
      expect(result).toBe("Hey John, as CTO in Berlin");
    });

    it("is case-insensitive", () => {
      const result = renderTemplate("{{FIRSTNAME}} {{firstname}} {{FirstName}}", contact);
      expect(result).toBe("John John John");
    });

    it("replaces missing variables with empty string", () => {
      const result = renderTemplate("Hi {{firstName}}", { email: "x@y.com" });
      expect(result).toBe("Hi ");
    });

    it("removes unresolved variables", () => {
      const result = renderTemplate("Hi {{firstName}}, re: {{unknownField}}", contact);
      expect(result).toBe("Hi John, re: ");
    });

    it("handles template with no variables", () => {
      const result = renderTemplate("Plain text email", contact);
      expect(result).toBe("Plain text email");
    });

    it("handles empty template", () => {
      const result = renderTemplate("", contact);
      expect(result).toBe("");
    });
  });

  describe("injectClickTracking", () => {
    let idCounter = 0;
    const generateId = () => `link-${++idCounter}`;

    it("rewrites http links", () => {
      idCounter = 0;
      const html = '<a href="https://example.com">Click</a>';
      const { html: result, links } = injectClickTracking(
        html,
        "enr1",
        0,
        "t.nixelo.com",
        generateId,
      );

      expect(result).toBe('<a href="https://t.nixelo.com/t/c/link-1">Click</a>');
      expect(links).toHaveLength(1);
      expect(links[0].originalUrl).toBe("https://example.com");
      expect(links[0].id).toBe("link-1");
      expect(links[0].step).toBe(0);
    });

    it("rewrites multiple links", () => {
      idCounter = 0;
      const html = '<a href="https://a.com">A</a> <a href="https://b.com">B</a>';
      const { links } = injectClickTracking(html, "enr1", 0, "t.nixelo.com", generateId);
      expect(links).toHaveLength(2);
    });

    it("skips mailto links", () => {
      idCounter = 0;
      const html = '<a href="mailto:test@test.com">Email</a>';
      const { html: result, links } = injectClickTracking(
        html,
        "enr1",
        0,
        "t.nixelo.com",
        generateId,
      );

      expect(result).toBe(html); // Unchanged
      expect(links).toHaveLength(0);
    });

    it("skips unsubscribe links", () => {
      idCounter = 0;
      const html = '<a href="https://t.nixelo.com/t/u/enr1">Unsub</a>';
      const { html: result, links } = injectClickTracking(
        html,
        "enr1",
        0,
        "t.nixelo.com",
        generateId,
      );

      expect(result).toBe(html); // Unchanged
      expect(links).toHaveLength(0);
    });

    it("handles html with no links", () => {
      idCounter = 0;
      const html = "<p>No links here</p>";
      const { html: result, links } = injectClickTracking(
        html,
        "enr1",
        0,
        "t.nixelo.com",
        generateId,
      );

      expect(result).toBe(html);
      expect(links).toHaveLength(0);
    });
  });

  describe("injectOpenTrackingPixel", () => {
    it("injects pixel before </body>", () => {
      const html = "<html><body><p>Hi</p></body></html>";
      const result = injectOpenTrackingPixel(html, "enr1", "t.nixelo.com");

      expect(result).toContain('src="https://t.nixelo.com/t/o/enr1"');
      expect(result).toContain("</body>");
      expect(result.indexOf("t/o/enr1")).toBeLessThan(result.indexOf("</body>"));
    });

    it("appends pixel when no </body> tag", () => {
      const html = "<p>Hi</p>";
      const result = injectOpenTrackingPixel(html, "enr1", "t.nixelo.com");

      expect(result).toContain('src="https://t.nixelo.com/t/o/enr1"');
      expect(result).toContain("<p>Hi</p>");
    });

    it("uses correct enrollment ID and domain", () => {
      const result = injectOpenTrackingPixel("<p>test</p>", "abc123", "track.custom.com");
      expect(result).toContain("https://track.custom.com/t/o/abc123");
    });
  });

  describe("buildComplianceFooter", () => {
    it("includes physical address", () => {
      const result = buildComplianceFooter("123 Main St, NY 10001", "enr1", "t.nixelo.com");
      expect(result).toContain("123 Main St, NY 10001");
    });

    it("includes unsubscribe link with correct URL", () => {
      const result = buildComplianceFooter("123 Main St", "enr1", "t.nixelo.com");
      expect(result).toContain("https://t.nixelo.com/t/u/enr1");
      expect(result).toContain("Unsubscribe");
    });

    it("uses custom tracking domain", () => {
      const result = buildComplianceFooter("addr", "enr1", "track.custom.com");
      expect(result).toContain("https://track.custom.com/t/u/enr1");
    });
  });

  describe("isAutoReply", () => {
    it("detects Auto-Submitted header", () => {
      const headers = [{ name: "Auto-Submitted", value: "auto-replied" }];
      expect(isAutoReply(headers)).toBe(true);
    });

    it("detects auto-generated header", () => {
      const headers = [{ name: "Auto-Submitted", value: "auto-generated" }];
      expect(isAutoReply(headers)).toBe(true);
    });

    it("detects X-Auto-Response-Suppress header", () => {
      const headers = [{ name: "X-Auto-Response-Suppress", value: "All" }];
      expect(isAutoReply(headers)).toBe(true);
    });

    it("detects X-Auto-Response-Suppress OOF", () => {
      const headers = [{ name: "X-Auto-Response-Suppress", value: "OOF" }];
      expect(isAutoReply(headers)).toBe(true);
    });

    it("detects Precedence: bulk header", () => {
      const headers = [{ name: "Precedence", value: "bulk" }];
      expect(isAutoReply(headers)).toBe(true);
    });

    it("detects Precedence: auto_reply header", () => {
      const headers = [{ name: "Precedence", value: "auto_reply" }];
      expect(isAutoReply(headers)).toBe(true);
    });

    it("detects X-Autoreply header", () => {
      const headers = [{ name: "X-Autoreply", value: "yes" }];
      expect(isAutoReply(headers)).toBe(true);
    });

    it("detects OOO body patterns", () => {
      expect(isAutoReply([], "I am currently out of office")).toBe(true);
      expect(isAutoReply([], "On vacation until March 30")).toBe(true);
      expect(isAutoReply([], "This is an automated response")).toBe(true);
      expect(isAutoReply([], "I will be back on Monday")).toBe(true);
      expect(isAutoReply([], "Away from my desk this week")).toBe(true);
      expect(isAutoReply([], "I have limited access to email")).toBe(true);
    });

    it("returns false for normal reply headers", () => {
      const headers = [
        { name: "From", value: "john@test.com" },
        { name: "Subject", value: "Re: Partnership" },
      ];
      expect(isAutoReply(headers)).toBe(false);
    });

    it("returns false for normal reply body", () => {
      expect(isAutoReply([], "Thanks for reaching out! Let's schedule a call.")).toBe(false);
      expect(isAutoReply([], "Sounds great, I'm interested.")).toBe(false);
    });

    it("returns false with no headers and no body", () => {
      expect(isAutoReply([])).toBe(false);
    });

    it("handles case-insensitive body matching", () => {
      expect(isAutoReply([], "OUT OF OFFICE")).toBe(true);
      expect(isAutoReply([], "Auto-Reply: I am away")).toBe(true);
    });
  });
});
