import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { FeatureHighlights } from "@/components/Onboarding/FeatureHighlights";
import { InvitedWelcome } from "@/components/Onboarding/InvitedWelcome";
import { LeadOnboarding } from "@/components/Onboarding/LeadOnboarding";
import { MemberOnboarding } from "@/components/Onboarding/MemberOnboarding";
import { RoleSelector } from "@/components/Onboarding/RoleSelector";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/onboarding")({
  component: OnboardingPage,
});

type OnboardingStep = "loading" | "invited" | "role-select" | "lead-flow" | "member-flow";

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>("loading");
  const [, setSelectedPersona] = useState<"team_lead" | "team_member" | null>(null);

  // Queries
  const inviteStatus = useQuery(api.onboarding.checkInviteStatus);
  const userOrganizations = useQuery(api.organizations.getUserOrganizations);

  // Mutations
  const setPersona = useMutation(api.onboarding.setOnboardingPersona);
  const completeOnboarding = useMutation(api.onboarding.completeOnboardingFlow);

  // Determine initial step based on data
  useEffect(() => {
    if (inviteStatus !== undefined && step === "loading") {
      if (inviteStatus?.wasInvited) {
        // Invited users go to welcome screen (no role selection needed - role set by inviter)
        setStep("invited");
      } else {
        // Self-signup users pick their role
        setStep("role-select");
      }
    }
  }, [inviteStatus, step]);

  const handleRoleSelect = async (persona: "team_lead" | "team_member") => {
    setSelectedPersona(persona);
    await setPersona({ persona });

    if (persona === "team_lead") {
      setStep("lead-flow");
    } else {
      setStep("member-flow");
    }
  };

  // Navigate to the user's organization dashboard
  const navigateToOrganization = () => {
    if (userOrganizations && userOrganizations.length > 0) {
      // Use the first organization available
      const slug = userOrganizations[0].slug;
      if (slug) {
        navigate({
          to: ROUTES.dashboard.path,
          params: { orgSlug: slug },
        });
        return;
      }
    }

    // Fallback - redirect to /app gateway to trigger organization initialization
    // (This is essential for the "team_member" flow or if the query is momentarily stale)
    navigate({ to: ROUTES.app.path });
  };

  const handleComplete = async () => {
    await completeOnboarding();
    navigateToOrganization();
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigateToOrganization();
  };

  // Called when project is created during lead/member flow
  const handleWorkspaceCreated = (slug: string) => {
    navigate({
      to: ROUTES.dashboard.path,
      params: { orgSlug: slug },
    });
  };

  const handleProjectCreated = (_workspaceId: Id<"projects">) => {
    // Project was created, complete onboarding
    handleComplete();
  };

  // Loading state
  if (step === "loading") {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="min-h-screen bg-ui-bg-secondary">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between bg-ui-bg-secondary/80 backdrop-blur-sm sticky top-0 z-50">
        <Flex align="center" gap="md" className="group cursor-pointer">
          <Flex
            align="center"
            justify="center"
            className="h-10 w-10 rounded-xl bg-brand-indigo-bg shadow-lg shadow-brand-indigo-bg/20 transition-transform group-hover:scale-110 active:scale-95"
          >
            <Typography variant="h4" as="span" className="text-brand-foreground">
              N
            </Typography>
          </Flex>
          <Typography variant="h4">Nixelo</Typography>
        </Flex>
        {step !== "invited" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-tertiary transition-all"
          >
            Skip for now
          </Button>
        )}
      </header>

      {/* Main Content */}
      <FlexItem as="main" flex="1" className="flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Invited User Flow - skip role selection, go straight to complete */}
          {step === "invited" && inviteStatus && (
            <InvitedWelcome
              inviterName={inviteStatus.inviterName || "Someone"}
              onStartTour={handleComplete}
              onSkip={handleComplete}
            />
          )}

          {/* Role Selection */}
          {step === "role-select" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center">
                <Typography variant="h2" className="mb-3">
                  Welcome to Nixelo
                </Typography>
                <Typography variant="lead" className="text-ui-text-secondary">
                  How would you like to use your new workspace?
                </Typography>
              </div>

              <RoleSelector onSelect={handleRoleSelect} />

              <div className="pt-12">
                <FeatureHighlights />
              </div>
            </div>
          )}

          {/* Team Lead Flow */}
          {step === "lead-flow" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <LeadOnboarding
                onComplete={handleComplete}
                onCreateProject={handleProjectCreated}
                onBack={() => setStep("role-select")}
                onWorkspaceCreated={handleWorkspaceCreated}
              />
            </div>
          )}

          {/* Team Member Flow */}
          {step === "member-flow" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <MemberOnboarding
                onComplete={handleComplete}
                onBack={() => setStep("role-select")}
                onWorkspaceCreated={handleWorkspaceCreated}
              />
            </div>
          )}
        </div>
      </FlexItem>

      {/* Footer */}
      <footer className="p-6 text-center">
        <Typography className="text-sm text-ui-text-tertiary">
          Need help?{" "}
          <a href="mailto:support@nixelo.com" className="text-brand hover:underline">
            Contact support
          </a>
        </Typography>
      </footer>
    </Flex>
  );
}
