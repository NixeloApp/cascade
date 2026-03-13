import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/Landing";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid, GridItem } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
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
        <Grid cols={1} colsLg={5} gap="xl" className="w-full items-center lg:gap-10">
          <GridItem colSpanLg={3} className="hidden lg:block">
            <Card recipe="authShowcasePanel" padding="lg" className="xl:px-6 xl:py-7">
              <Badge variant="outline" shape="pill" className="mb-4 w-fit">
                Unified delivery workspace
              </Badge>

              <Button asChild variant="unstyled" size="none" className="w-fit">
                <Link to={ROUTES.home.path}>
                  <NixeloLogo size={32} />
                </Link>
              </Button>

              <Stack gap="lg" className="mt-6 max-w-lg">
                <Typography variant="h1">
                  Keep specs, execution, and client delivery in one calmer system.
                </Typography>
                <Typography variant="p" color="secondary" className="max-w-lg">
                  Docs, issues, calendars, time tracking, and team context stay inside the same
                  operating surface, so teams stop losing momentum across tools.
                </Typography>
              </Stack>

              <Grid cols={1} colsSm={3} gap="md" className="mt-6 max-w-3xl">
                <Card recipe="authFeatureTile" padding="md">
                  <Typography variant="eyebrow" color="tertiary" className="tracking-[0.18em]">
                    Search
                  </Typography>
                  <Typography variant="h4" className="mt-2">
                    Omnibox
                  </Typography>
                </Card>
                <Card recipe="authFeatureTile" padding="md">
                  <Typography variant="eyebrow" color="tertiary" className="tracking-[0.18em]">
                    Plan
                  </Typography>
                  <Typography variant="h4" className="mt-2">
                    Boards
                  </Typography>
                </Card>
                <Card recipe="authFeatureTile" padding="md">
                  <Typography variant="eyebrow" color="tertiary" className="tracking-[0.18em]">
                    Deliver
                  </Typography>
                  <Typography variant="h4" className="mt-2">
                    Clients
                  </Typography>
                </Card>
              </Grid>
            </Card>
          </GridItem>

          <GridItem colSpanLg={2}>
            <Flex align="center" justify="center" className="w-full lg:justify-start">
              <div className="w-full max-w-auth lg:max-w-md">
                <Stack gap="lg" className="mb-5 lg:hidden">
                  <Button asChild variant="unstyled" size="none" className="w-fit">
                    <Link to={ROUTES.home.path}>
                      <Card recipe="authMobileBrandChip" padding="sm">
                        <Flex align="center" gap="sm">
                          <NixeloLogo size={28} />
                          <Typography variant="small">Nixelo</Typography>
                        </Flex>
                      </Card>
                    </Link>
                  </Button>

                  <Typography variant="h3" className="max-w-sm">
                    Keep specs, execution, and client delivery connected.
                  </Typography>
                  <Typography variant="muted" color="secondary" className="max-w-sm">
                    Docs, issues, calendars, and team context stay in the same operating surface.
                  </Typography>
                </Stack>

                <Card recipe="authFormShell" padding="lg" className="sm:p-8">
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-brand/14 to-transparent" />
                  <Badge variant="outline" shape="pill" className="mb-4 w-fit">
                    Secure account access
                  </Badge>
                  <Typography variant="h2">{title}</Typography>

                  {subtitle && (
                    <Typography variant="muted" color="secondary" className="mt-3">
                      {subtitle}
                    </Typography>
                  )}

                  <div className="mt-8">{children}</div>

                  <Typography variant="caption" color="tertiary" className="mt-8 block text-center">
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
                </Card>
              </div>
            </Flex>
          </GridItem>
        </Grid>
      </Flex>
    </div>
  );
}
