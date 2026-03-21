import { Check } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface PlanCard {
  cta: string;
  description: string;
  featured?: boolean;
  features: string[];
  name: string;
  price: string;
}

const plans: PlanCard[] = [
  {
    name: "Starter",
    price: "Free",
    description: "For small teams validating workflow fit.",
    cta: "Start Free",
    features: ["Up to 10 users", "Docs + Issues", "Kanban + Sprints", "Community support"],
  },
  {
    name: "Team",
    price: "$12 / user",
    description: "For scaling product teams that need governance.",
    cta: "Contact Sales",
    featured: true,
    features: ["Unlimited users", "Advanced search", "Slack integrations", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For regulated orgs and large deployments.",
    cta: "Talk to Us",
    features: ["SSO / SAML", "Audit controls", "Data residency options", "SLA + onboarding"],
  },
];

function getPricingCardRecipe(featured: boolean) {
  return featured ? ("landingPricingCardFeatured" as const) : ("landingPricingCard" as const);
}

/** Landing pricing section with plan tiers and enterprise-oriented feature matrix. */
export function PricingSection() {
  return (
    <section id="pricing">
      <Container
        size="lg"
        style={{ paddingInline: "1.5rem", paddingTop: "6rem", paddingBottom: "6rem" }}
      >
        <Stack gap="2xl">
          <SectionIntro
            align="center"
            title="Pricing that scales with your team"
            description="Start self-hosted for free, then add enterprise controls as your org grows."
          />

          <Grid cols={1} colsMd={3} gap="lg">
            {plans.map((plan) => (
              <PlanPricingCard key={plan.name} {...plan} />
            ))}
          </Grid>
        </Stack>
      </Container>
    </section>
  );
}

function PlanPricingCard({ cta, description, featured = false, features, name, price }: PlanCard) {
  return (
    <Card recipe={getPricingCardRecipe(featured)} padding="none">
      <Stack gap="lg">
        <Stack gap="sm">
          <Typography variant="h4">{name}</Typography>
          <Typography as="h2" variant="landingPriceValue">
            {price}
          </Typography>
          <Typography variant="small" color="secondary">
            {description}
          </Typography>
        </Stack>

        {featured ? (
          <Badge variant="brand" size="sm">
            Most Popular
          </Badge>
        ) : null}

        <Stack as="ul" gap="sm">
          {features.map((feature) => (
            <Flex key={feature} as="li" align="center" gap="sm">
              <Check size={16} className="shrink-0 text-status-success-text" />
              <Typography variant="small" color="secondary">
                {feature}
              </Typography>
            </Flex>
          ))}
        </Stack>

        <Button variant={featured ? "primary" : "secondary"} className="w-full">
          {cta}
        </Button>
      </Stack>
    </Card>
  );
}
