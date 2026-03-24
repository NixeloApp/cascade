import type { ComponentProps } from "react";
import type { LucideIcon } from "@/lib/icons";
import { ArrowRight, FileText, PanelsTopLeft, Users } from "@/lib/icons";
import { Button } from "../ui/Button";
import { Card, type CardProps } from "../ui/Card";
import { Container } from "../ui/Container";
import { Grid } from "../ui/Grid";
import { IconCircle } from "../ui/IconCircle";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type FeatureCardRecipe = NonNullable<CardProps["recipe"]>;
type FeatureIconVariant = NonNullable<ComponentProps<typeof IconCircle>["variant"]>;
type FeatureIconTone = NonNullable<ComponentProps<typeof IconCircle>["tone"]>;

type FeatureCardData = {
  description: string;
  icon: LucideIcon;
  iconTone: FeatureIconTone;
  iconVariant: FeatureIconVariant;
  recipe: FeatureCardRecipe;
  title: string;
};

const features: FeatureCardData[] = [
  {
    icon: FileText,
    iconTone: "brand",
    iconVariant: "brand",
    recipe: "landingFeatureCardCyan",
    title: "Docs and execution stay linked",
    description:
      "Link specs, issue threads, client updates, and board work instead of asking the team to manually keep them in sync.",
  },
  {
    icon: Users,
    iconTone: "successText",
    iconVariant: "success",
    recipe: "landingFeatureCardTeal",
    title: "Collaboration with less context loss",
    description:
      "See what changed, who is blocked, and what needs a handoff without building a second workflow in chat and status meetings.",
  },
  {
    icon: PanelsTopLeft,
    iconTone: "warningText",
    iconVariant: "warning",
    recipe: "landingFeatureCardAmber",
    title: "AI can act on real workspace context",
    description:
      "Search, summarize, and draft next steps from the same source of truth your team already works in.",
  },
];

/** Landing page section showcasing key product features. */
export function FeaturesSection() {
  return (
    <section id="features">
      <Container size="lg" padding="section">
        <Stack gap="2xl">
          <SectionIntro
            align="center"
            title="Built for the intelligence age"
            description="A sharper workflow is mostly about killing duplicated work, duplicated context, and duplicated surfaces."
          />

          <Grid cols={1} colsMd={3} gap="lg">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </Grid>
        </Stack>
      </Container>
    </section>
  );
}

function FeatureCard({
  description,
  icon: Icon,
  iconTone,
  iconVariant,
  recipe,
  title,
}: FeatureCardData) {
  return (
    <Card recipe={recipe} padding="none">
      <Stack gap="lg">
        <IconCircle size="md" tone={iconTone} variant={iconVariant}>
          <Icon size={24} />
        </IconCircle>

        <Stack gap="sm">
          <Typography variant="h3">{title}</Typography>
          <Typography variant="small" color="secondary">
            {description}
          </Typography>
        </Stack>

        <Button asChild variant="link" size="none">
          <a href="#learn-more">
            Learn more
            <ArrowRight size={16} />
          </a>
        </Button>
      </Stack>
    </Card>
  );
}
