import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { LogoBar } from "./LogoBar";

describe("LogoBar", () => {
  it("renders the product-proof heading and every workflow signal card", () => {
    const { container } = render(<LogoBar />);

    expect(container.querySelector("section")).toBeInTheDocument();
    expect(screen.getByText("Product proof in the same workflow surfaces")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nixelo works when boards, docs, client updates, AI answers, and tracked time all stay attached to the same operating layer.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Boards and docs stay linked")).toBeInTheDocument();
    expect(screen.getByText("Updates stay grounded in live work")).toBeInTheDocument();
    expect(screen.getByText("Search answers come from real context")).toBeInTheDocument();
    expect(screen.getByText("Timers stay attached to delivery")).toBeInTheDocument();

    expect(screen.getByText("Product ops")).toBeInTheDocument();
    expect(screen.getByText("Client delivery")).toBeInTheDocument();
    expect(screen.getByText("AI assistance")).toBeInTheDocument();
    expect(screen.getByText("Time tracking")).toBeInTheDocument();

    expect(screen.queryByText("STRIPE")).not.toBeInTheDocument();
    expect(screen.queryByText("VERCEL")).not.toBeInTheDocument();
  });
});
