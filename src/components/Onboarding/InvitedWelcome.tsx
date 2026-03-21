/**
 * Invited Welcome
 *
 * Welcome screen for users joining via invite link.
 * Shows inviter name and onboarding tour option.
 * Allows skipping to go directly to dashboard.
 */

import { Check, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card, getCardRecipeClassName } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface InvitedWelcomeProps {
  inviterName: string;
  onStartTour: () => void;
  onSkip: () => void;
}

/** Welcome screen for invited users with tour option. */
export function InvitedWelcome({ inviterName, onStartTour, onSkip }: InvitedWelcomeProps) {
  return (
    <Stack gap="2xl" align="center" className="text-center">
      {/* Icon - Mintlify-inspired with subtle ring */}
      <Flex justify="center">
        <Card recipe="onboardingInviteHero" padding="lg" className="relative size-28">
          <Flex align="center" justify="center" className="h-full w-full">
            <Icon icon={PartyPopper} className="size-16 text-brand" />
          </Flex>
          {/* Decorative dot */}
          <div
            className={cn(
              getCardRecipeClassName("onboardingInviteHeroBadge"),
              "absolute -right-1 -top-1 size-5",
            )}
          >
            <Flex align="center" justify="center" className="h-full w-full">
              <Icon icon={Check} size="xs" className="text-brand-foreground" />
            </Flex>
          </div>
        </Card>
      </Flex>

      {/* Welcome Message */}
      <Stack gap="sm" align="center">
        <Typography variant="h1">Welcome to Nixelo!</Typography>
        <Typography color="secondary" variant="lead">
          <Typography as="span" variant="label">
            {inviterName}
          </Typography>{" "}
          invited you to collaborate
        </Typography>
      </Stack>

      {/* Brief Description - Mintlify-inspired card */}
      <Card recipe="onboardingInvitePanel" padding="lg" className="w-full max-w-xl text-left">
        <Typography className="mb-4" variant="h4">
          What you can do in Nixelo:
        </Typography>
        <Stack as="ul" gap="sm" className="list-none" style={{ margin: 0, padding: 0 }}>
          {[
            "View and work on project issues assigned to you",
            "Collaborate on documents in real-time",
            "Track time and participate in sprints",
            "Get notifications for mentions and updates",
          ].map((item) => (
            <Flex as="li" key={item} align="start" gap="md">
              <div
                className={cn(
                  getCardRecipeClassName("onboardingInviteBullet"),
                  "mt-0.5 size-5 shrink-0",
                )}
              >
                <Flex align="center" justify="center" className="h-full w-full">
                  <Icon icon={Check} size="xs" tone="brand" />
                </Flex>
              </div>
              <Typography color="secondary" variant="small">
                {item}
              </Typography>
            </Flex>
          ))}
        </Stack>
      </Card>

      {/* Actions - Mintlify-inspired button styling */}
      <Flex gap="md" justify="center" wrap>
        <Button variant="primary" size="lg" onClick={onStartTour} className="min-w-40">
          Take a quick tour
        </Button>
        <Button variant="link" size="lg" onClick={onSkip}>
          Skip to dashboard
        </Button>
      </Flex>

      {/* Note */}
      <Typography color="tertiary" variant="small">
        Your team lead will add you to projects. You'll see them on your dashboard.
      </Typography>
    </Stack>
  );
}
