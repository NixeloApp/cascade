import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Typography } from "./Typography";

describe("Typography", () => {
  it("applies the projectHeaderTitle variant", () => {
    render(
      <Typography variant="projectHeaderTitle" data-testid="title">
        Project Alpha
      </Typography>,
    );
    const title = screen.getByTestId("title");
    expect(title.className).toContain("truncate");
    expect(title.className).toContain("text-sm");
    expect(title.className).toContain("sm:text-2xl");
    expect(title.className).toContain("tracking-tight");
  });

  it("maps wikiCardTitle to an h3 with truncation styles", () => {
    render(
      <Typography variant="wikiCardTitle" data-testid="wiki-title">
        Engineering Playbook
      </Typography>,
    );
    const title = screen.getByTestId("wiki-title");
    expect(title.tagName).toBe("H3");
    expect(title.className).toContain("line-clamp-1");
    expect(title.className).toContain("text-2xl");
  });

  it("maps placeholderTitle to a paragraph with shared spacing", () => {
    render(
      <Typography variant="placeholderTitle" data-testid="placeholder-title">
        Coming Soon
      </Typography>,
    );
    const title = screen.getByTestId("placeholder-title");
    expect(title.tagName).toBe("P");
    expect(title.className).toContain("mb-2");
    expect(title.className).toContain("text-lg");
  });

  it("maps metricLabel to a paragraph with uppercase tracking", () => {
    render(
      <Typography variant="metricLabel" data-testid="metric-label">
        Teams
      </Typography>,
    );
    const label = screen.getByTestId("metric-label");
    expect(label.tagName).toBe("P");
    expect(label.className).toContain("uppercase");
    expect(label.className).toContain("tracking-wide");
  });

  it("maps landingSectionTitle to an h2 with landing hero sizing", () => {
    render(
      <Typography variant="landingSectionTitle" data-testid="landing-section-title">
        Run calmer delivery
      </Typography>,
    );
    const title = screen.getByTestId("landing-section-title");
    expect(title.tagName).toBe("H2");
    expect(title.className).toContain("text-4xl");
    expect(title.className).toContain("md:text-5xl");
    expect(title.className).toContain("tracking-tight");
  });

  it("maps landingMetricValue to a paragraph with responsive emphasis", () => {
    render(
      <Typography variant="landingMetricValue" data-testid="landing-metric-value">
        18
      </Typography>,
    );
    const value = screen.getByTestId("landing-metric-value");
    expect(value.tagName).toBe("P");
    expect(value.className).toContain("text-3xl");
    expect(value.className).toContain("sm:text-4xl");
    expect(value.className).toContain("font-bold");
  });

  it("maps errorCodeDisplay to a shared error-code heading", () => {
    render(
      <Typography variant="errorCodeDisplay" data-testid="error-code">
        404
      </Typography>,
    );
    const code = screen.getByTestId("error-code");
    expect(code.tagName).toBe("H1");
    expect(code.className).toContain("text-8xl");
    expect(code.className).toContain("tracking-tightest");
  });

  it("maps authStatusTitle to a paragraph with medium title styling", () => {
    render(
      <Typography variant="authStatusTitle" data-testid="auth-status-title">
        Account Error
      </Typography>,
    );
    const title = screen.getByTestId("auth-status-title");
    expect(title.tagName).toBe("P");
    expect(title.className).toContain("text-xl");
    expect(title.className).toContain("font-medium");
  });

  it("maps sidebarOrgInitial to a span", () => {
    render(
      <Typography variant="sidebarOrgInitial" data-testid="initials">
        NX
      </Typography>,
    );
    expect(screen.getByTestId("initials").tagName).toBe("SPAN");
  });
});
