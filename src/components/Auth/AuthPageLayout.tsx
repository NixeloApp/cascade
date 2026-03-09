import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/Landing";
import { Badge } from "@/components/ui/Badge";
import { Flex } from "@/components/ui/Flex";
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
    <div
      className="relative isolate min-h-screen w-full overflow-hidden bg-ui-bg p-4 sm:p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(34, 211, 238, 0.24), transparent 34%), radial-gradient(circle at top right, rgba(99, 102, 241, 0.2), transparent 38%), radial-gradient(circle at bottom center, rgba(16, 185, 129, 0.12), transparent 30%), linear-gradient(135deg, rgba(224, 242, 254, 0.82), rgba(245, 243, 255, 0.84) 48%, rgba(255, 255, 255, 0.96))",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-white/60 to-transparent" />
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl animate-fade-in items-center">
        <div className="w-full overflow-hidden rounded-3xl border border-ui-border-secondary/70 bg-white/55 shadow-elevated backdrop-blur-md">
          <div className="grid w-full gap-0 lg:grid-cols-[1.12fr_380px]">
            <div className="hidden border-r border-ui-border/60 bg-linear-to-br from-ui-bg-elevated via-brand-subtle/35 to-ui-bg-elevated p-12 lg:flex lg:flex-col lg:justify-between">
              <div>
                <Badge variant="brand" shape="pill" className="mb-6 w-fit">
                  Unified delivery workspace
                </Badge>

                <Link
                  to={ROUTES.home.path}
                  className="inline-flex w-fit items-center rounded-full border border-ui-border/70 bg-white/70 px-4 py-2 shadow-soft transition-opacity hover:opacity-80"
                >
                  <NixeloLogo size={32} />
                </Link>

                <div className="mt-10 max-w-xl">
                  <Typography variant="h1" className="text-5xl leading-tight tracking-tight">
                    Keep specs, execution, and client delivery in one calmer system.
                  </Typography>
                  <Typography
                    variant="muted"
                    className="mt-5 max-w-lg text-base leading-7 text-ui-text-secondary"
                  >
                    Nixelo brings docs, issues, calendars, time tracking, and AI assistance into the
                    same operating surface so teams stop losing context across tools.
                  </Typography>
                </div>

                <Flex gap="sm" className="mt-8 flex-wrap">
                  <Badge variant="outline" shape="pill">
                    Docs + delivery in one place
                  </Badge>
                  <Badge variant="outline" shape="pill">
                    AI search and action layer
                  </Badge>
                  <Badge variant="outline" shape="pill">
                    Fewer fragmented tools
                  </Badge>
                </Flex>
              </div>

              <div className="rounded-3xl border border-ui-border-secondary/70 bg-white/72 p-5 shadow-card">
                <div className="mb-4 inline-flex items-center rounded-full border border-ui-border/70 bg-ui-bg-elevated/85 px-3 py-1 text-xs font-medium uppercase tracking-wider text-ui-text-tertiary">
                  Operating snapshot
                </div>
                <Typography variant="h3" className="max-w-md text-3xl tracking-tight">
                  One search, one plan, one delivery view.
                </Typography>
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-ui-border/60 bg-ui-bg-elevated/75 px-4 py-3 shadow-soft">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />
                    <Typography variant="small" color="secondary">
                      Search docs, issues, and actions from the same command surface instead of
                      bouncing between tools.
                    </Typography>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-ui-border/60 bg-ui-bg-elevated/75 px-4 py-3 shadow-soft">
                    <span
                      className="mt-1 h-2.5 w-2.5 rounded-full bg-status-success"
                      aria-hidden="true"
                    />
                    <Typography variant="small" color="secondary">
                      Keep boards, roadmap, calendar, and client updates in one operating lane.
                    </Typography>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-ui-border/60 bg-ui-bg-elevated/80 p-3 shadow-soft">
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
                  <div className="rounded-2xl border border-ui-border/60 bg-ui-bg-elevated/80 p-3 shadow-soft">
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
                  <div className="rounded-2xl border border-ui-border/60 bg-ui-bg-elevated/80 p-3 shadow-soft">
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
                </div>
              </div>
            </div>

            <Flex
              align="center"
              justify="center"
              className="w-full bg-linear-to-b from-white/28 to-white/46 p-4 sm:p-6 lg:p-8"
            >
              <div className="w-full max-w-auth lg:max-w-none">
                <div className="mb-4 rounded-3xl border border-ui-border/70 bg-ui-bg-elevated/95 p-5 shadow-card lg:hidden">
                  <Badge variant="brand" shape="pill" className="mb-4 w-fit">
                    Unified delivery workspace
                  </Badge>

                  <Link
                    to={ROUTES.home.path}
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-ui-border/70 bg-white/80 px-3 py-2 shadow-soft transition-opacity hover:opacity-80"
                  >
                    <NixeloLogo size={28} />
                    <Typography variant="small" className="font-semibold text-ui-text">
                      Nixelo
                    </Typography>
                  </Link>

                  <div className="mt-5">
                    <Typography variant="h3" className="tracking-tight">
                      Keep specs, execution, and client delivery connected.
                    </Typography>
                    <Typography variant="muted" className="mt-3 text-ui-text-secondary">
                      Docs, issues, calendars, and team context stay in the same operating surface.
                    </Typography>
                  </div>
                </div>

                <div className="relative rounded-3xl border border-ui-border-secondary/70 bg-ui-bg-elevated/95 p-6 shadow-elevated sm:p-8">
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-brand/35 to-transparent" />
                  <div>
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
                  </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
