import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/Landing";
import { Badge } from "@/components/ui/Badge";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

interface AuthPageLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

/**
 * Shared layout wrapper for authentication pages (sign in, sign up, etc.).
 */
export function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <div className="bg-auth-gradient relative isolate min-h-screen w-full overflow-hidden bg-ui-bg px-4 py-6 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-ui-bg-elevated/56 to-transparent" />
      <Flex align="center" className="mx-auto min-h-auth-shell w-full max-w-5xl animate-fade-in">
        <Grid cols={1} className="w-full items-center gap-6 lg:grid-cols-5 lg:gap-10">
          <div className="hidden lg:col-span-3 lg:block">
            <div className="rounded-3xl border border-ui-border-secondary/60 bg-linear-to-b from-ui-bg-elevated/74 via-ui-bg-elevated/58 to-ui-bg-soft/56 px-5 py-6 shadow-soft backdrop-blur-sm xl:px-6 xl:py-7">
              <Badge variant="outline" shape="pill" className="mb-4 w-fit">
                Unified delivery workspace
              </Badge>

              <Link
                to={ROUTES.home.path}
                className="inline-flex w-fit items-center transition-opacity hover:opacity-80"
              >
                <NixeloLogo size={32} />
              </Link>

              <div className="mt-6 max-w-lg">
                <Typography variant="h1" className="text-4xl leading-tight tracking-tight">
                  Keep specs, execution, and client delivery in one calmer system.
                </Typography>
                <Typography
                  variant="muted"
                  className="mt-4 max-w-lg text-base leading-7 text-ui-text-secondary"
                >
                  Docs, issues, calendars, time tracking, and team context stay inside the same
                  operating surface, so teams stop losing momentum across tools.
                </Typography>
              </div>

              <Grid cols={1} colsSm={3} gap="md" className="mt-6 max-w-3xl">
                <div className="rounded-2xl border border-ui-border-secondary/55 bg-ui-bg-elevated/72 p-4 shadow-soft">
                  <Typography
                    variant="caption"
                    className="uppercase tracking-wider text-ui-text-tertiary"
                  >
                    Search
                  </Typography>
                  <Typography variant="h4" className="mt-2 tracking-tight">
                    Omnibox
                  </Typography>
                </div>
                <div className="rounded-2xl border border-ui-border-secondary/55 bg-ui-bg-elevated/72 p-4 shadow-soft">
                  <Typography
                    variant="caption"
                    className="uppercase tracking-wider text-ui-text-tertiary"
                  >
                    Plan
                  </Typography>
                  <Typography variant="h4" className="mt-2 tracking-tight">
                    Boards
                  </Typography>
                </div>
                <div className="rounded-2xl border border-ui-border-secondary/55 bg-ui-bg-elevated/72 p-4 shadow-soft">
                  <Typography
                    variant="caption"
                    className="uppercase tracking-wider text-ui-text-tertiary"
                  >
                    Deliver
                  </Typography>
                  <Typography variant="h4" className="mt-2 tracking-tight">
                    Clients
                  </Typography>
                </div>
              </Grid>
            </div>
          </div>

          <Flex align="center" justify="center" className="w-full lg:col-span-2 lg:justify-start">
            <div className="w-full max-w-auth lg:max-w-md">
              <div className="mb-5 lg:hidden">
                <Link
                  to={ROUTES.home.path}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-ui-border/70 bg-linear-to-r from-ui-bg-elevated/96 via-ui-bg-elevated/94 to-ui-bg-soft/88 px-3 py-2 shadow-soft transition-opacity hover:opacity-80"
                >
                  <NixeloLogo size={28} />
                  <Typography variant="small" className="font-semibold text-ui-text">
                    Nixelo
                  </Typography>
                </Link>

                <Typography variant="h3" className="mt-5 max-w-sm tracking-tight">
                  Keep specs, execution, and client delivery connected.
                </Typography>
                <Typography variant="muted" className="mt-2 max-w-sm text-ui-text-secondary">
                  Docs, issues, calendars, and team context stay in the same operating surface.
                </Typography>
              </div>

              <div className="relative rounded-3xl border border-ui-border-secondary/75 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/76 p-6 shadow-card sm:p-8">
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-brand/14 to-transparent" />
                <Badge variant="outline" shape="pill" className="mb-4 w-fit">
                  Secure account access
                </Badge>
                <Typography variant="h1" className="text-3xl font-semibold tracking-tight">
                  {title}
                </Typography>

                {subtitle && (
                  <Typography variant="muted" className="mt-3 text-ui-text-secondary">
                    {subtitle}
                  </Typography>
                )}

                <div className="mt-8">{children}</div>

                <Typography
                  variant="caption"
                  className="mt-8 block text-center text-ui-text-tertiary"
                >
                  <a
                    href={ROUTES.terms.build()}
                    className="underline underline-offset-4 transition-colors hover:text-ui-text-secondary"
                  >
                    Terms of Service
                  </a>
                  {" · "}
                  <a
                    href={ROUTES.privacy.build()}
                    className="underline underline-offset-4 transition-colors hover:text-ui-text-secondary"
                  >
                    Privacy Policy
                  </a>
                </Typography>
              </div>
            </div>
          </Flex>
        </Grid>
      </Flex>
    </div>
  );
}
