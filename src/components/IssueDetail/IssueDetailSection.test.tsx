import { render, screen } from "@/test/custom-render";
import { IssueDetailSection } from "./IssueDetailSection";

describe("IssueDetailSection", () => {
  it("renders the shared issue detail section anatomy", () => {
    render(
      <IssueDetailSection
        eyebrow="Issue workspace"
        title="Overview"
        description="Keep the problem and context together."
        action={<button type="button">Edit</button>}
      >
        <div>Section body</div>
      </IssueDetailSection>,
    );

    expect(screen.getByText("Issue workspace")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("Keep the problem and context together.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByText("Section body")).toBeInTheDocument();
  });

  it("omits optional chrome when only the core section content is provided", () => {
    render(
      <IssueDetailSection title="Discussion" compact>
        <div>Only content</div>
      </IssueDetailSection>,
    );

    expect(screen.getByRole("heading", { name: "Discussion" })).toBeInTheDocument();
    expect(screen.queryByText("Issue workspace")).not.toBeInTheDocument();
    expect(screen.getByText("Only content")).toBeInTheDocument();
  });
});
