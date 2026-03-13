import { cva } from "class-variance-authority";
import { Check } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";

interface PlanCard {
  name: string;
  price: string;
  description: string;
  cta: string;
  featured?: boolean;
  features: string[];
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

const pricingVariants = {
  section: cva("px-6 py-24 transition-colors"),
  intro: cva("text-center mb-14"),
  heading: cva("text-3xl md:text-4xl font-bold mb-4 text-ui-text"),
  lead: cva("text-ui-text-secondary max-w-2xl mx-auto"),
  featureList: cva("space-y-2 mb-6"),
};

function getPricingCardRecipe(featured: boolean) {
  return featured ? ("landingPricingCardFeatured" as const) : ("landingPricingCard" as const);
}

/** Landing pricing section with plan tiers and enterprise-oriented feature matrix. */
export function PricingSection() {
  return (
    <section id="pricing" className={pricingVariants.section()}>
      <div className="max-w-6xl mx-auto">
        <div className={pricingVariants.intro()}>
          <Typography variant="h2" className={pricingVariants.heading()}>
            Pricing that scales with your team
          </Typography>
          <Typography variant="lead" className={pricingVariants.lead()}>
            Start self-hosted for free, then add enterprise controls as your org grows.
          </Typography>
        </div>

        <Grid cols={1} colsMd={3} gap="lg">
          {plans.map((plan) => (
            <Card key={plan.name} recipe={getPricingCardRecipe(!!plan.featured)} padding="none">
              <div className="mb-4">
                <Typography variant="h3" className="text-xl text-ui-text">
                  {plan.name}
                </Typography>
                <Typography variant="h2" className="text-3xl font-bold mt-2 text-ui-text">
                  {plan.price}
                </Typography>
                <Typography variant="small" color="secondary" className="mt-2">
                  {plan.description}
                </Typography>
              </div>

              {plan.featured ? (
                <Badge variant="brand" size="sm" className="mb-4">
                  Most Popular
                </Badge>
              ) : null}

              <ul className={pricingVariants.featureList()}>
                {plan.features.map((feature) => (
                  <Flex key={feature} as="li" align="center" gap="sm">
                    <Check className="w-4 h-4 text-status-success-text shrink-0" />
                    <Typography variant="small" color="secondary">
                      {feature}
                    </Typography>
                  </Flex>
                ))}
              </ul>

              <Button variant={plan.featured ? "primary" : "secondary"} className="w-full">
                {plan.cta}
              </Button>
            </Card>
          ))}
        </Grid>
      </div>
    </section>
  );
}
