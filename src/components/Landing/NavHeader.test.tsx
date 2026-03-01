import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock convex/react auth components
vi.mock("convex/react", () => ({
  Authenticated: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="authenticated">{children}</div>
  ),
  Unauthenticated: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="unauthenticated">{children}</div>
  ),
}));

// Mock ThemeContext
vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

// Import after mocks
import { NavHeader } from "./NavHeader";

describe("NavHeader", () => {
  describe("Branding", () => {
    it("should render the Nixelo logo link", () => {
      render(<NavHeader />);

      const logoLink = screen.getByRole("link", { name: /Nixelo/i });
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute("href", "/");
    });
  });

  describe("Navigation Links", () => {
    it("should render navigation links", () => {
      render(<NavHeader />);

      expect(screen.getByRole("link", { name: "Features" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Pricing" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Resources" })).toBeInTheDocument();
    });

    it("should have correct anchor links", () => {
      render(<NavHeader />);

      expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "#features");
      expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "#pricing");
      expect(screen.getByRole("link", { name: "Resources" })).toHaveAttribute("href", "#resources");
    });
  });

  describe("Theme Toggle", () => {
    it("should render theme toggle button with accessible label", () => {
      render(<NavHeader />);

      expect(screen.getByRole("button", { name: /Toggle theme/i })).toBeInTheDocument();
    });
  });

  describe("Authentication Links", () => {
    it("should render Sign in link for unauthenticated users", () => {
      render(<NavHeader />);

      const unauthSection = screen.getByTestId("unauthenticated");
      expect(unauthSection).toContainElement(screen.getByRole("link", { name: /Sign in/i }));
    });

    it("should render Get Started link for unauthenticated users", () => {
      render(<NavHeader />);

      const unauthSection = screen.getByTestId("unauthenticated");
      expect(unauthSection).toContainElement(screen.getByRole("link", { name: /Get Started/i }));
    });

    it("should render Go to App link for authenticated users", () => {
      render(<NavHeader />);

      const authSection = screen.getByTestId("authenticated");
      expect(authSection).toContainElement(screen.getByRole("link", { name: /Go to App/i }));
    });
  });

  describe("Structure", () => {
    it("should render as a header element", () => {
      const { container } = render(<NavHeader />);

      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
    });

    it("should contain a nav element", () => {
      const { container } = render(<NavHeader />);

      const nav = container.querySelector("nav");
      expect(nav).toBeInTheDocument();
    });
  });
});
