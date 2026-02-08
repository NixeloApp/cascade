import { FileText, Kanban, Zap } from "lucide-react";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { cn } from "@/lib/utils";
import { Typography } from "../ui/Typography";

interface FeatureCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, iconBg, title, description }: FeatureCardProps) {
  return (
    <Flex
      direction="column"
      align="center"
      className="text-center p-5 rounded-container bg-ui-bg-soft border border-ui-border hover:border-ui-border-secondary transition-all duration-fast group"
    >
      <Flex
        align="center"
        justify="center"
        className={cn(
          "w-12 h-12 rounded-xl mb-4 transition-transform duration-default group-hover:scale-110",
          iconBg,
        )}
      >
        {icon}
      </Flex>
      <Typography variant="h3" className="font-semibold text-ui-text mb-1.5 tracking-tight">
        {title}
      </Typography>
      <Typography className="text-sm text-ui-text-secondary leading-relaxed">
        {description}
      </Typography>
    </Flex>
  );
}

export function FeatureHighlights() {
  return (
    <Grid cols={1} colsSm={3} gap="lg">
      <FeatureCard
        icon={<Kanban className="w-6 h-6 text-brand" />}
        iconBg="bg-brand-subtle"
        title="Kanban Boards"
        description="Visualize work with drag-and-drop boards"
      />
      <FeatureCard
        icon={<FileText className="w-6 h-6 text-status-success" />}
        iconBg="bg-status-success-bg"
        title="Documents"
        description="Collaborate on docs in real-time"
      />
      <FeatureCard
        icon={<Zap className="w-6 h-6 text-status-warning" />}
        iconBg="bg-status-warning-bg"
        title="Sprint Planning"
        description="Plan and track team velocity"
      />
    </Grid>
  );
}
