import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { FormActions, FormLayout, FormRow, FormSection } from "./FormLayout";

describe("FormLayout", () => {
  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <FormLayout>
          <input data-testid="input-field" />
        </FormLayout>,
      );

      expect(screen.getByTestId("input-field")).toBeInTheDocument();
    });

    it("should have default spacing", () => {
      const { container } = render(
        <FormLayout data-testid="form-layout">
          <div>Field 1</div>
          <div>Field 2</div>
        </FormLayout>,
      );

      const layout = container.firstChild;
      expect(layout).toHaveClass("space-y-4");
    });

    it("should apply custom className", () => {
      render(
        <FormLayout data-testid="form-layout" className="custom-class">
          <div>Content</div>
        </FormLayout>,
      );

      expect(screen.getByTestId("form-layout")).toHaveClass("custom-class");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(
        <FormLayout ref={ref}>
          <div>Content</div>
        </FormLayout>,
      );

      expect(ref.current).not.toBeNull();
    });
  });
});

describe("FormRow", () => {
  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <FormRow>
          <input data-testid="input-1" />
          <input data-testid="input-2" />
        </FormRow>,
      );

      expect(screen.getByTestId("input-1")).toBeInTheDocument();
      expect(screen.getByTestId("input-2")).toBeInTheDocument();
    });

    it("should use grid layout", () => {
      const { container } = render(
        <FormRow data-testid="form-row">
          <div>Field 1</div>
          <div>Field 2</div>
        </FormRow>,
      );

      const row = container.firstChild;
      expect(row).toHaveClass("grid");
      expect(row).toHaveClass("gap-4");
    });
  });

  describe("Column Variants", () => {
    it("should default to 2 columns", () => {
      render(
        <FormRow data-testid="form-row">
          <div>Field 1</div>
          <div>Field 2</div>
        </FormRow>,
      );

      expect(screen.getByTestId("form-row")).toHaveClass("sm:grid-cols-2");
    });

    it("should support 3 columns", () => {
      render(
        <FormRow data-testid="form-row" cols={3}>
          <div>Field 1</div>
          <div>Field 2</div>
          <div>Field 3</div>
        </FormRow>,
      );

      expect(screen.getByTestId("form-row")).toHaveClass("lg:grid-cols-3");
    });

    it("should support 4 columns", () => {
      render(
        <FormRow data-testid="form-row" cols={4}>
          <div>Field 1</div>
          <div>Field 2</div>
          <div>Field 3</div>
          <div>Field 4</div>
        </FormRow>,
      );

      expect(screen.getByTestId("form-row")).toHaveClass("lg:grid-cols-4");
    });
  });

  describe("Custom Props", () => {
    it("should apply custom className", () => {
      render(
        <FormRow data-testid="form-row" className="custom-class">
          <div>Content</div>
        </FormRow>,
      );

      expect(screen.getByTestId("form-row")).toHaveClass("custom-class");
    });
  });
});

describe("FormActions", () => {
  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <FormActions>
          <button type="button">Cancel</button>
          <button type="button">Save</button>
        </FormActions>,
      );

      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("should have right-aligned flex layout", () => {
      render(
        <FormActions data-testid="form-actions">
          <button type="button">Save</button>
        </FormActions>,
      );

      const actions = screen.getByTestId("form-actions");
      expect(actions).toHaveClass("flex");
      expect(actions).toHaveClass("justify-end");
      expect(actions).toHaveClass("gap-2");
    });

    it("should have top padding", () => {
      render(
        <FormActions data-testid="form-actions">
          <button type="button">Save</button>
        </FormActions>,
      );

      expect(screen.getByTestId("form-actions")).toHaveClass("pt-4");
    });
  });

  describe("Custom Props", () => {
    it("should apply custom className", () => {
      render(
        <FormActions data-testid="form-actions" className="custom-class">
          <button type="button">Save</button>
        </FormActions>,
      );

      expect(screen.getByTestId("form-actions")).toHaveClass("custom-class");
    });
  });
});

describe("FormSection", () => {
  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <FormSection>
          <input data-testid="input-field" />
        </FormSection>,
      );

      expect(screen.getByTestId("input-field")).toBeInTheDocument();
    });

    it("should render title when provided", () => {
      render(
        <FormSection title="Profile Settings">
          <div>Content</div>
        </FormSection>,
      );

      expect(screen.getByText("Profile Settings")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(
        <FormSection description="Update your personal information">
          <div>Content</div>
        </FormSection>,
      );

      expect(screen.getByText("Update your personal information")).toBeInTheDocument();
    });

    it("should render both title and description", () => {
      render(
        <FormSection title="Profile" description="Manage your profile settings">
          <div>Content</div>
        </FormSection>,
      );

      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Manage your profile settings")).toBeInTheDocument();
    });

    it("should not render header when neither title nor description provided", () => {
      const { container } = render(
        <FormSection data-testid="form-section">
          <div>Content only</div>
        </FormSection>,
      );

      const section = container.firstChild;
      // Should only have the content child, no header wrapper
      expect(section?.childNodes.length).toBe(1);
    });
  });

  describe("Custom Props", () => {
    it("should apply custom className", () => {
      render(
        <FormSection data-testid="form-section" className="custom-class">
          <div>Content</div>
        </FormSection>,
      );

      expect(screen.getByTestId("form-section")).toHaveClass("custom-class");
    });

    it("should have default spacing", () => {
      render(
        <FormSection data-testid="form-section">
          <div>Content</div>
        </FormSection>,
      );

      expect(screen.getByTestId("form-section")).toHaveClass("space-y-4");
    });
  });
});
