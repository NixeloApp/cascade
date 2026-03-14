import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PageError } from "./PageError";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

describe("PageError", () => {
  it("renders the title, message, and default back action", async () => {
    const user = userEvent.setup();

    render(<PageError title="Not found" message="This page is missing." />);

    expect(screen.getByRole("heading", { name: "Not found" })).toBeInTheDocument();
    expect(screen.getByText("This page is missing.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(navigateMock).toHaveBeenCalledWith({ to: ".." });
  });

  it("renders a custom action instead of the default back button", () => {
    render(
      <PageError
        title="Retry later"
        message="Temporary failure."
        action={<button type="button">Retry</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
  });
});
