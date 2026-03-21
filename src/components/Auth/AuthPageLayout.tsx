import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NixeloLogo } from "@/components/Landing";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid, GridItem } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { FileText, FolderKanban, Timer } from "@/lib/icons";
import { cn } from "@/lib/utils";

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
    <div className="bg-auth-gradient relative isolate min-h-screen w-full overflow-hidden bg-ui-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-ui-bg-elevated/56 to-transparent" />
      <Card
        variant="ghost"
        padding="lg"
        className="mx-auto min-h-auth-shell w-full max-w-6xl animate-fade-in"
      >
        <Grid cols={1} colsXl={12} gap="xl" className="w-full items-center xl:gap-12">
          <GridItem className="hidden xl:col-span-5 xl:block">
            <div className={cn(getCardRecipeClassName("authShowcasePanel"), "p-6")}>
              <Stack gap="xl">
                <Stack gap="lg">
                  <Typography variant="pageHeaderEyebrow">Unified delivery workspace</Typography>
                  <Button asChild variant="unstyled" size="none" className="w-fit">
                    <Link to={ROUTES.home.path}>
                      <NixeloLogo size={32} />
                    </Link>
                  </Button>
                  <Stack gap="md" className="max-w-lg">
                    <Typography variant="h2">
                      Get back to specs, execution, and client delivery in one place.
                    </Typography>
                    <Typography variant="small" color="secondary">
                      Sign-in should feel like a doorway back into the workspace, not a second
                      marketing page.
                    </Typography>
                  </Stack>
                </Stack>

                <Stack gap="md">
                  <AuthRailPoint
                    icon={FileText}
                    eyebrow="Capture"
                    title="Specs, notes, and decisions stay attached to the work."
                  />
                  <AuthRailPoint
                    icon={FolderKanban}
                    eyebrow="Coordinate"
                    title="Boards, backlogs, and client delivery live on the same surface."
                  />
                  <AuthRailPoint
                    icon={Timer}
                    eyebrow="Deliver"
                    title="Time, status, and handoff context stay visible without tool switching."
                  />
                </Stack>
              </Stack>
            </div>
          </GridItem>

          <GridItem className="xl:col-span-7">
            <Flex align="center" justify="center" className="w-full">
              <div className="w-full max-w-auth lg:max-w-md">
                <Stack gap="sm" className="mb-4 xl:hidden">
                  <Button asChild variant="unstyled" size="none" className="w-fit">
                    <Link to={ROUTES.home.path}>
                      <Flex align="center" gap="sm">
                        <NixeloLogo size={28} />
                        <Typography variant="caption" color="secondary">
                          Unified delivery workspace
                        </Typography>
                      </Flex>
                    </Link>
                  </Button>
                </Stack>

                <div className={cn(getCardRecipeClassName("authFormShell"), "p-5 sm:p-6")}>
                  <Stack gap="lg">
                    <Stack gap="sm">
                      <Typography variant="pageHeaderEyebrow">Secure account access</Typography>
                      <Typography variant="h2">{title}</Typography>

                      {subtitle ? (
                        <Typography variant="muted" color="secondary">
                          {subtitle}
                        </Typography>
                      ) : null}
                    </Stack>

                    <div>{children}</div>

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
                </div>
              </div>
            </Flex>
          </GridItem>
        </Grid>
      </Card>
    </div>
  );
}

interface AuthRailPointProps {
  icon: typeof FileText;
  eyebrow: string;
  title: string;
}

function AuthRailPoint({ icon, eyebrow, title }: AuthRailPointProps) {
  return (
    <Flex align="start" gap="md">
      <IconCircle size="sm" variant="soft" tone="brand">
        <Icon icon={icon} size="sm" />
      </IconCircle>
      <Stack gap="xs">
        <Typography variant="pageHeaderEyebrow">{eyebrow}</Typography>
        <Typography variant="small" color="secondary">
          {title}
        </Typography>
      </Stack>
    </Flex>
  );
}
