import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { Card, CardBody, CardHeader } from "./Card";

describe("Card", () => {
  describe("Basic Rendering", () => {
    it("should render children", () => {
      render(
        <Card>
          <div>Card content</div>
        </Card>,
      );

      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("should have default styling", () => {
      const { container } = render(<Card>Content</Card>);

      const card = container.firstChild;
      expect(card).toHaveClass("bg-ui-bg");
      expect(card).toHaveClass("rounded-lg");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("border-ui-border");
    });

    it("should not have hover styles by default", () => {
      const { container } = render(<Card>Content</Card>);

      const card = container.firstChild;
      expect(card).not.toHaveClass("hover:shadow-card-hover");
      expect(card).not.toHaveClass("cursor-pointer");
    });

    it("should not have button role by default", () => {
      const { container } = render(<Card>Content</Card>);

      expect(container.querySelector('[role="button"]')).not.toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(<Card className="custom-class">Content</Card>);

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should combine custom className with default classes", () => {
      const { container } = render(<Card className="p-8 bg-blue-50">Content</Card>);

      const card = container.firstChild;
      // tailwind-merge removes conflicting bg- classes, keeping custom bg-blue-50
      expect(card).toHaveClass("p-8");
      expect(card).toHaveClass("bg-blue-50");
      expect(card).toHaveClass("rounded-lg");
      expect(card).toHaveClass("border");
    });
  });

  describe("Hoverable Variant", () => {
    it("should add hover styles when hoverable is true", () => {
      const { container } = render(<Card hoverable>Content</Card>);

      const card = container.firstChild;
      expect(card).toHaveClass("hover:shadow-card-hover");
      expect(card).toHaveClass("cursor-pointer");
    });

    it("should not add hover styles when hoverable is false", () => {
      const { container } = render(<Card hoverable={false}>Content</Card>);

      const card = container.firstChild;
      expect(card).not.toHaveClass("hover:shadow-card-hover");
      expect(card).not.toHaveClass("cursor-pointer");
    });

    it("should work with hoverable and custom className", () => {
      const { container } = render(
        <Card hoverable className="custom">
          Content
        </Card>,
      );

      const card = container.firstChild;
      expect(card).toHaveClass("hover:shadow-card-hover");
      expect(card).toHaveClass("custom");
    });
  });

  describe("Interactive (Clickable) Card", () => {
    it("should have button role when onClick is provided", () => {
      const onClick = vi.fn();
      render(<Card onClick={onClick}>Content</Card>);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should have tabIndex when onClick is provided", () => {
      const onClick = vi.fn();
      render(<Card onClick={onClick}>Content</Card>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("tabIndex", "0");
    });

    it("should call onClick when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Card onClick={onClick}>Click me</Card>);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick multiple times", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Card onClick={onClick}>Click me</Card>);

      const button = screen.getByRole("button");
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it("should support keyboard interaction (Enter)", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Card onClick={onClick}>Keyboard test</Card>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(onClick).toHaveBeenCalled();
    });

    it("should support keyboard interaction (Space)", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Card onClick={onClick}>Keyboard test</Card>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard(" ");

      expect(onClick).toHaveBeenCalled();
    });

    it("should work with both hoverable and onClick", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      const { container } = render(
        <Card hoverable onClick={onClick}>
          Interactive Card
        </Card>,
      );

      const card = container.firstChild;
      expect(card).toHaveClass("hover:shadow-card-hover");
      expect(card).toHaveAttribute("role", "button");

      await user.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("Props Combinations", () => {
    it("should work with only children", () => {
      render(<Card>Minimal</Card>);
      expect(screen.getByText("Minimal")).toBeInTheDocument();
    });

    it("should work with children and className", () => {
      const { container } = render(<Card className="custom">Content</Card>);
      expect(container.firstChild).toHaveClass("custom");
    });

    it("should work with children and hoverable", () => {
      const { container } = render(<Card hoverable>Content</Card>);
      expect(container.firstChild).toHaveClass("hover:shadow-card-hover");
    });

    it("should work with children and onClick", () => {
      const onClick = vi.fn();
      render(<Card onClick={onClick}>Content</Card>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should work with all props", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      const { container } = render(
        <Card className="custom" hoverable onClick={onClick}>
          Full props
        </Card>,
      );

      const card = container.firstChild;
      expect(card).toHaveClass("custom");
      expect(card).toHaveClass("hover:shadow-card-hover");
      expect(card).toHaveAttribute("role", "button");

      await user.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("Complex Children", () => {
    it("should render complex nested children", () => {
      render(
        <Card>
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button type="button">Action</button>
          </div>
        </Card>,
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    });
  });
});

describe("CardHeader", () => {
  describe("Basic Rendering", () => {
    it("should render title", () => {
      render(<CardHeader title="Card Title" />);

      expect(screen.getByRole("heading", { name: "Card Title" })).toBeInTheDocument();
    });

    it("should render title as h3", () => {
      render(<CardHeader title="Title" />);

      const heading = screen.getByRole("heading", { level: 4 });
      expect(heading).toHaveTextContent("Title");
    });

    it("should have correct styling on title", () => {
      render(<CardHeader title="Title" />);

      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("text-lg");
      expect(heading).toHaveClass("font-semibold");
      expect(heading).toHaveClass("text-ui-text");
    });

    it("should not render description when not provided", () => {
      const { container } = render(<CardHeader title="Title" />);

      const description = container.querySelector("p");
      expect(description).not.toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(<CardHeader title="Title" description="This is a description" />);

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("should not render action when not provided", () => {
      const { container } = render(<CardHeader title="Title" />);

      // The header should only have the title div
      const header = container.firstChild as HTMLElement;
      expect(header.children).toHaveLength(1);
    });

    it("should render action when provided", () => {
      render(<CardHeader title="Title" action={<button type="button">Action</button>} />);

      expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    });
  });

  describe("Description", () => {
    it("should have correct styling on description", () => {
      const { container } = render(<CardHeader title="Title" description="Desc" />);

      const description = container.querySelector("p");
      expect(description).toHaveClass("text-sm");
      expect(description).toHaveClass("text-ui-text-tertiary");
    });

    it("should handle empty string description", () => {
      const { container } = render(<CardHeader title="Title" description="" />);

      // Empty string is falsy, so no description should render
      const description = container.querySelector("p");
      expect(description).not.toBeInTheDocument();
    });

    it("should handle long descriptions", () => {
      const longDesc = "A".repeat(200);
      render(<CardHeader title="Title" description={longDesc} />);

      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it("should handle special characters", () => {
      const specialDesc = "Description with <>&\"'";
      render(<CardHeader title="Title" description={specialDesc} />);

      expect(screen.getByText(specialDesc)).toBeInTheDocument();
    });
  });

  describe("Action", () => {
    it("should render complex action components", () => {
      render(
        <CardHeader
          title="Title"
          action={
            <div>
              <button type="button">Edit</button>
              <button type="button">Delete</button>
            </div>
          }
        />,
      );

      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });

    it("should render action with description", () => {
      render(
        <CardHeader
          title="Title"
          description="Description"
          action={<button type="button">Action</button>}
        />,
      );

      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    });
  });

  describe("Container Structure", () => {
    it("should have correct container classes", () => {
      const { container } = render(<CardHeader title="Title" />);

      const header = container.firstChild;
      expect(header).toHaveClass("p-4");
      expect(header).toHaveClass("border-b");
      expect(header).toHaveClass("border-ui-border");
      expect(header).toHaveClass("flex");
      expect(header).toHaveClass("items-center");
      expect(header).toHaveClass("justify-between");
    });
  });

  describe("Props Combinations", () => {
    it("should work with only title", () => {
      render(<CardHeader title="Only Title" />);

      expect(screen.getByRole("heading", { name: "Only Title" })).toBeInTheDocument();
    });

    it("should work with title and description", () => {
      render(<CardHeader title="Title" description="Description" />);

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("should work with title and action", () => {
      render(<CardHeader title="Title" action={<button type="button">Act</button>} />);

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument();
    });

    it("should work with all props", () => {
      render(
        <CardHeader title="Full" description="Desc" action={<button type="button">Act</button>} />,
      );

      expect(screen.getByText("Full")).toBeInTheDocument();
      expect(screen.getByText("Desc")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument();
    });
  });
});

describe("CardBody", () => {
  describe("Basic Rendering", () => {
    it("should render children", () => {
      render(<CardBody>Body content</CardBody>);

      expect(screen.getByText("Body content")).toBeInTheDocument();
    });

    it("should have default padding", () => {
      const { container } = render(<CardBody>Content</CardBody>);

      expect(container.firstChild).toHaveClass("p-4");
    });

    it("should work without custom className", () => {
      const { container } = render(<CardBody>Content</CardBody>);

      const body = container.firstChild;
      expect(body).toHaveClass("p-4");
      expect(body).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(<CardBody className="custom">Content</CardBody>);

      expect(container.firstChild).toHaveClass("custom");
    });

    it("should combine custom className with default padding", () => {
      const { container } = render(<CardBody className="bg-gray-50">Content</CardBody>);

      const body = container.firstChild;
      expect(body).toHaveClass("p-4");
      expect(body).toHaveClass("bg-gray-50");
    });
  });

  describe("Complex Children", () => {
    it("should render complex nested children", () => {
      render(
        <CardBody>
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
        </CardBody>,
      );

      expect(screen.getByText("Paragraph 1")).toBeInTheDocument();
      expect(screen.getByText("Paragraph 2")).toBeInTheDocument();
    });
  });
});

describe("Card Component Integration", () => {
  it("should work with Card, CardHeader, and CardBody together", () => {
    render(
      <Card>
        <CardHeader title="Integration Test" description="Testing all components" />
        <CardBody>Body content here</CardBody>
      </Card>,
    );

    expect(screen.getByRole("heading", { name: "Integration Test" })).toBeInTheDocument();
    expect(screen.getByText("Testing all components")).toBeInTheDocument();
    expect(screen.getByText("Body content here")).toBeInTheDocument();
  });

  it("should work with clickable Card and all sub-components", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Card hoverable onClick={onClick}>
        <CardHeader title="Clickable Card" action={<button type="button">Edit</button>} />
        <CardBody>Content</CardBody>
      </Card>,
    );

    // Click the card (not the edit button)
    await user.click(screen.getByRole("button", { name: /Clickable Card/i }));
    expect(onClick).toHaveBeenCalled();
  });
});
