import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/Landing";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

interface AuthPageLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

export function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <Flex align="center" justify="center" className="min-h-screen w-full bg-ui-bg p-4">
      {/* Main content - single fade-in animation */}
      <div className="w-full max-w-auth animate-fade-in">
        {/* Logo */}
        <Link to={ROUTES.home.path} className="block w-fit hover:opacity-80 transition-opacity">
          <NixeloLogo size={32} />
        </Link>

        {/* Heading */}
        <Typography variant="h1" className="mt-8 text-2xl font-semibold tracking-tight">
          {title}
        </Typography>

        {/* Subtitle (optional, usually contains signup/signin link) */}
        {subtitle && (
          <Typography variant="muted" className="mt-2 text-ui-text-tertiary">
            {subtitle}
          </Typography>
        )}

        {/* Form content */}
        <div className="mt-8">{children}</div>
      </div>

      {/* Legal - fixed to bottom */}
      <Typography
        variant="caption"
        className="fixed bottom-8 left-0 right-0 text-center text-ui-text-tertiary"
      >
        <a href="/terms" className="underline hover:text-ui-text-secondary transition-colors">
          Terms of Service
        </a>
        {" · "}
        <a href="/privacy" className="underline hover:text-ui-text-secondary transition-colors">
          Privacy Policy
        </a>
      </Typography>
    </Flex>
  );
}
