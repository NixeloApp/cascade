import { Check, PartyPopper } from "lucide-react";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface InvitedWelcomeProps {
  inviterName: string;
  onStartTour: () => void;
  onSkip: () => void;
}

export function InvitedWelcome({ inviterName, onStartTour, onSkip }: InvitedWelcomeProps) {
  return (
    <div className="text-center space-y-8">
      {/* Icon - Mintlify-inspired with subtle ring */}
      <Flex justify="center">
        <div className="relative">
          <div className="p-6 rounded-full bg-brand-subtle ring-8 ring-brand/10">
            <PartyPopper className="w-16 h-16 text-brand" />
          </div>
          {/* Decorative dot */}
          <Flex
            align="center"
            justify="center"
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-status-success ring-4 ring-ui-bg-secondary"
          >
            <Check className="w-3 h-3 text-brand-foreground" />
          </Flex>
        </div>
      </Flex>

      {/* Welcome Message */}
      <div className="space-y-3">
        <Typography variant="h1" className="text-3xl font-bold text-ui-text tracking-tight">
          Welcome to Nixelo!
        </Typography>
        <Typography className="text-lg text-ui-text-secondary">
          <Typography variant="label" as="span" className="text-ui-text">
            {inviterName}
          </Typography>{" "}
          invited you to collaborate
        </Typography>
      </div>

      {/* Brief Description - Mintlify-inspired card */}
      <div className="bg-ui-bg-soft rounded-container border border-ui-border p-6 text-left">
        <Typography variant="h3" className="font-semibold text-ui-text mb-4 tracking-tight">
          What you can do in Nixelo:
        </Typography>
        <ul className="space-y-3">
          {[
            "View and work on project issues assigned to you",
            "Collaborate on documents in real-time",
            "Track time and participate in sprints",
            "Get notifications for mentions and updates",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-ui-text-secondary">
              <Flex
                align="center"
                justify="center"
                className="w-5 h-5 rounded-full bg-brand-subtle shrink-0 mt-0.5"
              >
                <Check className="w-3 h-3 text-brand" />
              </Flex>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions - Mintlify-inspired button styling */}
      <Flex gap="md" justify="center">
        <Button variant="primary" size="lg" onClick={onStartTour} className="min-w-40">
          Take a quick tour
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={onSkip}
          className="text-ui-text-secondary hover:text-ui-text"
        >
          Skip to dashboard
        </Button>
      </Flex>

      {/* Note */}
      <Typography className="text-sm text-ui-text-tertiary">
        Your team lead will add you to projects. You'll see them on your dashboard.
      </Typography>
    </div>
  );
}
