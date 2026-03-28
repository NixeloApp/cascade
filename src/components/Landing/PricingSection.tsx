import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import type { LucideIcon } from "@/lib/icons";
import { ArrowRight, Check, Rocket, ShieldCheck, Users } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, getCardRecipeClassName } from "../ui/Card";
import { CardSection } from "../ui/CardSection";
import { Container } from "../ui/Container";
import { Flex } from "../ui/Flex";
import { Grid, GridItem } from "../ui/Grid";
import { Icon, type IconTone } from "../ui/Icon";
import { IconCircle } from "../ui/IconCircle";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { MetricText, SectionTitleText, Typography } from "../ui/Typography";

type PlanCta =
  | {
      kind: "anchor";
      href: `#${string}`;
      label: string;
    }
  | {
      kind: "route";
      label: string;
      to: string;
    };

type PlanCard = {
  audience: string;
  cta: PlanCta;
  description: string;
  featured?: boolean;
  icon: LucideIcon;
  iconTone: IconTone;
  includes: string[];
  launchMode: string;
  name: string;
  price: string;
  proof: string;
};

type PricingSignal = {
  label: string;
  value: string;
};

const plans = [
  {
    name: "Starter",
    audience: "Small teams proving workflow fit",
    price: "Free",
    launchMode: "Self-serve setup",
    description:
      "Run the core workspace without changing how planning, specs, and delivery already need to stay attached.",
    cta: {
      kind: "route",
      label: "Start free",
      to: ROUTES.signup.path,
    },
    icon: Rocket,
    iconTone: "brand",
    includes: [
      "Docs, issues, and sprint planning in one workspace",
      "Connected search and handoff context from day one",
      "Client-ready updates stay grounded in live work",
    ],
    proof: "Best when the team needs one operating surface before adding heavier governance.",
  },
  {
    name: "Team",
    audience: "Growing product orgs",
    price: "$12 / user",
    launchMode: "Most common rollout path",
    description:
      "Keep the same workspace model and add the depth teams need once more people, handoffs, and integrations are in play.",
    cta: {
      kind: "anchor",
      href: "#final-cta",
      label: "Plan the rollout",
    },
    featured: true,
    icon: Users,
    iconTone: "info",
    includes: [
      "Unlimited users across planning, delivery, and follow-up",
      "Advanced search and operational depth for larger teams",
      "Slack-connected updates and stronger team support",
    ],
    proof:
      "Best when boards, docs, updates, and execution rhythm all need to survive more handoffs.",
  },
  {
    name: "Enterprise",
    audience: "Security and scale requirements",
    price: "Custom",
    launchMode: "Guided rollout",
    description:
      "Add the controls serious organizations need without forcing the team onto a different workflow or a stripped-down pilot product.",
    cta: {
      kind: "anchor",
      href: "#final-cta",
      label: "Talk through rollout",
    },
    icon: ShieldCheck,
    iconTone: "success",
    includes: [
      "SSO / SAML for identity and access control",
      "Audit visibility and IP restrictions for tighter governance",
      "Onboarding support for larger teams and external workflows",
    ],
    proof:
      "Best when the workflow already fits and now has to clear security, rollout, and trust requirements.",
  },
] satisfies PlanCard[];

const pricingSignals = [
  {
    label: "Workspace core",
    value: "Boards, docs, client-ready updates, and search context stay attached in every plan.",
  },
  {
    label: "No reset",
    value:
      "Upgrading adds governance and support, not a second product with a different operating model.",
  },
  {
    label: "When enterprise matters",
    value:
      "SSO, audit visibility, and IP restrictions show up when the organization needs stricter controls.",
  },
] satisfies PricingSignal[];

/** Landing pricing section showing rollout stages without implying a workflow reset. */
export function PricingSection() {
  return (
    <section id="pricing" data-testid={TEST_IDS.LANDING.PRICING_SECTION}>
      <Container size="lg" padding="section">
        <Stack gap="2xl">
          <SectionIntro
            align="center"
            eyebrow="Pricing without a workflow reset"
            title="The workspace stays the same. The control surface grows with you."
            description="Start with the connected core, then add more governance, rollout support, and organizational controls as the team gets more serious."
          />

          <Grid cols={1} colsLg={12} gap="lg">
            <GridItem colSpanLg={8}>
              <Grid cols={1} colsMd={3} gap="lg" className="h-full">
                {plans.map((plan) => (
                  <PlanPricingCard key={plan.name} {...plan} />
                ))}
              </Grid>
            </GridItem>

            <GridItem colSpanLg={4}>
              <PricingContinuityCard />
            </GridItem>
          </Grid>
        </Stack>
      </Container>
    </section>
  );
}

function PlanPricingCard({
  audience,
  cta,
  description,
  featured = false,
  icon,
  iconTone,
  includes,
  launchMode,
  name,
  price,
  proof,
}: PlanCard) {
  return (
    <Card
      recipe={featured ? "optionTileSelected" : "optionTile"}
      variant="section"
      padding="lg"
      className="h-full"
    >
      <Stack gap="lg" className="h-full">
        <Flex align="start" justify="between" gap="sm">
          <Flex align="center" gap="sm" className="min-w-0">
            <IconCircle size="md" variant="soft">
              <Icon icon={icon} size="md" tone={iconTone} />
            </IconCircle>
            <Stack gap="xs">
              <Typography variant="eyebrowWide">{audience}</Typography>
              <Typography variant="h4">{name}</Typography>
            </Stack>
          </Flex>

          {featured ? (
            <Badge variant="brand" size="sm" shape="pill">
              Recommended
            </Badge>
          ) : null}
        </Flex>

        <Stack gap="xs">
          <MetricText as="h2" heavy="bold">
            {price}
          </MetricText>
          <Typography variant="label">{launchMode}</Typography>
          <Typography variant="small" color="secondary">
            {description}
          </Typography>
        </Stack>

        <Stack gap="sm">
          {includes.map((item) => (
            <PricingFeatureRow key={`${name}-${item}`}>{item}</PricingFeatureRow>
          ))}
        </Stack>

        <CardSection size="compact" className={getCardRecipeClassName("overlayInset")}>
          <Stack gap="xs">
            <Typography variant="eyebrowWide">Best when</Typography>
            <Typography variant="caption">{proof}</Typography>
          </Stack>
        </CardSection>

        <div style={{ flex: 1 }} />

        <PricingPlanCta cta={cta} featured={featured} />
      </Stack>
    </Card>
  );
}

function PricingFeatureRow({ children }: { children: string }) {
  return (
    <Flex align="start" gap="sm">
      <Icon icon={Check} size="sm" tone="successText" className="shrink-0" />
      <Typography variant="small" color="secondary">
        {children}
      </Typography>
    </Flex>
  );
}

function PricingContinuityCard() {
  return (
    <Card recipe="showcasePanel" variant="section" padding="lg" className="h-full">
      <Stack gap="lg" className="h-full">
        <Stack gap="sm">
          <Badge variant="outline" shape="pill" className="w-fit">
            Same operating model at every stage
          </Badge>
          <SectionTitleText as="h3">
            Pricing should explain rollout, not imply a product switch
          </SectionTitleText>
          <Typography variant="small" color="secondary">
            Nixelo is not a pilot tool that later turns into a different enterprise product. The
            same workflow stays intact from the first team through the stricter rollout.
          </Typography>
        </Stack>

        <Stack gap="sm">
          {pricingSignals.map((signal) => (
            <CardSection
              key={signal.label}
              size="compact"
              className={cn(getCardRecipeClassName("overlayInset"), "h-full")}
            >
              <Stack gap="xs">
                <Typography variant="eyebrowWide">{signal.label}</Typography>
                <Typography variant="caption">{signal.value}</Typography>
              </Stack>
            </CardSection>
          ))}
        </Stack>

        <CardSection size="md" className={getCardRecipeClassName("metricTileAccent")}>
          <Stack gap="xs">
            <Typography variant="label">Enterprise controls, when they matter</Typography>
            <Typography variant="caption">
              Identity, audit, and network controls are there for serious teams, but they do not
              force a separate operating surface or a separate story about how work gets done.
            </Typography>
          </Stack>
        </CardSection>
      </Stack>
    </Card>
  );
}

function PricingPlanCta({ cta, featured }: { cta: PlanCta; featured: boolean }) {
  if (cta.kind === "route") {
    return (
      <Button asChild variant={featured ? "primary" : "secondary"} className="w-full">
        <Link to={cta.to}>
          {cta.label}
          <Icon icon={ArrowRight} size="sm" />
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild variant={featured ? "primary" : "secondary"} className="w-full">
      <a href={cta.href}>
        {cta.label}
        <Icon icon={ArrowRight} size="sm" />
      </a>
    </Button>
  );
}
