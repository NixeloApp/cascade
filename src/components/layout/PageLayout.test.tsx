import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PageLayout } from "./PageLayout";

describe("PageLayout", () => {
  it("renders children with the default layout classes", () => {
    const { container } = render(
      <PageLayout>
        <div>Body</div>
      </PageLayout>,
    );

    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass(
      "mx-auto",
      "w-full",
      "animate-fade-in",
      "px-4",
      "py-5",
      "sm:px-6",
      "sm:py-6",
      "lg:px-8",
      "max-w-full",
    );
  });

  it("applies max-width, full-height, and custom classes", () => {
    const { container } = render(
      <PageLayout maxWidth="lg" fullHeight={true} className="custom-shell">
        <div>Panel</div>
      </PageLayout>,
    );

    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass(
      "max-w-6xl",
      "h-full",
      "overflow-y-auto",
      "custom-shell",
    );
  });
});
