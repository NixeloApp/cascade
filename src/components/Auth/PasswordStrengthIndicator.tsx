/**
 * Password Strength Indicator
 *
 * Visual password strength meter using zxcvbn.
 * Shows strength level and feedback suggestions.
 * Lazy-loads zxcvbn library for performance.
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface ZxcvbnResult {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: {
    warning?: string;
    suggestions?: string[];
  };
}

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;

const STRENGTH_TEXT_COLORS = [
  "text-status-error",
  "text-status-error",
  "text-status-warning",
  "text-status-success",
  "text-status-success",
] as const;

const STRENGTH_SEGMENT_RECIPES = [
  "authStrengthSegmentError",
  "authStrengthSegmentError",
  "authStrengthSegmentWarning",
  "authStrengthSegmentSuccess",
  "authStrengthSegmentSuccess",
] as const;

/**
 * Password strength indicator using zxcvbn (lazy-loaded to reduce bundle size).
 * Shows a visual bar with 4 segments and a text label.
 */
export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const [result, setResult] = useState<ZxcvbnResult | null>(null);

  useEffect(() => {
    if (!password) {
      setResult(null);
      return;
    }

    // Lazy load zxcvbn (~400KB) only when password is entered
    let cancelled = false;
    import("zxcvbn").then((module) => {
      if (!cancelled) {
        setResult(module.default(password));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [password]);

  if (!password || !result) {
    return null;
  }

  const { score } = result;
  const label = STRENGTH_LABELS[score];
  const textColor = STRENGTH_TEXT_COLORS[score];
  const segmentRecipe = STRENGTH_SEGMENT_RECIPES[score];

  return (
    <Flex direction="column" gap="xs" className={className}>
      <Grid cols={4} gap="xs" className="w-full">
        {[0, 1, 2, 3].map((segment) => (
          <Card key={segment} recipe={segment <= score ? segmentRecipe : "authStrengthSegment"} />
        ))}
      </Grid>

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
