import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";

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
        <Card
          key={stepId}
          recipe={stepIndex <= currentStep ? "authStepIndicatorActive" : "authStepIndicator"}
        />
      ))}
    </Flex>
  );
}
