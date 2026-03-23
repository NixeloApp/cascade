import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the brand and updated description", () => {
    render(<Footer />);

    expect(screen.getByText("Nixelo")).toBeInTheDocument();
    expect(screen.getByText(/The calmer way to run delivery/i)).toBeInTheDocument();
  });

  it("renders trust messaging and system status", () => {
    render(<Footer />);

    expect(screen.getByText("Enterprise-grade trust signals")).toBeInTheDocument();
    expect(screen.getByText("All systems normal")).toBeInTheDocument();
  });

  it("renders footer link columns with real destinations", () => {
    render(<Footer />);

    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "/#features");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  });

  it("renders social links and copyright", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: /Follow us on Facebook/i })).toHaveAttribute(
      "href",
      "https://www.facebook.com/nixeloapp/",
    );
    expect(screen.getByRole("link", { name: /Follow us on TikTok/i })).toHaveAttribute(
      "href",
      "https://www.tiktok.com/@nixeloapp",
    );
    expect(screen.getByRole("link", { name: /Support us on Patreon/i })).toHaveAttribute(
      "href",
      "https://www.patreon.com/nixelo",
    );
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${currentYear} Nixelo. All rights reserved.`)),
    ).toBeInTheDocument();
  });

  it("renders as a footer element with headings", () => {
    const { container } = render(<Footer />);

    expect(container.querySelector("footer")).toBeInTheDocument();
    expect(screen.getAllByRole("heading").length).toBeGreaterThanOrEqual(2);
  });
});
