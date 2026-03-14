import { Inbox } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PageContent } from "./PageContent";

describe("PageContent", () => {
  it("renders a loading spinner while content is loading", () => {
    render(<PageContent isLoading={true}>Loaded content</PageContent>);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Loaded content")).not.toBeInTheDocument();
  });

  it("renders the configured empty state when the page is empty", () => {
    const onClick = vi.fn();

    render(
      <PageContent
        isEmpty={true}
        emptyState={{
          icon: Inbox,
          title: "Nothing here yet",
          description: "Create your first item to get started.",
          action: {
            label: "Create item",
            onClick,
          },
        }}
      >
        Hidden content
      </PageContent>,
    );

    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument();
    expect(screen.getByText("Create your first item to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create item" })).toBeInTheDocument();
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  it("renders children inside the default error boundary wrapper", () => {
    const { container } = render(
      <PageContent className="content-shell">
        <div>Visible content</div>
      </PageContent>,
    );

    expect(screen.getByText("Visible content")).toBeInTheDocument();
    expect(container.querySelector(".content-shell")).toHaveTextContent("Visible content");
  });
});
