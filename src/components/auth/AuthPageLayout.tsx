import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/landing";
import { Flex } from "@/components/ui/Flex";
import { ROUTES } from "@/config/routes";
import { Typography } from "../ui/Typography";

interface AuthPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <Flex align="center" justify="center" className="min-h-screen w-full bg-ui-bg p-4">
      <div className="w-full max-w-md">
        {/* Back link with staggered animation and hover effect */}
        <div
          className="mb-4 animate-slide-up"
          style={{ animationDelay: "0.05s", animationFillMode: "backwards" }}
        >
          <Link
            to={ROUTES.home.path}
            className="inline-flex items-center gap-2 text-ui-text-tertiary hover:text-ui-text transition-default text-sm group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="transition-transform group-hover:-translate-x-0.5"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Home
          </Link>
        </div>
        {/* Main card with staggered scale-in animation */}
        <div
          className="card-subtle p-8 shadow-card animate-scale-in"
          style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
        >
          {/* Header with staggered animations */}
          <Flex direction="column" align="center" className="mb-6">
            <div
              className="animate-slide-up"
              style={{ animationDelay: "0.15s", animationFillMode: "backwards" }}
            >
              <Link to={ROUTES.home.path} className="hover:opacity-80 transition-default block">
                <NixeloLogo size={48} />
              </Link>
            </div>
            <Typography
              variant="h2"
              className="text-2xl font-bold mt-4 mb-2 tracking-tight animate-slide-up"
              style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
            >
              {title}
            </Typography>
            <Typography
              variant="muted"
              className="text-ui-text-tertiary animate-slide-up"
              style={{ animationDelay: "0.25s", animationFillMode: "backwards" }}
            >
              {subtitle}
            </Typography>
          </Flex>
          {/* Form content with fade-in */}
          <div
            className="animate-fade-in"
            style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
          >
            {children}
          </div>
          {/* Footer with delayed fade */}
          <Typography
            variant="caption"
            color="tertiary"
            className="mt-6 text-center animate-fade-in"
            style={{ animationDelay: "0.4s", animationFillMode: "backwards" }}
          >
            By continuing, you acknowledge that you understand and agree to the{" "}
            <a href="/terms" className="underline hover:text-ui-text-secondary transition-default">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline hover:text-ui-text-secondary transition-default"
            >
              Privacy Policy
            </a>
          </Typography>
        </div>
      </div>
    </Flex>
  );
}
