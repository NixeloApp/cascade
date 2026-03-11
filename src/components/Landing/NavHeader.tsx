import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
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

/** Landing page navigation header with logo, links, and theme toggle. */
export function NavHeader() {
  const { setTheme } = useTheme();

  return (
    <header className="absolute inset-x-0 top-0 z-50 px-4 py-4 text-ui-text transition-all duration-default sm:px-6">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between rounded-full border border-ui-border-secondary/70 bg-ui-bg/92 px-3 py-2.5 shadow-card backdrop-blur-xl sm:px-5 sm:py-3">
        <Link
          to={ROUTES.home.path}
          className="flex items-center gap-2.5 transition-opacity duration-default hover:opacity-80"
        >
          <NixeloLogo />
          <Typography variant="h3" className="tracking-tight text-ui-text">
            Nixelo
          </Typography>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-ui-border/60 bg-ui-bg-soft/92 px-2 py-1 shadow-soft md:flex">
          {["Features", "Pricing", "Resources"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-full px-4 py-2 text-sm text-ui-text-secondary transition-all duration-default hover:bg-ui-bg-hover hover:text-ui-text"
            >
              {item}
            </a>
          ))}
        </div>

        <Flex align="center" gap="xs" className="shrink-0 sm:gap-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-ui-border/60 bg-ui-bg-soft/92 text-ui-text-secondary transition-all duration-default hover:bg-ui-bg-hover hover:text-ui-text sm:h-10 sm:w-10"
              >
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
            <Link
              to={ROUTES.signin.path}
              className="rounded-full px-2 py-2 text-sm font-medium whitespace-nowrap text-ui-text-secondary transition-all duration-default hover:bg-ui-bg-hover hover:text-ui-text sm:px-4"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.signup.path}
              className="rounded-full bg-linear-to-r from-brand to-landing-accent px-4 py-2 text-sm font-medium whitespace-nowrap text-brand-foreground shadow-soft transition-all duration-default hover:translate-y-[-1px] hover:bg-brand-hover hover:shadow-card sm:px-5 sm:py-2.5"
            >
              Get Started
            </Link>
          </Unauthenticated>
          <Authenticated>
            <Link
              to={ROUTES.app.path}
              className="rounded-full bg-linear-to-r from-brand to-landing-accent px-4 py-2 text-sm font-medium whitespace-nowrap text-brand-foreground shadow-soft transition-all duration-default hover:translate-y-[-1px] hover:bg-brand-hover hover:shadow-card sm:px-5 sm:py-2.5"
            >
              Go to App
            </Link>
          </Authenticated>
        </Flex>
      </nav>
    </header>
  );
}
