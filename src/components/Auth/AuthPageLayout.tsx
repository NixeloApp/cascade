import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/Landing";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

interface AuthPageLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

/**
 * Minimal centered layout for authentication pages (sign in, sign up, forgot password).
 * Mirrors the Mintlify pattern: logo, heading, subtitle, form, legal — no card, no marketing rail.
 */
export function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="relative min-h-screen w-full bg-ui-bg px-4 py-8"
    >
      <Stack gap="lg" className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <Button asChild variant="unstyled" size="none" className="w-fit">
          <Link to={ROUTES.home.path}>
            <NixeloLogo size={32} />
          </Link>
        </Button>

        {/* Heading + Subtitle */}
        <Stack gap="sm">
          <Typography variant="pageHeaderEyebrow">Secure account access</Typography>
          <Typography variant="h2">{title}</Typography>
          {subtitle ? (
            <Typography variant="muted" color="secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>

        {/* Form */}
        <div>{children}</div>

        {/* Legal */}
        <Typography variant="caption" color="tertiary" className="text-center">
          <Button
            asChild
            variant="authLinkMuted"
            size="none"
            className="underline underline-offset-4"
          >
            <a href={ROUTES.terms.build()}>Terms of Service</a>
          </Button>
          {" · "}
          <Button
            asChild
            variant="authLinkMuted"
            size="none"
            className="underline underline-offset-4"
          >
            <a href={ROUTES.privacy.build()}>Privacy Policy</a>
          </Button>
        </Typography>
      </Stack>
    </Flex>
  );
}
