import { cva } from "class-variance-authority";
import { FileText, PanelsTopLeft, Users } from "lucide-react";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";
import { ArrowIcon } from "./Icons";

const featureSectionVariants = {
  section: cva("px-6 py-24 transition-colors"),
  intro: cva("text-center mb-16"),
  heading: cva("text-3xl md:text-4xl font-bold mb-4 text-ui-text"),
  lead: cva("text-ui-text-secondary max-w-2xl mx-auto"),
  card: cva(
    "group relative p-6 rounded-2xl bg-linear-to-b from-ui-bg-soft/80 to-ui-bg-secondary/50 border border-ui-border/40 backdrop-blur-md transition-all duration-medium hover:shadow-xl hover:-translate-y-1",
    {
      variants: {
        gradient: {
          cyan: "hover:shadow-brand-cyan-text/20 hover:border-brand-cyan-text/40",
          teal: "hover:shadow-brand-teal-text/20 hover:border-brand-teal-text/40",
          amber: "hover:shadow-status-warning/20 hover:border-status-warning/40",
        },
      },
    },
  ),
  iconHalo: cva(
    "inline-flex p-0.5 rounded-xl mb-5 bg-linear-to-br opacity-80 group-hover:opacity-100 transition-opacity",
    {
      variants: {
        gradient: {
          cyan: "from-brand-cyan-bg to-brand-teal-bg",
          teal: "from-brand-teal-bg to-brand-emerald-bg",
          amber: "from-status-warning-bg to-status-warning/70",
        },
      },
    },
  ),
  cardTitle: cva("text-lg font-semibold mb-2 text-ui-text"),
  cardBody: cva("text-ui-text-secondary text-sm leading-relaxed mb-4"),
  link: cva("inline-flex items-center gap-2 text-sm font-medium transition-colors", {
    variants: {
      gradient: {
        cyan: "text-brand-cyan-text hover:text-brand-cyan-border",
        teal: "text-brand-teal-text hover:text-brand-teal-border",
        amber: "text-status-warning-text hover:text-status-warning",
      },
    },
  }),
  iconPlate: cva("w-12 h-12 rounded-feature bg-ui-bg-elevated"),
};

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
    <div className={featureSectionVariants.card({ gradient })}>
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
      <a href="#learn-more" className={featureSectionVariants.link({ gradient })}>
        Learn more
        <ArrowIcon className="w-4 h-4" />
      </a>
    </div>
  );
}
