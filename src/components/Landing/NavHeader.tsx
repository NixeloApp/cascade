import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { NixeloLogo } from "./Icons";

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
                "absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-2 md:flex",
              )}
            >
              {["Features", "Pricing", "Resources"].map((item) => (
                <Button
                  key={item}
                  asChild
                  variant="unstyled"
                  chrome="landingNavLink"
                  chromeSize="landingNavPill"
                >
                  <a href={`#${item.toLowerCase()}`}>{item}</a>
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

              <Unauthenticated>
                <Button
                  asChild
                  variant="unstyled"
                  chrome="landingNavLink"
                  chromeSize="landingNavPill"
                >
                  <Link to={ROUTES.signin.path}>Sign in</Link>
                </Button>
                <Button asChild variant="landingPrimary" size="none">
                  <Link to={ROUTES.signup.path}>Get Started</Link>
                </Button>
              </Unauthenticated>
              <Authenticated>
                <Button asChild variant="landingPrimary" size="none">
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
