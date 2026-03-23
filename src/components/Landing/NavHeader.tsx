import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useTheme } from "@/contexts/ThemeContext";
import { BookOpen, Laptop, Menu, Moon, Sun } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { NixeloLogo } from "./Icons";

const landingNavItems = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#resources", label: "Resources" },
] as const;

/** Landing page navigation header with logo, links, and theme toggle. */
export function NavHeader() {
  const { setTheme } = useTheme();

  return (
    <header className="absolute inset-x-0 top-0 z-50 transition-all duration-default">
      <Card recipe="landingNavFrame" padding="none">
        <Container as="nav" size="lg">
          <div
            className={cn(
              getCardRecipeClassName("landingNavShell"),
              "relative flex items-center justify-between",
            )}
          >
            <Button
              asChild
              variant="unstyled"
              chrome="landingBrandLink"
              chromeSize="landingBrandLink"
            >
              <Link to={ROUTES.home.path}>
                <NixeloLogo />
                <Typography variant="h3">Nixelo</Typography>
              </Link>
            </Button>

            <div
              className={cn(
                getCardRecipeClassName("landingNavRail"),
                "absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-2 lg:flex",
              )}
            >
              {landingNavItems.map((item) => (
                <Button
                  key={item.label}
                  asChild
                  variant="unstyled"
                  chrome="landingNavLink"
                  chromeSize="landingNavPill"
                >
                  <a href={item.href}>{item.label}</a>
                </Button>
              ))}
            </div>

            <Flex align="center" gap="xs" className="shrink-0 sm:gap-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="unstyled"
                    chrome="landingThemeToggle"
                    chromeSize="landingThemeToggle"
                  >
                    <Sun className="h-icon-theme-toggle w-icon-theme-toggle rotate-0 scale-100 transition-all duration-default" />
                    <Moon className="absolute h-icon-theme-toggle w-icon-theme-toggle rotate-90 scale-0 transition-all duration-default" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    icon={<Icon icon={Sun} size="sm" />}
                  >
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    icon={<Icon icon={Moon} size="sm" />}
                  >
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    icon={<Icon icon={Laptop} size="sm" />}
                  >
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="unstyled"
                    chrome="landingNavLink"
                    chromeSize="landingNavPill"
                    className="lg:hidden"
                  >
                    <Icon icon={Menu} size="sm" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel weight="normal">Jump to</DropdownMenuLabel>
                  {landingNavItems.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      asChild
                      icon={<Icon icon={BookOpen} size="sm" tone="secondary" />}
                    >
                      <a href={item.href}>{item.label}</a>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <Unauthenticated>
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.signin.path}>Sign in</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.signup.path}>Get started</Link>
                    </DropdownMenuItem>
                  </Unauthenticated>
                  <Authenticated>
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.app.path}>Go to App</Link>
                    </DropdownMenuItem>
                  </Authenticated>
                </DropdownMenuContent>
              </DropdownMenu>

              <Unauthenticated>
                <Button
                  asChild
                  variant="unstyled"
                  chrome="landingNavLink"
                  chromeSize="landingNavPill"
                  className="hidden lg:inline-flex"
                >
                  <Link to={ROUTES.signin.path}>Sign in</Link>
                </Button>
                <Button
                  asChild
                  variant="landingPrimary"
                  size="none"
                  className="hidden sm:inline-flex"
                >
                  <Link to={ROUTES.signup.path}>
                    <span className="hidden md:inline">Get Started</span>
                    <span className="md:hidden">Start</span>
                  </Link>
                </Button>
              </Unauthenticated>
              <Authenticated>
                <Button
                  asChild
                  variant="landingPrimary"
                  size="none"
                  className="hidden sm:inline-flex"
                >
                  <Link to={ROUTES.app.path}>Go to App</Link>
                </Button>
              </Authenticated>
            </Flex>
          </div>
        </Container>
      </Card>
    </header>
  );
}
