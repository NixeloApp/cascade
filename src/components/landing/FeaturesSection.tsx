import { FileText, PanelsTopLeft, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { ArrowIcon } from "./icons";

export function FeaturesSection() {
  const features = [
    {
      icon: <FileText className="w-6 h-6 text-cyan-600" />,
      title: "Docs and issues, finally together",
      description:
        "No more tab-switching between your wiki and your task board. Link specs to tickets, discussions to sprints. All in one place.",
      gradient: "cyan" as const,
    },
    {
      icon: <Users className="w-6 h-6 text-teal-600" />,
      title: "Edit together, in real-time",
      description:
        "See who's typing, where they are, what changed. Collaborate like you're in the same room, even when you're not.",
      gradient: "teal" as const,
    },
    {
      icon: <PanelsTopLeft className="w-6 h-6 text-purple-600" />,
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

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
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
    cyan: "from-cyan-500 to-teal-500",
    teal: "from-teal-500 to-emerald-500",
    purple: "from-purple-500 to-pink-500",
  };

  const glows = {
    cyan: "hover:shadow-cyan-500/20 hover:border-cyan-500/40",
    teal: "hover:shadow-teal-500/20 hover:border-teal-500/40",
    purple: "hover:shadow-purple-500/20 hover:border-purple-500/40",
  };

  const linkColors = {
    cyan: "text-cyan-500 hover:text-cyan-600",
    teal: "text-teal-500 hover:text-teal-600",
    purple: "text-purple-500 hover:text-purple-600",
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
