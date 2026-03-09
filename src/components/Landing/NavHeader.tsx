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
    <header className="absolute inset-x-0 top-0 z-50 px-4 py-4 text-brand-foreground transition-all duration-default sm:px-6">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-linear-to-r from-black/45 via-black/25 to-black/45 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-5">
        <Link
          to={ROUTES.home.path}
          className="flex items-center gap-2.5 transition-opacity duration-default hover:opacity-80"
        >
          <NixeloLogo />
          <Typography variant="h3" className="tracking-tight text-brand-foreground">
            Nixelo
          </Typography>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:flex">
          {["Features", "Pricing", "Resources"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-full px-4 py-2 text-sm text-white/70 transition-all duration-default hover:bg-white/6 hover:text-white"
            >
              {item}
            </a>
          ))}
        </div>

        <Flex align="center" gap="sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-default hover:bg-white/10 hover:text-white"
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
              className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-all duration-default hover:bg-white/6 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.signup.path}
              className="rounded-full bg-linear-to-r from-landing-accent to-landing-accent-teal px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-[0_12px_30px_rgba(18,205,237,0.28)] transition-all duration-default hover:translate-y-[-1px] hover:shadow-[0_18px_36px_rgba(18,205,237,0.34)]"
            >
              Get Started
            </Link>
          </Unauthenticated>
          <Authenticated>
            <Link
              to={ROUTES.app.path}
              className="rounded-full bg-linear-to-r from-landing-accent to-landing-accent-teal px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-[0_12px_30px_rgba(18,205,237,0.28)] transition-all duration-default hover:translate-y-[-1px] hover:shadow-[0_18px_36px_rgba(18,205,237,0.34)]"
            >
              Go to App
            </Link>
          </Authenticated>
        </Flex>
      </nav>
    </header>
  );
}
