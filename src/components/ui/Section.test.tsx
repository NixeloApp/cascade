import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { Section } from "./Section";

describe("Section", () => {
  describe("Rendering", () => {
    it("should render as a section element", () => {
      render(<Section data-testid="section">Content</Section>);

      const section = screen.getByTestId("section");
      expect(section.tagName).toBe("SECTION");
    });

    it("should render children", () => {
      render(
        <Section>
          <div data-testid="child">Child content</div>
        </Section>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("should render title when provided", () => {
      render(<Section title="Settings">Content</Section>);

      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(<Section description="Manage your preferences">Content</Section>);

      expect(screen.getByText("Manage your preferences")).toBeInTheDocument();
    });

    it("should render both title and description", () => {
      render(
        <Section title="Settings" description="Manage your preferences">
          Content
        </Section>,
      );

      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Manage your preferences")).toBeInTheDocument();
    });

    it("should not render header area when neither title nor description provided", () => {
      render(<Section data-testid="section">Content only</Section>);

      const section = screen.getByTestId("section");
      // Should not have the header div with title/description
      expect(section.querySelector("h4")).not.toBeInTheDocument();
    });
  });

  describe("Gap Variants", () => {
    it("should apply default gap (md)", () => {
      render(<Section data-testid="section">Content</Section>);

      expect(screen.getByTestId("section")).toHaveClass("space-y-4");
    });

    it("should apply xs gap", () => {
      render(
        <Section data-testid="section" gap="xs">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("space-y-1");
    });

    it("should apply sm gap", () => {
      render(
        <Section data-testid="section" gap="sm">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("space-y-2");
    });

    it("should apply lg gap", () => {
      render(
        <Section data-testid="section" gap="lg">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("space-y-6");
    });

    it("should apply xl gap", () => {
      render(
        <Section data-testid="section" gap="xl">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("space-y-8");
    });

    it("should apply none gap", () => {
      render(
        <Section data-testid="section" gap="none">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).not.toHaveClass("space-y-4");
      expect(screen.getByTestId("section")).not.toHaveClass("space-y-2");
    });
  });

  describe("Padding Variants", () => {
    it("should have no padding by default", () => {
      render(<Section data-testid="section">Content</Section>);

      expect(screen.getByTestId("section")).not.toHaveClass("p-4");
      expect(screen.getByTestId("section")).not.toHaveClass("p-6");
    });

    it("should apply xs padding", () => {
      render(
        <Section data-testid="section" padding="xs">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("p-2");
    });

    it("should apply sm padding", () => {
      render(
        <Section data-testid="section" padding="sm">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("p-3");
    });

    it("should apply md padding", () => {
      render(
        <Section data-testid="section" padding="md">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("p-4");
    });

    it("should apply lg padding", () => {
      render(
        <Section data-testid="section" padding="lg">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("p-6");
    });

    it("should apply xl padding", () => {
      render(
        <Section data-testid="section" padding="xl">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("p-8");
    });
  });

  describe("Custom Props", () => {
    it("should apply custom className", () => {
      render(
        <Section data-testid="section" className="custom-class">
          Content
        </Section>,
      );

      expect(screen.getByTestId("section")).toHaveClass("custom-class");
    });

    it("should forward other HTML attributes", () => {
      render(
        <Section data-testid="section" id="my-section" aria-label="My section">
          Content
        </Section>,
      );

      const section = screen.getByTestId("section");
      expect(section).toHaveAttribute("id", "my-section");
      expect(section).toHaveAttribute("aria-label", "My section");
    });
  });
});
