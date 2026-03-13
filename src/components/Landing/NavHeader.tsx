import { Link } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Authenticated, Unauthenticated } from "convex/react";
import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useTheme } from "@/contexts/ThemeContext";
import { NixeloLogo } from "./Icons";

const navHeaderVariants = {
  header: cva(
    "absolute inset-x-0 top-0 z-50 px-4 py-4 text-ui-text transition-all duration-default sm:px-6",
  ),
  brandLink: cva("flex items-center gap-2.5 transition-opacity duration-default hover:opacity-80"),
  centerLink: cva(
    "rounded-full px-4 py-2 text-sm text-ui-text-secondary transition-all duration-default hover:bg-ui-bg-hover hover:text-ui-text",
  ),
  controls: cva("shrink-0 sm:gap-sm"),
  themeButton: cva(
    "h-9 w-9 rounded-full border border-ui-border/60 bg-ui-bg-elevated/92 text-ui-text-secondary transition-all duration-default hover:bg-ui-bg-hover hover:text-ui-text sm:h-10 sm:w-10",
  ),
  authLink: cva(
    "rounded-full px-2 py-2 text-sm font-medium whitespace-nowrap text-ui-text-secondary transition-all duration-default hover:bg-ui-bg-hover hover:text-ui-text sm:px-4",
  ),
  primaryLink: cva(
    "rounded-full bg-linear-to-r from-brand to-landing-accent px-4 py-2 text-sm font-medium whitespace-nowrap text-brand-foreground shadow-soft transition-all duration-default hover:-translate-y-px hover:bg-brand-hover hover:shadow-card sm:px-5 sm:py-2.5",
  ),
};

/** Landing page navigation header with logo, links, and theme toggle. */
export function NavHeader() {
  const { setTheme } = useTheme();

  return (
    <header className={navHeaderVariants.header()}>
      <nav className="mx-auto max-w-6xl">
        <Card
          recipe="landingNavShell"
          padding="none"
          className="relative flex items-center justify-between px-3 py-2.5 sm:px-5 sm:py-3"
        >
          <Link to={ROUTES.home.path} className={navHeaderVariants.brandLink()}>
            <NixeloLogo />
            <Typography variant="h3" className="tracking-tight text-ui-text">
              Nixelo
            </Typography>
          </Link>

          <Card
            recipe="landingNavRail"
            padding="none"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-2 px-2 py-1 md:flex"
          >
            {["Features", "Pricing", "Resources"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={navHeaderVariants.centerLink()}
              >
                {item}
              </a>
            ))}
          </Card>

          <Flex align="center" gap="xs" className={navHeaderVariants.controls()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={navHeaderVariants.themeButton()}>
                  <Sun className="h-icon-theme-toggle w-icon-theme-toggle rotate-0 scale-100 transition-all duration-default" />
                  <Moon className="absolute h-icon-theme-toggle w-icon-theme-toggle rotate-90 scale-0 transition-all duration-default" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Unauthenticated>
              <Link to={ROUTES.signin.path} className={navHeaderVariants.authLink()}>
                Sign in
              </Link>
              <Link to={ROUTES.signup.path} className={navHeaderVariants.primaryLink()}>
                Get Started
              </Link>
            </Unauthenticated>
            <Authenticated>
              <Link to={ROUTES.app.path} className={navHeaderVariants.primaryLink()}>
                Go to App
              </Link>
            </Authenticated>
          </Flex>
        </Card>
      </nav>
    </header>
  );
}
