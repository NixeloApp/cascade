import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { Footer } from "./Footer";

describe("Footer", () => {
  describe("Branding", () => {
    it("should render the nixelo logo and name", () => {
      render(<Footer />);

      expect(screen.getByText("nixelo")).toBeInTheDocument();
    });

    it("should render brand description", () => {
      render(<Footer />);

      expect(
        screen.getByText(/Revolutionizing project management with intelligent automation/),
      ).toBeInTheDocument();
    });

    it("should render copyright notice", () => {
      render(<Footer />);

      expect(screen.getByText(/© 2026 Nixelo. All rights reserved./)).toBeInTheDocument();
    });
  });

  describe("Navigation Links", () => {
    it("should render Product section with links", () => {
      render(<Footer />);

      expect(screen.getByText("Product")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Features" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Pricing" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Integrations" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Changelog" })).toBeInTheDocument();
    });

    it("should render organization section with links", () => {
      render(<Footer />);

      expect(screen.getByText("organization")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Blog" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Careers" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Contact" })).toBeInTheDocument();
    });

    it("should render Resources section with links", () => {
      render(<Footer />);

      expect(screen.getByText("Resources")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Documentation" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Help Center" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "API Reference" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Status" })).toBeInTheDocument();
    });
  });

  describe("Social Links", () => {
    it("should render Facebook link with accessible label", () => {
      render(<Footer />);

      const facebookLink = screen.getByRole("link", { name: /Follow us on Facebook/i });
      expect(facebookLink).toBeInTheDocument();
      expect(facebookLink).toHaveAttribute("href", "https://www.facebook.com/nixeloapp/");
      expect(facebookLink).toHaveAttribute("target", "_blank");
      expect(facebookLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should render TikTok link with accessible label", () => {
      render(<Footer />);

      const tiktokLink = screen.getByRole("link", { name: /Follow us on TikTok/i });
      expect(tiktokLink).toBeInTheDocument();
      expect(tiktokLink).toHaveAttribute("href", "https://www.tiktok.com/@nixeloapp");
    });

    it("should render Patreon link with accessible label", () => {
      render(<Footer />);

      const patreonLink = screen.getByRole("link", { name: /Support us on Patreon/i });
      expect(patreonLink).toBeInTheDocument();
      expect(patreonLink).toHaveAttribute("href", "https://www.patreon.com/nixelo");
    });
  });

  describe("Legal Links", () => {
    it("should render legal page links", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Terms" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Cookies" })).toBeInTheDocument();
    });
  });

  describe("Structure", () => {
    it("should render as a footer element", () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector("footer");
      expect(footer).toBeInTheDocument();
    });

    it("should have accessible heading structure", () => {
      render(<Footer />);

      // Section headings should be h4
      const h4s = screen.getAllByRole("heading", { level: 4 });
      expect(h4s.length).toBeGreaterThanOrEqual(3);
    });
  });
});
