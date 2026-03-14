import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AIFeatureDemo } from "./AIFeatureDemo";

describe("AIFeatureDemo", () => {
  it("renders the AI workflow pitch, operator question, and grounded answer content", () => {
    const { container } = render(<AIFeatureDemo />);

    expect(container.querySelector("#resources")).toBeInTheDocument();
    expect(screen.getByText("AI-native workflows")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Intelligent assistance across every handoff",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Operator question")).toBeInTheDocument();
    expect(screen.getByText("Nixelo AI")).toBeInTheDocument();
    expect(screen.getByText("Context aware")).toBeInTheDocument();
    expect(
      screen.getByText(
        "“How do I add a board to my project and keep the client-facing summary updated?”",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /To add a new board, open the workspace from the sidebar, choose the project/,
      ),
    ).toBeInTheDocument();
  });

  it("renders the operator bullets and all four guided answer steps", () => {
    render(<AIFeatureDemo />);

    expect(
      screen.getByText("Understands project structure, issue history, and linked documents"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Keeps the answer grounded in your actual workspace, not a generic help center",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Can immediately turn the answer into a next action"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Open the workspace and choose the project from the sidebar."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create a board from the board switcher or the project overview."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Pick a template, then connect related docs so specs stay attached to execution.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Invite teammates or clients and let AI summarize changes as the board evolves.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
