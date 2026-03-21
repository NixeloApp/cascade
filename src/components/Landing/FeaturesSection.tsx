import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { FileText, PanelsTopLeft, Users } from "lucide-react";
import { ArrowRight } from "@/lib/icons";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Grid } from "../ui/Grid";
import { IconCircle } from "../ui/IconCircle";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

const featureIconHaloVariants = cva("inline-flex rounded-xl bg-linear-to-br p-0.5 opacity-80", {
  variants: {
    gradient: {
      cyan: "from-brand-cyan-bg to-brand-teal-bg",
      teal: "from-brand-teal-bg to-brand-emerald-bg",
      amber: "from-status-warning-bg to-status-warning/70",
    },
  },
});

function getFeatureCardRecipe(gradient: FeatureGradient) {
  switch (gradient) {
    case "cyan":
      return "landingFeatureCardCyan" as const;
    case "teal":
      return "landingFeatureCardTeal" as const;
    case "amber":
      return "landingFeatureCardAmber" as const;
  }
}

type FeatureGradient = "cyan" | "teal" | "amber";

type FeatureCardData = {
  description: string;
  gradient: FeatureGradient;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
};

const features: FeatureCardData[] = [
  {
    icon: FileText,
    iconClassName: "text-brand-cyan-text",
    title: "Docs and execution stay linked",
    description:
      "Link specs, issue threads, client updates, and board work instead of asking the team to manually keep them in sync.",
    gradient: "cyan",
  },
  {
    icon: Users,
    iconClassName: "text-brand-teal-text",
    title: "Collaboration with less context loss",
    description:
      "See what changed, who is blocked, and what needs a handoff without building a second workflow in chat and status meetings.",
    gradient: "teal",
  },
  {
    icon: PanelsTopLeft,
    iconClassName: "text-status-warning-text",
    title: "AI can act on real workspace context",
    description:
      "Search, summarize, and draft next steps from the same source of truth your team already works in.",
    gradient: "amber",
  },
];

/** Landing page section showcasing key product features. */
export function FeaturesSection() {
  return (
    <section id="features">
      <Container
        size="lg"
        style={{ paddingInline: "1.5rem", paddingTop: "6rem", paddingBottom: "6rem" }}
      >
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

function FeatureCard({ description, gradient, icon: Icon, iconClassName, title }: FeatureCardData) {
  return (
    <Card recipe={getFeatureCardRecipe(gradient)} padding="none">
      <Stack gap="lg">
        <div className={featureIconHaloVariants({ gradient })}>
          <IconCircle size="md" variant="soft" className="bg-ui-bg-elevated">
            <Icon size={24} className={iconClassName} />
          </IconCircle>
        </div>

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
