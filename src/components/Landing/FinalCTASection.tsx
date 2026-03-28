import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import type { LucideIcon } from "@/lib/icons";
import { ArrowRight, Bot, Rocket, ShieldCheck } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, getCardRecipeClassName } from "../ui/Card";
import { CardSection } from "../ui/CardSection";
import { Container } from "../ui/Container";
import { Dot } from "../ui/Dot";
import { Flex } from "../ui/Flex";
import { Grid, GridItem } from "../ui/Grid";
import { Icon, type IconTone } from "../ui/Icon";
import { IconCircle } from "../ui/IconCircle";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type LaunchStep = {
  body: string;
  icon: LucideIcon;
  iconTone: IconTone;
  resultLabel: string;
  resultValue: string;
  stage: string;
  title: string;
};

type ClosingSignal = {
  label: string;
  value: string;
};

const launchSteps = [
  {
    stage: "Day 1",
    title: "Bring current work into one operating surface",
    body: "Start with the live board, the linked docs, and the client-facing context your team already needs instead of building a fake pilot workflow on the side.",
    icon: Rocket,
    iconTone: "brand",
    resultLabel: "Removes",
    resultValue: "Recopying work into a throwaway rollout layer before the real team can move.",
  },
  {
    stage: "First cycle",
    title: "Run planning, search, and follow-up from the same place",
    body: "Issues, docs, AI answers, and client-ready summaries stay attached through the first operating loop, so the team stops translating status across tools just to stay aligned.",
    icon: Bot,
    iconTone: "info",
    resultLabel: "Keeps",
    resultValue:
      "Live delivery context grounded when the first update, review, and handoff happen.",
  },
  {
    stage: "When rollout expands",
    title: "Add governance only when the organization needs it",
    body: "Bring in identity, audit, and network controls as the rollout gets more serious without resetting the workspace model that already fits the team.",
    icon: ShieldCheck,
    iconTone: "success",
    resultLabel: "Adds",
    resultValue:
      "SSO, IP restrictions, and tighter rollout trust without switching products midstream.",
  },
] satisfies LaunchStep[];

const closingSignals = [
  {
    label: "Same workspace core",
    value:
      "Boards, docs, AI assistance, and client-ready updates stay attached from the first team through the stricter rollout.",
  },
  {
    label: "No fake pilot",
    value:
      "The first setup should already look like the product you plan to run, not a stripped-down placeholder story.",
  },
  {
    label: "Control when needed",
    value:
      "Pricing and governance now support the rollout instead of forcing a second narrative at the end of the page.",
  },
] satisfies ClosingSignal[];

/** Closing CTA section for the landing page, framed as a product handoff instead of generic marketing filler. */
export function FinalCTASection() {
  return (
    <section id="final-cta">
      <Container size="lg" padding="section">
        <Card recipe="showcaseShell" padding="xl">
          <Stack gap="2xl">
            <SectionIntro
              align="center"
              eyebrow="What the first operating cycle looks like"
              title="Open one workspace, then let the same system carry the handoff"
              description="The point of signing up is not another promise. It is being able to bring work in, run a planning cycle, and send a grounded update without rebuilding context."
            />

            <Grid cols={1} colsLg={12} gap="lg">
              <GridItem colSpanLg={8}>
                <CardSection
                  size="lg"
                  className={cn(getCardRecipeClassName("dashboardPanel"), "h-full")}
                >
                  <Stack gap="lg">
                    <Flex align="center" justify="between" gap="md" wrap>
                      <Stack gap="xs">
                        <Typography variant="eyebrowWide">First operating cycle</Typography>
                        <Typography variant="h5" as="h3">
                          The first win is fewer rebuilds, not a prettier rollout deck
                        </Typography>
                      </Stack>
                      <Badge variant="outline" shape="pill">
                        Product-grounded handoff
                      </Badge>
                    </Flex>

                    <Stack gap="sm">
                      {launchSteps.map((step) => (
                        <LaunchStepCard key={step.title} {...step} />
                      ))}
                    </Stack>
                  </Stack>
                </CardSection>
              </GridItem>

              <GridItem colSpanLg={4}>
                <CardSection
                  size="lg"
                  className={cn(getCardRecipeClassName("dashboardPanelInset"), "h-full")}
                >
                  <Stack gap="lg" className="h-full">
                    <Stack gap="sm">
                      <Typography variant="eyebrowWide">Choose the next move</Typography>
                      <Typography variant="h5" as="h3">
                        Start free, review the rollout, or walk the product once more
                      </Typography>
                      <Typography variant="small" color="secondary">
                        However you enter, the next step should still look like the same connected
                        workspace you just saw, not a different closing-page promise.
                      </Typography>
                    </Stack>

                    <Stack gap="sm">
                      {closingSignals.map((signal) => (
                        <ClosingSignalRow key={signal.label} {...signal} />
                      ))}
                    </Stack>

                    <div style={{ flex: 1 }} />

                    <Stack gap="sm">
                      <Button asChild size="lg" className="w-full">
                        <Link to={ROUTES.signup.path}>Get started for free</Link>
                      </Button>
                      <Button asChild variant="secondary" size="lg" className="w-full">
                        <a href="#pricing">Review rollout stages</a>
                      </Button>
                      <Button asChild variant="link" size="none">
                        <a href="#product-showcase">
                          See the workflow tour
                          <Icon icon={ArrowRight} size="sm" />
                        </a>
                      </Button>
                    </Stack>
                  </Stack>
                </CardSection>
              </GridItem>
            </Grid>
          </Stack>
        </Card>
      </Container>
    </section>
  );
}

function LaunchStepCard({
  body,
  icon,
  iconTone,
  resultLabel,
  resultValue,
  stage,
  title,
}: LaunchStep) {
  return (
    <CardSection size="md" className={getCardRecipeClassName("overlayInset")}>
      <Stack gap="md">
        <Flex align="center" justify="between" gap="sm" wrap>
          <Flex align="center" gap="sm" className="min-w-0">
            <IconCircle size="sm" variant="soft">
              <Icon icon={icon} size="sm" tone={iconTone} />
            </IconCircle>
            <Stack gap="xs">
              <Typography variant="eyebrowWide">{stage}</Typography>
              <Typography variant="label">{title}</Typography>
            </Stack>
          </Flex>
          <Badge variant="outline" shape="pill" size="sm">
            {resultLabel}
          </Badge>
        </Flex>

        <Typography variant="small" color="secondary">
          {body}
        </Typography>

        <Flex align="center" gap="xs">
          <Dot size="sm" color={getStepDotColor(iconTone)} />
          <Typography variant="caption">{resultValue}</Typography>
        </Flex>
      </Stack>
    </CardSection>
  );
}

function ClosingSignalRow({ label, value }: ClosingSignal) {
  return (
    <CardSection size="compact" className={getCardRecipeClassName("overlayInset")}>
      <Stack gap="xs">
        <Typography variant="eyebrowWide">{label}</Typography>
        <Typography variant="caption">{value}</Typography>
      </Stack>
    </CardSection>
  );
}

function getStepDotColor(iconTone: IconTone) {
  switch (iconTone) {
    case "brand":
      return "brand";
    case "info":
      return "info";
    case "success":
      return "success";
    default:
      return "muted";
  }
}
