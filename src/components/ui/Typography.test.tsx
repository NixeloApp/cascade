import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DocumentTitleText,
  PageTitleText,
  SectionTitleText,
  TYPOGRAPHY_VARIANTS,
  Typography,
} from "./Typography";

describe("Typography", () => {
  it("keeps the shared variant surface under the design-system limit", () => {
    expect(TYPOGRAPHY_VARIANTS).toHaveLength(18);
  });

  it("maps h2 to a heading with shared heading styles", () => {
    render(
      <Typography variant="h2" data-testid="title">
        Project Alpha
      </Typography>,
    );
    const title = screen.getByTestId("title");
    expect(title.tagName).toBe("H2");
    expect(title.className).toContain("text-3xl");
    expect(title.className).toContain("font-semibold");
    expect(title.className).toContain("tracking-tight");
  });

  it("maps h3 to a heading with shared heading styles", () => {
    render(
      <Typography variant="h3" data-testid="wiki-title">
        Engineering Playbook
      </Typography>,
    );
    const title = screen.getByTestId("wiki-title");
    expect(title.tagName).toBe("H3");
    expect(title.className).toContain("text-2xl");
    expect(title.className).toContain("tracking-tight");
  });

  it("maps eyebrowWide to a paragraph with uppercase tracking", () => {
    render(
      <Typography variant="eyebrowWide" data-testid="metric-label">
        Teams
      </Typography>,
    );
    const label = screen.getByTestId("metric-label");
    expect(label.tagName).toBe("P");
    expect(label.className).toContain("uppercase");
    expect(label.className).toContain("tracking-widest");
  });

  it("maps label to a paragraph with shared label styling", () => {
    render(
      <Typography variant="label" data-testid="field-section-label">
        Custom Fields
      </Typography>,
    );
    const label = screen.getByTestId("field-section-label");
    expect(label.tagName).toBe("P");
    expect(label.className).toContain("text-sm");
    expect(label.className).toContain("font-medium");
  });

  it("maps caption to a paragraph with helper-text sizing", () => {
    render(
      <Typography variant="caption" data-testid="search-trigger-label">
        Search, jump, or create...
      </Typography>,
    );
    const label = screen.getByTestId("search-trigger-label");
    expect(label.tagName).toBe("P");
    expect(label.className).toContain("text-xs");
    expect(label.className).toContain("text-ui-text-secondary");
  });

  it("maps mono to a span with compact mono styling", () => {
    render(
      <Typography variant="mono" data-testid="issue-key-mono">
        DEMO-1
      </Typography>,
    );
    const label = screen.getByTestId("issue-key-mono");
    expect(label.tagName).toBe("SPAN");
    expect(label.className).toContain("text-xs");
    expect(label.className).toContain("font-mono");
    expect(label.className).toContain("tracking-tight");
  });

  it("supports preformatted mono blocks via className overrides", () => {
    render(
      <Typography as="pre" variant="mono" className="whitespace-pre-wrap" data-testid="mono-block">
        Line one
      </Typography>,
    );
    const block = screen.getByTestId("mono-block");
    expect(block.tagName).toBe("PRE");
    expect(block.className).toContain("font-mono");
    expect(block.className).toContain("whitespace-pre-wrap");
    expect(block.className).toContain("text-xs");
  });

  it("supports mono wrapping overrides through className", () => {
    render(
      <Typography variant="mono" className="break-all" data-testid="mono-wrap">
        https://example.com/hooks/issues
      </Typography>,
    );
    const block = screen.getByTestId("mono-wrap");
    expect(block.tagName).toBe("SPAN");
    expect(block.className).toContain("font-mono");
    expect(block.className).toContain("break-all");
    expect(block.className).toContain("text-xs");
  });

  it("supports the brandActive color override", () => {
    render(
      <Typography variant="mono" color="brandActive" data-testid="mono-brand-active">
        2h 15m
      </Typography>,
    );
    const block = screen.getByTestId("mono-brand-active");
    expect(block.className).toContain("text-brand-active");
  });

  it("maps strong to a span", () => {
    render(
      <Typography variant="strong" data-testid="initials">
        NX
      </Typography>,
    );
    expect(screen.getByTestId("initials").tagName).toBe("SPAN");
  });

  it("renders page titles through the shared responsive wrapper", () => {
    render(<PageTitleText data-testid="page-title">Workspace Overview</PageTitleText>);
    const title = screen.getByTestId("page-title");
    expect(title.tagName).toBe("H2");
    expect(title.className).toContain("text-xl");
    expect(title.className).toContain("lg:text-3xl");
  });

  it("renders section titles through the shared landing wrapper", () => {
    render(
      <SectionTitleText as="h3" data-testid="section-title">
        Pricing should explain rollout
      </SectionTitleText>,
    );
    const title = screen.getByTestId("section-title");
    expect(title.tagName).toBe("H3");
    expect(title.className).toContain("text-2xl");
    expect(title.className).toContain("sm:text-3xl");
  });

  it("renders document titles through the shared document wrapper", () => {
    render(<DocumentTitleText data-testid="document-title">Launch Plan</DocumentTitleText>);
    const title = screen.getByTestId("document-title");
    expect(title.tagName).toBe("H2");
    expect(title.className).toContain("text-2xl");
    expect(title.className).toContain("lg:text-4xl");
  });
});
