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
import { ROUTES } from "@/config/routes";
import { useTheme } from "@/contexts/ThemeContext";
import { NixeloLogo } from "./icons";

export function NavHeader() {
  const { setTheme } = useTheme();

  return (
    <header className="px-6 py-5 sticky top-0 z-50 transition-all duration-300 backdrop-blur-md bg-ui-bg-primary/10 border-b border-ui-border-primary/20">
      <nav className="max-w-6xl mx-auto flex items-center justify-between relative">
        <Link
          to={ROUTES.home.path}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <NixeloLogo />
          <span className="text-xl font-semibold text-ui-text-primary">Nixelo</span>
        </Link>

        <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2">
          {["Features", "Pricing", "Resources"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-ui-text-secondary hover:text-ui-text-primary transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <Flex align="center" gap="md">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-ui-text-secondary">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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
              className="text-sm font-medium text-ui-text-secondary hover:text-ui-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.signup.path}
              className="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all shadow-sm"
            >
              Get Started
            </Link>
          </Unauthenticated>
          <Authenticated>
            <Link
              to={ROUTES.app.path}
              className="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all shadow-sm"
            >
              Go to App
            </Link>
          </Authenticated>
        </Flex>
      </nav>
    </header>
  );
}
