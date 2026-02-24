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
import { NixeloLogo } from "./icons";

export function NavHeader() {
  const { setTheme } = useTheme();

  return (
    <header className="px-6 py-4 sticky top-0 z-50 transition-all duration-default backdrop-blur-md bg-ui-bg/80 border-b border-ui-border/30">
      <nav className="max-w-6xl mx-auto flex items-center justify-between relative">
        <Link
          to={ROUTES.home.path}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-default"
        >
          <NixeloLogo />
          <Typography variant="h3" className="tracking-tight">
            Nixelo
          </Typography>
        </Link>

        <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2">
          {["Features", "Pricing", "Resources"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-ui-text-secondary hover:text-ui-text transition-colors duration-default relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-ui-text after:transition-all after:duration-default hover:after:w-full"
            >
              {item}
            </a>
          ))}
        </div>

        <Flex align="center" gap="md">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-ui-text-secondary hover:text-ui-text transition-all duration-default"
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
              className="text-sm font-medium text-ui-text-secondary hover:text-ui-text transition-colors duration-default"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.signup.path}
              className="px-5 py-2.5 bg-linear-to-r from-landing-accent to-landing-accent-teal rounded-full text-sm font-medium text-brand-foreground hover:shadow-lg hover:shadow-landing-accent/25 transition-all duration-default shadow-sm"
            >
              Get Started
            </Link>
          </Unauthenticated>
          <Authenticated>
            <Link
              to={ROUTES.app.path}
              className="px-5 py-2.5 bg-linear-to-r from-landing-accent to-landing-accent-teal rounded-full text-sm font-medium text-brand-foreground hover:shadow-lg hover:shadow-landing-accent/25 transition-all duration-default shadow-sm"
            >
              Go to App
            </Link>
          </Authenticated>
        </Flex>
      </nav>
    </header>
  );
}
