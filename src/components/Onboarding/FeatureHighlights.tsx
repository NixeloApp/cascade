/**
 * Feature Highlights
 *
 * Grid of feature cards for onboarding pages.
 * Highlights key product capabilities with icons.
 * Used in lead and member onboarding flows.
 */

import type { LucideIcon } from "lucide-react";
import { FileText, Kanban, Zap } from "lucide-react";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { Typography } from "../ui/Typography";

interface FeatureCardProps {
  icon: LucideIcon;
  iconClassName: string;
  iconRecipe:
    | "onboardingFeatureIconBrand"
    | "onboardingFeatureIconSuccess"
    | "onboardingFeatureIconWarning";
  title: string;
  description: string;
}

function FeatureCard({ icon, iconClassName, iconRecipe, title, description }: FeatureCardProps) {
  return (
    <Card recipe="onboardingFeatureCard" hoverable padding="lg" className="group">
      <Flex direction="column" align="center">
        <div className={cn(getCardRecipeClassName(iconRecipe), "mb-4 size-12")}>
          <Flex align="center" justify="center" className="size-full">
            <Icon icon={icon} size="lg" className={iconClassName} />
          </Flex>
        </div>
        <Typography variant="h4" className="mb-1.5">
          {title}
        </Typography>
        <Typography color="secondary" variant="small">
          {description}
        </Typography>
      </Flex>
    </Card>
  );
}

/** Grid of feature cards showcasing key product capabilities. */
export function FeatureHighlights() {
  return (
    <Grid cols={1} colsSm={3} gap="lg">
      <FeatureCard
        icon={Kanban}
        iconClassName="text-brand"
        iconRecipe="onboardingFeatureIconBrand"
        title="Kanban Boards"
        description="Visualize work with drag-and-drop boards"
      />
      <FeatureCard
        icon={FileText}
        iconClassName="text-status-success"
        iconRecipe="onboardingFeatureIconSuccess"
        title="Documents"
        description="Collaborate on docs in real-time"
      />
      <FeatureCard
        icon={Zap}
        iconClassName="text-status-warning"
        iconRecipe="onboardingFeatureIconWarning"
        title="Sprint Planning"
        description="Plan and track team velocity"
      />
    </Grid>
  );
}
