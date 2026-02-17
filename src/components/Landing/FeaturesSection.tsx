import { FileText, PanelsTopLeft, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";
import { ArrowIcon } from "./icons";

export function FeaturesSection() {
  const features = [
    {
      icon: <FileText className="w-6 h-6 text-brand-cyan-text" />,
      title: "Docs and issues, finally together",
      description:
        "No more tab-switching between your wiki and your task board. Link specs to tickets, discussions to sprints. All in one place.",
      gradient: "cyan" as const,
    },
    {
      icon: <Users className="w-6 h-6 text-brand-teal-text" />,
      title: "Edit together, in real-time",
      description:
        "See who's typing, where they are, what changed. Collaborate like you're in the same room, even when you're not.",
      gradient: "teal" as const,
    },
    {
      icon: <PanelsTopLeft className="w-6 h-6 text-palette-purple-text" />,
      title: "See everything. Miss nothing.",
      description:
        "One dashboard that actually makes sense. No more digging through 5 different tools to find what you need.",
      gradient: "purple" as const,
    },
  ];

  return (
    <section id="features" className="px-6 py-24 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Typography variant="h2" className="text-3xl md:text-4xl font-bold mb-4 text-ui-text">
            Stop juggling tools. Start shipping.
          </Typography>
          <Typography variant="lead" className="text-ui-text-secondary max-w-2xl mx-auto">
            Project management shouldn't feel like a second job.
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
  gradient: "cyan" | "teal" | "purple";
}) {
  const gradients = {
    cyan: "from-brand-cyan-bg to-brand-teal-bg",
    teal: "from-brand-teal-bg to-brand-emerald-bg",
    purple: "from-palette-purple-solid to-palette-pink-solid",
  };

  const glows = {
    cyan: "hover:shadow-brand-cyan-text/20 hover:border-brand-cyan-text/40",
    teal: "hover:shadow-brand-teal-text/20 hover:border-brand-teal-text/40",
    purple: "hover:shadow-palette-purple-solid/20 hover:border-palette-purple-solid/40",
  };

  const linkColors = {
    cyan: "text-brand-cyan-text hover:text-brand-cyan-border",
    teal: "text-brand-teal-text hover:text-brand-teal-border",
    purple: "text-palette-purple-text hover:text-palette-purple-solid",
  };

  return (
    <div
      className={cn(
        "group relative p-6 rounded-2xl",
        "bg-linear-to-b from-ui-bg-soft/80 to-ui-bg-secondary/50",
        "border border-ui-border/40",
        "backdrop-blur-md",
        "transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        glows[gradient],
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "inline-flex p-0.5 rounded-xl mb-5 bg-linear-to-br opacity-80 group-hover:opacity-100 transition-opacity",
          gradients[gradient],
        )}
      >
        <Flex
          align="center"
          justify="center"
          className="w-12 h-12 rounded-feature bg-ui-bg-elevated"
        >
          {icon}
        </Flex>
      </div>

      {/* Content */}
      <Typography variant="h3" className="text-lg font-semibold mb-2 text-ui-text">
        {title}
      </Typography>
      <Typography variant="p" className="text-ui-text-secondary text-sm leading-relaxed mb-4">
        {description}
      </Typography>

      {/* Link */}
      <a
        href="#learn-more"
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium transition-colors",
          linkColors[gradient],
        )}
      >
        Learn more
        <ArrowIcon className="w-4 h-4" />
      </a>
    </div>
  );
}
