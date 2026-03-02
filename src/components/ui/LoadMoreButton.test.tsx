import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { LoadMoreButton } from "./LoadMoreButton";

describe("LoadMoreButton", () => {
  describe("Rendering", () => {
    it("should render 'Load more' by default", () => {
      render(<LoadMoreButton onClick={vi.fn()} />);

      expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
    });

    it("should render remaining count when provided", () => {
      render(<LoadMoreButton onClick={vi.fn()} remainingCount={47} />);

      expect(screen.getByRole("button", { name: "Load 47 more" })).toBeInTheDocument();
    });

    it("should render custom label when provided", () => {
      render(<LoadMoreButton onClick={vi.fn()} label="Show all results" />);

      expect(screen.getByRole("button", { name: "Show all results" })).toBeInTheDocument();
    });

    it("should prefer custom label over remaining count", () => {
      render(<LoadMoreButton onClick={vi.fn()} remainingCount={47} label="Custom Label" />);

      expect(screen.getByRole("button", { name: "Custom Label" })).toBeInTheDocument();
      expect(screen.queryByText(/47/)).not.toBeInTheDocument();
    });

    it("should show 'Load more' when remainingCount is 0", () => {
      render(<LoadMoreButton onClick={vi.fn()} remainingCount={0} />);

      expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
    });
  });

  describe("Click Handler", () => {
    it("should call onClick when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<LoadMoreButton onClick={onClick} />);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<LoadMoreButton onClick={onClick} isLoading />);

      await user.click(screen.getByRole("button"));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should be disabled when isLoading is true", () => {
      render(<LoadMoreButton onClick={vi.fn()} isLoading />);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should not be disabled when isLoading is false", () => {
      render(<LoadMoreButton onClick={vi.fn()} isLoading={false} />);

      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });

  describe("Styling", () => {
    it("should apply custom className", () => {
      render(<LoadMoreButton onClick={vi.fn()} className="custom-class" />);

      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("should have full width by default", () => {
      render(<LoadMoreButton onClick={vi.fn()} />);

      expect(screen.getByRole("button")).toHaveClass("w-full");
    });
  });
});
