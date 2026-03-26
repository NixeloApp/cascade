import { Flex } from "@/components/ui/Flex";
import { ProgressPill } from "@/components/ui/ProgressPill";

interface AuthStepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

/**
 * Compact progress indicator for multi-step authentication flows.
 */
export function AuthStepIndicator({ currentStep, totalSteps = 3 }: AuthStepIndicatorProps) {
  const stepIds = Array.from({ length: totalSteps }, (_, stepIndex) => `auth-step-${stepIndex}`);

  return (
    <Flex justify="center" gap="sm" aria-label="Authentication progress">
      {stepIds.map((stepId, stepIndex) => (
        <ProgressPill
          key={stepId}
          aria-hidden="true"
          tone={stepIndex <= currentStep ? "active" : "inactive"}
          length={stepIndex <= currentStep ? "extended" : "compact"}
        />
      ))}
    </Flex>
  );
}
