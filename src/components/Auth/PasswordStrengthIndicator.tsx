import { useMemo } from "react";
import zxcvbn from "zxcvbn";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;

const STRENGTH_COLORS = [
  "bg-status-error", // 0 - Very weak
  "bg-status-error", // 1 - Weak
  "bg-status-warning", // 2 - Fair
  "bg-status-success", // 3 - Good
  "bg-status-success", // 4 - Strong
] as const;

const STRENGTH_TEXT_COLORS = [
  "text-status-error",
  "text-status-error",
  "text-status-warning",
  "text-status-success",
  "text-status-success",
] as const;

/**
 * Password strength indicator using zxcvbn.
 * Shows a visual bar with 4 segments and a text label.
 */
export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const result = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password);
  }, [password]);

  if (!password || !result) {
    return null;
  }

  const { score } = result;
  const label = STRENGTH_LABELS[score];
  const barColor = STRENGTH_COLORS[score];
  const textColor = STRENGTH_TEXT_COLORS[score];

  return (
    <Flex direction="column" gap="xs" className={className}>
      {/* Strength bar */}
      <Flex gap="xs" className="w-full">
        {[0, 1, 2, 3].map((segment) => (
          <div
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              segment <= score ? barColor : "bg-ui-border",
            )}
          />
        ))}
      </Flex>

      {/* Label and feedback */}
      <Flex justify="between" align="center">
        <Typography variant="caption" className={cn(textColor)}>
          {label}
        </Typography>
        {result.feedback.warning && (
          <Typography variant="caption" color="secondary" className="truncate ml-2">
            {result.feedback.warning}
          </Typography>
        )}
      </Flex>
    </Flex>
  );
}
