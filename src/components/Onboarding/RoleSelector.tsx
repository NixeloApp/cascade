/**
 * Role Selector
 *
 * Card-based role selection for onboarding.
 * Offers team lead and team member paths.
 * Routes to appropriate onboarding flow.
 */

import type { LucideIcon } from "lucide-react";
import { Check, User, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Typography } from "../ui/Typography";

interface RoleSelectorProps {
  onSelect: (role: "team_lead" | "team_member") => Promise<void> | void;
}

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  "data-testid"?: string;
}

function RoleCard({
  icon,
  title,
  description,
  selected,
  disabled,
  onClick,
  "data-testid": testId,
}: RoleCardProps) {
  return (
    <Button
      variant="unstyled"
      size="card"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      data-testid={testId}
    >
      <Card
        recipe={selected ? "onboardingRoleCardSelected" : "onboardingRoleCard"}
        padding="xl"
        className="h-full w-full"
      >
        <div
          className={cn(
            getCardRecipeClassName(
              selected ? "onboardingRoleIndicatorSelected" : "onboardingRoleIndicator",
            ),
            "absolute right-4 top-4 z-10 size-6",
          )}
        >
          <Flex align="center" justify="center" className="size-full">
            {selected ? <Icon icon={Check} size="xsPlus" /> : null}
          </Flex>
        </div>

        <Flex
          direction="column"
          align="center"
          gap="xl"
          className="relative z-10 h-full text-center"
        >
          <div
            className={cn(
              getCardRecipeClassName(
                selected ? "onboardingRoleIconShellSelected" : "onboardingRoleIconShell",
              ),
              "p-6 transition-default",
            )}
          >
            <Icon icon={icon} size="xl" />
          </div>

          <Stack gap="md" align="center">
            <Typography variant="h4">{title}</Typography>
            <Typography variant="small" color="secondary" className="max-w-56 leading-relaxed">
              {description}
            </Typography>
          </Stack>
        </Flex>
      </Card>
    </Button>
  );
}

/** Card selector for choosing between team lead and team member roles. */
export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const [isPending, setIsPending] = useState(false);
  const [localSelected, setLocalSelected] = useState<"team_lead" | "team_member" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSelect = (role: "team_lead" | "team_member") => {
    setLocalSelected(role);
    setIsPending(true);

    // Small delay for visual feedback before transitioning
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      void Promise.resolve(onSelect(role)).catch(() => {
        if (!isMountedRef.current) {
          return;
        }

        setLocalSelected(null);
        setIsPending(false);
      });
    }, 400);
  };

  return (
    <Grid
      cols={1}
      colsSm={2}
      gap="xl"
      className="animate-in fade-in slide-in-from-bottom-8 duration-enter-slow"
    >
      <RoleCard
        icon={Users}
        title="Team Lead"
        description="I'll be building new projects and inviting my team to join"
        selected={localSelected === "team_lead"}
        disabled={isPending}
        onClick={() => handleSelect("team_lead")}
        data-testid={TEST_IDS.ONBOARDING.TEAM_LEAD_CARD}
      />
      <RoleCard
        icon={User}
        title="Team Member"
        description="I'm joining an existing workspace to collaborate on tasks"
        selected={localSelected === "team_member"}
        disabled={isPending}
        onClick={() => handleSelect("team_member")}
        data-testid={TEST_IDS.ONBOARDING.TEAM_MEMBER_CARD}
      />
    </Grid>
  );
}
