import { cva } from "class-variance-authority";
import { FileText, PanelsTopLeft, Users } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";
import { ArrowIcon } from "./Icons";

const featureSectionVariants = {
  section: cva("px-6 py-24 transition-colors"),
  intro: cva("text-center mb-16"),
  heading: cva("text-3xl md:text-4xl font-bold mb-4 text-ui-text"),
  lead: cva("text-ui-text-secondary max-w-2xl mx-auto"),
  iconHalo: cva("mb-5 inline-flex rounded-xl bg-linear-to-br p-0.5 opacity-80", {
    variants: {
      gradient: {
        cyan: "from-brand-cyan-bg to-brand-teal-bg",
        teal: "from-brand-teal-bg to-brand-emerald-bg",
        amber: "from-status-warning-bg to-status-warning/70",
      },
    },
  }),
  cardTitle: cva("text-lg font-semibold mb-2 text-ui-text"),
  cardBody: cva("text-ui-text-secondary text-sm leading-relaxed mb-4"),
  link: cva("", {
    variants: {
      gradient: {
        cyan: "text-brand-cyan-text",
        teal: "text-brand-teal-text",
        amber: "text-status-warning-text",
      },
    },
  }),
  iconPlate: cva("w-12 h-12 rounded-feature bg-ui-bg-elevated"),
};

function getFeatureCardRecipe(gradient: "cyan" | "teal" | "amber") {
  switch (gradient) {
    case "cyan":
      return "landingFeatureCardCyan" as const;
    case "teal":
      return "landingFeatureCardTeal" as const;
    case "amber":
      return "landingFeatureCardAmber" as const;
  }
}

/** Landing page section showcasing key product features. */
export function FeaturesSection() {
  const features = [
    {
      icon: <FileText className="w-6 h-6 text-brand-cyan-text" />,
      title: "Docs and execution stay linked",
      description:
        "Link specs, issue threads, client updates, and board work instead of asking the team to manually keep them in sync.",
      gradient: "cyan" as const,
    },
    {
      icon: <Users className="w-6 h-6 text-brand-teal-text" />,
      title: "Collaboration with less context loss",
      description:
        "See what changed, who is blocked, and what needs a handoff without building a second workflow in chat and status meetings.",
      gradient: "teal" as const,
    },
    {
      icon: <PanelsTopLeft className="w-6 h-6 text-status-warning-text" />,
      title: "AI can act on real workspace context",
      description:
        "Search, summarize, and draft next steps from the same source of truth your team already works in.",
      gradient: "amber" as const,
    },
  ];

  return (
    <section id="features" className={featureSectionVariants.section()}>
      <div className="max-w-6xl mx-auto">
        <div className={featureSectionVariants.intro()}>
          <Typography variant="h2" className={featureSectionVariants.heading()}>
            Built for the intelligence age
          </Typography>
          <Typography variant="lead" className={featureSectionVariants.lead()}>
            A sharper workflow is mostly about killing duplicated work, duplicated context, and
            duplicated surfaces.
          </Typography>
        </div>

        <Grid cols={1} colsMd={3} gap="lg">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </Grid>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: "cyan" | "teal" | "amber";
}) {
  return (
    <Card recipe={getFeatureCardRecipe(gradient)} padding="none">
      {/* Icon */}
      <div className={featureSectionVariants.iconHalo({ gradient })}>
        <Flex align="center" justify="center" className={featureSectionVariants.iconPlate()}>
          {icon}
        </Flex>
      </div>

      {/* Content */}
      <Typography variant="h3" className={featureSectionVariants.cardTitle()}>
        {title}
      </Typography>
      <Typography variant="p" className={featureSectionVariants.cardBody()}>
        {description}
      </Typography>

      {/* Link */}
      <Button
        asChild
        variant="link"
        size="none"
        className={featureSectionVariants.link({ gradient })}
      >
        <a href="#learn-more">
          Learn more
          <ArrowIcon className="w-4 h-4" />
        </a>
      </Button>
    </Card>
  );
}
