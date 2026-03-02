import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PaginationInfo } from "./PaginationInfo";

describe("PaginationInfo", () => {
  describe("Partial Loading", () => {
    it("should show 'Showing X of Y items' when loaded is less than total", () => {
      render(<PaginationInfo loaded={50} total={150} />);

      expect(screen.getByText("Showing 50 of 150 items")).toBeInTheDocument();
    });

    it("should use custom itemName when provided", () => {
      render(<PaginationInfo loaded={25} total={100} itemName="issues" />);

      expect(screen.getByText("Showing 25 of 100 issues")).toBeInTheDocument();
    });
  });

  describe("Full Loading", () => {
    it("should show just 'X items' when loaded equals total", () => {
      render(<PaginationInfo loaded={100} total={100} />);

      expect(screen.getByText("100 items")).toBeInTheDocument();
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });

    it("should use custom itemName when loaded equals total", () => {
      render(<PaginationInfo loaded={50} total={50} itemName="documents" />);

      expect(screen.getByText("50 documents")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero items", () => {
      render(<PaginationInfo loaded={0} total={0} />);

      expect(screen.getByText("0 items")).toBeInTheDocument();
    });

    it("should handle single item loaded", () => {
      render(<PaginationInfo loaded={1} total={10} itemName="item" />);

      expect(screen.getByText("Showing 1 of 10 item")).toBeInTheDocument();
    });

    it("should handle all items loaded (single)", () => {
      render(<PaginationInfo loaded={1} total={1} itemName="item" />);

      expect(screen.getByText("1 item")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply custom className", () => {
      render(<PaginationInfo loaded={10} total={100} className="custom-class" />);

      const element = screen.getByText(/Showing 10 of 100 items/);
      expect(element).toHaveClass("custom-class");
    });

    it("should have default text styling", () => {
      render(<PaginationInfo loaded={10} total={100} />);

      const element = screen.getByText(/Showing 10 of 100 items/);
      expect(element).toHaveClass("text-sm");
      expect(element).toHaveClass("text-ui-text-tertiary");
    });
  });
});
